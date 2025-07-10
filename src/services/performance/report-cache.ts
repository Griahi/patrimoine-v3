import { logger } from '@/lib/logger';

// Types pour le cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  dependencies: string[];
  computationTime: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalComputationTime: number;
  averageComputationTime: number;
}

// Types pour les calculs de rapports
interface AssetCalculationInput {
  assets: any[];
  entities: any[];
  filters: any;
}

interface AssetTypeDistribution {
  [type: string]: {
    value: number;
    count: number;
    color: string;
    percentage: number;
  };
}

interface LiquidityAnalysis {
  [level: string]: {
    value: number;
    count: number;
    percentage: number;
    days: string;
    color: string;
    assets: any[];
  };
}

interface StressTestResult {
  scenario: string;
  totalLoss: number;
  totalValue: number;
  impactRate: number;
  impactsByType: Record<string, any>;
}

interface ProjectionResult {
  years: number;
  totalValue: number;
  assetProjections: Record<string, number>;
  growth: number;
  growthRate: number;
}

// Service de cache pour les rapports
class ReportCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalComputationTime: 0,
    averageComputationTime: 0
  };
  
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly COMPONENT_NAME = 'ReportCache';

  // Génération de clés de cache
  private generateCacheKey(type: string, input: any): string {
    const stableString = JSON.stringify(input, Object.keys(input).sort());
    const hash = this.simpleHash(stableString);
    return `${type}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Génération des dépendances pour invalidation
  private generateDependencies(input: AssetCalculationInput): string[] {
    const deps: string[] = [];
    
    // Dépendances basées sur les actifs
    if (input.assets) {
      deps.push(`assets_count_${input.assets.length}`);
      deps.push(`assets_hash_${this.simpleHash(JSON.stringify(input.assets.map(a => ({ id: a.id, valuations: a.valuations?.[0] }))))}`);
    }
    
    // Dépendances basées sur les entités
    if (input.entities) {
      deps.push(`entities_count_${input.entities.length}`);
      deps.push(`entities_ids_${input.entities.map(e => e.id).sort().join('_')}`);
    }
    
    // Dépendances basées sur les filtres
    if (input.filters) {
      deps.push(`filters_${this.simpleHash(JSON.stringify(input.filters))}`);
    }
    
    return deps;
  }

  // Vérification de validité du cache
  private isCacheValid<T>(entry: CacheEntry<T>, dependencies: string[]): boolean {
    const now = Date.now();
    
    // Vérifier TTL
    if (now - entry.timestamp > this.CACHE_TTL) {
      return false;
    }
    
    // Vérifier les dépendances
    if (entry.dependencies.length !== dependencies.length) {
      return false;
    }
    
    for (let i = 0; i < dependencies.length; i++) {
      if (entry.dependencies[i] !== dependencies[i]) {
        return false;
      }
    }
    
    return true;
  }

  // Gestion de la taille du cache
  private maintainCacheSize(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;
    
    // Supprimer les entrées les plus anciennes
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE + 10);
    toDelete.forEach(([key]) => this.cache.delete(key));
    
    logger.debug(`Cache maintenu: ${toDelete.length} entrées supprimées`, undefined, this.COMPONENT_NAME);
  }

  // Méthode générique de cache
  private async getOrCompute<T>(
    type: string,
    input: AssetCalculationInput,
    computeFn: () => Promise<T> | T
  ): Promise<T> {
    const key = this.generateCacheKey(type, input);
    const dependencies = this.generateDependencies(input);
    const cachedEntry = this.cache.get(key);
    
    // Vérifier le cache
    if (cachedEntry && this.isCacheValid(cachedEntry, dependencies)) {
      this.stats.hits++;
      logger.debug(`Cache hit pour ${type}`, { key, computationTime: cachedEntry.computationTime }, this.COMPONENT_NAME);
      return cachedEntry.data as T;
    }
    
    // Calculer les données
    this.stats.misses++;
    const startTime = performance.now();
    
    try {
      const result = await computeFn();
      const computationTime = performance.now() - startTime;
      
      // Mettre en cache
      this.cache.set(key, {
        data: result,
        timestamp: Date.now(),
        dependencies,
        computationTime
      });
      
      // Mettre à jour les statistiques
      this.stats.totalComputationTime += computationTime;
      this.stats.averageComputationTime = this.stats.totalComputationTime / this.stats.misses;
      
      logger.debug(`Cache miss pour ${type}`, { 
        key, 
        computationTime: `${computationTime.toFixed(2)}ms`,
        cacheSize: this.cache.size
      }, this.COMPONENT_NAME);
      
      this.maintainCacheSize();
      return result;
      
    } catch (error) {
      logger.error(`Erreur lors du calcul ${type}`, error, this.COMPONENT_NAME);
      throw error;
    }
  }

  // Calculs spécifiques optimisés

  // 1. Calcul de la valeur totale et distribution par type
  async getAssetTypeDistribution(input: AssetCalculationInput): Promise<{
    totalValue: number;
    assetsByType: AssetTypeDistribution;
  }> {
    return this.getOrCompute('asset_type_distribution', input, () => {
      const { calculateAssetValue, calculateOwnershipPercentage, validateValuation } = require('@/utils/financial-calculations');
      
      let totalValue = 0;
      const assetsByType: AssetTypeDistribution = {};
      
      input.assets.forEach(asset => {
        const latestValuation = asset.valuations?.[0];
        const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false };
        
        const relevantOwnerships = asset.ownerships?.filter(ownership => 
          input.filters.entities.length === 0 || 
          input.filters.entities.includes(ownership.ownerEntity.id)
        ) || [];
        
        const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships);
        const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage);
        
        totalValue += assetValue;
        
        const typeName = asset.assetType?.name || 'Non défini';
        if (!assetsByType[typeName]) {
          assetsByType[typeName] = { 
            value: 0, 
            count: 0, 
            color: asset.assetType?.color || '#6B7280',
            percentage: 0
          };
        }
        
        assetsByType[typeName].value += assetValue;
        assetsByType[typeName].count += 1;
      });
      
      // Calculer les pourcentages
      Object.keys(assetsByType).forEach(type => {
        assetsByType[type].percentage = totalValue > 0 ? (assetsByType[type].value / totalValue) * 100 : 0;
      });
      
      return { totalValue, assetsByType };
    });
  }

  // 2. Analyse de liquidité
  async getLiquidityAnalysis(input: AssetCalculationInput): Promise<LiquidityAnalysis> {
    return this.getOrCompute('liquidity_analysis', input, () => {
      const { calculateAssetValue, calculateOwnershipPercentage, validateValuation } = require('@/utils/financial-calculations');
      
      // Mapping des types d'actifs aux niveaux de liquidité
      const liquidityMapping: Record<string, { level: string; days: string; color: string }> = {
        'Épargne': { level: 'Immédiate', days: '0-1 jours', color: '#10B981' },
        'Compte courant': { level: 'Immédiate', days: '0-1 jours', color: '#10B981' },
        'Livret A': { level: 'Immédiate', days: '0-1 jours', color: '#10B981' },
        'Actions': { level: 'Court terme', days: '1-7 jours', color: '#3B82F6' },
        'ETF': { level: 'Court terme', days: '1-7 jours', color: '#3B82F6' },
        'Obligations': { level: 'Court terme', days: '1-7 jours', color: '#3B82F6' },
        'Assurance-vie': { level: 'Moyen terme', days: '1-3 mois', color: '#F59E0B' },
        'PEA': { level: 'Moyen terme', days: '1-3 mois', color: '#F59E0B' },
        'Immobilier': { level: 'Long terme', days: '3+ mois', color: '#EF4444' },
        'SCPI': { level: 'Long terme', days: '3+ mois', color: '#EF4444' },
        'Cryptomonnaies': { level: 'Court terme', days: '1-7 jours', color: '#3B82F6' }
      };
      
      const getLiquidityLevel = (assetTypeName: string) => {
        return liquidityMapping[assetTypeName] || { level: 'Moyen terme', days: '1-3 mois', color: '#F59E0B' };
      };
      
      const liquidityData: LiquidityAnalysis = {};
      let totalValue = 0;
      
      input.assets.forEach(asset => {
        const latestValuation = asset.valuations?.[0];
        const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false };
        
        const relevantOwnerships = asset.ownerships?.filter(ownership => 
          input.filters.entities.length === 0 || 
          input.filters.entities.includes(ownership.ownerEntity.id)
        ) || [];
        
        const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships);
        const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage);
        
        totalValue += assetValue;
        
        const liquidityInfo = getLiquidityLevel(asset.assetType?.name || '');
        
        if (!liquidityData[liquidityInfo.level]) {
          liquidityData[liquidityInfo.level] = {
            value: 0,
            count: 0,
            percentage: 0,
            days: liquidityInfo.days,
            color: liquidityInfo.color,
            assets: []
          };
        }
        
        liquidityData[liquidityInfo.level].value += assetValue;
        liquidityData[liquidityInfo.level].count += 1;
        liquidityData[liquidityInfo.level].assets.push({
          ...asset,
          value: assetValue,
          liquidityDays: liquidityInfo.days
        });
      });
      
      // Calculer les pourcentages
      Object.keys(liquidityData).forEach(level => {
        liquidityData[level].percentage = totalValue > 0 ? (liquidityData[level].value / totalValue) * 100 : 0;
      });
      
      return liquidityData;
    });
  }

  // 3. Tests de résistance
  async getStressTestResults(input: AssetCalculationInput): Promise<StressTestResult[]> {
    return this.getOrCompute('stress_test_results', input, () => {
      const { calculateAssetValue, calculateOwnershipPercentage, validateValuation } = require('@/utils/financial-calculations');
      
      const stressScenarios = [
        {
          name: 'Krach Boursier',
          description: 'Chute des marchés actions de 30%',
          impacts: {
            'Actions': -30, 'ETF': -25, 'Obligations': -5, 'Immobilier': -10,
            'Épargne': 0, 'Cryptomonnaies': -50, 'default': -15
          }
        },
        {
          name: 'Crise Immobilière',
          description: 'Baisse de l\'immobilier de 20%',
          impacts: {
            'Immobilier': -20, 'SCPI': -15, 'Actions': -10, 'Obligations': 5,
            'Épargne': 0, 'default': -5
          }
        },
        {
          name: 'Inflation Élevée',
          description: 'Inflation de 6% par an',
          impacts: {
            'Épargne': -6, 'Obligations': -8, 'Actions': 2, 'Immobilier': 4,
            'Cryptomonnaies': 15, 'default': -2
          }
        },
        {
          name: 'Crise de Liquidité',
          description: 'Problèmes d\'accès aux fonds',
          impacts: {
            'Épargne': 0, 'Actions': -15, 'ETF': -12, 'Obligations': -5,
            'Immobilier': -25, 'SCPI': -20, 'default': -10
          }
        }
      ];
      
      return stressScenarios.map(scenario => {
        let totalLoss = 0;
        let totalValue = 0;
        const impactsByType: Record<string, { value: number; loss: number; impactRate: number }> = {};
        
        input.assets.forEach(asset => {
          const latestValuation = asset.valuations?.[0];
          const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false };
          
          const relevantOwnerships = asset.ownerships?.filter(ownership => 
            input.filters.entities.length === 0 || 
            input.filters.entities.includes(ownership.ownerEntity.id)
          ) || [];
          
          const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships);
          const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage);
          
          const assetTypeName = asset.assetType?.name || 'default';
          const impactRate = scenario.impacts[assetTypeName] || scenario.impacts['default'];
          const loss = assetValue * (Math.abs(impactRate) / 100);
          
          if (!impactsByType[assetTypeName]) {
            impactsByType[assetTypeName] = { value: 0, loss: 0, impactRate };
          }
          
          impactsByType[assetTypeName].value += assetValue;
          impactsByType[assetTypeName].loss += loss;
          
          totalValue += assetValue;
          if (impactRate < 0) {
            totalLoss += loss;
          }
        });
        
        const totalImpactRate = totalValue > 0 ? (totalLoss / totalValue) * 100 : 0;
        
        return {
          scenario: scenario.name,
          totalLoss,
          totalValue,
          impactRate: totalImpactRate,
          impactsByType
        };
      });
    });
  }

  // 4. Projections
  async getProjectionResults(input: AssetCalculationInput, scenario: 'optimistic' | 'realistic' | 'pessimistic'): Promise<ProjectionResult[]> {
    const cacheInput = { ...input, scenario };
    
    return this.getOrCompute(`projection_${scenario}`, cacheInput, () => {
      const { calculateAssetValue, calculateOwnershipPercentage, validateValuation } = require('@/utils/financial-calculations');
      
      const growthAssumptions: Record<string, Record<string, number>> = {
        'Actions': { optimistic: 10, realistic: 7, pessimistic: 3 },
        'ETF': { optimistic: 9, realistic: 6.5, pessimistic: 2.5 },
        'Obligations': { optimistic: 4, realistic: 2.5, pessimistic: 0.5 },
        'Immobilier': { optimistic: 6, realistic: 4, pessimistic: 1 },
        'Épargne': { optimistic: 2, realistic: 1.5, pessimistic: 0.5 },
        'Cryptomonnaies': { optimistic: 25, realistic: 12, pessimistic: -5 },
        'SCPI': { optimistic: 5, realistic: 3.5, pessimistic: 1 },
        'Assurance-vie': { optimistic: 4, realistic: 3, pessimistic: 1.5 },
        'default': { optimistic: 6, realistic: 4, pessimistic: 1 }
      };
      
      const timeHorizons = [1, 3, 5, 10, 15, 20];
      
      // Calculer la valeur totale actuelle
      let totalCurrentValue = 0;
      input.assets.forEach(asset => {
        const latestValuation = asset.valuations?.[0];
        const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false };
        
        const relevantOwnerships = asset.ownerships?.filter(ownership => 
          input.filters.entities.length === 0 || 
          input.filters.entities.includes(ownership.ownerEntity.id)
        ) || [];
        
        const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships);
        const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage);
        totalCurrentValue += assetValue;
      });
      
      return timeHorizons.map(years => {
        let totalProjectedValue = 0;
        const assetProjections: Record<string, number> = {};
        
        input.assets.forEach(asset => {
          const latestValuation = asset.valuations?.[0];
          const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false };
          
          const relevantOwnerships = asset.ownerships?.filter(ownership => 
            input.filters.entities.length === 0 || 
            input.filters.entities.includes(ownership.ownerEntity.id)
          ) || [];
          
          const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships);
          const currentAssetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage);
          
          const assetTypeName = asset.assetType?.name || 'default';
          const growthRate = growthAssumptions[assetTypeName]?.[scenario] || growthAssumptions['default'][scenario];
          
          const projectedValue = currentAssetValue * Math.pow(1 + (growthRate / 100), years);
          
          if (!assetProjections[assetTypeName]) {
            assetProjections[assetTypeName] = 0;
          }
          assetProjections[assetTypeName] += projectedValue;
          totalProjectedValue += projectedValue;
        });
        
        return {
          years,
          totalValue: totalProjectedValue,
          assetProjections,
          growth: totalProjectedValue - totalCurrentValue,
          growthRate: totalCurrentValue > 0 ? ((totalProjectedValue / totalCurrentValue) - 1) * 100 : 0
        };
      });
    });
  }

  // Méthodes utilitaires pour le cache
  getStats(): CacheStats {
    return { ...this.stats };
  }

  clearCache(): void {
    this.cache.clear();
    logger.info('Cache vidé', undefined, this.COMPONENT_NAME);
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Invalidation ciblée
  invalidateByPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
    keys.forEach(key => this.cache.delete(key));
    logger.info(`Cache invalidé pour le pattern: ${pattern}`, { keysDeleted: keys.length }, this.COMPONENT_NAME);
  }
}

// Instance singleton
export const reportCache = new ReportCacheService();

// Hook pour accéder aux statistiques du cache
export function useReportCacheStats() {
  return reportCache.getStats();
} 