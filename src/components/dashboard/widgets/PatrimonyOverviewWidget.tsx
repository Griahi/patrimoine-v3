"use client";

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Euro, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { WidgetProps } from '@/types/dashboard';
import { formatCurrency } from '@/utils/dashboard-calculations';

interface PatrimonyData {
  totalValue: number;
  performance: number;
  topAssets: Array<{
    id: string;
    name: string;
    type: string;
    value: number;
    percentage: number;
    owner?: string;
  }>;
}

export default function PatrimonyOverviewWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [data, setData] = useState<PatrimonyData | null>(null);
  const [loading, setLoading] = useState(!isPreview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPreview) {
      loadData();
      // Delay interaction tracking to avoid initialization loops
      const timer = setTimeout(() => {
        onInteraction('mount', { widgetType: 'patrimony-overview' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPreview]);

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
        throw new Error(`API responded with status: ${response.status}`);
      }

      const dashboardData = await response.json();
      
      // Utiliser directement les données calculées par l'API
      const totalValue = dashboardData.portfolioValue || 0;
      const performance = dashboardData.performance || 0;
      const topAssets = dashboardData.topAssets || [];

      console.log('✅ Données patrimoniales chargées:', {
        totalValue,
        performance,
        topAssetsCount: topAssets.length
      });

      setData({
        totalValue,
        performance,
        topAssets: topAssets.slice(0, 3) // Limiter à 3 actifs
      });
    } catch (error) {
      console.error('Error loading patrimony data:', error);
      
      if (error.name === 'AbortError') {
        setError('Timeout: La requête a pris trop de temps');
      } else {
        setError('Erreur lors du chargement des données');
      }
      
      // Ne pas utiliser de données mockées en cas d'erreur
      setData({
        totalValue: 0,
        performance: 0,
        topAssets: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    onInteraction('view_details');
    // Navigate to detailed view
    window.location.href = '/dashboard';
  };

  const handleRefresh = () => {
    onInteraction('refresh');
    loadData();
  };

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement du patrimoine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
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
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Vue d'ensemble du patrimoine</h3>
          <div className="text-2xl font-bold text-blue-600">Aperçu</div>
          <div className="flex items-center text-sm text-gray-600">
            <PieChart className="h-4 w-4 mr-1" />
            Mode aperçu
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Données réelles</span>
            <span>Chargées dynamiquement</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Patrimoine Total</h3>
          <Euro className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {data?.totalValue ? formatCurrency(data.totalValue) : '€0'}
        </div>
        
        {data && data.performance !== 0 && (
          <div className={`flex items-center text-sm ${
            data.performance > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {data.performance > 0 ? 
              <TrendingUp className="h-4 w-4 mr-1" /> : 
              <TrendingDown className="h-4 w-4 mr-1" />
            }
            {data.performance > 0 ? '+' : ''}{data.performance.toFixed(1)}% sur la période
          </div>
        )}
      </div>

      {data && data.topAssets.length > 0 && (
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top actifs</h4>
          <div className="space-y-2">
            {data.topAssets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{asset.name}</div>
                  <div className="text-gray-500 text-xs">{asset.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(asset.value)}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {asset.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.topAssets.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <PieChart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <div className="text-sm">Aucun actif trouvé</div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <button
          onClick={handleViewDetails}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Vue détaillée
        </button>
      </div>
    </div>
  );
} 