'use client';

import { useState, useMemo } from 'react';
import { EnhancedTreemapFiltersData } from '@/components/dashboard/enhanced-treemap-filters';

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
  type: string;
}

interface AssetType {
  id: string;
  name: string;
  category: string;
}

interface UseEnhancedTreemapDataResult {
  filteredAssets: Asset[];
  availableEntities: Entity[];
  availableAssetTypes: AssetType[];
  totalValue: number;
  totalAssets: number;
  loading: boolean;
  error: Error | null;
}

export function useEnhancedTreemapData(
  assets: Asset[],
  entities: Entity[],
  filters: EnhancedTreemapFiltersData
): UseEnhancedTreemapDataResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Filtrer les actifs selon les critères
  const filteredAssets = useMemo(() => {
    try {
      setLoading(true);
      setError(null);

      if (!assets || assets.length === 0) {
        return [];
      }

      let filtered = [...assets];

      // Filtrer par entités
      if (filters.entities.length > 0) {
        filtered = filtered.filter(asset =>
          asset.ownerships.some(ownership =>
            filters.entities.includes(ownership.ownerEntity.id)
          )
        );
      }

      // Filtrer par types d'actifs
      if (filters.assetTypes.length > 0) {
        filtered = filtered.filter(asset =>
          filters.assetTypes.includes(asset.assetType.id)
        );
      }

      // Filtrer par valeur minimale/maximale
      filtered = filtered.filter(asset => {
        const latestValuation = asset.valuations?.[0];
        if (!latestValuation) return false;

        const value = parseFloat(latestValuation.value) || 0;
        
        if (filters.minValue > 0 && value < filters.minValue) return false;
        if (filters.maxValue !== undefined && value > filters.maxValue) return false;

        return true;
      });

      // Filtrer par période (si applicable)
      if (filters.period !== 'all') {
        const now = new Date();
        let cutoffDate: Date;

        switch (filters.period) {
          case '1M':
            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case '3M':
            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case '6M':
            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
            break;
          case '1Y':
            cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          default:
            cutoffDate = new Date(0);
        }

        filtered = filtered.filter(asset => {
          const latestValuation = asset.valuations?.[0];
          if (!latestValuation) return false;

          const valuationDate = new Date(latestValuation.valuationDate);
          return valuationDate >= cutoffDate;
        });
      }

      // Trier les actifs
      filtered.sort((a, b) => {
        const aValuation = a.valuations?.[0];
        const bValuation = b.valuations?.[0];
        
        if (!aValuation || !bValuation) return 0;

        const aValue = parseFloat(aValuation.value) || 0;
        const bValue = parseFloat(bValuation.value) || 0;

        switch (filters.sortBy) {
          case 'value':
            return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          case 'name':
            return filters.sortOrder === 'asc' 
              ? a.name.localeCompare(b.name) 
              : b.name.localeCompare(a.name);
          case 'count':
            // Pour le tri par count, on compte le nombre d'actifs de même type
            const aCount = filtered.filter(asset => asset.assetType.id === a.assetType.id).length;
            const bCount = filtered.filter(asset => asset.assetType.id === b.assetType.id).length;
            return filters.sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
          default:
            return 0;
        }
      });

      return filtered;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du filtrage'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [assets, filters]);

  // Extraire les entités disponibles
  const availableEntities = useMemo(() => {
    if (!entities || entities.length === 0) return [];
    
    // Filtrer les entités qui ont des actifs
    const entitiesWithAssets = entities.filter(entity =>
      assets.some(asset =>
        asset.ownerships.some(ownership =>
          ownership.ownerEntity.id === entity.id
        )
      )
    );

    return entitiesWithAssets.map(entity => ({
      id: entity.id,
      name: entity.name,
      type: entity.type
    }));
  }, [entities, assets]);

  // Extraire les types d'actifs disponibles
  const availableAssetTypes = useMemo(() => {
    if (!assets || assets.length === 0) return [];

    const uniqueTypes = new Map<string, AssetType>();

    assets.forEach(asset => {
      if (!uniqueTypes.has(asset.assetType.id)) {
        uniqueTypes.set(asset.assetType.id, {
          id: asset.assetType.id,
          name: asset.assetType.name,
          category: asset.assetType.category
        });
      }
    });

    return Array.from(uniqueTypes.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assets]);

  // Calculer la valeur totale
  const totalValue = useMemo(() => {
    return filteredAssets.reduce((sum, asset) => {
      const latestValuation = asset.valuations?.[0];
      if (!latestValuation) return sum;

      const value = parseFloat(latestValuation.value) || 0;
      return sum + value;
    }, 0);
  }, [filteredAssets]);

  // Calculer le nombre total d'actifs
  const totalAssets = filteredAssets.length;

  return {
    filteredAssets,
    availableEntities,
    availableAssetTypes,
    totalValue,
    totalAssets,
    loading,
    error
  };
}

// Hook utilitaire pour obtenir les statistiques de la treemap
export function useTreemapStats(assets: Asset[]) {
  return useMemo(() => {
    if (!assets || assets.length === 0) {
      return {
        totalValue: 0,
        totalAssets: 0,
        categoriesCount: 0,
        entitiesCount: 0,
        averageValue: 0,
        medianValue: 0
      };
    }

    // Calculer les statistiques
    const values = assets
      .map(asset => {
        const latestValuation = asset.valuations?.[0];
        return latestValuation ? parseFloat(latestValuation.value) || 0 : 0;
      })
      .filter(value => value > 0)
      .sort((a, b) => a - b);

    const totalValue = values.reduce((sum, value) => sum + value, 0);
    const totalAssets = assets.length;
    const averageValue = totalValue / totalAssets;
    const medianValue = values.length > 0 ? values[Math.floor(values.length / 2)] : 0;

    // Compter les catégories uniques
    const categories = new Set(assets.map(asset => asset.assetType.category));
    const categoriesCount = categories.size;

    // Compter les entités uniques
    const entities = new Set();
    assets.forEach(asset => {
      asset.ownerships.forEach(ownership => {
        entities.add(ownership.ownerEntity.id);
      });
    });
    const entitiesCount = entities.size;

    return {
      totalValue,
      totalAssets,
      categoriesCount,
      entitiesCount,
      averageValue,
      medianValue
    };
  }, [assets]);
}

// Hook pour obtenir les données groupées selon les filtres
export function useGroupedTreemapData(
  assets: Asset[],
  groupBy: 'type' | 'entity' | 'category'
) {
  return useMemo(() => {
    if (!assets || assets.length === 0) return [];

    const grouped = new Map<string, {
      id: string;
      name: string;
      value: number;
      count: number;
      assets: Asset[];
      category?: string;
    }>();

    assets.forEach(asset => {
      const latestValuation = asset.valuations?.[0];
      if (!latestValuation) return;

      const value = parseFloat(latestValuation.value) || 0;
      let groupKey: string;
      let groupName: string;
      let category: string | undefined;

      switch (groupBy) {
        case 'category':
          groupKey = asset.assetType.category;
          groupName = getCategoryDisplayName(asset.assetType.category);
          category = asset.assetType.category;
          break;
        case 'type':
          groupKey = asset.assetType.id;
          groupName = asset.assetType.name;
          category = asset.assetType.category;
          break;
        case 'entity':
          // Pour les entités, on prend la première ownership (principal owner)
          const mainOwnership = asset.ownerships[0];
          if (!mainOwnership) return;
          groupKey = mainOwnership.ownerEntity.id;
          groupName = mainOwnership.ownerEntity.name;
          break;
        default:
          return;
      }

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          id: groupKey,
          name: groupName,
          value: 0,
          count: 0,
          assets: [],
          category
        });
      }

      const group = grouped.get(groupKey)!;
      group.value += value;
      group.count += 1;
      group.assets.push(asset);
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.value - a.value);
  }, [assets, groupBy]);
}

// Fonction utilitaire pour obtenir le nom d'affichage d'une catégorie
function getCategoryDisplayName(category: string): string {
  const categoryNames: Record<string, string> = {
    'Immobilier': 'Immobilier',
    'Financier': 'Placements Financiers',
    'Liquidités': 'Liquidités',
    'Assurance': 'Assurance Vie',
    'Numérique': 'Crypto-monnaies',
    'Divers': 'Autres',
    'OTHER': 'Autres'
  };
  
  return categoryNames[category] || 'Autres';
} 