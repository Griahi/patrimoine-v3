"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useDashboardStore } from '@/stores/dashboard-store';
import { TrendingUp, Activity, AlertTriangle, BarChart3 } from 'lucide-react';

interface AdaptiveLayoutProps {
  userId: string;
  className?: string;
}

interface SimpleWidget {
  id: string;
  title: string;
  content: string;
  bgColor: string;
  icon: React.ReactNode;
}

export default function AdaptiveLayout({ userId, className }: AdaptiveLayoutProps) {
  const {
    currentLayout,
    userBehavior,
    suggestions,
    isLoading,
    error
  } = useDashboardStore();

  const [widgets] = useState<SimpleWidget[]>([
    {
      id: 'patrimony-overview',
      title: 'Vue d\'ensemble du patrimoine',
      content: 'Portfolio total: 15,757,330 €',
      bgColor: 'bg-blue-50 border-blue-200',
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />
    },
    {
      id: 'performance-chart',
      title: 'Performance',
      content: '+12.5% cette année',
      bgColor: 'bg-green-50 border-green-200',
      icon: <BarChart3 className="h-5 w-5 text-green-600" />
    },
    {
      id: 'recent-activity',
      title: 'Activité récente',
      content: '3 nouvelles transactions',
      bgColor: 'bg-purple-50 border-purple-200',
      icon: <Activity className="h-5 w-5 text-purple-600" />
    },
    {
      id: 'alerts',
      title: 'Alertes',
      content: '2 alertes importantes',
      bgColor: 'bg-orange-50 border-orange-200',
      icon: <AlertTriangle className="h-5 w-5 text-orange-600" />
    }
  ]);

  // Simple effect for demonstration
  useEffect(() => {
    console.log('AdaptiveLayout mounted for user:', userId);
  }, [userId]);

  return (
    <div className={`relative space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Dashboard Adaptatif</h1>
          <Badge variant="default" className="flex items-center gap-1">
            Score: 85%
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Optimiser
          </Button>
          <Button variant="ghost" size="sm">
            Modifier
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Simple Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map(widget => (
          <Card key={widget.id} className={`p-6 ${widget.bgColor} hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {widget.icon}
                  <h3 className="font-semibold text-gray-900">{widget.title}</h3>
                </div>
                <p className="text-gray-700 text-sm">{widget.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Status Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Dashboard IA chargé avec succès!</span>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Interface simplifiée - {widgets.length} widgets actifs • Utilisateur: {userId}
        </p>
      </div>
    </div>
  );
} 