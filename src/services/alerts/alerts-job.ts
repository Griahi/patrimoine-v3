import { prisma } from '@/lib/prisma';
import { AlertsEngine } from './alerts-engine';

export class AlertsJob {
  private alertsEngine: AlertsEngine;

  constructor() {
    this.alertsEngine = new AlertsEngine();
  }

  async processAllUsers(): Promise<void> {
    console.log('🔔 Starting alerts generation job...');
    
    try {
      // Récupérer tous les utilisateurs actifs
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, email: true }
      });

      console.log(`📊 Processing alerts for ${users.length} users`);

      let totalAlertsGenerated = 0;

      for (const user of users) {
        try {
          const userAlertsCount = await this.processUserAlerts(user.id);
          totalAlertsGenerated += userAlertsCount;
          
          if (userAlertsCount > 0) {
            console.log(`✅ Generated ${userAlertsCount} alerts for user ${user.email}`);
          }
        } catch (error) {
          console.error(`❌ Error processing alerts for user ${user.email}:`, error);
        }
      }

      console.log(`🎉 Alerts job completed. Total alerts generated: ${totalAlertsGenerated}`);
      
      // Nettoyer les anciennes alertes dismissées
      await this.cleanupOldAlerts();

    } catch (error) {
      console.error('💥 Alerts job failed:', error);
      throw error;
    }
  }

  private async processUserAlerts(userId: string): Promise<number> {
    try {
      // Récupérer les données du patrimoine pour cet utilisateur
      const patrimonyData = await this.getPatrimonyData(userId);
      
      // Si l'utilisateur n'a pas d'actifs, on skip
      if (!patrimonyData || patrimonyData.assets.length === 0) {
        return 0;
      }

      // Générer les alertes
      const newAlerts = await this.alertsEngine.processUserAlerts(userId, patrimonyData);
      
      return newAlerts.length;
    } catch (error) {
      console.error(`Error processing user ${userId}:`, error);
      return 0;
    }
  }

  private async getPatrimonyData(userId: string) {
    // Récupérer les entités de l'utilisateur
    const entities = await prisma.entity.findMany({
      where: { userId }
    });

    if (entities.length === 0) {
      return null;
    }

    // Récupérer les actifs avec leurs valorisations
    const assets = await prisma.asset.findMany({
      where: {
        ownerships: {
          some: {
            ownerEntity: {
              userId
            }
          }
        }
      },
      include: {
        assetType: true,
        valuations: {
          orderBy: { valuationDate: 'desc' },
          take: 2 // Dernière et avant-dernière valorisation
        },
        ownerships: {
          include: {
            ownerEntity: true
          }
        }
      }
    });

    if (assets.length === 0) {
      return null;
    }

    // Calculer la valeur totale et les performances
    let totalValue = 0;
    let monthlyFees = 0;
    const assetData = [];
    
    for (const asset of assets) {
      const latestValuation = asset.valuations[0];
      const previousValuation = asset.valuations[1];
      
      if (!latestValuation) continue;

      const assetValue = latestValuation.value;
      totalValue += assetValue;

      // Calculer la performance mensuelle si possible
      let monthlyPerformance = undefined;
      if (previousValuation) {
        const timeDiff = latestValuation.valuationDate.getTime() - previousValuation.valuationDate.getTime();
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        
        // Seulement si les valorisations sont suffisamment espacées (plus de 7 jours)
        if (daysDiff > 7) {
          monthlyPerformance = (assetValue - previousValuation.value) / previousValuation.value;
          
          // Normaliser sur une base mensuelle si nécessaire
          if (daysDiff > 45) { // Plus d'un mois et demi
            monthlyPerformance = monthlyPerformance * (30 / daysDiff);
          }
        }
      }

      // Simuler des frais mensuels pour certains types d'actifs
      if (asset.assetType.code === 'bank_account') {
        monthlyFees += 15; // 15€ de frais par compte
      } else if (asset.assetType.code === 'investment_fund') {
        monthlyFees += assetValue * 0.002; // 0.2% de frais annuels
      }

      assetData.push({
        id: asset.id,
        name: asset.name,
        type: asset.assetType.code,
        value: assetValue,
        percentage: 0, // Sera calculé après
        monthlyPerformance,
        ticker: asset.metadata?.ticker || null
      });
    }

    // Calculer les pourcentages
    assetData.forEach(asset => {
      asset.percentage = asset.value / totalValue;
    });

    // Calculer la diversification
    const diversification = this.calculateDiversification(assetData);

    return {
      totalValue,
      assets: assetData,
      monthlyFees,
      diversification
    };
  }

  private calculateDiversification(assets: any[]) {
    const byAssetType: Record<string, number> = {};
    let maxConcentration = 0;

    // Grouper par type d'actif
    assets.forEach(asset => {
      byAssetType[asset.type] = (byAssetType[asset.type] || 0) + asset.percentage;
      maxConcentration = Math.max(maxConcentration, asset.percentage);
    });

    return {
      byAssetType,
      concentration: maxConcentration
    };
  }

  private async cleanupOldAlerts(): Promise<void> {
    try {
      // Supprimer les alertes dismissées de plus de 30 jours
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const deletedCount = await prisma.alert.deleteMany({
        where: {
          status: 'dismissed',
          dismissedAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      if (deletedCount.count > 0) {
        console.log(`🧹 Cleaned up ${deletedCount.count} old dismissed alerts`);
      }

      // Supprimer les alertes snoozées expirées depuis plus de 7 jours
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const expiredSnoozeCount = await prisma.alert.deleteMany({
        where: {
          status: 'snoozed',
          snoozedUntil: {
            lt: sevenDaysAgo
          }
        }
      });

      if (expiredSnoozeCount.count > 0) {
        console.log(`⏰ Cleaned up ${expiredSnoozeCount.count} expired snoozed alerts`);
      }

    } catch (error) {
      console.error('Error during alerts cleanup:', error);
    }
  }

  async generateTestAlerts(userId: string): Promise<number> {
    console.log(`🧪 Generating test alerts for user ${userId}`);
    return await this.processUserAlerts(userId);
  }
}

// Fonction utilitaire pour lancer le job manuellement
export async function runAlertsJob(): Promise<void> {
  const job = new AlertsJob();
  await job.processAllUsers();
} 