import { prisma } from '@/lib/prisma';
import { 
  UserBehavior, 
  WidgetInteraction, 
  ActionEvent, 
  Suggestion, 
  WidgetConfig,
  UserProfile
} from '@/types/dashboard';

export class BehaviorTrackingService {
  private sessionId: string;
  private sessionStartTime: number;
  private interactionBuffer: Array<{
    widgetId: string;
    action: string;
    timestamp: number;
    params?: Record<string, any>;
    coordinates?: { x: number; y: number };
  }> = [];

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    // Flush buffer every 10 seconds
    setInterval(() => this.flushBuffer(), 10000);
    
    // Track session end
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.endSession());
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track widget interaction
   */
  async trackInteraction(
    userId: string,
    widgetId: string,
    action: string,
    params?: Record<string, any>,
    coordinates?: { x: number; y: number }
  ) {
    this.interactionBuffer.push({
      widgetId,
      action,
      timestamp: Date.now(),
      params,
      coordinates
    });

    // Immediate flush for critical actions
    if (action === 'click' || action === 'navigate') {
      await this.flushBuffer();
    }
  }

  /**
   * Flush interaction buffer to database
   */
  private async flushBuffer() {
    if (this.interactionBuffer.length === 0) return;

    try {
      const interactions = this.interactionBuffer.map(interaction => ({
        userId: this.getCurrentUserId(),
        widgetId: interaction.widgetId,
        action: interaction.action,
        params: interaction.params || {},
        timestamp: new Date(interaction.timestamp),
        sessionId: this.sessionId,
        duration: null,
        clickX: interaction.coordinates?.x || null,
        clickY: interaction.coordinates?.y || null,
      }));

      await prisma.widgetInteraction.createMany({
        data: interactions,
        skipDuplicates: true
      });

      this.interactionBuffer = [];
    } catch (error) {
      console.error('Error flushing interaction buffer:', error);
    }
  }

  /**
   * Track widget view duration
   */
  async trackWidgetView(
    userId: string,
    widgetId: string,
    startTime: number,
    endTime: number
  ) {
    const duration = endTime - startTime;
    
    await prisma.widgetInteraction.create({
      data: {
        userId,
        widgetId,
        action: 'view',
        timestamp: new Date(startTime),
        sessionId: this.sessionId,
        duration,
        params: {},
      }
    });
  }

  /**
   * Get user behavior analytics
   */
  async getUserBehavior(userId: string): Promise<UserBehavior> {
    const existingBehavior = await prisma.userBehavior.findUnique({
      where: { userId }
    });

    if (!existingBehavior) {
      return this.createInitialBehavior(userId);
    }

    // Update behavior with recent interactions
    const recentInteractions = await prisma.widgetInteraction.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    const behaviorData = this.analyzeInteractions(recentInteractions);

    return {
      userId,
      widgetInteractions: behaviorData.widgetInteractions,
      sessionDuration: behaviorData.averageSessionDuration,
      mostViewedWidgets: behaviorData.mostViewedWidgets,
      leastViewedWidgets: behaviorData.leastViewedWidgets,
      preferredLayout: behaviorData.preferredLayout,
      lastActiveDate: behaviorData.lastActiveDate,
      totalSessions: behaviorData.totalSessions,
      averageSessionTime: behaviorData.averageSessionTime,
    };
  }

  /**
   * Analyze widget interactions to extract patterns
   */
  private analyzeInteractions(interactions: any[]): {
    widgetInteractions: Record<string, WidgetInteraction>;
    averageSessionDuration: number;
    mostViewedWidgets: string[];
    leastViewedWidgets: string[];
    preferredLayout: 'compact' | 'extended' | 'custom';
    lastActiveDate: Date;
    totalSessions: number;
    averageSessionTime: number;
  } {
    const widgetStats: Record<string, {
      viewCount: number;
      totalTimeSpent: number;
      lastViewed: Date;
      actionsPerformed: ActionEvent[];
      clickHeatmap: Array<{ x: number; y: number; timestamp: Date }>;
    }> = {};

    const sessions = new Set(interactions.map(i => i.sessionId).filter(Boolean));
    const sessionDurations: number[] = [];

    // Group interactions by widget
    interactions.forEach(interaction => {
      if (!widgetStats[interaction.widgetId]) {
        widgetStats[interaction.widgetId] = {
          viewCount: 0,
          totalTimeSpent: 0,
          lastViewed: interaction.timestamp,
          actionsPerformed: [],
          clickHeatmap: []
        };
      }

      const widget = widgetStats[interaction.widgetId];
      
      if (interaction.action === 'view') {
        widget.viewCount += 1;
        widget.totalTimeSpent += interaction.duration || 0;
      }

      widget.actionsPerformed.push({
        action: interaction.action,
        timestamp: interaction.timestamp,
        params: interaction.params
      });

      if (interaction.clickX && interaction.clickY) {
        widget.clickHeatmap.push({
          x: interaction.clickX,
          y: interaction.clickY,
          timestamp: interaction.timestamp
        });
      }

      widget.lastViewed = new Date(Math.max(
        widget.lastViewed.getTime(),
        interaction.timestamp.getTime()
      ));
    });

    // Calculate session statistics
    sessions.forEach(sessionId => {
      const sessionInteractions = interactions.filter(i => i.sessionId === sessionId);
      if (sessionInteractions.length > 0) {
        const start = Math.min(...sessionInteractions.map(i => i.timestamp.getTime()));
        const end = Math.max(...sessionInteractions.map(i => i.timestamp.getTime()));
        sessionDurations.push(end - start);
      }
    });

    // Convert to WidgetInteraction format
    const widgetInteractions: Record<string, WidgetInteraction> = {};
    Object.entries(widgetStats).forEach(([widgetId, stats]) => {
      widgetInteractions[widgetId] = {
        widgetId,
        viewCount: stats.viewCount,
        totalTimeSpent: stats.totalTimeSpent,
        lastViewed: stats.lastViewed,
        actionsPerformed: stats.actionsPerformed,
        clickHeatmap: stats.clickHeatmap
      };
    });

    // Sort widgets by usage
    const sortedWidgets = Object.entries(widgetInteractions)
      .sort((a, b) => b[1].viewCount - a[1].viewCount)
      .map(([widgetId]) => widgetId);

    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;

    // Determine preferred layout based on usage patterns
    const preferredLayout = this.determinePreferredLayout(widgetInteractions);

    return {
      widgetInteractions,
      averageSessionDuration,
      mostViewedWidgets: sortedWidgets.slice(0, 5),
      leastViewedWidgets: sortedWidgets.slice(-3),
      preferredLayout,
      lastActiveDate: new Date(Math.max(...interactions.map(i => i.timestamp.getTime()))),
      totalSessions: sessions.size,
      averageSessionTime: averageSessionDuration / 1000 / 60 // Convert to minutes
    };
  }

  /**
   * Determine preferred layout based on usage patterns
   */
  private determinePreferredLayout(
    widgetInteractions: Record<string, WidgetInteraction>
  ): 'compact' | 'extended' | 'custom' {
    const totalViews = Object.values(widgetInteractions)
      .reduce((sum, w) => sum + w.viewCount, 0);

    const uniqueWidgetsUsed = Object.keys(widgetInteractions).length;

    // If user uses many widgets frequently, prefer extended layout
    if (uniqueWidgetsUsed >= 8 && totalViews >= 100) {
      return 'extended';
    }

    // If user uses few widgets, prefer compact
    if (uniqueWidgetsUsed <= 4) {
      return 'compact';
    }

    // Default to custom for mixed usage
    return 'custom';
  }

  /**
   * Generate suggestions based on behavior
   */
  async generateSuggestions(userId: string): Promise<Suggestion[]> {
    const behavior = await this.getUserBehavior(userId);
    const suggestions: Suggestion[] = [];

    // Suggestion 1: Pin frequently used widgets
    const topWidget = behavior.mostViewedWidgets[0];
    if (topWidget && behavior.widgetInteractions[topWidget]?.viewCount >= 20) {
      suggestions.push({
        id: `pin-${topWidget}`,
        type: 'widget-resize',
        title: 'Épingler votre widget favori',
        description: `Vous consultez souvent ${topWidget}. Voulez-vous l'épingler en haut ?`,
        impact: 'medium',
        confidence: 0.8,
        data: { widgetId: topWidget, suggestedPosition: { x: 0, y: 0 } },
        actions: [
          { label: 'Épingler', action: 'pin_widget', params: { widgetId: topWidget } },
          { label: 'Ignorer', action: 'dismiss_suggestion' }
        ],
        createdAt: new Date(),
        isRead: false,
        isDismissed: false
      });
    }

    // Suggestion 2: Remove unused widgets
    const unusedWidgets = behavior.leastViewedWidgets.filter(
      widgetId => behavior.widgetInteractions[widgetId]?.viewCount < 3
    );
    
    if (unusedWidgets.length > 0) {
      suggestions.push({
        id: `remove-unused`,
        type: 'widget-remove',
        title: 'Simplifier votre dashboard',
        description: `Certains widgets ne sont jamais utilisés. Les masquer ?`,
        impact: 'low',
        confidence: 0.6,
        data: { widgetsToRemove: unusedWidgets },
        actions: [
          { label: 'Masquer', action: 'hide_widgets', params: { widgetIds: unusedWidgets } },
          { label: 'Garder', action: 'dismiss_suggestion' }
        ],
        createdAt: new Date(),
        isRead: false,
        isDismissed: false
      });
    }

    // Suggestion 3: Layout optimization
    if (behavior.preferredLayout === 'compact' && behavior.mostViewedWidgets.length >= 6) {
      suggestions.push({
        id: `optimize-layout`,
        type: 'layout-optimize',
        title: 'Optimiser votre layout',
        description: 'Réorganiser automatiquement pour un accès plus rapide ?',
        impact: 'high',
        confidence: 0.7,
        data: { currentLayout: behavior.preferredLayout },
        actions: [
          { label: 'Optimiser', action: 'optimize_layout' },
          { label: 'Plus tard', action: 'snooze_suggestion' }
        ],
        createdAt: new Date(),
        isRead: false,
        isDismissed: false
      });
    }

    return suggestions;
  }

  /**
   * Update user behavior in database
   */
  async updateUserBehavior(userId: string, behaviorData: Partial<UserBehavior>) {
    await prisma.userBehavior.upsert({
      where: { userId },
      update: {
        widgetInteractions: behaviorData.widgetInteractions || {},
        sessionDuration: behaviorData.sessionDuration || 0,
        mostViewedWidgets: JSON.stringify(behaviorData.mostViewedWidgets || []),
        leastViewedWidgets: JSON.stringify(behaviorData.leastViewedWidgets || []),
        preferredLayout: behaviorData.preferredLayout || 'extended',
        lastActiveDate: behaviorData.lastActiveDate || new Date(),
        totalSessions: behaviorData.totalSessions || 0,
        averageSessionTime: behaviorData.averageSessionTime || 0,
        updatedAt: new Date()
      },
      create: {
        userId,
        widgetInteractions: behaviorData.widgetInteractions || {},
        sessionDuration: behaviorData.sessionDuration || 0,
        mostViewedWidgets: JSON.stringify(behaviorData.mostViewedWidgets || []),
        leastViewedWidgets: JSON.stringify(behaviorData.leastViewedWidgets || []),
        preferredLayout: behaviorData.preferredLayout || 'extended',
        lastActiveDate: behaviorData.lastActiveDate || new Date(),
        totalSessions: 1,
        averageSessionTime: behaviorData.averageSessionTime || 0,
        behaviorCluster: 'beginner',
        preferences: {
          autoOptimizeLayout: true,
          showSuggestions: true,
          compactMode: false,
          animationsEnabled: true,
          dataRetention: true,
          preferredMetrics: [],
          hiddenWidgets: []
        }
      }
    });
  }

  /**
   * Create initial behavior profile
   */
  private async createInitialBehavior(userId: string): Promise<UserBehavior> {
    const initialBehavior: UserBehavior = {
      userId,
      widgetInteractions: {},
      sessionDuration: 0,
      mostViewedWidgets: [],
      leastViewedWidgets: [],
      preferredLayout: 'extended',
      lastActiveDate: new Date(),
      totalSessions: 0,
      averageSessionTime: 0,
    };

    await this.updateUserBehavior(userId, initialBehavior);
    return initialBehavior;
  }

  /**
   * End current session and update statistics
   */
  async endSession() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    await this.flushBuffer();
    
    // Additional session cleanup logic here
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastSessionDuration', sessionDuration.toString());
    }
  }

  /**
   * Get current user ID (placeholder - should be implemented based on auth system)
   */
  private getCurrentUserId(): string {
    // This should be implemented based on your auth system
    // For now, return a placeholder
    return 'current-user-id';
  }

  /**
   * Generate widget usage heatmap
   */
  async getWidgetHeatmap(userId: string, widgetId: string): Promise<Array<{ x: number; y: number; intensity: number }>> {
    const interactions = await prisma.widgetInteraction.findMany({
      where: {
        userId,
        widgetId,
        clickX: { not: null },
        clickY: { not: null }
      },
      select: {
        clickX: true,
        clickY: true,
        timestamp: true
      }
    });

    // Group clicks by proximity and calculate intensity
    const heatmapData: Array<{ x: number; y: number; intensity: number }> = [];
    const proximityThreshold = 20; // pixels

    interactions.forEach(interaction => {
      if (!interaction.clickX || !interaction.clickY) return;

      let added = false;
      for (const point of heatmapData) {
        const distance = Math.sqrt(
          Math.pow(point.x - interaction.clickX, 2) + 
          Math.pow(point.y - interaction.clickY, 2)
        );

        if (distance <= proximityThreshold) {
          point.intensity += 1;
          added = true;
          break;
        }
      }

      if (!added) {
        heatmapData.push({
          x: interaction.clickX,
          y: interaction.clickY,
          intensity: 1
        });
      }
    });

    return heatmapData;
  }

  /**
   * Get user cluster based on behavior
   */
  getUserCluster(behavior: UserBehavior): UserProfile['behaviorCluster'] {
    const { widgetInteractions, averageSessionTime, totalSessions } = behavior;
    
    const totalViews = Object.values(widgetInteractions)
      .reduce((sum, w) => sum + w.viewCount, 0);
    
    const uniqueWidgets = Object.keys(widgetInteractions).length;
    
    // Advanced user: high activity, many widgets, long sessions
    if (totalViews >= 500 && uniqueWidgets >= 10 && averageSessionTime >= 15) {
      return 'aggressive';
    }
    
    // Active trader: frequent short sessions, focus on performance widgets
    if (totalSessions >= 50 && averageSessionTime <= 10) {
      return 'trader';
    }
    
    // Balanced user: moderate activity across various widgets
    if (totalViews >= 100 && uniqueWidgets >= 6) {
      return 'balanced';
    }
    
    // Conservative user: low activity, focus on overview widgets
    if (totalViews >= 50 && uniqueWidgets <= 5) {
      return 'conservative';
    }
    
    // Default for new users
    return 'beginner';
  }
}

// Singleton instance
export const behaviorTracker = new BehaviorTrackingService(); 