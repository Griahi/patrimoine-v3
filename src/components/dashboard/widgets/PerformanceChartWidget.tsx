"use client";

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { WidgetProps } from '@/types/dashboard';
import { 
  calculatePerformance, 
  calculateEvolutionData, 
  formatCurrency 
} from '@/utils/dashboard-calculations';

interface PerformanceData {
  data: Array<{
    month: string;
    value: number;
  }>;
  performance: number;
  totalValue: number;
  trend: 'up' | 'down' | 'neutral';
}

export default function PerformanceChartWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(!isPreview);
  const [error, setError] = useState<string | null>(null);

  const months = config.config?.months || 6;
  const showBenchmark = config.config?.showBenchmark || false;
  const chartType = config.config?.chartType || 'bar';

  useEffect(() => {
    if (!isPreview) {
      loadData();
      // Delay interaction tracking to avoid initialization loops
      const timer = setTimeout(() => {
        onInteraction('mount', { widgetType: 'performance-chart' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPreview, months]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/dashboard', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Dashboard API Error: ${response.status}`);
      }

      const { assets, entities } = await response.json();
      
      // Calculer les données de performance réelles
      const performance = calculatePerformance(assets);
      const evolutionData = calculateEvolutionData(assets, months);
      
      // Calculer la valeur totale actuelle
      const totalValue = assets.reduce((sum, asset) => {
        const latestValuation = asset.valuations?.[0];
        return sum + (latestValuation?.value || 0);
      }, 0);

      // Déterminer la tendance
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (performance > 1) trend = 'up';
      else if (performance < -1) trend = 'down';

      setData({
        data: evolutionData,
        performance,
        totalValue,
        trend
      });

    } catch (error) {
      console.error('Error loading performance data:', error);
      
      if (error.name === 'AbortError') {
        setError('Timeout: La requête a pris trop de temps');
      } else {
        setError('Erreur lors du chargement des données');
      }
      
      setData({
        data: [],
        performance: 0,
        totalValue: 0,
        trend: 'neutral'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    onInteraction('refresh');
    loadData();
  };

  const handleViewDetails = () => {
    onInteraction('view_details');
    window.location.href = '/dashboard/predictions';
  };

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement des performances...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-red-500 mx-auto mb-2" />
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
          <h3 className="font-medium text-gray-900">Performance</h3>
          <BarChart3 className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="h-32 flex items-end justify-between space-x-1">
          {[40, 65, 45, 80, 55, 90].map((height, index) => (
            <div
              key={index}
              className="bg-blue-500 rounded-t"
              style={{ height: `${height}%`, width: '16%' }}
            />
          ))}
        </div>
        
        <div className="mt-3 text-center">
          <div className="text-lg font-semibold text-gray-600">Mode aperçu</div>
          <div className="text-xs text-gray-500">Données calculées dynamiquement</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Performance</h3>
        <div className="flex items-center gap-2">
          {data?.trend && (
            <div className={`p-1 rounded-full ${
              data.trend === 'up' ? 'bg-green-100' : 
              data.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              {data.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : data.trend === 'down' ? (
                <TrendingDown className="h-3 w-3 text-red-600" />
              ) : (
                <BarChart3 className="h-3 w-3 text-gray-600" />
              )}
            </div>
          )}
          <BarChart3 className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {data?.data && data.data.length > 0 ? (
        <>
          <div className="h-32 flex items-end justify-between space-x-1 mb-4">
            {data.data.map((item, index) => {
              const maxValue = Math.max(...data.data.map(d => d.value));
              const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className={`rounded-t w-full transition-all hover:opacity-80 ${
                      data.trend === 'up' ? 'bg-green-500' : 
                      data.trend === 'down' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${item.month}: ${formatCurrency(item.value)}`}
                  />
                  <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mb-4">
            <div className={`text-lg font-semibold ${
              data.performance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.performance >= 0 ? '+' : ''}{data.performance.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              Performance sur {months} mois
            </div>
          </div>

          {data.totalValue > 0 && (
            <div className="text-center mb-2">
              <div className="text-sm text-gray-600">
                Valeur actuelle
              </div>
              <div className="text-lg font-medium text-gray-900">
                {formatCurrency(data.totalValue)}
              </div>
            </div>
          )}

          {showBenchmark && (
            <div className="text-center mb-2">
              <div className="text-xs text-gray-500">
                vs. Marché: {data.performance > 5 ? 'Surperformance' : 
                             data.performance < -5 ? 'Sous-performance' : 'Neutre'}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <div className="text-sm">Pas de données d'évolution</div>
            <div className="text-xs text-gray-400 mt-1">
              Ajoutez des valorisations pour voir l'évolution
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
          <button
            onClick={handleViewDetails}
            className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Analyse détaillée
          </button>
        </div>
      </div>
    </div>
  );
} 