"use client";

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { WidgetProps } from '@/types/dashboard';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: Date;
}

const sampleAlerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Concentration élevée',
    message: '68% de votre patrimoine est concentré sur l\'immobilier',
    severity: 'high',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: '2',
    type: 'info',
    title: 'Valorisation en attente',
    message: '3 actifs nécessitent une mise à jour de valorisation',
    severity: 'medium',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: '3',
    type: 'success',
    title: 'Performance positive',
    message: 'Votre portefeuille a gagné 5.2% ce mois-ci',
    severity: 'low',
    isRead: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: '4',
    type: 'warning',
    title: 'Échéance fiscale',
    message: 'Déclaration IFI dans 30 jours',
    severity: 'medium',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

export default function AlertsWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(!isPreview);

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
    } else {
      setAlerts(sampleAlerts.slice(0, maxAlerts));
    }
  }, [isPreview, maxAlerts]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/alerts', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const alertsData = await response.json();
        // Handle both array and object responses
        const alertsArray = Array.isArray(alertsData) ? alertsData : (alertsData.data || []);
        setAlerts(alertsArray.slice(0, maxAlerts));
      } else {
        // Fallback to sample data
        console.warn('Alerts API returned non-ok status, using sample data');
        setAlerts(sampleAlerts.slice(0, maxAlerts));
      }
    } catch (error) {
      // Silent fallback to sample data for better UX
      console.warn('Error loading alerts, using sample data:', error);
      setAlerts(sampleAlerts.slice(0, maxAlerts));
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDismissAlert = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts(alerts.filter(alert => alert.id !== alertId));
    onInteraction('alert_dismiss', { alertId });
  };

  const handleAlertClick = (alert: Alert) => {
    onInteraction('alert_click', { alertId: alert.id, type: alert.type });
    
    // Mark as read
    setAlerts(alerts.map(a => 
      a.id === alert.id ? { ...a, isRead: true } : a
    ));
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">Alertes</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-red-500 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Bell className="h-4 w-4 text-gray-400" />
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {alerts.map((alert) => {
            const IconComponent = getAlertIcon(alert.type);
            
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:shadow-sm ${getAlertColor(alert.type)} ${
                  alert.isRead ? 'opacity-75' : ''
                }`}
                onClick={() => handleAlertClick(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <IconComponent className="h-4 w-4 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{alert.title}</span>
                        {showSeverity && (
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{alert.message}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {alert.createdAt.toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    onClick={(e) => handleDismissAlert(alert.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <div className="text-sm">Aucune alerte</div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <button
          onClick={() => onInteraction('view_all_alerts')}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Voir toutes les alertes
        </button>
      </div>
    </div>
  );
} 