import { prisma } from '@/lib/prisma';
import { Alert, AlertContext, AlertRule, AlertType, AlertSeverity, AlertAction } from '@/types/alerts';
import { generateId } from '@/utils/id';

export class AlertsEngine {
  private alertRules: AlertRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.alertRules = [
      // Concentration excessive
      {
        type: 'concentration_risk',
        condition: (context) => context.patrimony.diversification.concentration > 0.4,
        severity: (context) => {
          const concentration = context.patrimony.diversification.concentration;
          if (concentration > 0.7) return 'critical';
          if (concentration > 0.6) return 'high';
          if (concentration > 0.5) return 'medium';
          return 'low';
        },
        generateAlert: (context) => {
          const topAsset = context.patrimony.assets.reduce((max, asset) => 
            asset.percentage > max.percentage ? asset : max
          );
          
          return {
            type: 'concentration_risk',
            severity: context.patrimony.diversification.concentration > 0.7 ? 'critical' : 'high',
            title: '⚠️ Concentration excessive détectée',
            message: `${topAsset.name} représente ${(topAsset.percentage * 100).toFixed(1)}% de votre patrimoine. Il est recommandé de ne pas dépasser 40% sur un seul actif.`,
            data: {
              topAsset: topAsset.name,
              concentration: topAsset.percentage,
              recommendation: 'Diversifier le patrimoine',
              threshold: 0.4,
              current: topAsset.percentage
            },
            actions: [
              {
                id: 'view_diversification',
                label: 'Voir les suggestions de diversification',
                action: 'SHOW_DIVERSIFICATION',
                params: { assetId: topAsset.id }
              },
              {
                id: 'simulate_rebalance',
                label: 'Simuler un rééquilibrage',
                action: 'SIMULATE_REBALANCE',
                params: { targetConcentration: 0.3 }
              }
            ]
          };
        }
      },

      // Performance anormale
      {
        type: 'performance_anomaly',
        condition: (context) => context.patrimony.assets.some(asset => 
          asset.monthlyPerformance && Math.abs(asset.monthlyPerformance) > 0.15
        ),
        severity: (context) => {
          const maxVariation = Math.max(...context.patrimony.assets
            .filter(asset => asset.monthlyPerformance)
            .map(asset => Math.abs(asset.monthlyPerformance!))
          );
          if (maxVariation > 0.3) return 'critical';
          if (maxVariation > 0.25) return 'high';
          if (maxVariation > 0.2) return 'medium';
          return 'low';
        },
        generateAlert: (context) => {
          const anomalousAssets = context.patrimony.assets.filter(asset => 
            asset.monthlyPerformance && Math.abs(asset.monthlyPerformance) > 0.15
          );
          
          const worstAsset = anomalousAssets.reduce((worst, asset) => 
            Math.abs(asset.monthlyPerformance!) > Math.abs(worst.monthlyPerformance!) ? asset : worst
          );

          const isNegative = worstAsset.monthlyPerformance! < 0;
          const emoji = isNegative ? '📉' : '📈';
          const direction = isNegative ? 'baissé' : 'augmenté';
          
          return {
            type: 'performance_anomaly',
            severity: Math.abs(worstAsset.monthlyPerformance!) > 0.3 ? 'critical' : 'high',
            title: `${emoji} Performance anormale détectée`,
            message: `${worstAsset.name} a ${direction} de ${Math.abs(worstAsset.monthlyPerformance! * 100).toFixed(1)}% ce mois-ci.`,
            data: {
              asset: worstAsset.name,
              performance: worstAsset.monthlyPerformance,
              threshold: 0.15,
              isNegative
            },
            actions: [
              {
                id: 'analyze_asset',
                label: 'Analyser l\'actif',
                action: 'ANALYZE_ASSET',
                params: { assetId: worstAsset.id }
              },
              {
                id: 'view_history',
                label: 'Voir l\'historique',
                action: 'VIEW_ASSET_HISTORY',
                params: { assetId: worstAsset.id }
              }
            ]
          };
        }
      },

      // Opportunités de marché
      {
        type: 'market_opportunity',
        condition: (context) => {
          return context.marketData && Object.values(context.marketData).some(data => 
            data.monthlyChange < -0.15
          );
        },
        severity: () => 'medium',
        generateAlert: (context) => {
          const opportunities = Object.entries(context.marketData || {})
            .filter(([_, data]) => data.monthlyChange < -0.15)
            .sort(([_, a], [__, b]) => a.monthlyChange - b.monthlyChange);

          const [ticker, data] = opportunities[0];
          
          return {
            type: 'market_opportunity',
            severity: 'medium',
            title: '💡 Opportunité de marché détectée',
            message: `${ticker} a baissé de ${Math.abs(data.monthlyChange * 100).toFixed(1)}% ce mois. Historiquement, cela peut être un bon point d'entrée.`,
            data: {
              ticker,
              change: data.monthlyChange,
              volatility: data.volatility,
              recommendation: 'Considérer un achat progressif'
            },
            actions: [
              {
                id: 'research_opportunity',
                label: 'Rechercher l\'opportunité',
                action: 'RESEARCH_ASSET',
                params: { ticker }
              },
              {
                id: 'simulate_buy',
                label: 'Simuler un achat',
                action: 'SIMULATE_BUY',
                params: { ticker, amount: 1000 }
              }
            ]
          };
        }
      },

      // Frais excessifs
      {
        type: 'excessive_fees',
        condition: (context) => context.patrimony.monthlyFees > 50,
        severity: (context) => {
          const fees = context.patrimony.monthlyFees;
          if (fees > 200) return 'critical';
          if (fees > 150) return 'high';
          if (fees > 100) return 'medium';
          return 'low';
        },
        generateAlert: (context) => {
          const annualFees = context.patrimony.monthlyFees * 12;
          const feesPercentage = (annualFees / context.patrimony.totalValue) * 100;
          
          return {
            type: 'excessive_fees',
            severity: context.patrimony.monthlyFees > 200 ? 'critical' : 'high',
            title: '💸 Frais bancaires excessifs',
            message: `Vous payez ${context.patrimony.monthlyFees.toFixed(0)}€/mois de frais bancaires (${annualFees.toFixed(0)}€/an, soit ${feesPercentage.toFixed(2)}% de votre patrimoine).`,
            data: {
              monthlyFees: context.patrimony.monthlyFees,
              annualFees,
              feesPercentage,
              threshold: 50,
              recommendation: 'Comparer les offres bancaires'
            },
            actions: [
              {
                id: 'compare_banks',
                label: 'Comparer les banques',
                action: 'COMPARE_BANKS',
                params: { currentFees: context.patrimony.monthlyFees }
              },
              {
                id: 'negotiate_fees',
                label: 'Négocier les frais',
                action: 'NEGOTIATE_FEES',
                params: { potentialSavings: Math.max(0, annualFees - 200) }
              }
            ]
          };
        }
      },

      // Échéances fiscales
      {
        type: 'tax_deadline',
        condition: (context) => {
          const now = new Date();
          const ifiDeadline = new Date(now.getFullYear(), 5, 15); // 15 juin
          const daysUntilIFI = Math.floor((ifiDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          return context.taxableWealth && context.taxableWealth > 1300000 && 
                 daysUntilIFI > 0 && daysUntilIFI < 60;
        },
        severity: (context) => {
          const now = new Date();
          const ifiDeadline = new Date(now.getFullYear(), 5, 15);
          const daysUntilIFI = Math.floor((ifiDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilIFI < 15) return 'critical';
          if (daysUntilIFI < 30) return 'high';
          return 'medium';
        },
        generateAlert: (context) => {
          const now = new Date();
          const ifiDeadline = new Date(now.getFullYear(), 5, 15);
          const daysUntilIFI = Math.floor((ifiDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            type: 'tax_deadline',
            severity: daysUntilIFI < 30 ? 'high' : 'medium',
            title: '📅 Déclaration IFI à préparer',
            message: `Échéance dans ${daysUntilIFI} jours. Patrimoine taxable estimé : ${(context.taxableWealth! / 1000000).toFixed(1)}M€.`,
            data: {
              daysUntilDeadline: daysUntilIFI,
              taxableWealth: context.taxableWealth,
              deadline: ifiDeadline.toISOString(),
              estimatedTax: this.calculateIFI(context.taxableWealth!)
            },
            actions: [
              {
                id: 'prepare_ifi',
                label: 'Préparer la déclaration',
                action: 'PREPARE_IFI',
                params: { taxableWealth: context.taxableWealth }
              },
              {
                id: 'ifi_optimizations',
                label: 'Voir les optimisations',
                action: 'IFI_OPTIMIZATIONS',
                params: { wealth: context.taxableWealth }
              }
            ]
          };
        }
      },

      // Optimisations possibles
      {
        type: 'optimization_opportunity',
        condition: (context) => {
          // Vérifier les opportunités d'optimisation
          return context.patrimony.assets.some(asset => 
            asset.type === 'real_estate' && asset.value > 100000
          );
        },
        severity: () => 'low',
        generateAlert: (context) => {
          const realEstateAssets = context.patrimony.assets.filter(asset => 
            asset.type === 'real_estate' && asset.value > 100000
          );
          
          const totalRealEstate = realEstateAssets.reduce((sum, asset) => sum + asset.value, 0);
          const potentialSavings = totalRealEstate * 0.02; // 2% d'économies potentielles
          
          return {
            type: 'optimization_opportunity',
            severity: 'low',
            title: '🎯 Optimisation patrimoniale possible',
            message: `Votre patrimoine immobilier de ${(totalRealEstate / 1000000).toFixed(1)}M€ pourrait bénéficier d'optimisations fiscales.`,
            data: {
              realEstateValue: totalRealEstate,
              potentialSavings,
              strategies: ['Déficit foncier', 'SCI familiale', 'Démembrement']
            },
            actions: [
              {
                id: 'analyze_optimizations',
                label: 'Analyser les optimisations',
                action: 'ANALYZE_OPTIMIZATIONS',
                params: { patrimonyValue: context.patrimony.totalValue }
              },
              {
                id: 'schedule_consultation',
                label: 'Programmer une consultation',
                action: 'SCHEDULE_CONSULTATION',
                params: { topic: 'optimisation_fiscale' }
              }
            ]
          };
        }
      }
    ];
  }

  private calculateIFI(taxableWealth: number): number {
    // Calcul simplifié de l'IFI
    if (taxableWealth <= 1300000) return 0;
    if (taxableWealth <= 1400000) return (taxableWealth - 1300000) * 0.005;
    if (taxableWealth <= 2570000) return 500 + (taxableWealth - 1400000) * 0.007;
    if (taxableWealth <= 5000000) return 8690 + (taxableWealth - 2570000) * 0.01;
    if (taxableWealth <= 10000000) return 32990 + (taxableWealth - 5000000) * 0.0125;
    return 95490 + (taxableWealth - 10000000) * 0.015;
  }

  async generateAlerts(context: AlertContext): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    // Récupérer les préférences utilisateur
    const preferences = await prisma.alertPreferences.findMany({
      where: { userId: context.userId }
    });

    const preferencesMap = new Map(preferences.map(p => [p.alertType, p]));

    for (const rule of this.alertRules) {
      const pref = preferencesMap.get(rule.type);
      
      // Vérifier si l'alerte est activée
      if (pref && !pref.enabled) continue;
      
      // Vérifier la condition
      if (!rule.condition(context)) continue;

      // Vérifier si une alerte similaire n'a pas été générée récemment
      const recentAlert = await this.checkRecentAlert(context.userId, rule.type);
      if (recentAlert) continue;

      const severity = rule.severity(context);
      const alertData = rule.generateAlert(context);

      const alert: Alert = {
        id: generateId(),
        userId: context.userId,
        ...alertData,
        severity,
        status: 'new',
        createdAt: new Date()
      };

      alerts.push(alert);
    }

    // Trier par priorité
    alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return alerts;
  }

  private async checkRecentAlert(userId: string, type: AlertType): Promise<boolean> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentAlert = await prisma.alert.findFirst({
      where: {
        userId,
        type,
        createdAt: { gte: oneDayAgo },
        status: { not: 'dismissed' }
      }
    });

    return !!recentAlert;
  }

  async saveAlerts(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      await prisma.alert.create({
        data: {
          id: alert.id,
          userId: alert.userId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          data: alert.data,
          status: alert.status,
          actions: alert.actions,
          createdAt: alert.createdAt
        }
      });
    }
  }

