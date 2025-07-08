"use client";

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Euro, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { WidgetProps } from '@/types/dashboard';

interface PatrimonyData {
  totalValue: number;
  performance: number;
  topAssets: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

export default function PatrimonyOverviewWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [data, setData] = useState<PatrimonyData | null>(null);
  const [loading, setLoading] = useState(!isPreview);

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
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/dashboard', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const dashboardData = await response.json();
        setData({
          totalValue: dashboardData.portfolioValue || 0,
          performance: dashboardData.performance || 0,
          topAssets: dashboardData.topAssets?.slice(0, 3) || []
        });
      } else {
        console.warn('Dashboard API returned non-ok status');
        // Set default empty data
        setData({
          totalValue: 0,
          performance: 0,
          topAssets: []
        });
      }
    } catch (error) {
      console.warn('Error loading patrimony data:', error);
      // Set default empty data instead of leaving null
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
  };

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="p-4 h-full">
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Vue d'ensemble du patrimoine</h3>
          <div className="text-2xl font-bold text-blue-600">€ 1,234,567</div>
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            +5.2% ce mois
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Immobilier</span>
            <span>65%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Actions</span>
            <span>25%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Liquidités</span>
            <span>10%</span>
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
          {data?.totalValue ? 
            new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0
            }).format(data.totalValue) 
            : '€0'
          }
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

      {data?.topAssets && data.topAssets.length > 0 && (
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Actifs</h4>
          <div className="space-y-2">
            {data.topAssets.map((asset, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate flex-1">{asset.name}</span>
                <div className="text-right ml-2">
                  <div className="text-sm font-medium">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0
                    }).format(asset.value)}
                  </div>
                  <div className="text-xs text-gray-500">{asset.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <button
          onClick={handleViewDetails}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Voir le détail
        </button>
      </div>
    </div>
  );
} 