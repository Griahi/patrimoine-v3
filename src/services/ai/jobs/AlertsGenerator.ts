import { PrismaClient } from '@prisma/client';
import { getAlertsConfig } from '@/config/ai.config';

const prisma = new PrismaClient();

export interface Alert {
  type: 'risk' | 'opportunity' | 'action_required' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    params?: any;
  }>;
}

export interface PortfolioAnalysis {
  totalValue: number;
  assets: any[];
  concentration: {
    maxWeight: number;
    topAsset: string;
    byAssetType: Record<string, number>;
  };
  performance: {
    monthly: number;
    yearly: number;
    volatility: number;
  };
  fees: {
    monthly: number;
    yearly: number;
  };
  risks: {
    concentrationRisk: number;
    volatilityRisk: number;
    liquidityRisk: number;
  };
}

export class AlertsGenerator {
  private config = getAlertsConfig();

  async generateAllAlerts(): Promise<void> {
    console.log('Starting alert generation for all users...');
    
    try {
      // Récupérer tous les utilisateurs actifs
      const users = await prisma.user.findMany({
        where: {
          // Utilisateurs actifs dans les 30 derniers jours
          sessions: {
            some: {
              expires: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        },
        select: { id: true }
      });

      console.log(`Found ${users.length} active users`);

      // Nettoyer les anciennes alertes
      await this.cleanupOldAlerts();

      // Générer les alertes pour chaque utilisateur
      let processedCount = 0;
      for (const user of users) {
        try {
          await this.generateUserAlerts(user.id);
          processedCount++;
        } catch (error) {
          console.error(`Failed to generate alerts for user ${user.id}:`, error);
        }
      }

      console.log(`Alert generation completed. Processed ${processedCount}/${users.length} users.`);
    } catch (error) {
      console.error('Failed to generate alerts for all users:', error);
      throw error;
    }
  }

  async generateUserAlerts(userId: string): Promise<Alert[]> {
    try {
      // Analyser le portfolio de l'utilisateur
      const analysis = await this.analyzeUserPortfolio(userId);
      
      if (!analysis) {
        console.log(`No portfolio data found for user ${userId}`);
        return [];
      }

      // Générer les alertes basées sur l'analyse
      const alerts = await this.analyzeAndGenerateAlerts(analysis);

      // Sauvegarder les alertes en base
      await this.saveAlerts(userId, alerts);

      console.log(`Generated ${alerts.length} alerts for user ${userId}`);
      return alerts;
    } catch (error) {
      console.error(`Failed to generate alerts for user ${userId}:`, error);
      throw error;
    }
  }

  private async analyzeUserPortfolio(userId: string): Promise<PortfolioAnalysis | null> {
    // Récupérer les entités de l'utilisateur
    const entities = await prisma.entity.findMany({
      where: { userId },
      include: {
        ownerships: {
          include: {
            ownedAsset: {
              include: {
                assetType: true,
                valuations: {
                  orderBy: { valuationDate: 'desc' },
                  take: 2 // Prendre les 2 dernières valorisations pour calculer la performance
                },
                debts: true
              }
            }
          }
        }
      }
    });

    if (entities.length === 0) {
      return null;
    }

    // Traiter les actifs
    const assets: any[] = [];
    let totalValue = 0;
    const assetTypeValues: Record<string, number> = {};
    let totalFees = 0;

    for (const entity of entities) {
      for (const ownership of entity.ownerships) {
        const asset = ownership.ownedAsset;
        if (!asset || !asset.valuations.length) continue;

        const currentValuation = asset.valuations[0];
        const previousValuation = asset.valuations[1];
        
        const assetValue = currentValuation.value * ownership.percentage;
        const assetPerformance = previousValuation 
          ? (currentValuation.value - previousValuation.value) / previousValuation.value
          : 0;

        assets.push({
          id: asset.id,
          name: asset.name,
          type: asset.assetType.name,
          value: assetValue,
          performance: assetPerformance,
          weight: 0, // Sera calculé après
          fees: this.calculateAssetFees(asset),
          debts: asset.debts.reduce((sum, debt) => sum + debt.amount, 0)
        });

        totalValue += assetValue;
        assetTypeValues[asset.assetType.name] = (assetTypeValues[asset.assetType.name] || 0) + assetValue;
        totalFees += this.calculateAssetFees(asset);
      }
    }

    // Calculer les poids
    assets.forEach(asset => {
      asset.weight = asset.value / totalValue;
    });

    // Calculer la concentration
    const maxWeight = Math.max(...assets.map(a => a.weight));
    const topAsset = assets.find(a => a.weight === maxWeight)?.name || 'Unknown';
    
    const concentration = {
      maxWeight,
      topAsset,
      byAssetType: Object.fromEntries(
        Object.entries(assetTypeValues).map(([type, value]) => [type, value / totalValue])
      )
    };

    // Calculer les performances et la volatilité
    const performances = assets.map(a => a.performance).filter(p => p !== 0);
    const avgPerformance = performances.length > 0 
      ? performances.reduce((sum, p) => sum + p, 0) / performances.length 
      : 0;
    
    const variance = performances.length > 1
      ? performances.reduce((sum, p) => sum + Math.pow(p - avgPerformance, 2), 0) / (performances.length - 1)
      : 0;
    const volatility = Math.sqrt(variance);

    // Calculer les risques
    const risks = {
      concentrationRisk: maxWeight,
      volatilityRisk: volatility,
      liquidityRisk: this.calculateLiquidityRisk(assets)
    };

    return {
      totalValue,
      assets,
      concentration,
      performance: {
        monthly: avgPerformance,
        yearly: avgPerformance * 12, // Approximation
        volatility
      },
      fees: {
        monthly: totalFees,
        yearly: totalFees * 12
      },
      risks
    };
  }

  private async analyzeAndGenerateAlerts(analysis: PortfolioAnalysis): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // 1. Alerte de concentration excessive
    if (analysis.concentration.maxWeight > this.config.severityThresholds.concentration) {
      alerts.push({
        type: 'risk',
        severity: analysis.concentration.maxWeight > 0.6 ? 'critical' : 'high',
        title: 'Concentration excessive détectée',
        message: `${analysis.concentration.topAsset} représente ${(analysis.concentration.maxWeight * 100).toFixed(1)}% de votre patrimoine. Une diversification est recommandée.`,
        data: {
          asset: analysis.concentration.topAsset,
          weight: analysis.concentration.maxWeight,
          recommendation: 'diversification'
        },
        actions: [
          {
            label: 'Voir les suggestions de diversification',
            action: 'SHOW_DIVERSIFICATION_SUGGESTIONS',
            params: { assetType: analysis.concentration.topAsset }
          },
          {
            label: 'Analyser les risques',
            action: 'ANALYZE_CONCENTRATION_RISK'
          }
        ]
      });
    }

    // 2. Alerte de performance anormale
    if (Math.abs(analysis.performance.monthly) > this.config.severityThresholds.performance) {
      const isPositive = analysis.performance.monthly > 0;
      alerts.push({
        type: isPositive ? 'info' : 'risk',
        severity: Math.abs(analysis.performance.monthly) > 0.25 ? 'high' : 'medium',
        title: `Performance ${isPositive ? 'exceptionnelle' : 'préoccupante'} ce mois`,
        message: `Votre patrimoine a ${isPositive ? 'gagné' : 'perdu'} ${Math.abs(analysis.performance.monthly * 100).toFixed(1)}% ce mois.`,
        data: {
          performance: analysis.performance.monthly,
          type: isPositive ? 'gain' : 'loss'
        },
        actions: [
          {
            label: 'Analyser en détail',
            action: 'ANALYZE_PERFORMANCE_DETAILS'
          }
        ]
      });
    }

    // 3. Alerte de frais excessifs
    if (analysis.fees.monthly > this.config.severityThresholds.fees) {
      alerts.push({
        type: 'action_required',
        severity: analysis.fees.monthly > 100 ? 'high' : 'medium',
        title: 'Frais bancaires élevés',
        message: `Vous payez ${analysis.fees.monthly.toFixed(2)}€ de frais par mois (${analysis.fees.yearly.toFixed(2)}€/an). Des économies sont possibles.`,
        data: {
          monthlyFees: analysis.fees.monthly,
          yearlyFees: analysis.fees.yearly,
          potentialSavings: analysis.fees.yearly * 0.5 // Estimation
        },
        actions: [
          {
            label: 'Comparer les banques',
            action: 'COMPARE_BANK_OFFERS'
          },
          {
            label: 'Optimiser les comptes',
            action: 'OPTIMIZE_ACCOUNTS'
          }
        ]
      });
    }

    // 4. Alerte de volatilité excessive
    if (analysis.performance.volatility > this.config.severityThresholds.risk) {
      alerts.push({
        type: 'risk',
        severity: analysis.performance.volatility > 0.3 ? 'high' : 'medium',
        title: 'Volatilité élevée détectée',
        message: `Votre portefeuille présente une volatilité de ${(analysis.performance.volatility * 100).toFixed(1)}%. Considérez une stratégie plus défensive.`,
        data: {
          volatility: analysis.performance.volatility,
          riskLevel: analysis.performance.volatility > 0.3 ? 'high' : 'medium'
        },
        actions: [
          {
            label: 'Rebalancer le portefeuille',
            action: 'REBALANCE_PORTFOLIO'
          },
          {
            label: 'Ajouter des actifs défensifs',
            action: 'ADD_DEFENSIVE_ASSETS'
          }
        ]
      });
    }

    // 5. Opportunités de marché (exemple basé sur des baisses)
    const underperformingAssets = analysis.assets.filter(a => a.performance < -0.1);
    if (underperformingAssets.length > 0) {
      const worstAsset = underperformingAssets.reduce((worst, current) => 
        current.performance < worst.performance ? current : worst
      );

      alerts.push({
        type: 'opportunity',
        severity: 'medium',
        title: 'Opportunité d\'achat potentielle',
        message: `${worstAsset.name} a baissé de ${Math.abs(worstAsset.performance * 100).toFixed(1)}% récemment. Cela pourrait être une opportunité.`,
        data: {
          asset: worstAsset.name,
          performance: worstAsset.performance,
          currentValue: worstAsset.value
        },
        actions: [
          {
            label: 'Analyser la tendance',
            action: 'ANALYZE_ASSET_TREND',
            params: { assetId: worstAsset.id }
          },
          {
            label: 'Simuler un renforcement',
            action: 'SIMULATE_ADDITIONAL_INVESTMENT',
            params: { assetId: worstAsset.id }
          }
        ]
      });
    }

    // 6. Échéances fiscales (IFI)
    if (analysis.totalValue > 1300000) {
      const today = new Date();
      const ifiDeadline = new Date(today.getFullYear(), 5, 15); // 15 juin
      const daysUntilIFI = Math.floor((ifiDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilIFI > 0 && daysUntilIFI < 60) {
        alerts.push({
          type: 'action_required',
          severity: daysUntilIFI < 30 ? 'high' : 'medium',
          title: 'Déclaration IFI à préparer',
          message: `Échéance dans ${daysUntilIFI} jours. Patrimoine taxable estimé : ${this.formatCurrency(analysis.totalValue)}`,
          data: {
            deadline: ifiDeadline,
            daysRemaining: daysUntilIFI,
            taxableAmount: analysis.totalValue
          },
          actions: [
            {
              label: 'Préparer la déclaration',
              action: 'PREPARE_IFI_DECLARATION'
            },
            {
              label: 'Optimisations fiscales',
              action: 'SHOW_TAX_OPTIMIZATIONS'
            }
          ]
        });
      }
    }

    // 7. Suggestions de rééquilibrage
    const assetTypeWeights = Object.values(analysis.concentration.byAssetType);
    const isUnbalanced = assetTypeWeights.some(weight => weight > 0.7);
    
    if (isUnbalanced) {
      alerts.push({
        type: 'info',
        severity: 'low',
        title: 'Rééquilibrage recommandé',
        message: 'Votre allocation d\'actifs pourrait bénéficier d\'un rééquilibrage pour optimiser le rapport risque/rendement.',
        data: {
          currentAllocation: analysis.concentration.byAssetType,
          recommendation: 'rebalance'
        },
        actions: [
          {
            label: 'Voir les suggestions',
            action: 'SHOW_REBALANCING_SUGGESTIONS'
          },
          {
            label: 'Simulateur d\'allocation',
            action: 'OPEN_ALLOCATION_SIMULATOR'
          }
        ]
      });
    }

    return alerts;
  }

  private async saveAlerts(userId: string, alerts: Alert[]): Promise<void> {
    // Supprimer les anciennes alertes non lues du même type (éviter la duplication)
    for (const alert of alerts) {
      await prisma.alert.deleteMany({
        where: {
          userId,
          type: alert.type,
          title: alert.title,
          status: 'new'
        }
      });
    }

    // Créer les nouvelles alertes
    for (const alert of alerts) {
      await prisma.alert.create({
        data: {
          userId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          data: alert.data ? JSON.stringify(alert.data) : null,
          actions: alert.actions ? JSON.stringify(alert.actions) : null,
          status: 'new'
        }
      });
    }
  }

  private async cleanupOldAlerts(): Promise<void> {
    const retentionDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    await prisma.alert.deleteMany({
      where: {
        createdAt: {
          lt: retentionDate
        }
      }
    });

    console.log(`Cleaned up alerts older than ${this.config.retentionDays} days`);
  }

  private calculateAssetFees(asset: any): number {
    // Simulation du calcul des frais basé sur le type d'actif
    const metadata = asset.metadata ? JSON.parse(asset.metadata) : {};
    
    switch (asset.assetType.name) {
      case 'Comptes Bancaires':
        return metadata.monthlyFees || 0;
      case 'Actions':
        return (metadata.managementFees || 0) * asset.valuations[0]?.value / 12;
      case 'Assurance-vie':
        return (metadata.managementFees || 0) * asset.valuations[0]?.value / 12;
      default:
        return 0;
    }
  }

  private calculateLiquidityRisk(assets: any[]): number {
    // Calcul simple du risque de liquidité basé sur les types d'actifs
    const liquidityWeights = {
      'Comptes Bancaires': 0,
      'Actions': 0.3,
      'Immobilier': 0.8,
      'Assurance-vie': 0.5,
      'Crypto': 0.4,
      'Or': 0.2
    };

    let totalWeight = 0;
    let totalValue = 0;

    for (const asset of assets) {
      const weight = liquidityWeights[asset.type as keyof typeof liquidityWeights] || 0.5;
      totalWeight += weight * asset.value;
      totalValue += asset.value;
    }

    return totalValue > 0 ? totalWeight / totalValue : 0;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
} 