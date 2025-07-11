import { useState, useEffect, useMemo, useCallback } from 'react';
import { TreemapFiltersData } from '@/components/dashboard/treemap-filters';

interface Asset {
  id: string;
  name: string;
  description?: string;
  assetType: {
    id: string;
    name: string;
    category: string;
    color?: string;
  };
  ownerships: Array<{
    ownerEntity: {
      id: string;
      name: string;
      type: string;
    };
    percentage: number;
  }>;
  valuations: Array<{
    value: number;
    currency: string;
    valuationDate: string;
  }>;
}

interface Entity {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'LEGAL_ENTITY';
}

interface AssetType {
  id: string;
  name: string;
  category: string;
}

interface TreemapData {
  name: string;
  value: number;
  color?: string;
  children?: TreemapData[];
}

interface UseTreemapDataResult {
  data: TreemapData;
  loading: boolean;
  error: Error | null;
  total: number;
  assets: Asset[];
  entities: Entity[];
  assetTypes: AssetType[];
  refresh: () => void;
}

function filterAssetsByPeriod(assets: Asset[], period: string): Asset[] {
  if (period === 'all') return assets;
  
  const now = new Date();
  const cutoffDate = new Date();
  
  switch (period) {
    case '1M':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case '6M':
      cutoffDate.setMonth(now.getMonth() - 6);
      break;
    case '1Y':
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return assets;
  }
  
  return assets.filter(asset => {
    const latestValuation = asset.valuations?.[0];
    if (!latestValuation) return false;
    
    const valuationDate = new Date(latestValuation.valuationDate);
    return valuationDate >= cutoffDate;
  });
}

function applyFilters(assets: Asset[], filters: TreemapFiltersData): Asset[] {
  let filteredAssets = [...assets];
  
  // Filtrer par période
  filteredAssets = filterAssetsByPeriod(filteredAssets, filters.period);
  
  // Filtrer par entités
  if (filters.entities.length > 0) {
    filteredAssets = filteredAssets.filter(asset =>
      asset.ownerships.some(ownership =>
        filters.entities.includes(ownership.ownerEntity.id)
      )
    );
  }
  
  // Filtrer par types d'actifs
  if (filters.assetTypes.length > 0) {
    filteredAssets = filteredAssets.filter(asset =>
      filters.assetTypes.includes(asset.assetType.id)
    );
  }
  
  // Filtrer par valeur minimum
  if (filters.minValue > 0) {
    filteredAssets = filteredAssets.filter(asset => {
      const latestValuation = asset.valuations?.[0];
      return latestValuation && latestValuation.value >= filters.minValue;
    });
  }
  
  return filteredAssets;
}

function transformToTreemapData(assets: Asset[], groupBy: string): TreemapData {
  if (!assets || assets.length === 0) {
    return { name: 'Patrimoine', value: 0, children: [] };
  }
  
  const grouped = assets.reduce((acc, asset) => {
    const latestValuation = asset.valuations?.[0];
    if (!latestValuation) return acc;
    
    const value = latestValuation.value || 0;
    let groupKey: string;
    let color: string;
    
    switch (groupBy) {
      case 'entity':
        groupKey = asset.ownerships[0]?.ownerEntity.name || 'Sans entité';
        color = getColorForEntity(asset.ownerships[0]?.ownerEntity.type);
        break;
      case 'category':
        groupKey = asset.assetType.category || 'Autre';
        color = getColorForCategory(asset.assetType.category);
        break;
      default: // 'type'
        groupKey = asset.assetType.name || 'Autre';
        color = asset.assetType.color || getColorForType(asset.assetType.category);
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = {
        name: groupKey,
        value: 0,
        color,
        children: []
      };
    }
    
    acc[groupKey].value += value;
    acc[groupKey].children!.push({
      name: asset.name,
      value: value,
      color: color
    });
    
    return acc;
  }, {} as Record<string, TreemapData>);
  
  return {
    name: 'Patrimoine',
    value: Object.values(grouped).reduce((sum, group) => sum + group.value, 0),
    children: Object.values(grouped)
  };
}

