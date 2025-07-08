import { PrismaClient } from '@prisma/client';
import { getAIConfig } from '@/config/ai.config';

const prisma = new PrismaClient();

export interface CleanupResult {
  deletedRecords: {
    interactions: number;
    predictions: number;
    models: number;
    alerts: number;
    sessions: number;
  };
  freedSpace: number; // En MB
  duration: number;
}

export class DataCleanup {
  private config = getAIConfig();

  async cleanupExpiredData(): Promise<CleanupResult> {
    console.log('Starting data cleanup...');
    const startTime = Date.now();
    
    const result: CleanupResult = {
      deletedRecords: {
        interactions: 0,
        predictions: 0,
        models: 0,
        alerts: 0,
        sessions: 0,
      },
      freedSpace: 0,
      duration: 0,
    };

    try {
      // Nettoyer les interactions IA anciennes (> 90 jours)
      result.deletedRecords.interactions = await this.cleanupAIInteractions();
      
      // Nettoyer les prédictions expirées
      result.deletedRecords.predictions = await this.cleanupPredictionsCache();
      
      // Nettoyer les anciens modèles ML
      result.deletedRecords.models = await this.cleanupOldModels();
      
      // Nettoyer les alertes anciennes
      result.deletedRecords.alerts = await this.cleanupOldAlerts();
      
      // Nettoyer les sessions expirées
      result.deletedRecords.sessions = await this.cleanupExpiredSessions();
      
      // Optimiser la base de données
      await this.optimizeDatabase();
      
      result.duration = Date.now() - startTime;
      result.freedSpace = this.estimateFreedSpace(result.deletedRecords);
      
      console.log('Data cleanup completed:', result);
      return result;
    } catch (error) {
      console.error('Data cleanup failed:', error);
      throw error;
    }
  }

  private async cleanupAIInteractions(): Promise<number> {
    const retentionDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 jours
    
    const { count } = await prisma.aIInteraction.deleteMany({
      where: {
        createdAt: {
          lt: retentionDate
        }
      }
    });
    
    console.log(`Deleted ${count} AI interactions older than 90 days`);
    return count;
  }

  private async cleanupPredictionsCache(): Promise<number> {
    // Supprimer les prédictions expirées du cache
    const now = new Date();
    
    const { count } = await prisma.aIPredictionsCache.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
    
    console.log(`Deleted ${count} expired prediction cache entries`);
    return count;
  }

  private async cleanupOldModels(): Promise<number> {
    // Garder seulement les 3 dernières versions de chaque modèle
    const modelTypes = await prisma.mLModel.findMany({
      select: { modelType: true },
      distinct: ['modelType']
    });
    
    let totalDeleted = 0;
    
    for (const { modelType } of modelTypes) {
      const models = await prisma.mLModel.findMany({
        where: { modelType },
        orderBy: { createdAt: 'desc' },
        skip: 3 // Garder les 3 plus récents
      });
      
      if (models.length > 0) {
        const { count } = await prisma.mLModel.deleteMany({
          where: {
            id: {
              in: models.map(m => m.id)
            }
          }
        });
        
        totalDeleted += count;
      }
    }
    
    console.log(`Deleted ${totalDeleted} old ML models`);
    return totalDeleted;
  }

  private async cleanupOldAlerts(): Promise<number> {
    const retentionDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 jours
    
    // Supprimer les alertes anciennes qui ont été lues ou rejetées
    const { count } = await prisma.alert.deleteMany({
      where: {
        OR: [
          {
            status: 'dismissed',
            updatedAt: { lt: retentionDate }
          },
          {
            status: 'read',
            readAt: { lt: retentionDate }
          }
        ]
      }
    });
    
    console.log(`Deleted ${count} old alerts`);
    return count;
  }

