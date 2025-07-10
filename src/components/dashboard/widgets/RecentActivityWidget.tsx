"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit, Trash, Eye } from 'lucide-react';
import { WidgetProps } from '@/types/dashboard';
import { getRecentActivities } from '@/utils/dashboard-calculations';

interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'view';
  title: string;
  description: string;
  timestamp: Date;
  entityType: 'asset' | 'entity' | 'valuation';
}

export default function RecentActivityWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(!isPreview);
  const [error, setError] = useState<string | null>(null);

  const maxItems = config.config?.maxItems || 5;
  const showDates = config.config?.showDates || true;

  useEffect(() => {
    if (!isPreview) {
      loadActivities();
      // Delay interaction tracking to avoid initialization loops
      const timer = setTimeout(() => {
        onInteraction('mount', { widgetType: 'recent-activity' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPreview, maxItems]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les données du dashboard pour générer les activités récentes
      const response = await fetch('/api/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard API Error: ${response.status}`);
      }

      const { assets, entities } = await response.json();
      
      // Générer les activités récentes basées sur les données réelles
      const recentActivities = getRecentActivities(assets, entities);
      setActivities(recentActivities.slice(0, maxItems));

    } catch (error) {
      console.error('Error loading activities:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement');
      
      // En cas d'erreur, ne pas utiliser de sample data
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    onInteraction('refresh');
    loadActivities();
  };

  const handleActivityClick = (activity: Activity) => {
    onInteraction('activity_click', { 
      activityId: activity.id, 
      type: activity.type,
      entityType: activity.entityType
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return Plus;
      case 'update': return Edit;
      case 'delete': return Trash;
      case 'view': return Eye;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create': return 'text-green-600';
      case 'update': return 'text-blue-600';
      case 'delete': return 'text-red-600';
      case 'view': return 'text-gray-600';
      default: return 'text-gray-500';
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'asset': return 'bg-blue-100 text-blue-800';
      case 'entity': return 'bg-green-100 text-green-800';
      case 'valuation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement des activités...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 text-red-500 mx-auto mb-2" />
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
          <h3 className="font-medium text-gray-900">Activité récente</h3>
          <Clock className="h-4 w-4 text-gray-400" />
        </div>
        <div className="space-y-2">
          <div className="p-2 bg-purple-50 rounded text-sm">
            <div className="font-medium">Mode aperçu</div>
            <div className="text-xs text-gray-600">Activités générées dynamiquement</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Activité récente</h3>
        <Clock className="h-4 w-4 text-gray-400" />
      </div>

      {activities.length > 0 ? (
        <div className="space-y-3 flex-1">
          {activities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type);
            
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                <div className={`p-1.5 rounded-full ${getActivityColor(activity.type)}`}>
                  <IconComponent className="h-3 w-3" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getEntityTypeColor(activity.entityType)}`}>
                      {activity.entityType === 'asset' ? 'Actif' : 
                       activity.entityType === 'entity' ? 'Entité' : 'Valorisation'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate">
                    {activity.description}
                  </p>
                  
                  {showDates && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <div className="text-sm">Aucune activité récente</div>
            <div className="text-xs text-gray-400 mt-1">
              Les nouvelles activités apparaîtront ici
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <button
          onClick={handleRefresh}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Actualiser les activités
        </button>
      </div>
    </div>
  );
} 