"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2, 
  Settings,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  AdaptiveWidgetProps, 
  WidgetConfig, 
  WidgetInteraction 
} from '@/types/dashboard';
import { useDashboardStore } from '@/stores/dashboard-store';
import PatrimonyOverviewWidget from './widgets/PatrimonyOverviewWidget';
import PerformanceChartWidget from './widgets/PerformanceChartWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import AIInsightsWidget from './widgets/AIInsightsWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';
import MarketNewsWidget from './widgets/MarketNewsWidget';
import AlertsWidget from './widgets/AlertsWidget';
import TaxOptimizationWidget from './widgets/TaxOptimizationWidget';

interface AdaptiveWidgetState {
  isVisible: boolean;
  isExpanded: boolean;
  viewStartTime: number | null;
  contextualActions: string[];
  adaptiveSize: { w: number; h: number };
}

export default function AdaptiveWidget({ 
  config, 
  behaviorData, 
  suggestions, 
  adaptiveFeatures,
  onInteraction,
  onConfigChange,
  isPreview = false
}: AdaptiveWidgetProps) {
  const [state, setState] = useState<AdaptiveWidgetState>({
    isVisible: config.isVisible,
    isExpanded: false,
    viewStartTime: null,
    contextualActions: [],
    adaptiveSize: config.position
  });

  const [showSettings, setShowSettings] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { trackInteraction } = useDashboardStore();

  // Adaptive behavior based on usage patterns
  useEffect(() => {
    if (adaptiveFeatures.autoResize && behaviorData) {
      const shouldResize = determineOptimalSize();
      if (shouldResize) {
        setState(prev => ({ ...prev, adaptiveSize: shouldResize }));
        onConfigChange({ position: shouldResize });
      }
    }
  }, [behaviorData, adaptiveFeatures.autoResize]);

  // Contextual actions based on behavior
  useEffect(() => {
    if (adaptiveFeatures.contextualActions && behaviorData) {
      const actions = generateContextualActions();
      setState(prev => ({ ...prev, contextualActions: actions }));
    }
  }, [behaviorData, adaptiveFeatures.contextualActions]);

  // Intelligent hiding based on low usage
  useEffect(() => {
    if (adaptiveFeatures.intelligentHiding && behaviorData && behaviorData.lastViewed) {
      try {
        const lastViewedDate = new Date(behaviorData.lastViewed);
        const shouldHide = behaviorData.viewCount < 3 && 
                          Date.now() - lastViewedDate.getTime() > 7 * 24 * 60 * 60 * 1000;
        
        if (shouldHide && state.isVisible) {
          setState(prev => ({ ...prev, isVisible: false }));
          onConfigChange({ isVisible: false });
        }
      } catch (error) {
        console.warn('Error parsing lastViewed date:', behaviorData.lastViewed);
      }
    }
  }, [behaviorData, adaptiveFeatures.intelligentHiding]);

  // Track view time
  useEffect(() => {
    if (!isPreview && !state.viewStartTime) {
      setState(prev => ({ ...prev, viewStartTime: Date.now() }));
    }

    return () => {
      if (state.viewStartTime) {
        const viewDuration = Date.now() - state.viewStartTime;
        trackInteraction(config.id, 'view', { duration: viewDuration });
      }
    };
  }, []);

  // Intersection observer for visibility tracking
  useEffect(() => {
    if (!widgetRef.current || isPreview) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, viewStartTime: Date.now() }));
          trackInteraction(config.id, 'view_start');
        } else if (state.viewStartTime) {
          const viewDuration = Date.now() - state.viewStartTime;
          trackInteraction(config.id, 'view_end', { duration: viewDuration });
          setState(prev => ({ ...prev, viewStartTime: null }));
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, [widgetRef.current, isPreview]);

  const determineOptimalSize = (): { w: number; h: number } | null => {
    if (!behaviorData) return null;

    const { viewCount, totalTimeSpent } = behaviorData;
    const averageTimePerView = totalTimeSpent / Math.max(viewCount, 1);

    // High usage widgets should be larger
    if (viewCount >= 50 && averageTimePerView >= 30000) {
      return { w: Math.min(config.position.w + 2, config.maxSize.w), h: config.position.h };
    }

    // Low usage widgets should be smaller
    if (viewCount <= 10 && averageTimePerView <= 10000) {
      return { w: Math.max(config.position.w - 1, config.minSize.w), h: config.position.h };
    }

    return null;
  };

  const generateContextualActions = (): string[] => {
    if (!behaviorData || !behaviorData.actionsPerformed) return [];

    const actions: string[] = [];
    const recentActions = behaviorData.actionsPerformed.slice(0, 5);
    const actionCounts = recentActions.reduce((acc, actionData) => {
      if (actionData && actionData.action) {
        acc[actionData.action] = (acc[actionData.action] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Most performed actions
    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([action]) => action)
      .filter(action => action && action !== 'mount'); // Filter out mount and invalid actions

    return topActions;
  };

  const getUsageIndicator = () => {
    if (!behaviorData) return null;

    const { viewCount = 0, totalTimeSpent = 0 } = behaviorData;
    const averageTimePerView = totalTimeSpent / Math.max(viewCount, 1);

    if (viewCount >= 50) return { level: 'high', color: 'bg-green-500' };
    if (viewCount >= 20) return { level: 'medium', color: 'bg-yellow-500' };
    if (viewCount >= 5) return { level: 'low', color: 'bg-blue-500' };
    return { level: 'minimal', color: 'bg-gray-400' };
  };

  const handleWidgetAction = (action: string, params?: any) => {
    if (!action) {
      console.warn('handleWidgetAction called with no action');
      return;
    }
    trackInteraction(config.id, action, params);
    onInteraction(action, params);
  };

  const renderWidget = () => {
    const commonProps = {
      config,
      onInteraction: handleWidgetAction,
      isPreview
    };

    switch (config.type) {
      case 'patrimony-overview':
        return <PatrimonyOverviewWidget {...commonProps} />;
      case 'performance-chart':
        return <PerformanceChartWidget {...commonProps} />;
      case 'quick-actions':
        return <QuickActionsWidget {...commonProps} />;
      case 'ai-insights':
        return <AIInsightsWidget {...commonProps} />;
      case 'recent-activity':
        return <RecentActivityWidget {...commonProps} />;
      case 'market-news':
        return <MarketNewsWidget {...commonProps} />;
      case 'alerts':
        return <AlertsWidget {...commonProps} />;
      case 'tax-optimization':
        return <TaxOptimizationWidget {...commonProps} />;
      default:
        return <div className="p-4 text-center text-gray-500">Widget non disponible</div>;
    }
  };

  const usageIndicator = getUsageIndicator();
  const relevantSuggestions = suggestions.filter(s => 
    s.data.widgetId === config.id && !s.isDismissed
  );

  if (!state.isVisible) {
    return null;
  }

  return (
    <motion.div
      ref={widgetRef}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-full overflow-hidden">
        {/* Widget Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{config.title}</h3>
            
            {/* Usage Indicator */}
            {usageIndicator && !isPreview && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${usageIndicator.color}`} />
                <span className="text-xs text-gray-500">
                  {behaviorData?.viewCount || 0} vues
                </span>
              </div>
            )}

            {/* Suggestions Badge */}
            {relevantSuggestions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {relevantSuggestions.length} suggestion{relevantSuggestions.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Contextual Actions */}
            <AnimatePresence>
              {isHovered && state.contextualActions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1 mr-2"
                >
                  {state.contextualActions.slice(0, 2).map((action, index) => (
                    <Button
                      key={action}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleWidgetAction(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Widget Actions */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowSettings(!showSettings)}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Widget Settings Dropdown */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-12 right-3 z-50 bg-white border rounded-lg shadow-lg p-2 min-w-[200px]"
            >
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
                    handleWidgetAction('toggle_expand');
                  }}
                >
                  {state.isExpanded ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
                  {state.isExpanded ? 'Réduire' : 'Agrandir'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setState(prev => ({ ...prev, isVisible: false }));
                    onConfigChange({ isVisible: false });
                    handleWidgetAction('hide');
                  }}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Masquer
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    handleWidgetAction('configure');
                    setShowSettings(false);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuration
                </Button>

                {/* Widget Stats */}
                {behaviorData && !isPreview && (
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Vues:</span>
                        <span>{behaviorData.viewCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Temps total:</span>
                        <span>{Math.round(behaviorData.totalTimeSpent / 1000 / 60)}min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Dernière vue:</span>
                        <span>
                          {behaviorData.lastViewed 
                            ? new Date(behaviorData.lastViewed).toLocaleDateString() 
                            : 'Jamais'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Content */}
        <div className="flex-1 overflow-hidden">
          {renderWidget()}
        </div>

        {/* Relevant Suggestions */}
        <AnimatePresence>
          {relevantSuggestions.length > 0 && isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 right-0 bg-blue-50 border-t p-2"
            >
              <div className="text-xs text-blue-600">
                💡 {relevantSuggestions[0].description}
              </div>
              <div className="flex gap-1 mt-1">
                {relevantSuggestions[0].actions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => handleWidgetAction(action.action, action.params)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Click outside handler */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSettings(false)}
        />
      )}
    </motion.div>
  );
} 