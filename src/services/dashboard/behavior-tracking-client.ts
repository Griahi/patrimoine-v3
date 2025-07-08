"use client";

import { UserBehavior, WidgetInteraction } from '@/types/dashboard';

export class BehaviorTrackingClientService {
  private behaviorBuffer: Map<string, any[]> = new Map();
  private bufferTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-flush buffer every 30 seconds
    this.bufferTimeout = setInterval(() => {
      this.flushBuffer();
    }, 30000);
  }

  async trackInteraction(
    userId: string,
    widgetId: string,
    action: string,
    params?: Record<string, any>
  ): Promise<void> {
    try {
      // Add to buffer for batch processing
      const bufferKey = `${userId}_${widgetId}`;
      if (!this.behaviorBuffer.has(bufferKey)) {
        this.behaviorBuffer.set(bufferKey, []);
      }

      this.behaviorBuffer.get(bufferKey)?.push({
        action,
        params: params || {},
        timestamp: new Date().toISOString()
      });

      // Send to API
      await fetch('/api/dashboard/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_interaction',
          behavior: {
            widgetId,
            actionType: action,
            params
          }
        })
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  async getUserBehavior(userId: string): Promise<UserBehavior> {
    try {
      const response = await fetch('/api/dashboard/adaptive');
      if (response.ok) {
        const data = await response.json();
        return data.behavior || this.getDefaultBehavior(userId);
      }
    } catch (error) {
      console.error('Error getting user behavior:', error);
    }

    return this.getDefaultBehavior(userId);
  }

  async updateUserBehavior(userId: string, behavior: Partial<UserBehavior>): Promise<void> {
    try {
      await fetch('/api/dashboard/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_behavior',
          behavior
        })
      });
    } catch (error) {
      console.error('Error updating user behavior:', error);
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.behaviorBuffer.size === 0) return;

    try {
      // Process buffer entries
      for (const [key, interactions] of this.behaviorBuffer.entries()) {
        if (interactions.length > 0) {
          const [userId, widgetId] = key.split('_');
          
          // Send batch update
          await fetch('/api/dashboard/adaptive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'batch_track',
              userId,
              widgetId,
              interactions
            })
          });
        }
      }

      // Clear buffer
      this.behaviorBuffer.clear();
    } catch (error) {
      console.error('Error flushing behavior buffer:', error);
    }
  }

  private getDefaultBehavior(userId: string): UserBehavior {
    return {
      userId,
      widgetInteractions: {},
      sessionDuration: 0,
      mostViewedWidgets: [],
      leastViewedWidgets: [],
      preferredLayout: 'extended',
      lastActiveDate: new Date(),
      totalSessions: 0,
      averageSessionTime: 0
    };
  }

  destroy(): void {
    if (this.bufferTimeout) {
      clearInterval(this.bufferTimeout);
      this.bufferTimeout = null;
    }
    this.flushBuffer();
  }
} 