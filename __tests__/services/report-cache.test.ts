import { reportCache } from '@/services/performance/report-cache';
import { vi } from 'vitest';

vi.mock('@/utils/financial-calculations', () => ({
  calculateAssetValue: vi.fn((value, percentage) => value * (percentage / 100)),
  calculateOwnershipPercentage: vi.fn((ownerships) =>
    ownerships.reduce((sum: number, ownership: any) => sum + ownership.percentage, 0)
  ),
  validateValuation: vi.fn((valuation) =>
    valuation ? { value: valuation.value, currency: valuation.currency, isValid: true } : { value: 0, currency: 'EUR', isValid: false }
  )
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('ReportCacheService', () => {
  // Données de test
  const mockAssets = [
    {
      id: 'asset1',
      name: 'Actions Apple',
      assetType: { name: 'Actions', color: '#3B82F6' },
      valuations: [{ value: 50000, currency: 'EUR', valuationDate: '2024-01-01' }],
      ownerships: [{ percentage: 100, ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } }]
    },
    {
      id: 'asset2',
      name: 'Appartement Paris',
      assetType: { name: 'Immobilier', color: '#EF4444' },
      valuations: [{ value: 300000, currency: 'EUR', valuationDate: '2024-01-01' }],
      ownerships: [{ percentage: 50, ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } }]
    }
  ];

  const mockEntities = [
    { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' }
  ];

  const mockFilters = {
    period: '1Y',
    entities: [],
    assets: [],
    currency: 'EUR',
    reportType: 'bilan_complet',
    includeProjections: false,
    liquidityFilter: 'all',
    fiscalOptimization: false
  };

  beforeEach(() => {
    // Nettoyer le cache avant chaque test
    reportCache.clearCache();
    vi.clearAllMocks();
  });

  describe('Cache Management', () => {
    it('should start with empty cache', () => {
      expect(reportCache.getCacheSize()).toBe(0);
      const stats = reportCache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should clear cache successfully', () => {
      const input = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      return reportCache.getAssetTypeDistribution(input).then(() => {
        expect(reportCache.getCacheSize()).toBeGreaterThan(0);
        reportCache.clearCache();
        expect(reportCache.getCacheSize()).toBe(0);
      });
    });

    it('should track cache statistics', async () => {
      const input = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      
      // Premier appel - cache miss
      await reportCache.getAssetTypeDistribution(input);
      let stats = reportCache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);

      // Deuxième appel - cache hit
      await reportCache.getAssetTypeDistribution(input);
      stats = reportCache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(1);
    });

    it('should invalidate cache by pattern', async () => {
      const input1 = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      const input2 = { assets: mockAssets, entities: mockEntities, filters: { ...mockFilters, reportType: 'performance' } };
      
      await reportCache.getAssetTypeDistribution(input1);
      await reportCache.getLiquidityAnalysis(input2);
      
      expect(reportCache.getCacheSize()).toBe(2);
      
      reportCache.invalidateByPattern('asset_type_distribution');
      expect(reportCache.getCacheSize()).toBe(1);
    });
  });

  describe('Asset Type Distribution', () => {
    it('should calculate asset type distribution correctly', async () => {
      const input = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      
      const result = await reportCache.getAssetTypeDistribution(input);
      
      expect(result).toHaveProperty('totalValue');
      expect(result).toHaveProperty('assetsByType');
      expect(result.totalValue).toBe(200000); // 50000 + (300000 * 0.5)
      expect(result.assetsByType).toHaveProperty('Actions');
      expect(result.assetsByType).toHaveProperty('Immobilier');
      expect(result.assetsByType.Actions.value).toBe(50000);
      expect(result.assetsByType.Immobilier.value).toBe(150000);
    });

    it('should handle empty assets array', async () => {
      const input = { assets: [], entities: mockEntities, filters: mockFilters };
      
      const result = await reportCache.getAssetTypeDistribution(input);
      
      expect(result.totalValue).toBe(0);
      expect(Object.keys(result.assetsByType)).toHaveLength(0);
    });

    it('should filter by entities correctly', async () => {
      const filtersWithEntity = { ...mockFilters, entities: ['entity1'] };
      const input = { assets: mockAssets, entities: mockEntities, filters: filtersWithEntity };
      
      const result = await reportCache.getAssetTypeDistribution(input);
      
      expect(result.totalValue).toBe(200000);
    });

    it('should use cache for identical requests', async () => {
      const input = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      
      const start1 = performance.now();
      await reportCache.getAssetTypeDistribution(input);
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      await reportCache.getAssetTypeDistribution(input);
      const time2 = performance.now() - start2;

      // Le deuxième appel devrait être plus rapide (cache hit)
      expect(time2).toBeLessThan(time1);
      
      const stats = reportCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('Liquidity Analysis', () => {
    it('should analyze liquidity correctly', async () => {
      const input = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      
      const result = await reportCache.getLiquidityAnalysis(input);
      
      expect(result).toHaveProperty('Court terme'); // Actions
      expect(result).toHaveProperty('Long terme');   // Immobilier
      expect(result['Court terme'].value).toBe(50000);
      expect(result['Long terme'].value).toBe(150000);
    });

    it('should categorize assets by liquidity correctly', async () => {
      const assetsWithEpargne = [
        ...mockAssets,
        {
          id: 'asset3',
          name: 'Livret A',
          assetType: { name: 'Épargne', color: '#10B981' },
          valuations: [{ value: 10000, currency: 'EUR', valuationDate: '2024-01-01' }],
          ownerships: [{ percentage: 100, ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } }]
        }
      ];

      const input = { assets: assetsWithEpargne, entities: mockEntities, filters: mockFilters };
      
      const result = await reportCache.getLiquidityAnalysis(input);
      
      expect(result).toHaveProperty('Immédiate'); // Épargne
      expect(result['Immédiate'].value).toBe(10000);
    });
  });

  describe('Stress Test Results', () => {
    it('should calculate stress test scenarios', async () => {
      const input = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      
      const result = await reportCache.getStressTestResults(input);
      
      expect(result).toHaveLength(4); // 4 scénarios définis
      expect(result[0]).toHaveProperty('scenario');
      expect(result[0]).toHaveProperty('totalLoss');
      expect(result[0]).toHaveProperty('totalValue');
      expect(result[0]).toHaveProperty('impactRate');
      expect(result[0]).toHaveProperty('impactsByType');
    });

    it('should apply correct impact rates by asset type', async () => {
      const input = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      
      const result = await reportCache.getStressTestResults(input);
      
      // Scenario "Krach Boursier" - Actions: -30%, Immobilier: -10%
      const krach = result.find(s => s.scenario === 'Krach Boursier');
      expect(krach).toBeDefined();
      expect(krach!.impactsByType.Actions.impactRate).toBe(-30);
      expect(krach!.impactsByType.Immobilier.impactRate).toBe(-10);
    });
  });

  describe('Projection Results', () => {
    it('should calculate projections for different scenarios', async () => {
      const input = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      
      const optimistic = await reportCache.getProjectionResults(input, 'optimistic');
      const realistic = await reportCache.getProjectionResults(input, 'realistic');
      const pessimistic = await reportCache.getProjectionResults(input, 'pessimistic');
      
      expect(optimistic).toHaveLength(6); // 6 horizons temporels
      expect(realistic).toHaveLength(6);
      expect(pessimistic).toHaveLength(6);

      // Les projections optimistes devraient être supérieures aux réalistes
      const optimistic10Y = optimistic.find(p => p.years === 10);
      const realistic10Y = realistic.find(p => p.years === 10);
      
      expect(optimistic10Y!.totalValue).toBeGreaterThan(realistic10Y!.totalValue);
    });

    it('should apply growth rates correctly', async () => {
      const input = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      
      const result = await reportCache.getProjectionResults(input, 'realistic');
      
      const projection1Y = result.find(p => p.years === 1);
      const projection5Y = result.find(p => p.years === 5);
      
      expect(projection5Y!.totalValue).toBeGreaterThan(projection1Y!.totalValue);
      expect(projection5Y!.growthRate).toBeGreaterThan(projection1Y!.growthRate);
    });
  });

  describe('Cache Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Générer un grand dataset
      const largeAssets = Array.from({ length: 1000 }, (_, i) => ({
        id: `asset${i}`,
        name: `Asset ${i}`,
        assetType: { name: i % 2 === 0 ? 'Actions' : 'Obligations', color: '#3B82F6' },
        valuations: [{ value: Math.random() * 100000, currency: 'EUR', valuationDate: '2024-01-01' }],
        ownerships: [{ percentage: 100, ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } }]
      }));

      const input = { assets: largeAssets, entities: mockEntities, filters: mockFilters };
      
      const start = performance.now();
      await reportCache.getAssetTypeDistribution(input);
      const computationTime = performance.now() - start;

      // Le cache doit traiter 1000 actifs en moins de 1 seconde
      expect(computationTime).toBeLessThan(1000);
    });

    it('should maintain cache size limits', async () => {
      // Générer de nombreuses requêtes différentes pour dépasser la limite
      const requests = Array.from({ length: 120 }, (_, i) => ({
        assets: mockAssets,
        entities: mockEntities,
        filters: { ...mockFilters, period: `${i}M` as any }
      }));

      for (const input of requests) {
        await reportCache.getAssetTypeDistribution(input);
      }

      // Le cache ne devrait pas dépasser sa taille maximale (100)
      expect(reportCache.getCacheSize()).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', async () => {
      const invalidAssets = [
        {
          id: 'invalid',
          name: 'Invalid Asset',
          assetType: null, // Type d'actif invalide
          valuations: [],  // Pas de valorisations
          ownerships: []   // Pas de propriétaires
        }
      ];

      const input = { assets: invalidAssets as any, entities: mockEntities, filters: mockFilters };
      
      const result = await reportCache.getAssetTypeDistribution(input);
      
      expect(result.totalValue).toBe(0);
      expect(result.assetsByType['Non défini']).toBeDefined();
    });

    it('should continue working after errors', async () => {
      const validInput = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      
      // Une requête valide devrait toujours fonctionner
      const result = await reportCache.getAssetTypeDistribution(validInput);
      expect(result).toBeDefined();
      expect(result.totalValue).toBeGreaterThan(0);
    });
  });

  describe('Cache Dependencies', () => {
    it('should invalidate cache when assets change', async () => {
      const input1 = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      const input2 = { assets: [...mockAssets, mockAssets[0]], entities: mockEntities, filters: mockFilters };
      
      await reportCache.getAssetTypeDistribution(input1);
      await reportCache.getAssetTypeDistribution(input2);
      
      const stats = reportCache.getStats();
      expect(stats.misses).toBe(2); // Deux cache misses à cause des données différentes
    });

    it('should invalidate cache when filters change', async () => {
      const input1 = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      const input2 = { assets: mockAssets, entities: mockEntities, filters: { ...mockFilters, currency: 'USD' } };
      
      await reportCache.getAssetTypeDistribution(input1);
      await reportCache.getAssetTypeDistribution(input2);
      
      const stats = reportCache.getStats();
      expect(stats.misses).toBe(2); // Deux cache misses à cause des filtres différents
    });

    it('should use cache when only order changes', async () => {
      const input1 = { assets: mockAssets, entities: mockEntities, filters: mockFilters };
      const input2 = { assets: [...mockAssets].reverse(), entities: mockEntities, filters: mockFilters };
      
      await reportCache.getAssetTypeDistribution(input1);
      await reportCache.getAssetTypeDistribution(input2);
      
      const stats = reportCache.getStats();
      expect(stats.hits).toBe(1); // Le cache devrait être utilisé car les données sont équivalentes
    });
  });
}); 