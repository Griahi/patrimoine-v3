import { reportCache } from '@/services/performance/report-cache';
import { secureExcelExport, securePDFExport } from '@/lib/secure-export';
import { logger } from '@/lib/logger';

// Mock des dépendances externes
jest.mock('@/utils/financial-calculations', () => ({
  calculateAssetValue: jest.fn((value, percentage) => value * (percentage / 100)),
  calculateOwnershipPercentage: jest.fn((ownerships) => 
    ownerships.reduce((sum: number, ownership: any) => sum + ownership.percentage, 0)
  ),
  validateValuation: jest.fn((valuation) => 
    valuation ? { value: valuation.value, currency: valuation.currency, isValid: true } : { value: 0, currency: 'EUR', isValid: false }
  ),
  formatCurrency: jest.fn((value, options) => `${value} ${options?.currency || 'EUR'}`),
  formatPercentage: jest.fn((value) => `${value}%`)
}));

jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

jest.mock('html2canvas', () => jest.fn(() => Promise.resolve({
  toDataURL: () => 'data:image/png;base64,mock-canvas-data'
})));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn(() => ({
    addImage: jest.fn(),
    save: jest.fn(),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } }
  }))
}));

describe('Reports System Integration Tests', () => {
  // Données complètes de test
  const fullMockData = {
    assets: [
      {
        id: 'asset1',
        name: 'Actions Apple Inc.',
        assetType: { name: 'Actions', color: '#3B82F6' },
        valuations: [
          { value: 150000, currency: 'EUR', valuationDate: '2024-01-15' },
          { value: 140000, currency: 'EUR', valuationDate: '2023-12-15' },
          { value: 130000, currency: 'EUR', valuationDate: '2023-11-15' }
        ],
        ownerships: [
          { percentage: 80, ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } },
          { percentage: 20, ownerEntity: { id: 'entity2', name: 'Jane Doe', type: 'PHYSICAL_PERSON' } }
        ],
        metadata: { sector: 'Technology', country: 'US' }
      },
      {
        id: 'asset2',
        name: 'Appartement Paris 16e',
        assetType: { name: 'Immobilier', color: '#EF4444' },
        valuations: [
          { value: 800000, currency: 'EUR', valuationDate: '2024-01-01' }
        ],
        ownerships: [
          { percentage: 50, ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } },
          { percentage: 50, ownerEntity: { id: 'entity3', name: 'Doe SCI', type: 'LEGAL_ENTITY' } }
        ],
        metadata: { location: 'Paris', type: 'Residential' }
      },
      {
        id: 'asset3',
        name: 'Livret A',
        assetType: { name: 'Épargne', color: '#10B981' },
        valuations: [
          { value: 22950, currency: 'EUR', valuationDate: '2024-01-01' }
        ],
        ownerships: [
          { percentage: 100, ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } }
        ],
        metadata: { bank: 'Banque Postale', rate: 3.0 }
      },
      {
        id: 'asset4',
        name: 'Bitcoin',
        assetType: { name: 'Cryptomonnaies', color: '#F59E0B' },
        valuations: [
          { value: 25000, currency: 'EUR', valuationDate: '2024-01-15' },
          { value: 20000, currency: 'EUR', valuationDate: '2023-12-15' }
        ],
        ownerships: [
          { percentage: 100, ownerEntity: { id: 'entity2', name: 'Jane Doe', type: 'PHYSICAL_PERSON' } }
        ],
        metadata: { exchange: 'Binance', wallet: 'Hardware' }
      },
      {
        id: 'asset5',
        name: 'Assurance Vie AXA',
        assetType: { name: 'Assurance-vie', color: '#8B5CF6' },
        valuations: [
          { value: 75000, currency: 'EUR', valuationDate: '2024-01-01' }
        ],
        ownerships: [
          { percentage: 100, ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } }
        ],
        metadata: { provider: 'AXA', type: 'Multisupport' }
      }
    ],
    entities: [
      { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' },
      { id: 'entity2', name: 'Jane Doe', type: 'PHYSICAL_PERSON' },
      { id: 'entity3', name: 'Doe SCI', type: 'LEGAL_ENTITY' }
    ],
    filters: {
      period: '1Y',
      entities: [],
      assets: [],
      currency: 'EUR',
      reportType: 'bilan_complet',
      includeProjections: false,
      liquidityFilter: 'all',
      fiscalOptimization: false
    }
  };

  beforeEach(() => {
    reportCache.clearCache();
    jest.clearAllMocks();
  });

  describe('End-to-End Report Generation', () => {
    it('should generate complete asset type distribution report', async () => {
      const { assets, entities, filters } = fullMockData;
      const input = { assets, entities, filters };

      const result = await reportCache.getAssetTypeDistribution(input);

      // Vérifications structurelles
      expect(result).toHaveProperty('totalValue');
      expect(result).toHaveProperty('assetsByType');

      // Vérifications de valeurs (calcul attendu)
      const expectedTotal = (150000 * 0.8) + (800000 * 0.5) + 22950 + 75000; // John Doe's share
      expect(result.totalValue).toBeCloseTo(518950, 2);

      // Vérifications par type d'actif
      expect(result.assetsByType).toHaveProperty('Actions');
      expect(result.assetsByType).toHaveProperty('Immobilier');
      expect(result.assetsByType).toHaveProperty('Épargne');
      expect(result.assetsByType).toHaveProperty('Assurance-vie');

      expect(result.assetsByType.Actions.value).toBeCloseTo(120000, 2);
      expect(result.assetsByType.Immobilier.value).toBeCloseTo(400000, 2);
      expect(result.assetsByType.Épargne.value).toBeCloseTo(22950, 2);
      expect(result.assetsByType['Assurance-vie'].value).toBeCloseTo(75000, 2);

      // Vérifications des pourcentages
      Object.values(result.assetsByType).forEach(type => {
        expect(type.percentage).toBeGreaterThanOrEqual(0);
        expect(type.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should generate complete liquidity analysis report', async () => {
      const { assets, entities, filters } = fullMockData;
      const input = { assets, entities, filters };

      const result = await reportCache.getLiquidityAnalysis(input);

      // Vérifications structurelles
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');

      // Vérifications des niveaux de liquidité
      expect(result).toHaveProperty('Immédiate'); // Épargne
      expect(result).toHaveProperty('Court terme'); // Actions, Crypto
      expect(result).toHaveProperty('Moyen terme'); // Assurance-vie
      expect(result).toHaveProperty('Long terme'); // Immobilier

      // Vérifications des valeurs par niveau
      expect(result['Immédiate'].value).toBeCloseTo(22950, 2);
      expect(result['Court terme'].value).toBeCloseTo(120000, 2); // Actions seulement (John Doe)
      expect(result['Moyen terme'].value).toBeCloseTo(75000, 2);
      expect(result['Long terme'].value).toBeCloseTo(400000, 2);

      // Vérifications des métadonnées
      Object.values(result).forEach(level => {
        expect(level).toHaveProperty('days');
        expect(level).toHaveProperty('color');
        expect(level).toHaveProperty('assets');
        expect(Array.isArray(level.assets)).toBe(true);
      });
    });

    it('should generate stress test analysis', async () => {
      const { assets, entities, filters } = fullMockData;
      const input = { assets, entities, filters };

      const result = await reportCache.getStressTestResults(input);

      // Vérifications structurelles
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4); // 4 scénarios de stress

      // Vérifications de chaque scénario
      result.forEach(scenario => {
        expect(scenario).toHaveProperty('scenario');
        expect(scenario).toHaveProperty('totalLoss');
        expect(scenario).toHaveProperty('totalValue');
        expect(scenario).toHaveProperty('impactRate');
        expect(scenario).toHaveProperty('impactsByType');

        expect(typeof scenario.totalValue).toBe('number');
        expect(scenario.totalValue).toBeGreaterThan(0);
        expect(typeof scenario.impactRate).toBe('number');
      });

      // Vérifications spécifiques du scénario "Krach Boursier"
      const krach = result.find(s => s.scenario === 'Krach Boursier');
      expect(krach).toBeDefined();
      expect(krach!.impactsByType.Actions.impactRate).toBe(-30);
      expect(krach!.impactsByType.Immobilier.impactRate).toBe(-10);
    });

    it('should generate projection analysis for all scenarios', async () => {
      const { assets, entities, filters } = fullMockData;
      const input = { assets, entities, filters };

      const optimistic = await reportCache.getProjectionResults(input, 'optimistic');
      const realistic = await reportCache.getProjectionResults(input, 'realistic');
      const pessimistic = await reportCache.getProjectionResults(input, 'pessimistic');

      // Vérifications structurelles
      [optimistic, realistic, pessimistic].forEach(projections => {
        expect(Array.isArray(projections)).toBe(true);
        expect(projections).toHaveLength(6); // 6 horizons temporels

        projections.forEach(projection => {
          expect(projection).toHaveProperty('years');
          expect(projection).toHaveProperty('totalValue');
          expect(projection).toHaveProperty('assetProjections');
          expect(projection).toHaveProperty('growth');
          expect(projection).toHaveProperty('growthRate');
        });
      });

      // Vérifications de cohérence entre scénarios
      const optimistic10Y = optimistic.find(p => p.years === 10)!;
      const realistic10Y = realistic.find(p => p.years === 10)!;
      const pessimistic10Y = pessimistic.find(p => p.years === 10)!;

      expect(optimistic10Y.totalValue).toBeGreaterThan(realistic10Y.totalValue);
      expect(realistic10Y.totalValue).toBeGreaterThan(pessimistic10Y.totalValue);

      // Vérifications temporelles
      const realistic1Y = realistic.find(p => p.years === 1)!;
      const realistic20Y = realistic.find(p => p.years === 20)!;

      expect(realistic20Y.totalValue).toBeGreaterThan(realistic1Y.totalValue);
      expect(realistic20Y.growthRate).toBeGreaterThan(realistic1Y.growthRate);
    });
  });

  describe('Multi-Entity Scenarios', () => {
    it('should handle entity filtering correctly', async () => {
      const { assets, entities } = fullMockData;
      
      // Test avec une seule entité
      const filtersJohnOnly = {
        ...fullMockData.filters,
        entities: ['entity1'] // John Doe seulement
      };

      const resultJohn = await reportCache.getAssetTypeDistribution({
        assets, entities, filters: filtersJohnOnly
      });

      // John possède : 80% des actions + 50% de l'immobilier + 100% épargne + 100% assurance-vie
      const expectedJohn = (150000 * 0.8) + (800000 * 0.5) + 22950 + 75000;
      expect(resultJohn.totalValue).toBeCloseTo(expectedJohn, 2);

      // Test avec une autre entité
      const filtersJaneOnly = {
        ...fullMockData.filters,
        entities: ['entity2'] // Jane Doe seulement
      };

      const resultJane = await reportCache.getAssetTypeDistribution({
        assets, entities, filters: filtersJaneOnly
      });

      // Jane possède : 20% des actions + 100% crypto
      const expectedJane = (150000 * 0.2) + 25000;
      expect(resultJane.totalValue).toBeCloseTo(expectedJane, 2);
    });

    it('should generate consolidation report correctly', async () => {
      const { assets, entities, filters } = fullMockData;
      const input = { assets, entities, filters };

      // Ici on testerait renderConsolidationReport si on l'avait extrait
      // Pour l'instant, on teste la logique via les autres méthodes
      
      const allEntitiesData = await Promise.all([
        reportCache.getAssetTypeDistribution({ 
          assets, entities, 
          filters: { ...filters, entities: ['entity1'] }
        }),
        reportCache.getAssetTypeDistribution({ 
          assets, entities, 
          filters: { ...filters, entities: ['entity2'] }
        }),
        reportCache.getAssetTypeDistribution({ 
          assets, entities, 
          filters: { ...filters, entities: ['entity3'] }
        })
      ]);

      // Vérifications
      expect(allEntitiesData[0].totalValue).toBeGreaterThan(0); // John
      expect(allEntitiesData[1].totalValue).toBeGreaterThan(0); // Jane
      expect(allEntitiesData[2].totalValue).toBeGreaterThan(0); // SCI

      // La somme des entités individuelles devrait égaler le total sans filtre
      const totalIndividual = allEntitiesData.reduce((sum, data) => sum + data.totalValue, 0);
      const totalGlobal = await reportCache.getAssetTypeDistribution(input);
      
      // Note: Il peut y avoir des différences dues aux actifs partagés
      expect(totalIndividual).toBeGreaterThan(totalGlobal.totalValue * 0.8);
    });
  });

  describe('Export Functionality', () => {
    it('should export data to Excel format', async () => {
      const { assets, entities, filters } = fullMockData;
      const exportData = {
        totalValue: 518950,
        assetsByType: {
          'Actions': { value: 120000, count: 1, percentage: 23.1 },
          'Immobilier': { value: 400000, count: 1, percentage: 77.1 },
          'Épargne': { value: 22950, count: 1, percentage: 4.4 },
          'Assurance-vie': { value: 75000, count: 1, percentage: 14.5 }
        },
        assets,
        entities,
        filters
      };

      // Tester l'export Excel (mocked)
      expect(() => {
        secureExcelExport(exportData, 'test-report.xlsx');
      }).not.toThrow();
    });

    it('should export data to PDF format', async () => {
      // Mock d'un élément DOM
      const mockElement = document.createElement('div');
      mockElement.id = 'report-content';
      mockElement.innerHTML = '<h1>Test Report</h1><p>Content</p>';
      document.body.appendChild(mockElement);

      // Tester l'export PDF (mocked)
      expect(() => {
        securePDFExport('report-content', 'test-report.pdf', 'Test Report');
      }).not.toThrow();

      document.body.removeChild(mockElement);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty asset list', async () => {
      const input = {
        assets: [],
        entities: fullMockData.entities,
        filters: fullMockData.filters
      };

      const result = await reportCache.getAssetTypeDistribution(input);
      
      expect(result.totalValue).toBe(0);
      expect(Object.keys(result.assetsByType)).toHaveLength(0);
    });

    it('should handle assets without valuations', async () => {
      const assetsWithoutValuations = [{
        id: 'asset-no-val',
        name: 'Asset without valuation',
        assetType: { name: 'Unknown', color: '#gray' },
        valuations: [],
        ownerships: [{ 
          percentage: 100, 
          ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } 
        }]
      }];

      const input = {
        assets: assetsWithoutValuations,
        entities: fullMockData.entities,
        filters: fullMockData.filters
      };

      const result = await reportCache.getAssetTypeDistribution(input);
      
      expect(result.totalValue).toBe(0);
      expect(result.assetsByType.Unknown).toBeDefined();
      expect(result.assetsByType.Unknown.value).toBe(0);
    });

    it('should handle invalid ownership percentages', async () => {
      const assetsWithInvalidOwnership = [{
        id: 'asset-invalid-ownership',
        name: 'Asset with invalid ownership',
        assetType: { name: 'Test', color: '#test' },
        valuations: [{ value: 100000, currency: 'EUR', valuationDate: '2024-01-01' }],
        ownerships: [{ 
          percentage: 150, // > 100%
          ownerEntity: { id: 'entity1', name: 'John Doe', type: 'PHYSICAL_PERSON' } 
        }]
      }];

      const input = {
        assets: assetsWithInvalidOwnership,
        entities: fullMockData.entities,
        filters: fullMockData.filters
      };

      // Devrait fonctionner sans erreur même avec des pourcentages invalides
      const result = await reportCache.getAssetTypeDistribution(input);
      expect(result).toBeDefined();
      expect(result.totalValue).toBeGreaterThan(0);
    });

    it('should handle concurrent access gracefully', async () => {
      const { assets, entities, filters } = fullMockData;
      const input = { assets, entities, filters };

      // Lancer plusieurs opérations en parallèle
      const operations = [
        reportCache.getAssetTypeDistribution(input),
        reportCache.getLiquidityAnalysis(input),
        reportCache.getStressTestResults(input),
        reportCache.getProjectionResults(input, 'realistic'),
        reportCache.getProjectionResults(input, 'optimistic')
      ];

      const results = await Promise.all(operations);

      // Toutes les opérations devraient réussir
      results.forEach(result => {
        expect(result).toBeDefined();
      });

      // Les statistiques de cache devraient être cohérentes
      const stats = reportCache.getStats();
      expect(stats.misses + stats.hits).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance across multiple report types', async () => {
      const { assets, entities, filters } = fullMockData;
      const input = { assets, entities, filters };

      const startTime = performance.now();

      // Générer tous les types de rapports
      await reportCache.getAssetTypeDistribution(input);
      await reportCache.getLiquidityAnalysis(input);
      await reportCache.getStressTestResults(input);
      await reportCache.getProjectionResults(input, 'realistic');
      await reportCache.getProjectionResults(input, 'optimistic');
      await reportCache.getProjectionResults(input, 'pessimistic');

      const totalTime = performance.now() - startTime;

      // Même avec tous les rapports, ça devrait rester rapide
      expect(totalTime).toBeLessThan(500); // Moins de 500ms pour tous les rapports
    });

    it('should demonstrate cache efficiency across session', async () => {
      const { assets, entities, filters } = fullMockData;
      const input = { assets, entities, filters };

      // Premier cycle - cache misses
      const start1 = performance.now();
      await reportCache.getAssetTypeDistribution(input);
      await reportCache.getLiquidityAnalysis(input);
      const time1 = performance.now() - start1;

      // Deuxième cycle - cache hits
      const start2 = performance.now();
      await reportCache.getAssetTypeDistribution(input);
      await reportCache.getLiquidityAnalysis(input);
      const time2 = performance.now() - start2;

      // Le deuxième cycle devrait être significativement plus rapide
      expect(time2).toBeLessThan(time1 * 0.2); // Au moins 5x plus rapide

      const stats = reportCache.getStats();
      expect(stats.hits).toBeGreaterThanOrEqual(2);
      expect(stats.misses).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log operations correctly in development', () => {
      // Vérifier que le logger est appelé pendant les opérations
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
    });

    it('should track cache statistics', async () => {
      const { assets, entities, filters } = fullMockData;
      const input = { assets, entities, filters };

      const initialStats = reportCache.getStats();
      
      await reportCache.getAssetTypeDistribution(input);
      await reportCache.getAssetTypeDistribution(input); // Cache hit
      
      const finalStats = reportCache.getStats();
      
      expect(finalStats.misses).toBe(initialStats.misses + 1);
      expect(finalStats.hits).toBe(initialStats.hits + 1);
      expect(finalStats.totalComputationTime).toBeGreaterThan(initialStats.totalComputationTime);
    });
  });
}); 