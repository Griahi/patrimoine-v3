export interface WidgetConfig {
  id: string;
  type: 'patrimony-overview' | 'performance-chart' | 'quick-actions' | 'ai-insights' | 'recent-activity' | 'market-news' | 'alerts' | 'tax-optimization';
  title: string;
  description: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  priority: number;
  isVisible: boolean;
  config: Record<string, any>;
  minSize: { w: number; h: number };
  maxSize: { w: number; h: number };
  resizable: boolean;
  draggable: boolean;
}

export interface UserBehavior {
  userId: string;
  widgetInteractions: Record<string, WidgetInteraction>;
  sessionDuration: number;
  mostViewedWidgets: string[];
  leastViewedWidgets: string[];
  preferredLayout: 'compact' | 'extended' | 'custom';
  lastActiveDate: Date;
  totalSessions: number;
  averageSessionTime: number;
}

export interface WidgetInteraction {
  widgetId: string;
  viewCount: number;
  totalTimeSpent: number; // en millisecondes
  lastViewed: Date;
  actionsPerformed: ActionEvent[];
  clickHeatmap: ClickPoint[];
}

export interface ActionEvent {
  action: string;
  timestamp: Date;
  params?: Record<string, any>;
}

export interface ClickPoint {
  x: number;
  y: number;
  timestamp: Date;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  widgets: WidgetConfig[];
  breakpoints: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Suggestion {
  id: string;
  type: 'widget-add' | 'widget-remove' | 'widget-resize' | 'layout-optimize';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  data: Record<string, any>;
  actions: SuggestionAction[];
  createdAt: Date;
  isRead: boolean;
  isDismissed: boolean;
}

export interface SuggestionAction {
  label: string;
  action: string;
  params?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  behaviorCluster: 'conservative' | 'balanced' | 'aggressive' | 'trader' | 'beginner';
  preferences: UserPreferences;
  demographicData: {
    age?: number;
    profession?: string;
    investmentExperience?: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface UserPreferences {
  autoOptimizeLayout: boolean;
  showSuggestions: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
  dataRetention: boolean; // RGPD compliance
  preferredMetrics: string[];
  hiddenWidgets: string[];
}

export interface DashboardAnalytics {
  totalUsers: number;
  activeUsers: number;
  widgetUsageStats: Record<string, WidgetUsageStats>;
  userClusters: Record<string, number>;
  suggestionStats: {
    totalSuggestions: number;
    acceptedSuggestions: number;
    acceptanceRate: number;
    topSuggestionTypes: Array<{ type: string; count: number }>;
  };
}

export interface WidgetUsageStats {
  widgetId: string;
  totalViews: number;
  uniqueUsers: number;
  averageTimeSpent: number;
  interactionRate: number;
  retentionRate: number;
}

export interface LayoutOptimization {
  currentLayout: WidgetConfig[];
  optimizedLayout: WidgetConfig[];
  improvements: {
    estimatedTimeReduction: number;
    usabilityScore: number;
    reasoning: string[];
  };
  confidence: number;
}

export interface DashboardState {
  currentLayout: DashboardLayout;
  userBehavior: UserBehavior;
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  trackInteraction: (widgetId: string, action: string, params?: Record<string, any>) => void;
  updateWidgetConfig: (widgetId: string, config: Partial<WidgetConfig>) => void;
  acceptSuggestion: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  optimizeLayout: () => Promise<void>;
  resetLayout: () => void;
  saveLayout: (name: string) => Promise<void>;
  loadLayout: (layoutId: string) => Promise<void>;
  
  // Getters
  getMostUsedWidgets: () => string[];
  getLeastUsedWidgets: () => string[];
  getRecommendedWidgets: () => string[];
  getLayoutScore: () => number;
}

export interface WidgetProps {
  config: WidgetConfig;
  onInteraction: (action: string, params?: Record<string, any>) => void;
  onConfigChange: (config: Partial<WidgetConfig>) => void;
  isPreview?: boolean;
}

export interface AdaptiveWidgetProps extends WidgetProps {
  behaviorData: WidgetInteraction;
  suggestions: Suggestion[];
  adaptiveFeatures: {
    autoResize: boolean;
    contextualActions: boolean;
    intelligentHiding: boolean;
  };
}

export interface DashboardTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  errorRate: number;
} 