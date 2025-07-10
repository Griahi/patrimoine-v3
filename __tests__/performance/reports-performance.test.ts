import { render, screen, waitFor } from '@testing-library/react';
import { reportCache } from '@/services/performance/report-cache';
import { performance } from 'perf_hooks';
import { vi } from 'vitest';

// Mock des composants pour les tests de performance
vi.mock('@/components/charts/ReportsCharts', () => ({
  AssetDistributionChart: vi.fn(() => 'AssetDistributionChart'),
  AssetsByEntityChart: vi.fn(() => 'AssetsByEntityChart'),
  PortfolioEvolutionChart: vi.fn(() => 'PortfolioEvolutionChart')
}));

vi.mock('@/utils/financial-calculations', () => ({
  calculateAssetValue: vi.fn((value, percentage) => value * (percentage / 100)),
  calculateOwnershipPercentage: vi.fn((ownerships) => 
    ownerships.reduce((sum: number, ownership: any) => sum + ownership.percentage, 0)
  ),
  validateValuation: vi.fn((valuation) => 
    valuation ? { value: valuation.value, currency: valuation.currency, isValid: true } : { value: 0, currency: 'EUR', isValid: false }
  ),
  formatCurrency: vi.fn((value, options) => `${value} ${options?.currency || 'EUR'}`),
  formatPercentage: vi.fn((value) => `${value}%`)
}));

