import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { PatrimoineHeader } from './PatrimoineHeader';
import { PieChartPatrimoine } from './PieChartPatrimoine';
import { CategoryBar } from './CategoryBar';
import { 
  AssetForFinancial, 
  EntityForFinancial, 
  PatrimoineMetrics,
  CategoryData,
  processAssetsForFinancialMetrics,
  filterAssets
} from '@/utils/financial-utils';

interface PatrimoineContainerProps {
  initialAssets?: AssetForFinancial[];
  initialEntities?: EntityForFinancial[];
  height?: number;
  onCategoryDetail?: (category: CategoryData) => void;
}

export function PatrimoineContainer({ 
  initialAssets = [],
  initialEntities = [],
  height = 500,
  onCategoryDetail
}: PatrimoineContainerProps) {
  const [assets, setAssets] = useState<AssetForFinancial[]>(initialAssets);
  const [entities, setEntities] = useState<EntityForFinancial[]>(initialEntities);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres avancés
  const [filters, setFilters] = useState({
    searchTerm: '',
    assetTypes: [] as string[],
    dateRange: null as { start: Date; end: Date } | null,
    valueRange: null as { min: number; max: number } | null
  });

  // Charger les données initiales
  useEffect(() => {
    if (initialAssets.length > 0) {
      setAssets(initialAssets);
    }
    if (initialEntities.length > 0) {
      setEntities(initialEntities);
    }
  }, [initialAssets, initialEntities]);

  // Filtrer les actifs selon les critères
  const filteredAssets = useMemo(() => {
    return filterAssets(assets, {
      entityIds: selectedEntityIds,
      assetTypes: filters.assetTypes,
      dateRange: filters.dateRange,
      valueRange: filters.valueRange,
      searchTerm: filters.searchTerm
    });
  }, [assets, selectedEntityIds, filters]);

  // Calculer les métriques du patrimoine
  const patrimoineMetrics = useMemo(() => {
    const metrics = processAssetsForFinancialMetrics(filteredAssets, selectedEntityIds);
    return {
      ...metrics,
      entites: selectedEntityIds.length > 0 
        ? entities.filter(e => selectedEntityIds.includes(e.id)).map(e => e.name)
        : entities.map(e => e.name)
    };
  }, [filteredAssets, selectedEntityIds, entities]);

  // Charger les données depuis l'API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Construire les paramètres de requête
      const entityQueryParam = selectedEntityIds.length > 0 
        ? `?entityIds=${selectedEntityIds.join(',')}` 
        : '';

      // Charger les actifs et entités en parallèle
      const [assetsResponse, entitiesResponse] = await Promise.all([
        fetch(`/api/assets${entityQueryParam}`),
        fetch('/api/entities')
      ]);

      if (!assetsResponse.ok) {
        throw new Error('Erreur lors du chargement des actifs');
      }

      if (!entitiesResponse.ok) {
        throw new Error('Erreur lors du chargement des entités');
      }

      const [assetsData, entitiesData] = await Promise.all([
        assetsResponse.json(),
        entitiesResponse.json()
      ]);

      // Transformer les données au format attendu
      const transformedAssets: AssetForFinancial[] = assetsData.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        assetType: {
          id: asset.assetType.id,
          name: asset.assetType.name,
          category: asset.assetType.category,
          color: asset.assetType.color
        },
        valuations: asset.valuations || [],
        ownerships: asset.ownerships || [],
        debts: asset.debts || []
      }));

      const transformedEntities: EntityForFinancial[] = entitiesData.map((entity: any) => ({
        id: entity.id,
        name: entity.name,
        type: entity.type
      }));

      setAssets(transformedAssets);
      setEntities(transformedEntities);
      
      toast.success('Données chargées avec succès');
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [selectedEntityIds]);

  // Gérer la sélection d'entités
  const handleEntityChange = useCallback((entityIds: string[]) => {
    setSelectedEntityIds(entityIds);
  }, []);

  // Gérer le clic sur une catégorie
  const handleCategoryClick = useCallback((category: CategoryData) => {
    if (onCategoryDetail) {
      onCategoryDetail(category);
    } else {
      toast.info(`Catégorie: ${category.nom} (${category.nombreActifs} actifs)`);
    }
  }, [onCategoryDetail]);

  // Gérer le rafraîchissement
  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Charger les données au montage du composant
  useEffect(() => {
    if (assets.length === 0) {
      loadData();
    }
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <p className="text-lg font-medium">Erreur de chargement</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec métriques */}
      <PatrimoineHeader
        data={patrimoineMetrics}
        entities={entities}
        selectedEntityIds={selectedEntityIds}
        onEntityChange={handleEntityChange}
        loading={loading}
      />

      {/* Graphique principal */}
      <PieChartPatrimoine
        categories={patrimoineMetrics.categories}
        height={height}
        loading={loading}
        onCategoryClick={handleCategoryClick}
        onRefresh={handleRefresh}
      />

      {/* Barre de catégories */}
      <CategoryBar
        categories={patrimoineMetrics.categories}
        onCategoryClick={handleCategoryClick}
      />

      {/* Debug info en mode développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-2 space-y-1">
              <p>Assets: {assets.length}</p>
              <p>Filtered Assets: {filteredAssets.length}</p>
              <p>Entities: {entities.length}</p>
              <p>Selected Entities: {selectedEntityIds.length}</p>
              <p>Categories: {patrimoineMetrics.categories.length}</p>
              <p>Total Value: {patrimoineMetrics.total.toLocaleString()} EUR</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
} 