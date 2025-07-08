export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data?: any;
  status: AlertStatus;
  actions?: AlertAction[];
  createdAt: Date;
  readAt?: Date;
  snoozedUntil?: Date;
  dismissedAt?: Date;
}

export type AlertType = 
  | 'concentration_risk'
  | 'performance_anomaly'
  | 'market_opportunity'
  | 'tax_deadline'
  | 'excessive_fees'
  | 'optimization_opportunity'
  | 'portfolio_rebalance'
  | 'credit_refinance';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export type AlertStatus = 'new' | 'read' | 'snoozed' | 'dismissed';

export interface AlertAction {
  id: string;
  label: string;
  action: string;
  params?: Record<string, any>;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface AlertPreferences {
  userId: string;
  alertType: AlertType;
  enabled: boolean;
  threshold?: number;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface AlertRule {
  type: AlertType;
  condition: (context: AlertContext) => boolean;
  severity: (context: AlertContext) => AlertSeverity;
  generateAlert: (context: AlertContext) => Omit<Alert, 'id' | 'userId' | 'createdAt' | 'status'>;
}

export interface AlertContext {
  userId: string;
  patrimony: {
    totalValue: number;
    assets: Array<{
      id: string;
      name: string;
      type: string;
      value: number;
      percentage: number;
      performance?: number;
      monthlyPerformance?: number;
    }>;
    monthlyFees: number;
    diversification: {
      byAssetType: Record<string, number>;
      concentration: number;
    };
  };
  marketData?: {
    [ticker: string]: {
      change: number;
      monthlyChange: number;
      volatility: number;
    };
  };
  taxableWealth?: number;
}

export interface AlertMetrics {
  total: number;
  byType: Record<AlertType, number>;
  bySeverity: Record<AlertSeverity, number>;
  unreadCount: number;
  criticalCount: number;
} 