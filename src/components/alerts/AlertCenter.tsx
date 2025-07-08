'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  X, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Info,
  TrendingUp,
  Calendar,
  DollarSign,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Alert, AlertSeverity, AlertType } from '@/types/alerts';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AlertCenterProps {
  className?: string;
}

export default function AlertCenter({ className }: AlertCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setUnreadCount(data.alerts?.filter((alert: Alert) => alert.status === 'new').length || 0);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: 'POST' });
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'read' as const, readAt: new Date() } : alert
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleSnooze = async (alertId: string, hours: number = 24) => {
    try {
      const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
      await fetch(`/api/alerts/${alertId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozedUntil })
      });
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'snoozed' as const, snoozedUntil } : alert
      ));
    } catch (error) {
      console.error('Error snoozing alert:', error);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/dismiss`, { method: 'POST' });
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      if (alerts.find(alert => alert.id === alertId)?.status === 'new') {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleAction = async (alertId: string, action: string, params?: any) => {
    // Log action
    try {
      await fetch(`/api/alerts/${alertId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params })
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }

    // Execute action based on type
    switch (action) {
      case 'SHOW_DIVERSIFICATION':
        // Navigate to diversification page
        window.location.href = '/dashboard?tab=diversification';
        break;
      case 'ANALYZE_ASSET':
        // Navigate to asset analysis
        window.location.href = `/assets/${params.assetId}`;
        break;
      case 'COMPARE_BANKS':
        // Navigate to bank comparison
        window.location.href = '/tools/bank-comparison';
        break;
      // Add more actions as needed
      default:
        console.log('Action not implemented:', action);
    }
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5" />;
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <Info className="w-5 h-5" />;
      case 'low': return <Info className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'concentration_risk': return <Target className="w-4 h-4" />;
      case 'performance_anomaly': return <TrendingUp className="w-4 h-4" />;
      case 'market_opportunity': return <DollarSign className="w-4 h-4" />;
      case 'tax_deadline': return <Calendar className="w-4 h-4" />;
      case 'excessive_fees': return <DollarSign className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const visibleAlerts = alerts.filter(alert => 
    alert.status !== 'dismissed' && 
    (!alert.snoozedUntil || new Date(alert.snoozedUntil) <= new Date())
  );

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon with Badge */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-orange-500" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-96 z-50"
            >
              <Card className="shadow-xl border-gray-200 max-h-[500px] overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} nouvelles
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="p-1 h-6 w-6"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="p-6 text-center text-gray-500">
                      Chargement des alertes...
                    </div>
                  ) : visibleAlerts.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p>Aucune alerte active</p>
                      <p className="text-sm">Votre patrimoine va bien !</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {visibleAlerts.map((alert) => (
                        <AlertItem
                          key={alert.id}
                          alert={alert}
                          onMarkAsRead={handleMarkAsRead}
                          onSnooze={handleSnooze}
                          onDismiss={handleDismiss}
                          onAction={handleAction}
                          getSeverityColor={getSeverityColor}
                          getSeverityIcon={getSeverityIcon}
                          getTypeIcon={getTypeIcon}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {visibleAlerts.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-sm"
                      onClick={() => window.location.href = '/alerts'}
                    >
                      Voir toutes les alertes
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AlertItemProps {
  alert: Alert;
  onMarkAsRead: (id: string) => void;
  onSnooze: (id: string, hours?: number) => void;
  onDismiss: (id: string) => void;
  onAction: (id: string, action: string, params?: any) => void;
  getSeverityColor: (severity: AlertSeverity) => string;
  getSeverityIcon: (severity: AlertSeverity) => React.ReactNode;
  getTypeIcon: (type: AlertType) => React.ReactNode;
}

function AlertItem({ 
  alert, 
  onMarkAsRead, 
  onSnooze, 
  onDismiss, 
  onAction,
  getSeverityColor,
  getSeverityIcon,
  getTypeIcon
}: AlertItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`p-4 hover:bg-gray-50 cursor-pointer ${
        alert.status === 'new' ? 'bg-blue-50/30' : ''
      }`}
      onClick={() => {
        if (alert.status === 'new') {
          onMarkAsRead(alert.id);
        }
        setExpanded(!expanded);
      }}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
          {getTypeIcon(alert.type)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm leading-tight">
                {alert.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {alert.message}
              </p>
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              {getSeverityIcon(alert.severity)}
              {alert.status === 'new' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatDistance(new Date(alert.createdAt), new Date(), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze(alert.id);
                }}
              >
                <Clock className="w-3 h-3 mr-1" />
                Snooze
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(alert.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          {expanded && alert.actions && alert.actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-100"
            >
              <div className="flex flex-wrap gap-2">
                {alert.actions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    className="text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(alert.id, action.action, action.params);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 