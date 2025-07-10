import { useState, useEffect, useMemo, useCallback } from 'react';
import { reportCache } from '@/services/performance/report-cache';
import { logger } from '@/lib/logger';

// Types
interface Asset {
  id: string;
  name: string;
  assetType: {
    id: string;
    name: string;
    color?: string;
  };
  valuations: Array<{
    value: number;
    valuationDate: string;
    currency: string;
  }>;
  ownerships: Array<{
    percentage: number;
    ownerEntity: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  metadata?: any;
}

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface FilterState {
  period: string;
  entities: string[];
  assets: string[];
  currency: string;
  reportType: string;
  includeProjections: boolean;
  liquidityFilter: string;
  fiscalOptimization: boolean;
}

interface ReportCalculations {
  totalValue: number;
  assetsByType: Record<string, any>;
  filteredAssets: Asset[];
  isLoading: boolean;
  error: string | null;
  computationTime: number;
}

// Hook principal pour les calculs de base des rapports
export function useReportCalculations(
  assets: Asset[],
  entities: Entity[],
  filters: FilterState
): ReportCalculations {
  const [state, setState] = useState({
    totalValue: 0,
    assetsByType: {} as Record<string, any>,
    isLoading: true,
    error: null as string | null,
    computationTime: 0
  });

  // Mémoriser les actifs filtrés
  const filteredAssets = useMemo(() => {
    const startTime = performance.now();
    
    const filtered = assets.filter(asset => {
      // Filtre par entité
      if (filters.entities.length > 0) {
        const hasMatchingEntity = asset.ownerships.some(ownership => 
          filters.entities.includes(ownership.ownerEntity.id)
        );
        if (!hasMatchingEntity) return false;
      }

      // Filtre par actifs spécifiques
      if (filters.assets.length > 0) {
        if (!filters.assets.includes(asset.id)) return false;
      }

      // Filtre par liquidité (si nécessaire)
      if (filters.liquidityFilter !== 'all') {
        // Logique de filtrage par liquidité basée sur les métadonnées
      }

      return true;
    });
    
    const filterTime = performance.now() - startTime;
    logger.debug(`Assets filtered in ${filterTime.toFixed(2)}ms`, { 
      originalCount: assets.length, 
      filteredCount: filtered.length 
    }, 'useReportCalculations');
    
    return filtered;
  }, [assets, filters.entities, filters.assets, filters.liquidityFilter]);

  // Effet pour calculer les données avec cache
  useEffect(() => {
    let cancelled = false;
    
    async function calculateData() {
      if (filteredAssets.length === 0) {
        setState({
          totalValue: 0,
          assetsByType: {},
          isLoading: false,
          error: null,
          computationTime: 0
        });
        return;
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const startTime = performance.now();
        
        const result = await reportCache.getAssetTypeDistribution({
          assets: filteredAssets,
          entities,
          filters
        });
        
        const computationTime = performance.now() - startTime;
        
        if (!cancelled) {
          setState({
            totalValue: result.totalValue,
            assetsByType: result.assetsByType,
            isLoading: false,
            error: null,
            computationTime
          });
        }
      } catch (error) {
        logger.error('Error calculating report data', error, 'useReportCalculations');
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Erreur lors du calcul des données'
          }));
        }
      }
    }
    
    calculateData();
    
    return () => {
      cancelled = true;
    };
  }, [filteredAssets, entities, filters]);

  return {
    ...state,
    filteredAssets
  };
}

// Hook pour l'analyse de liquidité
export function useLiquidityAnalysis(
  assets: Asset[],
  entities: Entity[],
  filters: FilterState
) {
  const [state, setState] = useState({
    liquidityData: {} as Record<string, any>,
    isLoading: true,
    error: null as string | null
  });

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (filters.entities.length > 0) {
        const hasMatchingEntity = asset.ownerships.some(ownership => 
          filters.entities.includes(ownership.ownerEntity.id)
        );
        if (!hasMatchingEntity) return false;
      }
      if (filters.assets.length > 0) {
        if (!filters.assets.includes(asset.id)) return false;
      }
      return true;
    });
  }, [assets, filters.entities, filters.assets]);

  useEffect(() => {
    let cancelled = false;
    
    async function calculateLiquidity() {
      if (filteredAssets.length === 0) {
        setState({
          liquidityData: {},
          isLoading: false,
          error: null
        });
        return;
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const result = await reportCache.getLiquidityAnalysis({
          assets: filteredAssets,
          entities,
          filters
        });
        
        if (!cancelled) {
          setState({
            liquidityData: result,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        logger.error('Error calculating liquidity analysis', error, 'useLiquidityAnalysis');
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Erreur lors de l\'analyse de liquidité'
          }));
        }
      }
    }
    
    calculateLiquidity();
    
    return () => {
      cancelled = true;
    };
  }, [filteredAssets, entities, filters]);

  return state;
}

