import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  DashboardState, 
  DashboardLayout, 
  UserBehavior, 
  Suggestion, 
  WidgetConfig,
  LayoutOptimization 
} from '@/types/dashboard';
import { BehaviorTrackingClientService } from '@/services/dashboard/behavior-tracking-client';

interface DashboardStore extends DashboardState {
  // Additional state
  availableWidgets: WidgetConfig[];
  isOptimizing: boolean;
  lastOptimization: Date | null;
  
  // Internal methods
  initialize: (userId: string) => Promise<void>;
  setBehavior: (behavior: UserBehavior) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  setLayout: (layout: DashboardLayout) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const defaultWidgets: WidgetConfig[] = [
  {
    id: 'patrimony-overview',
    type: 'patrimony-overview',
    title: 'Vue d\'ensemble du patrimoine',
    description: 'Aperçu global de votre patrimoine',
    position: { x: 0, y: 0, w: 6, h: 4 },
    priority: 1,
    isVisible: true,
    config: {
      showChart: true,
      showMetrics: true,
      period: '1Y'
    },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 8 },
    resizable: true,
    draggable: true
  },
  {
    id: 'performance-chart',
    type: 'performance-chart',
    title: 'Performance',
    description: 'Graphique de performance de vos actifs',
    position: { x: 6, y: 0, w: 6, h: 4 },
    priority: 2,
    isVisible: true,
    config: {
      period: '6M',
      showBenchmark: true,
      chartType: 'line'
    },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 8 },
    resizable: true,
    draggable: true
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Actions rapides',
    description: 'Raccourcis vers les actions fréquentes',
    position: { x: 0, y: 4, w: 4, h: 3 },
    priority: 3,
    isVisible: true,
    config: {
      maxActions: 6,
      showRecent: true
    },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 4 },
    resizable: true,
    draggable: true
  },
  {
    id: 'ai-insights',
    type: 'ai-insights',
    title: 'Insights IA',
    description: 'Suggestions et analyses automatiques',
    position: { x: 4, y: 4, w: 4, h: 3 },
    priority: 4,
    isVisible: true,
    config: {
      maxInsights: 3,
      showTrends: true
    },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 6 },
    resizable: true,
    draggable: true
  },
  {
    id: 'recent-activity',
    type: 'recent-activity',
    title: 'Activité récente',
    description: 'Dernières transactions et modifications',
    position: { x: 8, y: 4, w: 4, h: 3 },
    priority: 5,
    isVisible: true,
    config: {
      maxItems: 5,
      showDates: true
    },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 4 },
    resizable: true,
    draggable: true
  },
  {
    id: 'market-news',
    type: 'market-news',
    title: 'Actualités marché',
    description: 'Actualités financières pertinentes',
    position: { x: 0, y: 7, w: 6, h: 3 },
    priority: 6,
    isVisible: false, // Hidden by default
    config: {
      maxNews: 4,
      sources: ['general', 'stocks', 'crypto']
    },
    minSize: { w: 4, h: 2 },
    maxSize: { w: 12, h: 6 },
    resizable: true,
    draggable: true
  },
  {
    id: 'alerts',
    type: 'alerts',
    title: 'Alertes',
    description: 'Notifications et alertes importantes',
    position: { x: 6, y: 7, w: 6, h: 3 },
    priority: 7,
    isVisible: true,
    config: {
      maxAlerts: 5,
      showSeverity: true
    },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 6 },
    resizable: true,
    draggable: true
  },
  {
    id: 'tax-optimization',
    type: 'tax-optimization',
    title: 'Optimisation fiscale',
    description: 'Suggestions d\'optimisation fiscale',
    position: { x: 0, y: 10, w: 12, h: 4 },
    priority: 8,
    isVisible: false, // Hidden by default
    config: {
      showProjections: true,
      maxSuggestions: 3
    },
    minSize: { w: 6, h: 3 },
    maxSize: { w: 12, h: 8 },
    resizable: true,
    draggable: true
  }
];

