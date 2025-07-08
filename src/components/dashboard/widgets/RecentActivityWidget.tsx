"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit, Trash, Eye } from 'lucide-react';
import { WidgetProps } from '@/types/dashboard';

interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'view';
  title: string;
  description: string;
  timestamp: Date;
  entityType: 'asset' | 'entity' | 'valuation';
}

const sampleActivities: Activity[] = [
  {
    id: '1',
    type: 'create',
    title: 'Nouvel actif ajouté',
    description: 'Appartement Paris 15ème',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    entityType: 'asset'
  },
  {
    id: '2',
    type: 'update',
    title: 'Valorisation mise à jour',
    description: 'Compte épargne Livret A',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    entityType: 'valuation'
  },
  {
    id: '3',
    type: 'create',
    title: 'Nouvelle entité créée',
    description: 'SCI Familiale',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    entityType: 'entity'
  },
  {
    id: '4',
    type: 'update',
    title: 'Actif modifié',
    description: 'Actions Total SE',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    entityType: 'asset'
  },
  {
    id: '5',
    type: 'view',
    title: 'Rapport consulté',
    description: 'Rapport patrimoine 2024',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    entityType: 'asset'
  }
];

export default function RecentActivityWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(!isPreview);

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
    } else {
      setActivities(sampleActivities.slice(0, maxItems));
    }
  }, [isPreview, maxItems]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with real activities API
      await new Promise(resolve => setTimeout(resolve, 800));
      setActivities(sampleActivities.slice(0, maxItems));
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
        <div className="space-y-3 flex-1 overflow-y-auto">
          {activities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type);
            
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onInteraction('activity_click', { 
                  activityId: activity.id, 
                  type: activity.type,
                  entityType: activity.entityType 
                })}
              >
                <div className={`p-1 rounded-full ${getActivityColor(activity.type)}`}>
                  <IconComponent className="h-3 w-3" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {activity.description}
                  </div>
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
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <button
          onClick={() => onInteraction('view_all')}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Voir toute l'activité
        </button>
      </div>
    </div>
  );
} 