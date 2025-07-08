import { 
  UserBehavior, 
  WidgetConfig, 
  Suggestion, 
  SuggestionAction,
  DashboardLayout,
  UserProfile 
} from '@/types/dashboard';
import { BehaviorTrackingService } from './behavior-tracking';

export class SuggestionEngine {
  private behaviorService: BehaviorTrackingService;
  private suggestionHistory: Map<string, Suggestion[]> = new Map();

  constructor() {
    this.behaviorService = new BehaviorTrackingService();
  }

  /**
   * Generate comprehensive suggestions based on user behavior
   */
  async generateSuggestions(
    userId: string, 
    currentLayout: DashboardLayout, 
    userProfile?: UserProfile
  ): Promise<Suggestion[]> {
    const behavior = await this.behaviorService.getUserBehavior(userId);
    const suggestions: Suggestion[] = [];

    // Get different types of suggestions
    const layoutSuggestions = this.analyzeLayoutOptimization(behavior, currentLayout);
    const widgetSuggestions = this.analyzeWidgetUsage(behavior, currentLayout);
    const personalizedSuggestions = this.generatePersonalizedSuggestions(behavior, userProfile);
    const performanceSuggestions = this.analyzePerformanceOptimization(behavior, currentLayout);

    suggestions.push(
      ...layoutSuggestions,
      ...widgetSuggestions,
      ...personalizedSuggestions,
      ...performanceSuggestions
    );

    // Filter and rank suggestions
    const rankedSuggestions = this.rankSuggestions(suggestions, behavior);
    
    // Store in history
    this.suggestionHistory.set(userId, rankedSuggestions);

    return rankedSuggestions;
  }

  /**
   * Analyze layout optimization opportunities
   */
  private analyzeLayoutOptimization(
    behavior: UserBehavior, 
    currentLayout: DashboardLayout
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const { widgetInteractions, mostViewedWidgets } = behavior;

    // Suggest reordering based on usage
    if (mostViewedWidgets.length >= 3) {
      const topWidget = mostViewedWidgets[0];
      const topWidgetConfig = currentLayout.widgets.find(w => w.id === topWidget);
      
      if (topWidgetConfig && topWidgetConfig.position.y > 0) {
        suggestions.push({
          id: `reorder-${topWidget}`,
          type: 'layout-optimize',
          title: 'Réorganiser pour un accès plus rapide',
          description: `Déplacer "${topWidgetConfig.title}" en haut pour un accès plus rapide`,
          impact: 'high',
          confidence: 0.85,
          data: {
            widgetId: topWidget,
            currentPosition: topWidgetConfig.position,
            suggestedPosition: { ...topWidgetConfig.position, y: 0 }
          },
          actions: [
            {
              label: 'Déplacer en haut',
              action: 'move_to_top',
              params: { widgetId: topWidget }
            },
            {
              label: 'Optimiser tout',
              action: 'optimize_layout'
            }
          ],
          createdAt: new Date(),
          isRead: false,
          isDismissed: false
        });
      }
    }

    // Suggest layout compaction
    const totalWidgets = currentLayout.widgets.length;
    const visibleWidgets = currentLayout.widgets.filter(w => w.isVisible).length;
    
    if (visibleWidgets < totalWidgets * 0.7) {
      suggestions.push({
        id: 'compact-layout',
        type: 'layout-optimize',
        title: 'Compacter le layout',
        description: 'Réduire l\'espace vide en compactant les widgets',
        impact: 'medium',
        confidence: 0.7,
        data: {
          currentWidgets: visibleWidgets,
          totalWidgets: totalWidgets
        },
        actions: [
          {
            label: 'Compacter',
            action: 'compact_layout'
          }
        ],
        createdAt: new Date(),
        isRead: false,
        isDismissed: false
      });
    }

    return suggestions;
  }

