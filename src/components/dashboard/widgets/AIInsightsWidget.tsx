"use client";

import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { WidgetProps } from '@/types/dashboard';
import { generateRealAIInsights } from '@/utils/dashboard-calculations';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}

export default function AIInsightsWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(!isPreview);
  const [error, setError] = useState<string | null>(null);

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
    }
  }, [isPreview, maxInsights]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les données du dashboard pour générer les insights IA
      const response = await fetch('/api/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard API Error: ${response.status}`);
      }

      const { assets, entities } = await response.json();
      
      // Générer les insights IA réels basés sur les données
      const realInsights = generateRealAIInsights(assets, entities);
      setInsights(realInsights.slice(0, maxInsights));

    } catch (error) {
      console.error('Error loading AI insights:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement');
      
      // En cas d'erreur, ne pas utiliser de sample data
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    onInteraction('refresh');
    loadInsights();
  };

  const handleInsightClick = (insight: AIInsight) => {
    onInteraction('insight_click', { 
      insightId: insight.id, 
      type: insight.type,
      actionable: insight.actionable 
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return Target;
      case 'risk': return AlertTriangle;
      case 'optimization': return Zap;
      case 'trend': return TrendingUp;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-green-600 bg-green-50 border-green-200';
      case 'risk': return 'text-red-600 bg-red-50 border-red-200';
      case 'optimization': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'trend': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return 'Élevée';
    if (confidence >= 0.6) return 'Moyenne';
    return 'Faible';
  };

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Génération des insights IA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={handleRefresh}
            className="text-xs text-blue-600 hover:text-blue-700 underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Insights IA</h3>
          <Brain className="h-4 w-4 text-gray-400" />
        </div>
        <div className="space-y-2">
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-purple-900">Mode aperçu</div>
            <div className="text-sm text-purple-700">
              Insights générés à partir de vos données réelles
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Insights IA</h3>
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500" />
          {insights.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {insights.filter(i => i.actionable).length} actions
            </Badge>
          )}
        </div>
      </div>

      {insights.length > 0 ? (
        <div className="space-y-3 flex-1">
          {insights.map((insight) => {
            const IconComponent = getInsightIcon(insight.type);
            
            return (
              <div
                key={insight.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getInsightColor(insight.type)}`}
                onClick={() => handleInsightClick(insight)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{insight.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getImpactColor(insight.impact)}`} />
                    <span className="text-xs text-gray-500">
                      {Math.round(insight.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  {insight.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Confiance: {getConfidenceLevel(insight.confidence)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Impact: {insight.impact}
                    </span>
                  </div>
                  
                  {insight.actionable && (
                    <Badge variant="outline" className="text-xs">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Actionnable
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Brain className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <div className="text-sm">Analyse en cours...</div>
            <div className="text-xs text-gray-400 mt-1">
              L'IA analyse vos données pour générer des insights
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex-1 text-sm text-gray-600 hover:text-gray-700 font-medium"
          >
            Actualiser
          </button>
          {insights.some(i => i.actionable) && (
            <button
              onClick={() => onInteraction('view_all_insights')}
              className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir actions
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 