describe('Reports Performance Tests', () => {
  // Générateur de données de test à différentes échelles
  const generateMockData = (assetCount: number, entityCount: number = 5) => {
    const entities = Array.from({ length: entityCount }, (_, i) => ({
      id: `entity${i}`,
      name: `Entity ${i}`,
      type: i % 2 === 0 ? 'PHYSICAL_PERSON' : 'LEGAL_ENTITY'
    }));

    const assetTypes = ['Actions', 'Obligations', 'Immobilier', 'Épargne', 'Cryptomonnaies', 'SCPI'];
    
    const assets = Array.from({ length: assetCount }, (_, i) => ({
      id: `asset${i}`,
      name: `Asset ${i}`,
      assetType: {
        name: assetTypes[i % assetTypes.length],
        color: `#${Math.random().toString(16).substr(-6)}`
      },
      valuations: [{
        value: Math.random() * 100000 + 10000,
        currency: 'EUR',
        valuationDate: new Date().toISOString()
      }],
      ownerships: [{
        percentage: Math.random() * 100,
        ownerEntity: entities[i % entityCount]
      }]
    }));

    const filters = {
      period: '1Y',
      entities: [],
      assets: [],
      currency: 'EUR',
      reportType: 'bilan_complet',
      includeProjections: false,
      liquidityFilter: 'all',
      fiscalOptimization: false
    };

    return { assets, entities, filters };
  };

  beforeEach(() => {
    reportCache.clearCache();
    vi.clearAllMocks();
  });

  describe('Cache Performance', () => {
    it('should improve performance with cache hits', async () => {
      const { assets, entities, filters } = generateMockData(500);
      const input = { assets, entities, filters };

      // Premier appel - mesurer le temps sans cache
      const start1 = performance.now();
      await reportCache.getAssetTypeDistribution(input);
      const timeWithoutCache = performance.now() - start1;

      // Deuxième appel - mesurer le temps avec cache
      const start2 = performance.now();
      await reportCache.getAssetTypeDistribution(input);
      const timeWithCache = performance.now() - start2;

      // Le cache devrait être significativement plus rapide
      expect(timeWithCache).toBeLessThan(timeWithoutCache * 0.1); // Au moins 10x plus rapide
      
      const stats = reportCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should handle concurrent requests efficiently', async () => {
      const { assets, entities, filters } = generateMockData(100);
      const input = { assets, entities, filters };

      const startTime = performance.now();

      // Exécuter 10 requêtes en parallèle
      const promises = Array.from({ length: 10 }, () => 
        reportCache.getAssetTypeDistribution(input)
      );

      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      // Toutes les requêtes devraient retourner le même résultat
      expect(results.every(result => 
        JSON.stringify(result) === JSON.stringify(results[0])
      )).toBe(true);

      // Le temps total ne devrait pas être 10x le temps d'une seule requête
      expect(totalTime).toBeLessThan(1000); // Moins d'une seconde pour 10 requêtes

      const stats = reportCache.getStats();
      expect(stats.hits).toBeGreaterThan(0); // Au moins quelques cache hits
    });

    it('should maintain performance with large datasets', async () => {
      const sizes = [100, 500, 1000, 2000];
      const times: number[] = [];

      for (const size of sizes) {
        const { assets, entities, filters } = generateMockData(size);
        const input = { assets, entities, filters };

        const start = performance.now();
        await reportCache.getAssetTypeDistribution(input);
        const time = performance.now() - start;
        
        times.push(time);
      }

      // La complexité devrait être approximativement linéaire
      const timeRatio2000to100 = times[3] / times[0]; // 2000 / 100 = 20x
      expect(timeRatio2000to100).toBeLessThan(50); // Pas plus de 50x plus lent

      // Aucun calcul ne devrait prendre plus de 2 secondes
      expect(Math.max(...times)).toBeLessThan(2000);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated cache operations', async () => {
      const initialStats = reportCache.getStats();
      
      // Effectuer de nombreuses opérations
      for (let i = 0; i < 200; i++) {
        const { assets, entities, filters } = generateMockData(50);
        const uniqueFilters = { ...filters, period: `${i}M` as any };
        await reportCache.getAssetTypeDistribution({ assets, entities, filters: uniqueFilters });
      }

      // Le cache devrait maintenir sa taille limite
      expect(reportCache.getCacheSize()).toBeLessThanOrEqual(100);
      
      // Les statistiques devraient refléter l'activité
      const finalStats = reportCache.getStats();
      expect(finalStats.misses).toBeGreaterThan(initialStats.misses);
    });

    it('should cleanup properly when clearing cache', () => {
      // Remplir le cache
      const promises = Array.from({ length: 50 }, async (_, i) => {
        const { assets, entities, filters } = generateMockData(10);
        const uniqueFilters = { ...filters, currency: i % 2 === 0 ? 'EUR' : 'USD' };
        return reportCache.getAssetTypeDistribution({ assets, entities, filters: uniqueFilters });
      });

      return Promise.all(promises).then(() => {
        expect(reportCache.getCacheSize()).toBeGreaterThan(0);
        
        reportCache.clearCache();
        
        expect(reportCache.getCacheSize()).toBe(0);
        const stats = reportCache.getStats();
        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(0);
      });
    });
  });

  describe('Calculation Performance', () => {
    it('should calculate liquidity analysis efficiently', async () => {
      const { assets, entities, filters } = generateMockData(1000);
      const input = { assets, entities, filters };

      const start = performance.now();
      const result = await reportCache.getLiquidityAnalysis(input);
      const time = performance.now() - start;

      expect(time).toBeLessThan(500); // Moins de 500ms pour 1000 actifs
      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(4); // 4 niveaux de liquidité
    });

    it('should calculate stress tests efficiently', async () => {
      const { assets, entities, filters } = generateMockData(500);
      const input = { assets, entities, filters };

      const start = performance.now();
      const result = await reportCache.getStressTestResults(input);
      const time = performance.now() - start;

      expect(time).toBeLessThan(300); // Moins de 300ms pour 500 actifs
      expect(result).toHaveLength(4); // 4 scénarios de stress
      expect(result.every(scenario => scenario.totalValue > 0)).toBe(true);
    });

    it('should calculate projections efficiently', async () => {
      const { assets, entities, filters } = generateMockData(300);
      const input = { assets, entities, filters };

      const start = performance.now();
      const result = await reportCache.getProjectionResults(input, 'realistic');
      const time = performance.now() - start;

      expect(time).toBeLessThan(200); // Moins de 200ms pour 300 actifs
      expect(result).toHaveLength(6); // 6 horizons temporels
      expect(result.every(projection => projection.totalValue > 0)).toBe(true);
    });
  });

  describe('Optimization Validation', () => {
    it('should demonstrate performance improvement over naive implementation', async () => {
      const { assets, entities, filters } = generateMockData(200);

      // Simulation d'une implémentation naïve (sans cache)
      const naiveCalculation = async () => {
        let totalValue = 0;
        const assetsByType: Record<string, any> = {};
        
        assets.forEach(asset => {
          // Simulation de calculs lourds
          for (let i = 0; i < 100; i++) {
            Math.sqrt(Math.random() * 1000);
          }
          
          const value = asset.valuations[0]?.value || 0;
          totalValue += value;
          
          const typeName = asset.assetType.name;
          if (!assetsByType[typeName]) {
            assetsByType[typeName] = { value: 0, count: 0 };
          }
          assetsByType[typeName].value += value;
          assetsByType[typeName].count += 1;
        });
        
        return { totalValue, assetsByType };
      };

      // Mesurer l'implémentation naïve
      const naiveStart = performance.now();
      await naiveCalculation();
      const naiveTime = performance.now() - naiveStart;

      // Mesurer l'implémentation optimisée (cache miss)
      const optimizedStart = performance.now();
      await reportCache.getAssetTypeDistribution({ assets, entities, filters });
      const optimizedTime = performance.now() - optimizedStart;

      // Mesurer l'implémentation optimisée (cache hit)
      const cachedStart = performance.now();
      await reportCache.getAssetTypeDistribution({ assets, entities, filters });
      const cachedTime = performance.now() - cachedStart;

      // L'optimisation devrait être significative
      expect(optimizedTime).toBeLessThan(naiveTime * 0.8); // Au moins 20% plus rapide
      expect(cachedTime).toBeLessThan(optimizedTime * 0.1); // Cache 10x plus rapide
    });

    it('should scale efficiently with different filter combinations', async () => {
      const { assets, entities } = generateMockData(100);
      const baseFilters = {
        period: '1Y',
        entities: [],
        assets: [],
        currency: 'EUR',
        reportType: 'bilan_complet',
        includeProjections: false,
        liquidityFilter: 'all',
        fiscalOptimization: false
      };

      const filterCombinations = [
        { ...baseFilters },
        { ...baseFilters, currency: 'USD' },
        { ...baseFilters, period: '2Y' },
        { ...baseFilters, entities: [entities[0].id] },
        { ...baseFilters, liquidityFilter: 'immediate' },
        { ...baseFilters, includeProjections: true }
      ];

      const times: number[] = [];

      for (const filters of filterCombinations) {
        const start = performance.now();
        await reportCache.getAssetTypeDistribution({ assets, entities, filters });
        const time = performance.now() - start;
        times.push(time);
      }

      // Tous les calculs devraient être raisonnablement rapides
      expect(Math.max(...times)).toBeLessThan(100); // Moins de 100ms
      expect(Math.min(...times)).toBeGreaterThan(0); // Pas instantané (sauf cache hit)
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle typical user portfolio size efficiently', async () => {
      // Portefeuille typique : 20-50 actifs, 1-3 entités
      const { assets, entities, filters } = generateMockData(35, 2);
      const input = { assets, entities, filters };

      const operations = [
        () => reportCache.getAssetTypeDistribution(input),
        () => reportCache.getLiquidityAnalysis(input),
        () => reportCache.getStressTestResults(input),
        () => reportCache.getProjectionResults(input, 'realistic')
      ];

      const times: number[] = [];

      for (const operation of operations) {
        const start = performance.now();
        await operation();
        const time = performance.now() - start;
        times.push(time);
      }

      // Toutes les opérations devraient être rapides pour un portefeuille typique
      expect(Math.max(...times)).toBeLessThan(50); // Moins de 50ms
      expect(times.reduce((sum, time) => sum + time, 0)).toBeLessThan(150); // Total < 150ms
    });

    it('should handle large institutional portfolio efficiently', async () => {
      // Portefeuille institutionnel : 500-2000 actifs, 10+ entités
      const { assets, entities, filters } = generateMockData(800, 15);
      const input = { assets, entities, filters };

      const start = performance.now();
      
      // Opérations courantes dans l'ordre
      await reportCache.getAssetTypeDistribution(input);
      await reportCache.getLiquidityAnalysis(input);
      await reportCache.getStressTestResults(input);
      
      const totalTime = performance.now() - start;

      // Même pour un gros portefeuille, ça devrait rester gérable
      expect(totalTime).toBeLessThan(2000); // Moins de 2 secondes au total
    });

    it('should maintain responsiveness during heavy usage', async () => {
      const portfolioSizes = [50, 100, 200];
      const concurrentUsers = 5;

      const scenarios = portfolioSizes.flatMap(size =>
        Array.from({ length: concurrentUsers }, () => generateMockData(size))
      );

      const startTime = performance.now();

      // Simuler plusieurs utilisateurs accédant aux rapports simultanément
      const promises = scenarios.map(({ assets, entities, filters }) =>
        reportCache.getAssetTypeDistribution({ assets, entities, filters })
      );

      await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      // Le système devrait gérer la charge concurrent
      expect(totalTime).toBeLessThan(3000); // Moins de 3 secondes pour tout traiter
      
      const stats = reportCache.getStats();
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.averageComputationTime).toBeLessThan(100); // Temps moyen raisonnable
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      const { assets, entities, filters } = generateMockData(100);
      const input = { assets, entities, filters };

      // Établir un baseline
      const baselineTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        reportCache.clearCache();
        const start = performance.now();
        await reportCache.getAssetTypeDistribution(input);
        const time = performance.now() - start;
        baselineTimes.push(time);
      }

      const baselineAverage = baselineTimes.reduce((sum, time) => sum + time, 0) / baselineTimes.length;

      // Test actuel
      reportCache.clearCache();
      const start = performance.now();
      await reportCache.getAssetTypeDistribution(input);
      const currentTime = performance.now() - start;

      // Le temps actuel ne devrait pas être significativement plus lent que la baseline
      expect(currentTime).toBeLessThan(baselineAverage * 2); // Pas plus de 2x plus lent
    });
  });
}); 