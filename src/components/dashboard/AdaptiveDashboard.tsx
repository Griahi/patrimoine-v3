"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Settings, 
  Lightbulb,
  BarChart3,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useDashboardStore } from '@/stores/dashboard-store';
import AdaptiveLayout from './AdaptiveLayout';
import SuggestionBanner from './SuggestionBanner';
import DashboardOnboarding from './DashboardOnboarding';

interface DashboardMetrics {
  totalWidgets: number;
  activeWidgets: number;
  layoutScore: number;
  userCluster: string;
  suggestionCount: number;
  lastOptimization: Date | null;
}

interface AdaptiveDashboardProps {
  className?: string;
}

export default function AdaptiveDashboard({ className }: AdaptiveDashboardProps) {
  const { data: session } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const {
    currentLayout,
    userBehavior,
    suggestions,
    isLoading,
    error,
    getLayoutScore,
    lastOptimization,
    initialize
  } = useDashboardStore();

  // Initialize dashboard store when user is available (only once)
  useEffect(() => {
    if (session?.user?.id && !hasInitialized) {
      console.log('Initializing adaptive dashboard for user:', session.user.id);
      
      // Force initialization with a timeout
      const initTimeout = setTimeout(() => {
        console.warn('Dashboard initialization taking too long, forcing completion');
        setHasInitialized(true);
      }, 3000); // 3 second timeout

      initialize(session.user.id)
        .then(() => {
          console.log('Dashboard initialized successfully');
        })
        .catch((error) => {
          console.error('Dashboard initialization failed:', error);
        })
        .finally(() => {
          clearTimeout(initTimeout);
          setHasInitialized(true);
        });
    }
  }, [session?.user?.id, hasInitialized, initialize]);

  // Check if user is new and should see onboarding (only after initialization)
  useEffect(() => {
    if (hasInitialized && session?.user && !onboardingChecked) {
      // Check if this is a first-time user or stored preference
      const hasSeenOnboarding = localStorage.getItem('adaptive-dashboard-onboarding-seen');
      
      if (!hasSeenOnboarding && userBehavior.totalSessions === 0) {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);
    }
  }, [hasInitialized, session?.user, userBehavior.totalSessions, onboardingChecked]);

  // Memoize user cluster calculation to prevent unnecessary recalculations
  const getUserCluster = useCallback((): string => {
    if (!userBehavior) return 'Nouveau';
    
    const { totalSessions, averageSessionTime, mostViewedWidgets } = userBehavior;
    
    if (totalSessions === 0) return 'Nouveau';
    if (totalSessions >= 50 && averageSessionTime <= 10) return 'Trader Actif';
    if (totalSessions >= 20 && mostViewedWidgets.length >= 6) return 'Utilisateur Avancé';
    if (totalSessions >= 10) return 'Utilisateur Régulier';
    return 'Utilisateur Occasionnel';
  }, [userBehavior?.totalSessions, userBehavior?.averageSessionTime, userBehavior?.mostViewedWidgets?.length]);

  // Memoize suggestion count to prevent unnecessary filters
  const suggestionCount = useMemo(() => {
    return suggestions.filter(s => !s.isDismissed && !s.isRead).length;
  }, [suggestions]);

  // Memoize layout score calculation
  const layoutScore = useMemo(() => {
    if (!currentLayout || !userBehavior || !hasInitialized) return 85;
    
    let score = 0;
    let totalPossibleScore = 0;
    currentLayout.widgets.forEach(widget => {
      const interaction = userBehavior.widgetInteractions[widget.id];
      const baseScore = widget.priority * 10;
      totalPossibleScore += baseScore;
      if (interaction) {
        const usageScore = Math.min(interaction.viewCount, 10) * baseScore / 10;
        score += usageScore;
      }
    });
    return totalPossibleScore > 0 ? (score / totalPossibleScore) * 100 : 85;
  }, [currentLayout, userBehavior, hasInitialized]);

  // Calculate dashboard metrics (simplified to avoid loops)
  useEffect(() => {
    if (!currentLayout || !userBehavior || !hasInitialized) return;

    const activeWidgets = currentLayout.widgets.filter(w => w.isVisible).length;
    const cluster = getUserCluster();

    // Only update metrics if they've actually changed
    const newMetrics = {
      totalWidgets: currentLayout.widgets.length,
      activeWidgets,
      layoutScore,
      userCluster: cluster,
      suggestionCount,
      lastOptimization
    };

    // Compare with current metrics to avoid unnecessary updates
    setMetrics(prevMetrics => {
      if (!prevMetrics) return newMetrics;
      
      const hasChanged = 
        prevMetrics.totalWidgets !== newMetrics.totalWidgets ||
        prevMetrics.activeWidgets !== newMetrics.activeWidgets ||
        Math.abs(prevMetrics.layoutScore - newMetrics.layoutScore) > 0.1 ||
        prevMetrics.userCluster !== newMetrics.userCluster ||
        prevMetrics.suggestionCount !== newMetrics.suggestionCount ||
        prevMetrics.lastOptimization !== newMetrics.lastOptimization;
      
      return hasChanged ? newMetrics : prevMetrics;
    });
  }, [currentLayout, hasInitialized, layoutScore, suggestionCount, lastOptimization, getUserCluster]);

  const getClusterColor = (cluster: string): string => {
    switch (cluster) {
      case 'Trader Actif': return 'text-red-600 bg-red-50';
      case 'Utilisateur Avancé': return 'text-blue-600 bg-blue-50';
      case 'Utilisateur Régulier': return 'text-green-600 bg-green-50';
      case 'Utilisateur Occasionnel': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Veuillez vous connecter pour accéder au dashboard</p>
        </div>
      </div>
    );
  }

  // Debug function to clear persistent state
  const clearPersistentState = () => {
    localStorage.removeItem('dashboard-store');
    localStorage.removeItem('adaptive-dashboard-onboarding-seen');
    window.location.reload();
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <DashboardOnboarding
            onComplete={() => {
              localStorage.setItem('adaptive-dashboard-onboarding-seen', 'true');
              setShowOnboarding(false);
            }}
            onSkip={() => {
              localStorage.setItem('adaptive-dashboard-onboarding-seen', 'true');
              setShowOnboarding(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header with AI Insights */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Adaptatif IA
              </h1>
            </div>

            {/* Real-time Metrics */}
            {metrics && (
              <div className="flex items-center gap-4">
                <Badge className={getClusterColor(metrics.userCluster)}>
                  <Activity className="h-3 w-3 mr-1" />
                  {metrics.userCluster}
                </Badge>

                <Badge className={getScoreColor(metrics.layoutScore)}>
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Score: {Math.round(metrics.layoutScore)}%
                </Badge>

                {metrics.suggestionCount > 0 && (
                  <Badge variant="secondary">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    {metrics.suggestionCount} suggestion{metrics.suggestionCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* AI Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              IA Active
            </div>
            
            {/* Debug button (only visible in development) */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearPersistentState}
                className="text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Banner */}
      {suggestions.length > 0 && !suggestions.every(s => s.isDismissed || s.isRead) && (
        <SuggestionBanner
          suggestions={suggestions.filter(s => !s.isDismissed && !s.isRead)}
          onAction={(suggestionId, action) => {
            if (action === 'accept') {
              useDashboardStore.getState().acceptSuggestion(suggestionId);
            } else {
              useDashboardStore.getState().dismissSuggestion(suggestionId);
            }
          }}
        />
      )}

      {/* Main Content */}
      <div className="p-6">
        {(isLoading && !hasInitialized) ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Initialisation du dashboard adaptatif...</p>
              <p className="text-sm text-gray-500 mt-2">
                Chargement des données personnalisées...
              </p>
            </div>
          </div>
        ) : error ? (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Erreur</h3>
                <p className="text-red-700">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    setHasInitialized(false);
                    useDashboardStore.getState().setError(null);
                  }}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <AdaptiveLayout 
            userId={session.user.id}
            className="adaptive-dashboard"
          />
        )}
      </div>

      {/* Performance Insights Floating Panel */}
      {metrics && userBehavior.totalSessions > 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Card className="p-4 max-w-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Insights IA
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Votre productivité a augmenté de{' '}
                  <span className="font-semibold">
                    {Math.round((metrics.layoutScore - 50) * 2)}%
                  </span>{' '}
                  grâce aux optimisations.
                </p>
                
                <div className="space-y-2 text-xs text-blue-600">
                  <div className="flex justify-between">
                    <span>Sessions cette semaine:</span>
                    <span className="font-medium">{userBehavior.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps moyen par session:</span>
                    <span className="font-medium">{Math.round(userBehavior.averageSessionTime)}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Widgets actifs:</span>
                    <span className="font-medium">{metrics.activeWidgets}/{metrics.totalWidgets}</span>
                  </div>
                </div>

                {metrics.lastOptimization && (
                  <p className="text-xs text-blue-600 mt-2">
                    Dernière optimisation: {metrics.lastOptimization.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Global Styles for Dashboard */}
      <style jsx global>{`
        .adaptive-dashboard {
          transition: all 0.3s ease;
        }

        .adaptive-dashboard .react-grid-layout {
          background: transparent;
        }

        .adaptive-dashboard .react-grid-item {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .adaptive-dashboard .react-grid-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        .adaptive-dashboard .react-grid-item.react-grid-placeholder {
          background: #3b82f6 !important;
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -o-user-select: none;
          user-select: none;
        }

        .adaptive-dashboard .react-grid-item.react-grid-placeholder.placeholder-active {
          opacity: 0.3;
        }

        .adaptive-dashboard .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid rgba(0, 0, 0, 0.4);
          border-bottom: 2px solid rgba(0, 0, 0, 0.4);
        }

        @media (max-width: 768px) {
          .adaptive-dashboard .react-grid-item {
            margin-bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
} 