  private async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    
    const { count } = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: now
        }
      }
    });
    
    console.log(`Deleted ${count} expired sessions`);
    return count;
  }

  private async optimizeDatabase(): Promise<void> {
    try {
      // Analyser et optimiser les tables principales
      await prisma.$executeRaw`ANALYZE`;
      console.log('Database analysis completed');
    } catch (error) {
      console.warn('Database optimization skipped:', error);
    }
  }

  private estimateFreedSpace(deletedRecords: CleanupResult['deletedRecords']): number {
    // Estimation approximative de l'espace libéré (en MB)
    const estimations = {
      interactions: 0.001, // ~1KB par interaction
      predictions: 0.01,   // ~10KB par prédiction
      models: 5,           // ~5MB par modèle
      alerts: 0.002,       // ~2KB par alerte
      sessions: 0.001,     // ~1KB par session
    };
    
    let totalMB = 0;
    for (const [type, count] of Object.entries(deletedRecords)) {
      totalMB += count * estimations[type as keyof typeof estimations];
    }
    
    return Math.round(totalMB);
  }

  // Méthodes utilitaires pour le nettoyage spécialisé
  async cleanupUserData(userId: string): Promise<void> {
    console.log(`Cleaning up data for user: ${userId}`);
    
    // Supprimer toutes les données IA de l'utilisateur
    await Promise.all([
      prisma.aIInteraction.deleteMany({ where: { userId } }),
      prisma.alert.deleteMany({ where: { userId } }),
      prisma.userBehavior.deleteMany({ where: { userId } }),
      prisma.dashboardSuggestion.deleteMany({ where: { userId } }),
      prisma.dashboardLayout.deleteMany({ where: { userId } }),
    ]);
    
    console.log(`User data cleanup completed for: ${userId}`);
  }

  async cleanupTestData(): Promise<void> {
    console.log('Cleaning up test data...');
    
    // Supprimer les données de test (exemple : utilisateurs avec email de test)
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    });
    
    for (const user of testUsers) {
      await this.cleanupUserData(user.id);
    }
    
    console.log(`Cleaned up test data for ${testUsers.length} test users`);
  }

  async generateCleanupReport(): Promise<string> {
    const stats = await this.getDataStats();
    
    const report = `
=== AI Data Cleanup Report ===
Generated: ${new Date().toISOString()}

Current Data Statistics:
- AI Interactions: ${stats.interactions.toLocaleString()}
- Active Predictions: ${stats.predictions.toLocaleString()}
- ML Models: ${stats.models.toLocaleString()}
- Active Alerts: ${stats.alerts.toLocaleString()}
- Active Sessions: ${stats.sessions.toLocaleString()}

Storage Usage:
- Estimated Total: ${stats.estimatedSize} MB
- Cleanup Threshold: ${stats.cleanupThreshold} MB

Recommendations:
${this.generateRecommendations(stats)}
`;
    
    return report;
  }

  private async getDataStats() {
    const [interactions, predictions, models, alerts, sessions] = await Promise.all([
      prisma.aIInteraction.count(),
      prisma.aIPredictionsCache.count(),
      prisma.mLModel.count(),
      prisma.alert.count({ where: { status: { not: 'dismissed' } } }),
      prisma.session.count({ where: { expires: { gt: new Date() } } })
    ]);
    
    const estimatedSize = Math.round(
      interactions * 0.001 + 
      predictions * 0.01 + 
      models * 5 + 
      alerts * 0.002 + 
      sessions * 0.001
    );
    
    return {
      interactions,
      predictions,
      models,
      alerts,
      sessions,
      estimatedSize,
      cleanupThreshold: 1000 // 1GB
    };
  }

  private generateRecommendations(stats: any): string {
    const recommendations = [];
    
    if (stats.interactions > 100000) {
      recommendations.push('- Consider reducing AI interaction retention period');
    }
    
    if (stats.predictions > 10000) {
      recommendations.push('- Predictions cache is large, consider reducing TTL');
    }
    
    if (stats.models > 50) {
      recommendations.push('- Too many ML models stored, increase cleanup frequency');
    }
    
    if (stats.estimatedSize > stats.cleanupThreshold) {
      recommendations.push('- Database size exceeds threshold, immediate cleanup recommended');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- No immediate cleanup required');
    }
    
    return recommendations.join('\n');
  }
} 