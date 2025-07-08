"use client";

import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { WidgetProps } from '@/types/dashboard';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

const sampleInsights: AIInsight[] = [
  {
    id: '1',
    type: 'optimization',
    title: 'Optimisation fiscale détectée',
    description: 'Vous pourriez économiser 2,400€ en utilisant le PER.',
    confidence: 0.9,
    impact: 'high'
  },
  {
    id: '2',
    type: 'risk',
    title: 'Concentration élevée',
    description: '68% de votre patrimoine est en immobilier.',
    confidence: 0.85,
    impact: 'medium'
  },
  {
    id: '3',
    type: 'opportunity',
    title: 'Marché favorable',
    description: 'Opportunité d\'investissement dans le secteur tech.',
    confidence: 0.75,
    impact: 'medium'
  }
];

export default function AIInsightsWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(!isPreview);

  const maxInsights = config.config?.maxInsights || 3;
  const showTrends = config.config?.showTrends || true;

  useEffect(() => {
    if (!isPreview) {
      loadInsights();
      // Delay interaction tracking to avoid initialization loops
      const timer = setTimeout(() => {
        onInteraction('mount', { widgetType: 'ai-insights' });
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setInsights(sampleInsights.slice(0, maxInsights));
    }
  }, [isPreview, maxInsights]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with real insights API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInsights(sampleInsights.slice(0, maxInsights));
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'risk': return AlertTriangle;
      case 'optimization': return Lightbulb;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-green-600 bg-green-50';
      case 'risk': return 'text-red-600 bg-red-50';
      case 'optimization': return 'text-blue-600 bg-blue-50';
      default: return 'text-purple-600 bg-purple-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Insights IA</h3>
        <Brain className="h-4 w-4 text-purple-500" />
      </div>

      {insights.length > 0 ? (
        <div className="space-y-3 flex-1">
          {insights.map((insight) => {
            const IconComponent = getInsightIcon(insight.type);
            
            return (
              <div
                key={insight.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-opacity-80 ${getInsightColor(insight.type)}`}
                onClick={() => onInteraction('insight_click', { insightId: insight.id, type: insight.type })}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm font-medium">{insight.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getImpactColor(insight.impact)}`} />
                    <span className="text-xs text-gray-500">
                      {Math.round(insight.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Brain className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <div className="text-sm">Analyse en cours...</div>
          </div>
        </div>
      )}

      {showTrends && (
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs text-gray-500 mb-2">Tendances détectées</div>
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs">Marché haussier</Badge>
            <Badge variant="secondary" className="text-xs">Volatilité faible</Badge>
          </div>
        </div>
      )}
    </div>
  );
} 