  async processUserAlerts(userId: string, patrimonyData: any): Promise<Alert[]> {
    const context: AlertContext = {
      userId,
      patrimony: patrimonyData,
      taxableWealth: this.calculateTaxableWealth(patrimonyData),
      marketData: await this.getMarketData(patrimonyData.assets)
    };

    const alerts = await this.generateAlerts(context);
    await this.saveAlerts(alerts);
    
    return alerts;
  }

  private calculateTaxableWealth(patrimonyData: any): number {
    // Calculer le patrimoine taxable (immobilier principalement)
    return patrimonyData.assets
      .filter((asset: any) => asset.type === 'real_estate')
      .reduce((sum: number, asset: any) => sum + asset.value, 0);
  }

  private async getMarketData(assets: any[]): Promise<{ [ticker: string]: any }> {
    // Simuler des données de marché
    const marketData: { [ticker: string]: any } = {};
    
    for (const asset of assets) {
      if (asset.type === 'stock' && asset.ticker) {
        marketData[asset.ticker] = {
          change: (Math.random() - 0.5) * 0.4, // -20% à +20%
          monthlyChange: (Math.random() - 0.5) * 0.3, // -15% à +15%
          volatility: 0.15 + Math.random() * 0.1 // 15% à 25%
        };
      }
    }
    
    return marketData;
  }
}

// Utilitaire pour générer des IDs uniques
function generateId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 