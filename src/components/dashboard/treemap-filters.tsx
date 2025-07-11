'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown';
import { RotateCcw, Filter, ChevronDown } from 'lucide-react';

interface TreemapFiltersData {
  groupBy: 'type' | 'entity' | 'category';
  period: 'all' | '1M' | '3M' | '6M' | '1Y';
  entities: string[];
  minValue: number;
  assetTypes: string[];
}

interface TreemapFiltersProps {
  filters: TreemapFiltersData;
  onFiltersChange: (filters: TreemapFiltersData) => void;
  availableEntities?: Array<{ id: string; name: string; type: string }>;
  availableAssetTypes?: Array<{ id: string; name: string; category: string }>;
  isCollapsed?: boolean;
}

const defaultFilters: TreemapFiltersData = {
  groupBy: 'type',
  period: 'all',
  entities: [],
  minValue: 0,
  assetTypes: []
};

export function TreemapFilters({ 
  filters, 
  onFiltersChange, 
  availableEntities = [], 
  availableAssetTypes = [],
  isCollapsed = false 
}: TreemapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [localMinValue, setLocalMinValue] = useState(filters.minValue.toString());
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounce pour le montant minimum
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeout = setTimeout(() => {
      const value = parseFloat(localMinValue) || 0;
      if (value !== filters.minValue) {
        onFiltersChange({
          ...filters,
          minValue: value
        });
      }
    }, 500);
    
    setDebounceTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [localMinValue, filters.minValue]); // Ajout de filters.minValue pour éviter les warnings

  const handleFilterChange = (key: keyof TreemapFiltersData, value: string | string[] | number) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleResetFilters = () => {
    setLocalMinValue('0');
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.groupBy !== 'type' || 
    filters.period !== 'all' || 
    filters.entities.length > 0 || 
    filters.minValue > 0 || 
    filters.assetTypes.length > 0;

  const entityOptions = availableEntities.map(entity => ({
    id: entity.id,
    value: entity.id,
    label: `${entity.name} (${entity.type === 'INDIVIDUAL' ? 'Personne' : 'Entité juridique'})`,
    type: entity.type
  }));

  const assetTypeOptions = availableAssetTypes.map(assetType => ({
    id: assetType.id,
    value: assetType.id,
    label: assetType.name,
    type: assetType.category
  }));

  return (
    <div className="space-y-4">
      {/* Header avec toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Label className="text-sm font-medium">Filtres</Label>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {[
                filters.entities.length > 0 && `${filters.entities.length} entité${filters.entities.length > 1 ? 's' : ''}`,
                filters.assetTypes.length > 0 && `${filters.assetTypes.length} type${filters.assetTypes.length > 1 ? 's' : ''}`,
                filters.minValue > 0 && `Min: ${filters.minValue}€`,
                filters.period !== 'all' && filters.period,
                filters.groupBy !== 'type' && `Groupé par ${filters.groupBy}`
              ].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Contenu des filtres */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          {/* Grouper par */}
          <div className="space-y-2">
            <Label htmlFor="groupBy" className="text-sm font-medium">
              Grouper par
            </Label>
            <Select
              value={filters.groupBy}
              onValueChange={(value) => handleFilterChange('groupBy', value as TreemapFiltersData['groupBy'])}
            >
              <SelectTrigger id="groupBy">
                <SelectValue placeholder="Choisir le groupement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="type">Type d&apos;actif</SelectItem>
                <SelectItem value="entity">Entité</SelectItem>
                <SelectItem value="category">Catégorie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Période */}
          <div className="space-y-2">
            <Label htmlFor="period" className="text-sm font-medium">
              Période
            </Label>
            <Select
              value={filters.period}
              onValueChange={(value) => handleFilterChange('period', value as TreemapFiltersData['period'])}
            >
              <SelectTrigger id="period">
                <SelectValue placeholder="Toutes les périodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="1M">Dernier mois</SelectItem>
                <SelectItem value="3M">3 derniers mois</SelectItem>
                <SelectItem value="6M">6 derniers mois</SelectItem>
                <SelectItem value="1Y">Dernière année</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entités */}
          <div className="space-y-2">
            <Label htmlFor="entities" className="text-sm font-medium">
              Entités
            </Label>
            <MultiSelectDropdown
              options={entityOptions}
              selectedValues={filters.entities}
              onSelectionChange={(value: string[]) => handleFilterChange('entities', value)}
              placeholder="Toutes les entités"
              searchPlaceholder="Rechercher une entité..."
            />
          </div>

          {/* Types d'actifs */}
          <div className="space-y-2">
            <Label htmlFor="assetTypes" className="text-sm font-medium">
              Types d&apos;actifs
            </Label>
            <MultiSelectDropdown
              options={assetTypeOptions}
              selectedValues={filters.assetTypes}
              onSelectionChange={(value: string[]) => handleFilterChange('assetTypes', value)}
              placeholder="Tous les types"
              searchPlaceholder="Rechercher un type..."
            />
          </div>

          {/* Valeur minimum */}
          <div className="space-y-2">
            <Label htmlFor="minValue" className="text-sm font-medium">
              Valeur minimum (€)
            </Label>
            <Input
              id="minValue"
              type="number"
              min="0"
              step="100"
              value={localMinValue}
              onChange={(e) => setLocalMinValue(e.target.value)}
              placeholder="0"
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export type { TreemapFiltersData };
export { defaultFilters }; 