function getColorForType(type?: string): string {
  const colors: Record<string, string> = {
    'REAL_ESTATE': '#3b82f6',
    'STOCK': '#10b981',
    'CRYPTOCURRENCY': '#f59e0b',
    'CRYPTO': '#f59e0b',
    'BANK_ACCOUNT': '#6366f1',
    'INVESTMENT_FUND': '#8b5cf6',
    'LIFE_INSURANCE': '#06b6d4',
    'PRECIOUS_METALS': '#eab308',
    'VALUABLE_OBJECTS': '#f97316',
    'VEHICLES': '#84cc16',
    'INTER_ENTITY_LOAN': '#14b8a6',
    'OTHER': '#94a3b8'
  };
  
  return colors[type || 'OTHER'] || '#94a3b8';
}

function getColorForEntity(type?: string): string {
  const colors: Record<string, string> = {
    'INDIVIDUAL': '#3b82f6',
    'LEGAL_ENTITY': '#10b981'
  };
  
  return colors[type || 'INDIVIDUAL'] || '#3b82f6';
}

function getColorForCategory(category?: string): string {
  return getColorForType(category);
}

export function useTreemapData(filters: TreemapFiltersData): UseTreemapDataResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  // Cache pour éviter les requêtes trop fréquentes
  const shouldRefetch = useCallback(() => {
    const now = Date.now();
    return now - lastFetch > 5000; // 5 secondes minimum entre les requêtes
  }, [lastFetch]);
  
  const fetchData = useCallback(async () => {
    if (!shouldRefetch() && assets.length > 0) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching treemap data...');
      
      // Construire les paramètres de requête pour les filtres d'entités
      const entityQueryParam = filters.entities.length > 0 
        ? `?entityIds=${filters.entities.join(',')}` 
        : '';
      
      const [assetsResponse, entitiesResponse, assetTypesResponse] = await Promise.all([
        fetch(`/api/assets${entityQueryParam}`),
        fetch('/api/entities'),
        fetch('/api/asset-types')
      ]);
      
      if (!assetsResponse.ok) {
        throw new Error(`Erreur lors du chargement des actifs: ${assetsResponse.status}`);
      }
      
      const [assetsData, entitiesData, assetTypesData] = await Promise.all([
        assetsResponse.json(),
        entitiesResponse.ok ? entitiesResponse.json() : [],
        assetTypesResponse.ok ? assetTypesResponse.json() : []
      ]);
      
      setAssets(assetsData || []);
      setEntities(entitiesData || []);
      setAssetTypes(assetTypesData || []);
      setLastFetch(Date.now());
      
      console.log('✅ Treemap data loaded:', {
        assets: assetsData?.length || 0,
        entities: entitiesData?.length || 0,
        assetTypes: assetTypesData?.length || 0
      });
      
    } catch (err) {
      console.error('❌ Error fetching treemap data:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  }, [filters.entities, shouldRefetch, assets.length]); // Simplifier les dépendances
  
  const refresh = useCallback(() => {
    setLastFetch(0); // Force refresh
    fetchData();
  }, [fetchData]);
  
  // Chargement initial
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Données filtrées et transformées
  const filteredAssets = useMemo(() => {
    return applyFilters(assets, filters);
  }, [assets, filters]);
  
  const treemapData = useMemo(() => {
    return transformToTreemapData(filteredAssets, filters.groupBy);
  }, [filteredAssets, filters.groupBy]);
  
  const total = useMemo(() => {
    return filteredAssets.reduce((sum, asset) => {
      const latestValuation = asset.valuations?.[0];
      return sum + (latestValuation?.value || 0);
    }, 0);
  }, [filteredAssets]);
  
  return {
    data: treemapData,
    loading,
    error,
    total,
    assets: filteredAssets,
    entities,
    assetTypes,
    refresh
  };
} 