const createDefaultLayout = (userId: string): DashboardLayout => ({
  id: 'default',
  userId,
  name: 'Layout par défaut',
  widgets: defaultWidgets.filter(w => w.isVisible),
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480
  },
  isActive: true,
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // State
      currentLayout: createDefaultLayout(''),
      userBehavior: {
        userId: '',
        widgetInteractions: {},
        sessionDuration: 0,
        mostViewedWidgets: [],
        leastViewedWidgets: [],
        preferredLayout: 'extended',
        lastActiveDate: new Date(),
        totalSessions: 0,
        averageSessionTime: 0,
      },
      suggestions: [],
      availableWidgets: defaultWidgets,
      isLoading: false,
      isOptimizing: false,
      error: null,
      lastOptimization: null,

      // Actions
      trackInteraction: async (widgetId: string, action: string, params?: Record<string, any>) => {
        // Validate inputs
        if (!widgetId || !action || typeof action !== 'string') {
          console.warn('trackInteraction called with invalid parameters:', { widgetId, action, actionType: typeof action });
          return;
        }

        // Prevent tracking during initialization or if user is not set
        const state = get();
        if (!state.userBehavior.userId || state.isLoading) {
          return;
        }
        
        try {
          // Update local interaction count
          const currentInteractions = state.userBehavior.widgetInteractions[widgetId] || {
            viewCount: 0,
            clickCount: 0,
            totalTimeSpent: 0,
            lastViewed: new Date(),
            averageTimePerView: 0,
            actionsPerformed: []
          };

          if (action === 'view' || action === 'view_start') {
            currentInteractions.viewCount += 1;
            currentInteractions.lastViewed = new Date();
          }

          if (action === 'click' || (typeof action === 'string' && action.includes('click'))) {
            currentInteractions.clickCount += 1;
          }

          currentInteractions.actionsPerformed.push({
            action,
            timestamp: new Date(),
            params: params || {}
          });

          // Keep only last 50 actions
          currentInteractions.actionsPerformed = currentInteractions.actionsPerformed.slice(-50);

          // Update behavior
          const updatedBehavior = {
            ...state.userBehavior,
            widgetInteractions: {
              ...state.userBehavior.widgetInteractions,
              [widgetId]: currentInteractions
            }
          };

          set({ userBehavior: updatedBehavior });

          // Async API call without blocking (fire and forget)
          fetch('/api/dashboard/adaptive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'track_interaction',
              behavior: { widgetId, actionType: action, params }
            })
          }).catch(error => {
            console.warn('Background tracking failed:', error);
          });

        } catch (error) {
          console.error('Error tracking interaction:', error);
          // Don't set error state for tracking failures
        }
      },

      updateWidgetConfig: (widgetId: string, config: Partial<WidgetConfig>) => {
        const state = get();
        const updatedWidgets = state.currentLayout.widgets.map(widget =>
          widget.id === widgetId ? { ...widget, ...config } : widget
        );

        set({
          currentLayout: {
            ...state.currentLayout,
            widgets: updatedWidgets,
            updatedAt: new Date()
          }
        });
      },

      acceptSuggestion: async (suggestionId: string) => {
        const state = get();
        const suggestion = state.suggestions.find(s => s.id === suggestionId);
        
        if (!suggestion) return;

        try {
          // Execute suggestion action
          await get().executeSuggestionAction(suggestion);
          
          // Mark suggestion as read
          const updatedSuggestions = state.suggestions.map(s =>
            s.id === suggestionId ? { ...s, isRead: true } : s
          );
          
          set({ suggestions: updatedSuggestions });
        } catch (error) {
          console.error('Error accepting suggestion:', error);
          set({ error: 'Failed to accept suggestion' });
        }
      },

      dismissSuggestion: (suggestionId: string) => {
        const state = get();
        const updatedSuggestions = state.suggestions.map(s =>
          s.id === suggestionId ? { ...s, isDismissed: true } : s
        );
        
        set({ suggestions: updatedSuggestions });
      },

      optimizeLayout: async () => {
        const state = get();
        set({ isOptimizing: true, error: null });

        try {
          const optimizedLayout = await get().generateOptimizedLayout();
          
          set({
            currentLayout: optimizedLayout,
            isOptimizing: false,
            lastOptimization: new Date()
          });
        } catch (error) {
          console.error('Error optimizing layout:', error);
          set({ 
            error: 'Failed to optimize layout', 
            isOptimizing: false 
          });
        }
      },

      resetLayout: () => {
        const state = get();
        const defaultLayout = createDefaultLayout(state.userBehavior.userId);
        set({ currentLayout: defaultLayout });
      },

      saveLayout: async (name: string) => {
        const state = get();
        
        try {
          // Save to adaptive dashboard API
          const response = await fetch('/api/dashboard/adaptive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save_layout',
              layout: {
                ...state.currentLayout,
                name,
                id: `layout_${Date.now()}`,
                isDefault: false
              }
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save layout');
          }
        } catch (error) {
          console.error('Error saving layout:', error);
          set({ error: 'Failed to save layout' });
        }
      },

      loadLayout: async (layoutId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/dashboard/adaptive?layoutId=${layoutId}`);
          
          if (!response.ok) {
            throw new Error('Failed to load layout');
          }

          const { layout } = await response.json();
          set({ currentLayout: layout, isLoading: false });
        } catch (error) {
          console.error('Error loading layout:', error);
          set({ 
            error: 'Failed to load layout', 
            isLoading: false 
          });
        }
      },

      // Getters
      getMostUsedWidgets: () => {
        const state = get();
        return state.userBehavior.mostViewedWidgets;
      },

      getLeastUsedWidgets: () => {
        const state = get();
        return state.userBehavior.leastViewedWidgets;
      },

      getRecommendedWidgets: () => {
        const state = get();
        const { userBehavior, availableWidgets } = state;
        
        // Filter widgets based on user behavior and preferences
        return availableWidgets.filter(widget => {
          const interaction = userBehavior.widgetInteractions[widget.id];
          const isCurrentlyVisible = state.currentLayout.widgets.some(w => w.id === widget.id);
          
          // Recommend if not visible but has some interaction
          return !isCurrentlyVisible && interaction && interaction.viewCount > 0;
        });
      },

      getLayoutScore: () => {
        const state = get();
        const { currentLayout, userBehavior } = state;
        
        let score = 0;
        let totalPossibleScore = 0;

        currentLayout.widgets.forEach(widget => {
          const interaction = userBehavior.widgetInteractions[widget.id];
          const baseScore = widget.priority * 10;
          totalPossibleScore += baseScore;

          if (interaction) {
            // Score based on usage vs priority
            const usageScore = Math.min(interaction.viewCount, 10) * baseScore / 10;
            score += usageScore;
          }
        });

        return totalPossibleScore > 0 ? (score / totalPossibleScore) * 100 : 0;
      },

      // Internal methods
      initialize: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
          // Try to fetch from adaptive dashboard API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch('/api/dashboard/adaptive', {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const { layout, behavior, suggestions } = await response.json();
            
            set({
              currentLayout: layout || createDefaultLayout(userId),
              userBehavior: behavior || {
                userId,
                widgetInteractions: {},
                sessionDuration: 0,
                mostViewedWidgets: [],
                leastViewedWidgets: [],
                preferredLayout: 'extended',
                lastActiveDate: new Date(),
                totalSessions: 0,
                averageSessionTime: 0
              },
              suggestions: suggestions || [],
              isLoading: false
            });
          } else {
            // Fallback to default layout
            set({
              currentLayout: createDefaultLayout(userId),
              userBehavior: {
                userId,
                widgetInteractions: {},
                sessionDuration: 0,
                mostViewedWidgets: [],
                leastViewedWidgets: [],
                preferredLayout: 'extended',
                lastActiveDate: new Date(),
                totalSessions: 0,
                averageSessionTime: 0
              },
              suggestions: [],
              isLoading: false
            });
          }
        } catch (error) {
          console.warn('Dashboard initialization failed, using defaults:', error);
          // Fallback to default even on error (network issues, etc.)
          set({ 
            currentLayout: createDefaultLayout(userId),
            userBehavior: {
              userId,
              widgetInteractions: {},
              sessionDuration: 0,
              mostViewedWidgets: [],
              leastViewedWidgets: [],
              preferredLayout: 'extended',
              lastActiveDate: new Date(),
              totalSessions: 0,
              averageSessionTime: 0
            },
            suggestions: [],
            error: null, // Don't show error, just use default
            isLoading: false 
          });
        }
      },

      setBehavior: (behavior: UserBehavior) => {
        set({ userBehavior: behavior });
      },

      setSuggestions: (suggestions: Suggestion[]) => {
        set({ suggestions });
      },

      setLayout: (layout: DashboardLayout) => {
        set({ currentLayout: layout });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Helper methods
      executeSuggestionAction: async (suggestion: Suggestion) => {
        const state = get();
        
        switch (suggestion.type) {
          case 'widget-add':
            const newWidget = state.availableWidgets.find(w => w.id === suggestion.data.widgetId);
            if (newWidget) {
              const updatedWidgets = [...state.currentLayout.widgets, newWidget];
              set({
                currentLayout: {
                  ...state.currentLayout,
                  widgets: updatedWidgets
                }
              });
            }
            break;

          case 'widget-remove':
            const widgetsToRemove = suggestion.data.widgetsToRemove || [];
            const filteredWidgets = state.currentLayout.widgets.filter(
              w => !widgetsToRemove.includes(w.id)
            );
            set({
              currentLayout: {
                ...state.currentLayout,
                widgets: filteredWidgets
              }
            });
            break;

          case 'widget-resize':
            const { widgetId, suggestedPosition } = suggestion.data;
            get().updateWidgetConfig(widgetId, { position: suggestedPosition });
            break;

          case 'layout-optimize':
            await get().optimizeLayout();
            break;
        }
      },

      generateOptimizedLayout: async (): Promise<DashboardLayout> => {
        const state = get();
        const { userBehavior, currentLayout } = state;
        
        // Create optimized layout based on usage patterns
        const optimizedWidgets = [...currentLayout.widgets];
        
        // Sort by usage (most used first)
        optimizedWidgets.sort((a, b) => {
          const aInteraction = userBehavior.widgetInteractions[a.id];
          const bInteraction = userBehavior.widgetInteractions[b.id];
          
          const aUsage = aInteraction ? aInteraction.viewCount : 0;
          const bUsage = bInteraction ? bInteraction.viewCount : 0;
          
          return bUsage - aUsage;
        });

        // Repositioned based on usage
        let y = 0;
        optimizedWidgets.forEach((widget, index) => {
          const isHighPriority = index < 3;
          const width = isHighPriority ? 6 : 4;
          const height = isHighPriority ? 4 : 3;
          
          widget.position = {
            x: (index % 2) * width,
            y: y,
            w: width,
            h: height
          };

          if (index % 2 === 1) {
            y += height;
          }
        });

        return {
          ...currentLayout,
          widgets: optimizedWidgets,
          updatedAt: new Date()
        };
      }
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        currentLayout: state.currentLayout,
        userBehavior: state.userBehavior,
        lastOptimization: state.lastOptimization
        // Do not persist isLoading, error, or suggestions
      })
    }
  )
); 