// Hook pour les tests de résistance
export function useStressTestAnalysis(
  assets: Asset[],
  entities: Entity[],
  filters: FilterState
) {
  const [state, setState] = useState({
    stressResults: [] as any[],
    isLoading: true,
    error: null as string | null
  });

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (filters.entities.length > 0) {
        const hasMatchingEntity = asset.ownerships.some(ownership => 
          filters.entities.includes(ownership.ownerEntity.id)
        );
        if (!hasMatchingEntity) return false;
      }
      if (filters.assets.length > 0) {
        if (!filters.assets.includes(asset.id)) return false;
      }
      return true;
    });
  }, [assets, filters.entities, filters.assets]);

  useEffect(() => {
    let cancelled = false;
    
    async function calculateStressTest() {
      if (filteredAssets.length === 0) {
        setState({
          stressResults: [],
          isLoading: false,
          error: null
        });
        return;
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const result = await reportCache.getStressTestResults({
          assets: filteredAssets,
          entities,
          filters
        });
        
        if (!cancelled) {
          setState({
            stressResults: result,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        logger.error('Error calculating stress test', error, 'useStressTestAnalysis');
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Erreur lors des tests de résistance'
          }));
        }
      }
    }
    
    calculateStressTest();
    
    return () => {
      cancelled = true;
    };
  }, [filteredAssets, entities, filters]);

  return state;
}

// Hook pour les projections
export function useProjectionAnalysis(
  assets: Asset[],
  entities: Entity[],
  filters: FilterState,
  scenario: 'optimistic' | 'realistic' | 'pessimistic' = 'realistic'
) {
  const [state, setState] = useState({
    projections: [] as any[],
    isLoading: true,
    error: null as string | null
  });

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (filters.entities.length > 0) {
        const hasMatchingEntity = asset.ownerships.some(ownership => 
          filters.entities.includes(ownership.ownerEntity.id)
        );
        if (!hasMatchingEntity) return false;
      }
      if (filters.assets.length > 0) {
        if (!filters.assets.includes(asset.id)) return false;
      }
      return true;
    });
  }, [assets, filters.entities, filters.assets]);

  useEffect(() => {
    let cancelled = false;
    
    async function calculateProjections() {
      if (filteredAssets.length === 0) {
        setState({
          projections: [],
          isLoading: false,
          error: null
        });
        return;
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const result = await reportCache.getProjectionResults({
          assets: filteredAssets,
          entities,
          filters
        }, scenario);
        
        if (!cancelled) {
          setState({
            projections: result,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        logger.error('Error calculating projections', error, 'useProjectionAnalysis');
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Erreur lors des projections'
          }));
        }
      }
    }
    
    calculateProjections();
    
    return () => {
      cancelled = true;
    };
  }, [filteredAssets, entities, filters, scenario]);

  return state;
}

// Hook pour les performances et statistiques du cache
export function useCacheStats() {
  const [stats, setStats] = useState(reportCache.getStats());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(reportCache.getStats());
    }, 1000); // Mise à jour chaque seconde
    
    return () => clearInterval(interval);
  }, []);
  
  const clearCache = useCallback(() => {
    reportCache.clearCache();
    setStats(reportCache.getStats());
  }, []);
  
  const invalidatePattern = useCallback((pattern: string) => {
    reportCache.invalidateByPattern(pattern);
    setStats(reportCache.getStats());
  }, []);
  
  return {
    stats,
    clearCache,
    invalidatePattern,
    cacheSize: reportCache.getCacheSize()
  };
}

// Hook pour la virtualisation des listes d'actifs
export function useVirtualizedAssets(
  assets: Asset[],
  itemHeight: number = 60,
  containerHeight: number = 400
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      assets.length
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, assets.length]);
  
  const visibleAssets = useMemo(() => {
    return assets.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [assets, visibleRange]);
  
  const totalHeight = assets.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  return {
    visibleAssets,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange
  };
}

// Hook pour le lazy loading des composants de rapports
export function useLazyReportComponent(componentName: string) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadComponent = useCallback(async () => {
    if (Component || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let module;
      
      switch (componentName) {
        case 'AssetDistributionChart':
          module = await import('@/components/charts/ReportsCharts');
          setComponent(() => module.AssetDistributionChart);
          break;
        case 'AssetsByEntityChart':
          module = await import('@/components/charts/ReportsCharts');
          setComponent(() => module.AssetsByEntityChart);
          break;
        case 'PortfolioEvolutionChart':
          module = await import('@/components/charts/ReportsCharts');
          setComponent(() => module.PortfolioEvolutionChart);
          break;
        case 'PatrimoineChart':
          module = await import('@/components/charts/PatrimoineChart');
          setComponent(() => module.PatrimoineChart);
          break;
        case 'ValuationTrendsChart':
          module = await import('@/components/charts/ValuationTrendsChart');
          setComponent(() => module.ValuationTrendsChart);
          break;
        default:
          throw new Error(`Composant inconnu: ${componentName}`);
      }
      
      logger.debug(`Composant ${componentName} chargé avec succès`, undefined, 'useLazyReportComponent');
    } catch (err) {
      logger.error(`Erreur lors du chargement du composant ${componentName}`, err, 'useLazyReportComponent');
      setError(`Erreur lors du chargement du composant`);
    } finally {
      setIsLoading(false);
    }
  }, [componentName, Component, isLoading]);
  
  return {
    Component,
    isLoading,
    error,
    loadComponent
  };
}

// Hook pour optimiser les re-renders des graphiques
export function useChartData<T>(
  data: T,
  dependencies: any[] = []
): T {
  return useMemo(() => data, dependencies);
}

// Hook pour débouncer les changements de filtres
export function useDebouncedFilters(
  filters: FilterState,
  delay: number = 300
): FilterState {
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [filters, delay]);
  
  return debouncedFilters;
} 