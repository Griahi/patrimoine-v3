"use client";

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { WidgetProps } from '@/types/dashboard';

interface PerformanceData {
  data: Array<{
    month: string;
    value: number;
  }>;
  performance: number;
}

export default function PerformanceChartWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(!isPreview);

  useEffect(() => {
    if (!isPreview) {
      loadData();
      // Delay interaction tracking to avoid initialization loops
      const timer = setTimeout(() => {
        onInteraction('mount', { widgetType: 'performance-chart' });
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
          data: dashboardData.evolutionData || [],
          performance: dashboardData.performance || 0
        });
      } else {
        console.warn('Dashboard API returned non-ok status');
        setData({
          data: [],
          performance: 0
        });
      }
    } catch (error) {
      console.warn('Error loading performance data:', error);
      setData({
        data: [],
        performance: 0
      });
    } finally {
      setLoading(false);
    }
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
          <div className="text-lg font-semibold text-green-600">+12.5%</div>
          <div className="text-xs text-gray-500">sur 6 mois</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Performance</h3>
        <BarChart3 className="h-4 w-4 text-gray-400" />
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
                    className="bg-blue-500 rounded-t w-full"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${item.month}: ${new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0
                    }).format(item.value)}`}
                  />
                  <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <div className={`text-lg font-semibold ${
              data.performance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.performance >= 0 ? '+' : ''}{data.performance.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Performance globale</div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <div className="text-sm">Pas de données d'évolution</div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <button
          onClick={() => onInteraction('view_details')}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Analyse détaillée
        </button>
      </div>
    </div>
  );
} 