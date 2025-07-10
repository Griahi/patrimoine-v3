"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useDashboardStore } from '@/stores/dashboard-store';
import { TrendingUp, Activity, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { 
  calculatePortfolioValue, 
  calculatePerformance, 
  getRecentActivities, 
  generateRealAlerts,
  formatCurrency 
} from '@/utils/dashboard-calculations';

interface AdaptiveLayoutProps {
  userId: string;
  className?: string;
}

interface DashboardWidget {
  id: string;
  title: string;
  content: string;
  bgColor: string;
  icon: React.ReactNode;
  loading?: boolean;
  error?: string;
}

export default function AdaptiveLayout({ userId, className }: AdaptiveLayoutProps) {
  const {
    currentLayout,
    userBehavior,
    suggestions,
    isLoading,
    error
  } = useDashboardStore();

  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Charger les données réelles du dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setDashboardError(null);
      
      const response = await fetch('/api/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const { assets, entities } = await response.json();
      
      // Calculer les données réelles
      const totalValue = calculatePortfolioValue(assets);
      const performance = calculatePerformance(assets);
      const recentActivities = getRecentActivities(assets, entities);
      const alerts = generateRealAlerts(assets, entities);

      // Mettre à jour les widgets avec les données réelles
      setWidgets([
        {
          id: 'patrimony-overview',
          title: 'Vue d\'ensemble du patrimoine',
          content: totalValue > 0 ? `Portfolio total: ${formatCurrency(totalValue)}` : 'Aucun actif valorisé',
          bgColor: 'bg-blue-50 border-blue-200',
          icon: <TrendingUp className="h-5 w-5 text-blue-600" />
        },
        {
          id: 'performance-chart',
          title: 'Performance',
          content: performance !== 0 ? 
            `${performance > 0 ? '+' : ''}${performance.toFixed(1)}% sur la période` : 
            'Performance non calculable',
          bgColor: performance > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200',
          icon: <BarChart3 className={`h-5 w-5 ${performance > 0 ? 'text-green-600' : 'text-gray-600'}`} />
        },
        {
          id: 'recent-activity',
          title: 'Activité récente',
          content: recentActivities.length > 0 ? 
            `${recentActivities.length} activité${recentActivities.length > 1 ? 's' : ''} récente${recentActivities.length > 1 ? 's' : ''}` : 
            'Aucune activité récente',
          bgColor: 'bg-purple-50 border-purple-200',
          icon: <Activity className="h-5 w-5 text-purple-600" />
        },
        {
          id: 'alerts',
          title: 'Alertes',
          content: alerts.length > 0 ? 
            `${alerts.length} alerte${alerts.length > 1 ? 's' : ''} active${alerts.length > 1 ? 's' : ''}` : 
            'Aucune alerte',
          bgColor: alerts.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200',
          icon: <AlertTriangle className={`h-5 w-5 ${alerts.length > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardError(error instanceof Error ? error.message : 'Erreur lors du chargement');
      
      // En cas d'erreur, afficher des widgets vides mais pas de données mockées
      setWidgets([
        {
          id: 'patrimony-overview',
          title: 'Vue d\'ensemble du patrimoine',
          content: 'Erreur de chargement',
          bgColor: 'bg-red-50 border-red-200',
          icon: <TrendingUp className="h-5 w-5 text-red-600" />,
          error: 'Impossible de charger les données'
        },
        {
          id: 'performance-chart',
          title: 'Performance',
          content: 'Erreur de chargement',
          bgColor: 'bg-red-50 border-red-200',
          icon: <BarChart3 className="h-5 w-5 text-red-600" />,
          error: 'Impossible de charger les données'
        },
        {
          id: 'recent-activity',
          title: 'Activité récente',
          content: 'Erreur de chargement',
          bgColor: 'bg-red-50 border-red-200',
          icon: <Activity className="h-5 w-5 text-red-600" />,
          error: 'Impossible de charger les données'
        },
        {
          id: 'alerts',
          title: 'Alertes',
          content: 'Erreur de chargement',
          bgColor: 'bg-red-50 border-red-200',
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          error: 'Impossible de charger les données'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('AdaptiveLayout mounted for user:', userId);
    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className={`relative space-y-6 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Dashboard Adaptatif</h1>
          <Badge variant="default" className="flex items-center gap-1">
            Score: {currentLayout ? '85%' : 'N/A'}
          </Badge>
          {dashboardError && (
            <Badge variant="destructive" className="flex items-center gap-1">
              Erreur de données
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="ghost" size="sm">
            Optimiser
          </Button>
          <Button variant="ghost" size="sm">
            Modifier
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {(error || dashboardError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Erreur:</span>
            <span>{error || dashboardError}</span>
          </div>
          <p className="text-sm mt-1">
            Les données affichées peuvent ne pas être à jour. Essayez d'actualiser.
          </p>
        </div>
      )}

      {/* Widgets Grid */}
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
                {widget.error && (
                  <p className="text-red-600 text-xs mt-1">⚠️ {widget.error}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Status Info */}
      <div className={`p-4 rounded-lg ${dashboardError ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dashboardError ? 'bg-yellow-500' : 'bg-blue-500'} ${dashboardError ? '' : 'animate-pulse'}`}></div>
          <span className={`text-sm font-medium ${dashboardError ? 'text-yellow-800' : 'text-blue-800'}`}>
            {dashboardError ? 'Dashboard avec erreurs' : 'Dashboard IA chargé avec succès!'}
          </span>
        </div>
        <p className={`text-sm mt-1 ${dashboardError ? 'text-yellow-700' : 'text-blue-700'}`}>
          {dashboardError 
            ? `Certaines données n'ont pas pu être chargées. Utilisateur: ${userId}`
            : `Données réelles chargées • ${widgets.length} widgets actifs • Utilisateur: ${userId}`
          }
        </p>
      </div>
    </div>
  );
} 