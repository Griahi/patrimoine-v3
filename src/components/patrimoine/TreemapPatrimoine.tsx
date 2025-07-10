import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  TreeMap, 
  PieChart, 
  RefreshCw, 
  Settings, 
  Eye,
  Info
} from 'lucide-react';
import { 
  TreemapData, 
  CategoryData, 
  convertToTreemapData, 
  formatTreemapValue, 
  formatPercentage,
  calculateDiversificationIndex 
} from '@/utils/treemap-calculations';

interface TreemapPatrimoineProps {
  categories: CategoryData[];
  title?: string;
  height?: number;
  loading?: boolean;
  onCategoryClick?: (category: CategoryData) => void;
  onRefresh?: () => void;
}

export function TreemapPatrimoine({ 
  categories, 
  title = "Répartition du Patrimoine",
  height = 400,
  loading = false,
  onCategoryClick,
  onRefresh
}: TreemapPatrimoineProps) {
  const [viewMode, setViewMode] = useState<'treemap' | 'pie'>('treemap');
  const [showDetails, setShowDetails] = useState(false);
  const [hasTreemapError, setHasTreemapError] = useState(false);
  
  // Données simplifiées pour le treemap
  const treemapData = useMemo(() => {
    if (categories.length === 0) {
      return {
        name: 'Patrimoine',
        children: [
          { name: 'Aucune donnée', value: 1 }
        ]
      };
    }
    
    return {
      name: 'Patrimoine',
      children: categories.map(cat => ({
        name: cat.nom,
        value: cat.montant,
        id: cat.id
      }))
    };
  }, [categories]);
  
  const diversificationIndex = useMemo(() => calculateDiversificationIndex(categories), [categories]);
  const totalValue = useMemo(() => categories.reduce((sum, cat) => sum + cat.montant, 0), [categories]);

  const handleNodeClick = (node: any) => {
    if (onCategoryClick && node.name) {
      const category = categories.find(cat => cat.nom === node.name);
      if (category) {
        onCategoryClick(category);
      }
    }
  };



  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TreeMap className="w-5 h-5" />
              <span>{title}</span>
            </CardTitle>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-lg animate-pulse" style={{ height }}>
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TreeMap className="w-5 h-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Eye className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Aucune donnée disponible</p>
            <p className="text-sm">Ajoutez des actifs pour voir la répartition</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TreeMap className="w-5 h-5" />
            <span>{title}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {categories.length} catégorie{categories.length > 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Diversification: {diversificationIndex}%
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="p-2"
            >
              <Info className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHasTreemapError(!hasTreemapError)}
              className="p-2"
            >
              {hasTreemapError ? <TreeMap className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="p-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Informations détaillées */}
        {showDetails && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-900">Valeur totale:</span>
                <p className="text-blue-800">{formatTreemapValue(totalValue)}</p>
              </div>
              <div>
                <span className="font-medium text-blue-900">Nombre d'actifs:</span>
                <p className="text-blue-800">{categories.reduce((sum, cat) => sum + cat.nombreActifs, 0)}</p>
              </div>
              <div>
                <span className="font-medium text-blue-900">Indice de diversification:</span>
                <p className="text-blue-800">{diversificationIndex}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Treemap */}
        <div className="w-full" style={{ height }}>
          {hasTreemapError ? (
            /* Fallback simple si le treemap ne fonctionne pas */
            <div className="grid grid-cols-2 gap-4 h-full p-4">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="flex flex-col justify-center items-center p-4 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ 
                    borderColor: category.couleur,
                    backgroundColor: `${category.couleur}15`
                  }}
                  onClick={() => onCategoryClick && onCategoryClick(category)}
                >
                  <div 
                    className="w-8 h-8 rounded-full mb-2"
                    style={{ backgroundColor: category.couleur }}
                  />
                  <h3 className="font-medium text-center">{category.nom}</h3>
                  <p className="text-sm text-gray-600">{formatTreemapValue(category.montant)}</p>
                  <p className="text-xs text-gray-500">{formatPercentage(category.pourcentage)}</p>
                </div>
              ))}
            </div>
          ) : (
            <ResponsiveTreeMap
              data={treemapData}
              identity="name"
              value="value"
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              labelSkipSize={12}
              colors={{ scheme: 'category10' }}
              onClick={handleNodeClick}
            />
          )}
        </div>

        {/* Légende en bas */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Cliquez sur une catégorie pour plus de détails
        </div>
      </CardContent>
    </Card>
  );
} 