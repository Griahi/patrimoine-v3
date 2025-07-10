"use client";

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { WidgetProps } from '@/types/dashboard';
import { generateRealAlerts } from '@/utils/dashboard-calculations';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: Date;
}

export default function AlertsWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(!isPreview);
  const [error, setError] = useState<string | null>(null);

  const maxAlerts = config.config?.maxAlerts || 5;
  const showSeverity = config.config?.showSeverity || true;

  useEffect(() => {
    if (!isPreview) {
      loadAlerts();
      // Delay interaction tracking to avoid initialization loops
      const timer = setTimeout(() => {
        onInteraction('mount', { widgetType: 'alerts' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPreview, maxAlerts]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les données du dashboard pour générer les alertes réelles
      const dashboardResponse = await fetch('/api/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!dashboardResponse.ok) {
        throw new Error(`Dashboard API Error: ${dashboardResponse.status}`);
      }

      const { assets, entities } = await dashboardResponse.json();
      
      // Générer les alertes réelles basées sur les données
      const realAlerts = generateRealAlerts(assets, entities);
      setAlerts(realAlerts.slice(0, maxAlerts));

      // Essayer aussi de charger les alertes depuis l'API alerts si elle existe
      try {
        const alertsResponse = await fetch('/api/alerts', {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (alertsResponse.ok) {
          const apiAlerts = await alertsResponse.json();
          const alertsArray = Array.isArray(apiAlerts) ? apiAlerts : (apiAlerts.data || []);
          
          // Combiner les alertes de l'API avec les alertes générées
          const combinedAlerts = [...realAlerts, ...alertsArray];
          
          // Supprimer les doublons basés sur l'ID
          const uniqueAlerts = combinedAlerts.filter((alert, index, self) => 
            index === self.findIndex(a => a.id === alert.id)
          );
          
          setAlerts(uniqueAlerts.slice(0, maxAlerts));
        }
      } catch (apiError) {
        console.warn('Alerts API not available, using generated alerts only');
        // Garder les alertes générées
      }

    } catch (error) {
      console.error('Error loading alerts:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement');
      
      // En cas d'erreur, ne pas utiliser de sample data
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    onInteraction('refresh');
    loadAlerts();
  };

  const handleDismissAlert = (alertId: string) => {
    onInteraction('dismiss_alert', { alertId });
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleMarkAsRead = (alertId: string) => {
    onInteraction('mark_read', { alertId });
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return X;
      case 'success': return CheckCircle;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'success': return 'text-green-600 bg-green-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
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
          <h3 className="font-medium text-gray-900">Alertes</h3>
          <Bell className="h-4 w-4 text-gray-400" />
        </div>
        <div className="space-y-2">
          <div className="p-2 bg-blue-50 rounded text-sm">
            <div className="font-medium">Mode aperçu</div>
            <div className="text-xs text-gray-600">Alertes générées dynamiquement</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Alertes</h3>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {alerts.filter(a => !a.isRead).length} nouvelles
            </Badge>
          )}
          <Bell className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-3 flex-1">
          {alerts.map((alert) => {
            const IconComponent = getAlertIcon(alert.type);
            
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border transition-all ${
                  alert.isRead ? 'opacity-60' : ''
                } ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{alert.title}</span>
                        {showSeverity && (
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {alert.message}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        {alert.createdAt.toLocaleDateString('fr-FR')} à {alert.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
                        title="Marquer comme lu"
                      >
                        Lu
                      </button>
                    )}
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 p-1 rounded"
                      title="Ignorer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <div className="text-sm">Aucune alerte active</div>
            <div className="text-xs text-gray-400 mt-1">
              Tout semble en ordre !
            </div>
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={handleRefresh}
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Actualiser les alertes
          </button>
        </div>
      )}
    </div>
  );
} 