  /**
   * Analyze widget usage patterns
   */
  private analyzeWidgetUsage(
    behavior: UserBehavior, 
    currentLayout: DashboardLayout
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const { widgetInteractions, leastViewedWidgets } = behavior;

    // Suggest hiding unused widgets
    const unusedWidgets = leastViewedWidgets.filter(widgetId => {
      const interaction = widgetInteractions[widgetId];
      return interaction && interaction.viewCount < 3;
    });

    if (unusedWidgets.length > 0) {
      suggestions.push({
        id: 'hide-unused-widgets',
        type: 'widget-remove',
        title: 'Masquer les widgets inutilisés',
        description: `${unusedWidgets.length} widgets ne sont jamais consultés`,
        impact: 'medium',
        confidence: 0.8,
        data: {
          widgetsToHide: unusedWidgets,
          usageStats: unusedWidgets.map(id => ({
            id,
            viewCount: widgetInteractions[id]?.viewCount || 0
          }))
        },
        actions: [
          {
            label: 'Masquer tout',
            action: 'hide_widgets',
            params: { widgetIds: unusedWidgets }
          },
          {
            label: 'Réviser individuellement',
            action: 'review_widgets',
            params: { widgetIds: unusedWidgets }
          }
        ],
        createdAt: new Date(),
        isRead: false,
        isDismissed: false
      });
    }

    // Suggest resizing frequently used widgets
    Object.entries(widgetInteractions).forEach(([widgetId, interaction]) => {
      if (interaction.viewCount >= 30) {
        const widgetConfig = currentLayout.widgets.find(w => w.id === widgetId);
        if (widgetConfig && widgetConfig.position.w < widgetConfig.maxSize.w) {
          suggestions.push({
            id: `resize-${widgetId}`,
            type: 'widget-resize',
            title: 'Agrandir un widget fréquemment utilisé',
            description: `"${widgetConfig.title}" est souvent consulté, l'agrandir ?`,
            impact: 'low',
            confidence: 0.6,
            data: {
              widgetId,
              currentSize: widgetConfig.position,
              suggestedSize: {
                ...widgetConfig.position,
                w: Math.min(widgetConfig.position.w + 2, widgetConfig.maxSize.w)
              }
            },
            actions: [
              {
                label: 'Agrandir',
                action: 'resize_widget',
                params: { 
                  widgetId, 
                  newSize: {
                    ...widgetConfig.position,
                    w: Math.min(widgetConfig.position.w + 2, widgetConfig.maxSize.w)
                  }
                }
              }
            ],
            createdAt: new Date(),
            isRead: false,
            isDismissed: false
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * Generate personalized suggestions based on user profile
   */
  private generatePersonalizedSuggestions(
    behavior: UserBehavior, 
    userProfile?: UserProfile
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    if (!userProfile) return suggestions;

    // Suggestions based on user cluster
    switch (userProfile.behaviorCluster) {
      case 'trader':
        suggestions.push({
          id: 'trader-performance-widget',
          type: 'widget-add',
          title: 'Widget Performance Avancé',
          description: 'Ajoutez un widget de performance en temps réel adapté aux traders',
          impact: 'high',
          confidence: 0.9,
          data: {
            widgetType: 'advanced-performance',
            reason: 'Profil trader détecté'
          },
          actions: [
            {
              label: 'Ajouter',
              action: 'add_widget',
              params: { widgetType: 'advanced-performance' }
            }
          ],
          createdAt: new Date(),
          isRead: false,
          isDismissed: false
        });
        break;

      case 'conservative':
        suggestions.push({
          id: 'conservative-overview',
          type: 'layout-optimize',
          title: 'Layout Simplifié',
          description: 'Simplifier le dashboard avec les widgets essentiels',
          impact: 'medium',
          confidence: 0.8,
          data: {
            layoutType: 'conservative',
            reason: 'Profil conservateur détecté'
          },
          actions: [
            {
              label: 'Simplifier',
              action: 'apply_conservative_layout'
            }
          ],
          createdAt: new Date(),
          isRead: false,
          isDismissed: false
        });
        break;

      case 'beginner':
        suggestions.push({
          id: 'beginner-tutorial',
          type: 'widget-add',
          title: 'Widget d\'Aide',
          description: 'Ajoutez un widget d\'aide pour découvrir les fonctionnalités',
          impact: 'high',
          confidence: 0.9,
          data: {
            widgetType: 'help-tutorial',
            reason: 'Profil débutant détecté'
          },
          actions: [
            {
              label: 'Ajouter l\'aide',
              action: 'add_widget',
              params: { widgetType: 'help-tutorial' }
            }
          ],
          createdAt: new Date(),
          isRead: false,
          isDismissed: false
        });
        break;
    }

    return suggestions;
  }

  /**
   * Analyze performance optimization opportunities
   */
  private analyzePerformanceOptimization(
    behavior: UserBehavior, 
    currentLayout: DashboardLayout
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Suggest reducing widgets if too many
    if (currentLayout.widgets.length > 12) {
      suggestions.push({
        id: 'reduce-widget-count',
        type: 'layout-optimize',
        title: 'Réduire le nombre de widgets',
        description: 'Trop de widgets peuvent ralentir le dashboard',
        impact: 'medium',
        confidence: 0.7,
        data: {
          currentCount: currentLayout.widgets.length,
          suggestedCount: 8
        },
        actions: [
          {
            label: 'Optimiser',
            action: 'optimize_performance'
          }
        ],
        createdAt: new Date(),
        isRead: false,
        isDismissed: false
      });
    }

    // Suggest lazy loading for heavy widgets
    const heavyWidgets = currentLayout.widgets.filter(w => 
      ['performance-chart', 'market-news', 'ai-insights'].includes(w.type)
    );

    if (heavyWidgets.length > 3) {
      suggestions.push({
        id: 'lazy-load-widgets',
        type: 'layout-optimize',
        title: 'Chargement différé',
        description: 'Améliorer la performance avec le chargement différé',
        impact: 'low',
        confidence: 0.6,
        data: {
          heavyWidgets: heavyWidgets.map(w => w.id)
        },
        actions: [
          {
            label: 'Activer',
            action: 'enable_lazy_loading'
          }
        ],
        createdAt: new Date(),
        isRead: false,
        isDismissed: false
      });
    }

    return suggestions;
  }

  /**
   * Rank suggestions by relevance and impact
   */
  private rankSuggestions(suggestions: Suggestion[], behavior: UserBehavior): Suggestion[] {
    return suggestions
      .map(suggestion => ({
        ...suggestion,
        score: this.calculateSuggestionScore(suggestion, behavior)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Calculate suggestion relevance score
   */
  private calculateSuggestionScore(suggestion: Suggestion, behavior: UserBehavior): number {
    let score = 0;

    // Base score from confidence
    score += suggestion.confidence * 100;

    // Impact multiplier
    const impactMultiplier = {
      high: 1.5,
      medium: 1.0,
      low: 0.5
    };
    score *= impactMultiplier[suggestion.impact];

    // Behavioral relevance
    if (suggestion.type === 'widget-remove' && behavior.leastViewedWidgets.length > 0) {
      score += 20;
    }

    if (suggestion.type === 'layout-optimize' && behavior.totalSessions > 10) {
      score += 30;
    }

    if (suggestion.type === 'widget-resize' && behavior.mostViewedWidgets.length > 0) {
      score += 25;
    }

    // Recency factor (newer suggestions get slight boost)
    const daysSinceCreation = (Date.now() - suggestion.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceCreation);

    return score;
  }

  /**
   * Get suggestion acceptance rate for analytics
   */
  getSuggestionStats(userId: string): {
    totalGenerated: number;
    totalAccepted: number;
    acceptanceRate: number;
    topSuggestionTypes: Array<{ type: string; count: number }>;
  } {
    const userSuggestions = this.suggestionHistory.get(userId) || [];
    const totalGenerated = userSuggestions.length;
    const totalAccepted = userSuggestions.filter(s => s.isRead).length;
    const acceptanceRate = totalGenerated > 0 ? totalAccepted / totalGenerated : 0;

    const typeCounts = userSuggestions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSuggestionTypes = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));

    return {
      totalGenerated,
      totalAccepted,
      acceptanceRate,
      topSuggestionTypes
    };
  }

  /**
   * A/B test suggestions
   */
  async testSuggestion(
    userId: string, 
    suggestionId: string, 
    variant: 'A' | 'B'
  ): Promise<void> {
    // Implementation for A/B testing suggestions
    // This would track which variant performs better
    console.log(`Testing suggestion ${suggestionId} variant ${variant} for user ${userId}`);
  }

  /**
   * Learn from user feedback
   */
  async learnFromFeedback(
    userId: string, 
    suggestionId: string, 
    feedback: 'accepted' | 'dismissed' | 'not_useful'
  ): Promise<void> {
    // Implementation for learning from user feedback
    // This would adjust future suggestion generation
    console.log(`Learning from feedback: ${feedback} for suggestion ${suggestionId}`);
  }
}

// Singleton instance
export const suggestionEngine = new SuggestionEngine(); 