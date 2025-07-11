'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown';
import { 
  RotateCcw, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Settings,
  X,
  Search,
  TrendingUp,
  Users,
  Calendar,
  Euro
} from 'lucide-react';

interface EnhancedTreemapFiltersData {
  groupBy: 'type' | 'entity' | 'category';
  period: 'all' | '1M' | '3M' | '6M' | '1Y';
  entities: string[];
  minValue: number;
  maxValue?: number;
  assetTypes: string[];
  sortBy: 'value' | 'name' | 'count';
  sortOrder: 'asc' | 'desc';
}

interface EnhancedTreemapFiltersProps {
  filters: EnhancedTreemapFiltersData;
  onFiltersChange: (filters: EnhancedTreemapFiltersData) => void;
  availableEntities?: Array<{ id: string; name: string; type: string }>;
  availableAssetTypes?: Array<{ id: string; name: string; category: string }>;
  totalAssets?: number;
  totalValue?: number;
  className?: string;
}

const defaultFilters: EnhancedTreemapFiltersData = {
  groupBy: 'category',
  period: 'all',
  entities: [],
  minValue: 0,
  assetTypes: [],
  sortBy: 'value',
  sortOrder: 'desc'
};

export function EnhancedTreemapFilters({ 
  filters, 
  onFiltersChange, 
  availableEntities = [], 
  availableAssetTypes = [],
  totalAssets = 0,
  totalValue = 0,
  className = ''
}: EnhancedTreemapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localMinValue, setLocalMinValue] = useState(filters.minValue.toString());
  const [localMaxValue, setLocalMaxValue] = useState(filters.maxValue?.toString() || '');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounce pour les valeurs min/max
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeout = setTimeout(() => {
      const minVal = parseFloat(localMinValue) || 0;
      const maxVal = localMaxValue ? parseFloat(localMaxValue) : undefined;
      
      if (minVal !== filters.minValue || maxVal !== filters.maxValue) {
        onFiltersChange({
          ...filters,
          minValue: minVal,
          maxValue: maxVal
        });
      }
    }, 500);
    
    setDebounceTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [localMinValue, localMaxValue, filters, onFiltersChange]);

  const handleFilterChange = (key: keyof EnhancedTreemapFiltersData, value: string | string[] | number) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleResetFilters = () => {
    setLocalMinValue('0');
    setLocalMaxValue('');
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.groupBy !== 'category' || 
    filters.period !== 'all' || 
    filters.entities.length > 0 || 
    filters.minValue > 0 || 
    filters.maxValue !== undefined ||
    filters.assetTypes.length > 0 ||
    filters.sortBy !== 'value' ||
    filters.sortOrder !== 'desc';

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.groupBy !== 'category') count++;
    if (filters.period !== 'all') count++;
    if (filters.entities.length > 0) count++;
    if (filters.minValue > 0) count++;
    if (filters.maxValue !== undefined) count++;
    if (filters.assetTypes.length > 0) count++;
    if (filters.sortBy !== 'value' || filters.sortOrder !== 'desc') count++;
    return count;
  };

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

  const removeFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'groupBy':
        handleFilterChange('groupBy', 'category');
        break;
      case 'period':
        handleFilterChange('period', 'all');
        break;
      case 'entities':
        if (value) {
          handleFilterChange('entities', filters.entities.filter(id => id !== value));
        } else {
          handleFilterChange('entities', []);
        }
        break;
      case 'assetTypes':
        if (value) {
          handleFilterChange('assetTypes', filters.assetTypes.filter(id => id !== value));
        } else {
          handleFilterChange('assetTypes', []);
        }
        break;
      case 'minValue':
        setLocalMinValue('0');
        handleFilterChange('minValue', 0);
        break;
      case 'maxValue':
        setLocalMaxValue('');
        handleFilterChange('maxValue', undefined);
        break;
      case 'sort':
        handleFilterChange('sortBy', 'value');
        handleFilterChange('sortOrder', 'desc');
        break;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header élégant */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtres et Options</h3>
            </div>
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getActiveFiltersCount()} filtre{getActiveFiltersCount() > 1 ? 's' : ''} actif{getActiveFiltersCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Statistiques rapides */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{totalAssets} actifs</span>
              </div>
              <div className="flex items-center space-x-1">
                <Euro className="h-4 w-4" />
                <span>{totalValue?.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Réinitialiser</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1">
                {isExpanded ? 'Masquer' : 'Afficher'}
              </span>
            </Button>
          </div>
        </div>

        {/* Filtres actifs en badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.groupBy !== 'category' && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>Groupé par {filters.groupBy === 'type' ? 'type' : 'entité'}</span>
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('groupBy')}
                />
              </Badge>
            )}
            
            {filters.period !== 'all' && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{filters.period}</span>
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('period')}
                />
              </Badge>
            )}
            
            {filters.entities.length > 0 && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{filters.entities.length} entité{filters.entities.length > 1 ? 's' : ''}</span>
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('entities')}
                />
              </Badge>
            )}
            
            {filters.assetTypes.length > 0 && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>{filters.assetTypes.length} type{filters.assetTypes.length > 1 ? 's' : ''}</span>
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('assetTypes')}
                />
              </Badge>
            )}
            
            {filters.minValue > 0 && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>Min: {filters.minValue}€</span>
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('minValue')}
                />
              </Badge>
            )}
            
            {filters.maxValue !== undefined && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>Max: {filters.maxValue}€</span>
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('maxValue')}
                />
              </Badge>
            )}
            
            {(filters.sortBy !== 'value' || filters.sortOrder !== 'desc') && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>Tri: {filters.sortBy} {filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('sort')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Contenu des filtres */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Groupement */}
            <div className="space-y-2">
              <Label htmlFor="groupBy" className="text-sm font-medium flex items-center space-x-1">
                <Filter className="h-4 w-4" />
                <span>Grouper par</span>
              </Label>
              <Select
                value={filters.groupBy}
                onValueChange={(value) => handleFilterChange('groupBy', value as EnhancedTreemapFiltersData['groupBy'])}
              >
                <SelectTrigger id="groupBy">
                  <SelectValue placeholder="Choisir le groupement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Catégorie</SelectItem>
                  <SelectItem value="type">Type d&apos;actif</SelectItem>
                  <SelectItem value="entity">Entité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Période */}
            <div className="space-y-2">
              <Label htmlFor="period" className="text-sm font-medium flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Période</span>
              </Label>
              <Select
                value={filters.period}
                onValueChange={(value) => handleFilterChange('period', value as EnhancedTreemapFiltersData['period'])}
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

            {/* Tri */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>Tri</span>
              </Label>
              <div className="flex space-x-2">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value as EnhancedTreemapFiltersData['sortBy'])}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Valeur</SelectItem>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="count">Nombre</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3"
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Valeurs min/max */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center space-x-1">
                <Euro className="h-4 w-4" />
                <span>Valeurs (€)</span>
              </Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={localMinValue}
                  onChange={(e) => setLocalMinValue(e.target.value)}
                  placeholder="Min"
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={localMaxValue}
                  onChange={(e) => setLocalMaxValue(e.target.value)}
                  placeholder="Max"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Filtres avancés */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entités */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Entités</span>
                  {filters.entities.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {filters.entities.length}
                    </Badge>
                  )}
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
                <Label className="text-sm font-medium flex items-center space-x-1">
                  <Search className="h-4 w-4" />
                  <span>Types d&apos;actifs</span>
                  {filters.assetTypes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {filters.assetTypes.length}
                    </Badge>
                  )}
                </Label>
                <MultiSelectDropdown
                  options={assetTypeOptions}
                  selectedValues={filters.assetTypes}
                  onSelectionChange={(value: string[]) => handleFilterChange('assetTypes', value)}
                  placeholder="Tous les types"
                  searchPlaceholder="Rechercher un type..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { EnhancedTreemapFiltersData };
export { defaultFilters }; 