import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useVirtualizedAssets } from '@/hooks/useOptimizedReports';
import { formatCurrency } from '@/utils/financial-calculations';
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

interface VirtualizedAssetListProps {
  assets: Asset[];
  itemHeight?: number;
  containerHeight?: number;
  currency?: string;
  onAssetClick?: (asset: Asset) => void;
  onAssetSelect?: (assetIds: string[]) => void;
  selectedAssets?: string[];
  className?: string;
  showCheckboxes?: boolean;
  showOwnership?: boolean;
  showLastValuation?: boolean;
  sortBy?: 'name' | 'value' | 'type' | 'date';
  sortOrder?: 'asc' | 'desc';
  filterText?: string;
}

// Composant pour un élément d'actif
const AssetItem = memo(({ 
  asset, 
  currency = 'EUR',
  isSelected = false,
  onSelect,
  onClick,
  showCheckbox = false,
  showOwnership = true,
  showLastValuation = true
}: {
  asset: Asset;
  currency?: string;
  isSelected?: boolean;
  onSelect?: (assetId: string, selected: boolean) => void;
  onClick?: (asset: Asset) => void;
  showCheckbox?: boolean;
  showOwnership?: boolean;
  showLastValuation?: boolean;
}) => {
  const latestValuation = asset.valuations?.[0];
  const totalOwnership = asset.ownerships?.reduce((sum, ownership) => sum + ownership.percentage, 0) || 0;
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(asset.id, e.target.checked);
  };

  const handleClick = () => {
    onClick?.(asset);
  };

  return (
    <div 
      className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
      onClick={handleClick}
    >
      {showCheckbox && (
        <div className="flex-shrink-0 mr-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}
      
      <div className="flex-shrink-0 mr-3">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: asset.assetType?.color || '#6B7280' }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {asset.name}
            </h4>
            <p className="text-xs text-gray-500 truncate">
              {asset.assetType?.name}
            </p>
          </div>
          
          {showLastValuation && latestValuation && (
            <div className="flex-shrink-0 text-right ml-4">
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(latestValuation.value, { currency })}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(latestValuation.valuationDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
          )}
        </div>
        
        {showOwnership && totalOwnership > 0 && totalOwnership < 100 && (
          <div className="mt-1">
            <div className="text-xs text-gray-500">
              Propriété: {totalOwnership}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

AssetItem.displayName = 'AssetItem';

// Composant principal de liste virtualisée
const VirtualizedAssetList: React.FC<VirtualizedAssetListProps> = ({
  assets,
  itemHeight = 70,
  containerHeight = 400,
  currency = 'EUR',
  onAssetClick,
  onAssetSelect,
  selectedAssets = [],
  className = '',
  showCheckboxes = false,
  showOwnership = true,
  showLastValuation = true,
  sortBy = 'name',
  sortOrder = 'asc',
  filterText = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Filtrer et trier les actifs
  const processedAssets = useMemo(() => {
    let filtered = assets;

    // Filtrage par texte
    if (filterText) {
      const searchTerm = filterText.toLowerCase();
      filtered = assets.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.assetType.name.toLowerCase().includes(searchTerm)
      );
    }

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.assetType.name.localeCompare(b.assetType.name);
          break;
        case 'value':
          const valueA = a.valuations?.[0]?.value || 0;
          const valueB = b.valuations?.[0]?.value || 0;
          comparison = valueA - valueB;
          break;
        case 'date':
          const dateA = new Date(a.valuations?.[0]?.valuationDate || 0).getTime();
          const dateB = new Date(b.valuations?.[0]?.valuationDate || 0).getTime();
          comparison = dateA - dateB;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [assets, filterText, sortBy, sortOrder]);

  // Utiliser la virtualisation
  const { visibleAssets, totalHeight, offsetY, setScrollTop: updateScrollTop, visibleRange } = 
    useVirtualizedAssets(processedAssets, itemHeight, containerHeight);

  // Gérer le scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    updateScrollTop(newScrollTop);
  };

  // Gérer la sélection d'actifs
  const handleAssetSelect = (assetId: string, selected: boolean) => {
    if (!onAssetSelect) return;

    const newSelection = selected
      ? [...selectedAssets, assetId]
      : selectedAssets.filter(id => id !== assetId);
    
    onAssetSelect(newSelection);
  };

  // Sélectionner/Désélectionner tout
  const handleSelectAll = () => {
    if (!onAssetSelect) return;

    const allVisible = visibleAssets.every(asset => selectedAssets.includes(asset.id));
    if (allVisible) {
      // Désélectionner tous les visibles
      const newSelection = selectedAssets.filter(id => 
        !visibleAssets.some(asset => asset.id === id)
      );
      onAssetSelect(newSelection);
    } else {
      // Sélectionner tous les visibles
      const visibleIds = visibleAssets.map(asset => asset.id);
      const newSelection = [...new Set([...selectedAssets, ...visibleIds])];
      onAssetSelect(newSelection);
    }
  };

  // Métriques de performance
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('VirtualizedAssetList stats', {
        totalAssets: processedAssets.length,
        visibleAssets: visibleAssets.length,
        visibleRange: `${visibleRange.startIndex}-${visibleRange.endIndex}`,
        performance: `${((visibleAssets.length / processedAssets.length) * 100).toFixed(1)}% rendered`
      }, 'VirtualizedAssetList');
    }
  }, [processedAssets.length, visibleAssets.length, visibleRange]);

  // Statistiques pour le header
  const selectionStats = {
    selected: selectedAssets.length,
    total: processedAssets.length,
    visible: visibleAssets.length
  };

  return (
    <div className={`virtualized-asset-list ${className}`}>
      {/* Header avec statistiques */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            {processedAssets.length} actif{processedAssets.length > 1 ? 's' : ''}
          </span>
          
          {filterText && (
            <span className="text-xs text-gray-500">
              (filtré{processedAssets.length !== assets.length ? ` sur ${assets.length}` : ''})
            </span>
          )}
          
          {showCheckboxes && selectionStats.selected > 0 && (
            <span className="text-xs text-blue-600 font-medium">
              {selectionStats.selected} sélectionné{selectionStats.selected > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {showCheckboxes && processedAssets.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {visibleAssets.every(asset => selectedAssets.includes(asset.id))
              ? 'Désélectionner tout'
              : 'Sélectionner tout'
            }
          </button>
        )}
      </div>

      {/* Liste virtualisée */}
      <div
        ref={containerRef}
        className="relative overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* Container virtuel avec la hauteur totale */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Éléments visibles avec offset */}
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleAssets.map((asset, index) => (
              <div
                key={asset.id}
                style={{ height: itemHeight }}
              >
                <AssetItem
                  asset={asset}
                  currency={currency}
                  isSelected={selectedAssets.includes(asset.id)}
                  onSelect={handleAssetSelect}
                  onClick={onAssetClick}
                  showCheckbox={showCheckboxes}
                  showOwnership={showOwnership}
                  showLastValuation={showLastValuation}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Message si aucun actif */}
        {processedAssets.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm">
                {filterText ? 'Aucun actif trouvé' : 'Aucun actif disponible'}
              </p>
              {filterText && (
                <p className="text-xs mt-1">
                  Essayez de modifier vos critères de recherche
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer avec informations de performance (dev uniquement) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500">
          Rendu: {visibleAssets.length}/{processedAssets.length} éléments 
          ({((visibleAssets.length / Math.max(processedAssets.length, 1)) * 100).toFixed(1)}%)
          • Plage: {visibleRange.startIndex}-{visibleRange.endIndex}
        </div>
      )}
    </div>
  );
};

// Hook pour la gestion des états de tri et filtrage
export function useAssetListControls(initialSortBy: string = 'name') {
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearSelection = () => {
    setSelectedAssets([]);
  };

  const selectAll = (assetIds: string[]) => {
    setSelectedAssets(assetIds);
  };

  return {
    sortBy,
    sortOrder,
    filterText,
    selectedAssets,
    setSortBy,
    setSortOrder,
    setFilterText,
    setSelectedAssets,
    handleSort,
    clearSelection,
    selectAll
  };
}

// Composant de contrôles pour la liste
export const AssetListControls = memo(({
  sortBy,
  sortOrder,
  filterText,
  onSortChange,
  onFilterChange,
  placeholder = "Rechercher des actifs..."
}: {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filterText: string;
  onSortChange: (field: string) => void;
  onFilterChange: (text: string) => void;
  placeholder?: string;
}) => {
  const sortFields = [
    { key: 'name', label: 'Nom' },
    { key: 'type', label: 'Type' },
    { key: 'value', label: 'Valeur' },
    { key: 'date', label: 'Date' }
  ];

  return (
    <div className="flex items-center space-x-4 p-3 bg-white border-b">
      <div className="flex-1">
        <input
          type="text"
          value={filterText}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">Trier par:</span>
        {sortFields.map(field => (
          <button
            key={field.key}
            onClick={() => onSortChange(field.key)}
            className={`px-2 py-1 text-xs rounded ${
              sortBy === field.key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {field.label}
            {sortBy === field.key && (
              <span className="ml-1">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

AssetListControls.displayName = 'AssetListControls';

export default VirtualizedAssetList; 