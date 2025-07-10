import { AlertsEngine } from '@/services/alerts/alerts-engine';
import { vi } from 'vitest';

// Mock des dépendances pour les tests
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('AlertsEngine', () => {
  let alertsEngine: AlertsEngine;

  beforeEach(() => {
    alertsEngine = new AlertsEngine();
    vi.clearAllMocks();
  });

  describe('Analyse du patrimoine', () => {
    it('devrait analyser un patrimoine équilibré', () => {
      const patrimonyData = {
        totalValue: 500000,
        monthlyPerformance: 0.02,
        yearlyPerformance: 0.08,
        assets: [
          { id: '1', name: 'Actions', type: 'stock', value: 200000, performance: 0.08, percentage: 40 },
          { id: '2', name: 'Immobilier', type: 'real_estate', value: 200000, performance: 0.05, percentage: 40 },
          { id: '3', name: 'Épargne', type: 'bank_account', value: 100000, performance: 0.02, percentage: 20 }
        ],
        diversification: {
          byAssetType: {
            stock: 0.4,
            real_estate: 0.4,
            bank_account: 0.2
          },
          concentration: 0.4,
          score: 0.8
        }
      };

      const alerts = alertsEngine.analyzePatrimony(patrimonyData);
      
      expect(alerts).toBeInstanceOf(Array);
      expect(alerts.length).toBeGreaterThanOrEqual(0);
      
      // Vérifier qu'il n'y a pas d'alertes critiques pour un patrimoine équilibré
      const criticalAlerts = alerts.filter(alert => alert.severity === 'high');
      expect(criticalAlerts.length).toBe(0);
    });

    it('devrait détecter une concentration excessive', () => {
      const patrimonyData = {
        totalValue: 500000,
        monthlyPerformance: 0.02,
        yearlyPerformance: 0.08,
        assets: [
          { id: '1', name: 'Actions Tech', type: 'stock', value: 400000, performance: 0.15, percentage: 80 },
          { id: '2', name: 'Épargne', type: 'bank_account', value: 100000, performance: 0.02, percentage: 20 }
        ],
        diversification: {
          byAssetType: {
            stock: 0.8,
            bank_account: 0.2
          },
          concentration: 0.8,
          score: 0.4
        }
      };

      const alerts = alertsEngine.analyzePatrimony(patrimonyData);
      
      // Devrait avoir au moins une alerte de concentration
      const concentrationAlerts = alerts.filter(alert => 
        alert.type === 'concentration' && alert.severity === 'high'
      );
      expect(concentrationAlerts.length).toBeGreaterThan(0);
      
      // Vérifier qu'on trouve l'actif le plus concentré
      const topAsset = patrimonyData.assets.find((a: any) => a.percentage === patrimonyData.diversification.concentration);
      expect(topAsset).toBeDefined();
    });

    it('devrait détecter une performance anormale', () => {
      const patrimonyData = {
        totalValue: 500000,
        monthlyPerformance: -0.15, // Performance très négative
        yearlyPerformance: -0.30,
        assets: [
          { id: '1', name: 'Actions', type: 'stock', value: 200000, performance: -0.40, percentage: 40 },
          { id: '2', name: 'Crypto', type: 'crypto', value: 200000, performance: -0.50, percentage: 40 },
          { id: '3', name: 'Épargne', type: 'bank_account', value: 100000, performance: 0.02, percentage: 20 }
        ],
        diversification: {
          byAssetType: {
            stock: 0.4,
            crypto: 0.4,
            bank_account: 0.2
          },
          concentration: 0.4,
          score: 0.6
        }
      };

      const alerts = alertsEngine.analyzePatrimony(patrimonyData);
      
      // Calculer la performance moyenne
      const avgPerformance = patrimonyData.assets.reduce((sum: number, a: any) => sum + (a.monthlyPerformance || 0), 0) / patrimonyData.assets.length;
      
      // Devrait avoir des alertes de performance
      const performanceAlerts = alerts.filter(alert => 
        alert.type === 'performance' && alert.severity === 'high'
      );
      expect(performanceAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Détection d\'opportunités', () => {
    it('devrait détecter des opportunités de rééquilibrage', () => {
      const patrimonyData = {
        totalValue: 500000,
        monthlyPerformance: 0.02,
        yearlyPerformance: 0.08,
        assets: [
          { id: '1', name: 'Actions', type: 'stock', value: 400000, performance: 0.12, percentage: 80 },
          { id: '2', name: 'Obligations', type: 'bond', value: 50000, performance: 0.04, percentage: 10 },
          { id: '3', name: 'Épargne', type: 'bank_account', value: 50000, performance: 0.02, percentage: 10 }
        ],
        diversification: {
          byAssetType: {
            stock: 0.8,
            bond: 0.1,
            bank_account: 0.1
          },
          concentration: 0.8,
          score: 0.4
        }
      };

      const opportunities = alertsEngine.detectOpportunities(patrimonyData);
      
      expect(opportunities).toBeInstanceOf(Array);
      expect(opportunities.length).toBeGreaterThan(0);
      
      // Devrait suggérer un rééquilibrage
      const rebalanceOpp = opportunities.find(opp => opp.type === 'rebalancing');
      expect(rebalanceOpp).toBeDefined();
    });
  });

  describe('Analyse de diversification', () => {
    it('devrait calculer la diversification correctement', () => {
      const assets = [
        { id: '1', name: 'Actions', type: 'stock', value: 200000 },
        { id: '2', name: 'Immobilier', type: 'real_estate', value: 200000 },
        { id: '3', name: 'Épargne', type: 'bank_account', value: 100000 }
      ];

      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
      const categories: Record<string, number> = {};
      
      assets.forEach(asset => {
        const category = asset.type;
        if (!categories[category]) categories[category] = 0;
        categories[category] += asset.value / totalValue;
      });

      const diversification = alertsEngine.calculateDiversification(assets);
      
      expect(diversification).toHaveProperty('byAssetType');
      expect(diversification).toHaveProperty('concentration');
      expect(diversification).toHaveProperty('score');
      
      // Vérifier que la concentration est correcte
      const maxConcentration = Math.max(...Object.values(categories));
      expect(diversification.concentration).toBeCloseTo(maxConcentration, 2);
    });
  });

  describe('Analyse de liquidité', () => {
    it('devrait analyser la liquidité du patrimoine', () => {
      const assets = [
        { id: '1', name: 'Épargne', type: 'bank_account', value: 50000 },
        { id: '2', name: 'Actions', type: 'stock', value: 100000 },
        { id: '3', name: 'Immobilier', type: 'real_estate', value: 200000 },
        { id: '4', name: 'Assurance vie', type: 'insurance', value: 100000 },
        { id: '5', name: 'Crypto', type: 'crypto', value: 50000 },
        { id: '6', name: 'Or', type: 'gold', value: 25000 }
      ];

      const liquidityWeights = {
        bank_account: 1.0,
        stock: 0.8,
        real_estate: 0.2,
        insurance: 0.4,
        crypto: 0.6,
        gold: 0.7
      };

      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
      let liquidityScore = 0;

      assets.forEach(asset => {
        const weight = liquidityWeights[asset.type as keyof typeof liquidityWeights] || 0.5;
        liquidityScore += (asset.value / totalValue) * weight;
      });

      const analysis = alertsEngine.analyzeLiquidity(assets);
      
      expect(analysis).toHaveProperty('liquidityScore');
      expect(analysis).toHaveProperty('liquidAssets');
      expect(analysis).toHaveProperty('illiquidAssets');
      
      expect(analysis.liquidityScore).toBeGreaterThan(0);
      expect(analysis.liquidityScore).toBeLessThanOrEqual(1);
    });
  });
}); 