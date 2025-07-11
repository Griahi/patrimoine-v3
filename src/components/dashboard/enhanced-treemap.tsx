'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/financial-calculations';
import { 
  ZoomIn, 
  ArrowLeft, 
  Camera,
  FileSpreadsheet
} from 'lucide-react';

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

interface TreemapData {
  name: string;
  value: number;
  color: string;
  percentage: number;
  count: number;
  assets?: Asset[];
  category?: string;
  subcategories?: TreemapData[];
}

interface EnhancedTreemapProps {
  assets: Asset[];
  height?: number;
  responsive?: boolean;
  className?: string;
}

// Couleurs améliorées avec plus de contraste et de lisibilité
const ENHANCED_COLORS = {
  'Immobilier': {
    primary: '#059669',
    light: '#6ee7b7',
    dark: '#047857',
    text: '#ffffff'
  },
  'Financier': {
    primary: '#2563eb',
    light: '#93c5fd',
    dark: '#1d4ed8',
    text: '#ffffff'
  },
  'Liquidités': {
    primary: '#f59e0b',
    light: '#fcd34d',
    dark: '#d97706',
    text: '#ffffff'
  },
  'Assurance': {
    primary: '#06b6d4',
    light: '#67e8f9',
    dark: '#0891b2',
    text: '#ffffff'
  },
  'Numérique': {
    primary: '#7c3aed',
    light: '#c4b5fd',
    dark: '#6d28d9',
    text: '#ffffff'
  },
  'Divers': {
    primary: '#64748b',
    light: '#cbd5e1',
    dark: '#475569',
    text: '#ffffff'
  },
  'OTHER': {
    primary: '#64748b',
    light: '#cbd5e1',
    dark: '#475569',
    text: '#ffffff'
  }
};

// Fonctions utilitaires de groupement
function groupByCategory(assets: Asset[]) {
  return assets.reduce((acc, asset) => {
    const latestValuation = asset.valuations?.[0];
    if (!latestValuation) return acc;

    const value = parseFloat(latestValuation.value) || 0;
    const categoryKey = asset.assetType?.category || 'OTHER';
    
    const categoryNames: Record<string, string> = {
      'Immobilier': 'Immobilier',
      'Financier': 'Placements Financiers',
      'Liquidités': 'Liquidités',
      'Assurance': 'Assurance Vie',
      'Numérique': 'Crypto-monnaies',
      'Divers': 'Autres',
      'OTHER': 'Autres'
    };
    
    const displayName = categoryNames[categoryKey] || 'Autres';
    
    if (!acc[displayName]) {
      acc[displayName] = {
        name: displayName,
        value: 0,
        category: categoryKey,
        count: 0,
        assets: []
      };
    }
    
    acc[displayName].value += value;
    acc[displayName].count += 1;
    acc[displayName].assets.push(asset);
    
    return acc;
  }, {} as Record<string, {
    name: string;
    value: number;
    category: string;
    count: number;
    assets: Asset[];
  }>);
}

function groupByAssetType(assets: Asset[]) {
  return assets.reduce((acc, asset) => {
    const latestValuation = asset.valuations?.[0];
    if (!latestValuation) return acc;

    const value = parseFloat(latestValuation.value) || 0;
    const typeName = asset.assetType?.name || 'Autre';
    
    if (!acc[typeName]) {
      acc[typeName] = {
        name: typeName,
        value: 0,
        category: asset.assetType?.category || 'OTHER',
        count: 0,
        assets: []
      };
    }
    
    acc[typeName].value += value;
    acc[typeName].count += 1;
    acc[typeName].assets.push(asset);
    
    return acc;
  }, {} as Record<string, {
    name: string;
    value: number;
    category: string;
    count: number;
    assets: Asset[];
  }>);
}

function groupByIndividualAssets(assets: Asset[]) {
  return assets.reduce((acc, asset) => {
    const latestValuation = asset.valuations?.[0];
    if (!latestValuation) return acc;

    const value = parseFloat(latestValuation.value) || 0;
    const assetName = asset.name || `Actif ${asset.id}`;
    
    // Utiliser l'ID pour garantir l'unicité
    const uniqueKey = `${asset.id}-${assetName}`;
    
    acc[uniqueKey] = {
      name: assetName,
      value: value,
      category: asset.assetType?.category || 'OTHER',
      count: 1,
      assets: [asset]
    };
    
    return acc;
  }, {} as Record<string, {
    name: string;
    value: number;
    category: string;
    count: number;
    assets: Asset[];
  }>);
}

export function EnhancedTreemap({ 
  assets, 
  height: fixedHeight,
  responsive = true,
  className = '' 
}: EnhancedTreemapProps) {
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const treemapRef = useRef<HTMLDivElement>(null);

  // Gérer les dimensions responsives
  useEffect(() => {
    if (!responsive) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const calculatedHeight = fixedHeight || Math.max(400, Math.min(600, rect.width * 0.6));
        setDimensions({
          width: rect.width,
          height: calculatedHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [responsive, fixedHeight]);

  const { data, totalValue, currentLevel } = useMemo(() => {
    if (!assets || assets.length === 0) {
      return { data: [], totalValue: 0, currentLevel: 'root' };
    }

    // Déterminer le niveau actuel basé sur le drill path
    const isAtRoot = drillPath.length === 0;
    const currentCategory = drillPath[0];

    let filteredAssets = assets;
    let levelName = 'root';

    if (!isAtRoot && currentCategory) {
      // Filtrer les actifs pour la catégorie sélectionnée
      filteredAssets = assets.filter(asset => {
        const categoryKey = asset.assetType?.category || 'OTHER';
        const categoryNames: Record<string, string> = {
          'Immobilier': 'Immobilier',
          'Financier': 'Placements Financiers',
          'Liquidités': 'Liquidités',
          'Assurance': 'Assurance Vie',
          'Numérique': 'Crypto-monnaies',
          'Divers': 'Autres',
          'OTHER': 'Autres'
        };
        return categoryNames[categoryKey] === currentCategory;
      });
      levelName = currentCategory;
    }

    // Grouper les données selon le niveau
    const grouped = isAtRoot ? 
      groupByCategory(filteredAssets) : 
      groupByIndividualAssets(filteredAssets);

    const total = Object.values(grouped).reduce((sum, item) => sum + item.value, 0);
    
    const treemapData: TreemapData[] = Object.values(grouped)
      .map(item => ({
        name: item.name,
        value: item.value,
        color: getEnhancedColor(item.category || item.name, 'primary'),
        percentage: total > 0 ? (item.value / total) * 100 : 0,
        count: item.count,
        assets: item.assets,
        category: item.category
      }))
      .sort((a, b) => b.value - a.value);

    return { data: treemapData, totalValue: total, currentLevel: levelName };
  }, [assets, drillPath]);

  // Calculer les dimensions et positions pour le treemap
  const treemapItems = useMemo(() => {
    if (data.length === 0) return [];

    // Extraire tous les pourcentages pour l'algorithme
    const allPercentages = data.map(item => item.percentage);

    return data.map((item, index) => {
      const { x, y, width, height } = calculateTreemapPosition(
        item.percentage,
        index,
        data.length,
        dimensions.width || 800,
        dimensions.height || 400,
        allPercentages
      );

      return {
        ...item,
        x,
        y,
        width,
        height,
        fontSize: calculateFontSize(width, height),
        textColor: getEnhancedColor(item.category || item.name, 'text')
      };
    });
  }, [data, dimensions]);

  // Fonctions d'export
  const exportAsImage = async (format: 'png' | 'svg') => {
    if (!treemapRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // Dessiner le treemap sur le canvas
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const item of treemapItems) {
        // Rectangle
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x, item.y, item.width, item.height);

        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x, item.y, item.width, item.height);

        // Texte
        ctx.fillStyle = item.textColor;
        ctx.font = `${item.fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;
        
        ctx.fillText(item.name, centerX, centerY - 10);
        ctx.fillText(`${item.percentage.toFixed(1)}%`, centerX, centerY + 10);
      }

      // Télécharger
      const link = document.createElement('a');
      link.download = `treemap-${currentLevel}.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const exportAsCSV = () => {
    const csvData = [
      ['Nom', 'Valeur', 'Pourcentage', 'Nombre d\'actifs'],
      ...data.map(item => [
        item.name,
        item.value.toString(),
        item.percentage.toFixed(2),
        item.count.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `treemap-${currentLevel}.csv`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Gestion du drill-down
  const handleItemClick = (item: TreemapData) => {
    if (drillPath.length === 0) {
      // Drill down dans une catégorie (même avec un seul actif)
      setDrillPath([item.name]);
    }
  };

  const handleBackClick = () => {
    setDrillPath(prev => prev.slice(0, -1));
  };

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Répartition des actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">📊</div>
              <p>Aucun actif à afficher</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {drillPath.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
                className="flex items-center space-x-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Button>
            )}
            <CardTitle className="flex items-center space-x-2">
              <span>
                {drillPath.length > 0 ? `${currentLevel} - Détail` : 'Répartition du patrimoine'}
              </span>
              <span className="text-sm font-normal text-gray-500">
                Total: {formatCurrency(totalValue)}
              </span>
            </CardTitle>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAsImage('png')}
              className="flex items-center space-x-1"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">PNG</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAsCSV()}
              className="flex items-center space-x-1"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full">
          <div 
            ref={treemapRef}
            className="relative w-full bg-gray-100 rounded-lg overflow-hidden border"
            style={{ 
              height: `${dimensions.height || fixedHeight || 400}px`,
              minHeight: '300px'
            }}
          >
            {treemapItems.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className={`
                  absolute border-2 border-white cursor-pointer group
                  transition-all duration-300 ease-in-out
                  ${hoveredItem === item.name ? 'opacity-90 scale-[1.02] z-10' : 'opacity-100'}
                  ${drillPath.length === 0 ? 'hover:shadow-lg' : ''}
                `}
                style={{
                  backgroundColor: item.color,
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width}px`,
                  height: `${item.height}px`,
                  boxShadow: hoveredItem === item.name ? 
                    `0 0 20px ${getEnhancedColor(item.category || item.name, 'light')}` : 
                    'none'
                }}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Contenu du rectangle */}
                <div 
                  className="p-2 h-full flex flex-col justify-center items-center text-center"
                  style={{ color: item.textColor }}
                >
                  {/* Nom de la catégorie */}
                  {item.width > 80 && item.height > 40 && (
                    <div 
                      className="font-semibold mb-1 leading-tight drop-shadow-md"
                      style={{ fontSize: `${item.fontSize}px` }}
                    >
                      {item.name}
                    </div>
                  )}
                  
                  {/* Valeur */}
                  {item.width > 120 && item.height > 60 && (
                    <div 
                      className="opacity-90 mb-1 drop-shadow-md"
                      style={{ fontSize: `${item.fontSize * 0.8}px` }}
                    >
                      {formatCurrency(item.value)}
                    </div>
                  )}
                  
                  {/* Pourcentage */}
                  {item.width > 60 && item.height > 30 && (
                    <div 
                      className="font-bold drop-shadow-md"
                      style={{ fontSize: `${item.fontSize * 0.9}px` }}
                    >
                      {item.percentage.toFixed(1)}%
                    </div>
                  )}
                  
                  {/* Nombre d'actifs */}
                  {item.width > 140 && item.height > 80 && (
                    <div 
                      className="opacity-75 mt-1 drop-shadow-md"
                      style={{ fontSize: `${item.fontSize * 0.7}px` }}
                    >
                      {item.count} actif{item.count > 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Indicateur de drill-down */}
                  {drillPath.length === 0 && (
                    <div className="absolute top-2 right-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Tooltip amélioré */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 p-3 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  <div className="font-semibold mb-1">{item.name}</div>
                  <div className="text-xs space-y-1">
                    <div>💰 Valeur: {formatCurrency(item.value)}</div>
                    <div>📊 Part: {item.percentage.toFixed(2)}%</div>
                    <div>🏷️ {item.count} actif{item.count > 1 ? 's' : ''}</div>
                    {drillPath.length === 0 && (
                      <div className="text-blue-300">🔍 Cliquez pour explorer</div>
                    )}
                  </div>
                  {/* Flèche du tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Légende améliorée */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {drillPath.length === 0 ? 'Détail des catégories' : `Actifs - ${currentLevel}`}
            </h3>
            <div className="text-sm text-gray-500">
              Total: {formatCurrency(totalValue)} · {data.length} {drillPath.length === 0 ? 'catégorie' : 'actif'}{data.length > 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-5 h-5 rounded-full shadow-sm border border-gray-200"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="font-semibold text-gray-900 text-base">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.count} actif{item.count > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">{formatCurrency(item.value)}</div>
                    <div className="text-sm text-gray-600">{item.percentage.toFixed(1)}% du total</div>
                  </div>
                  
                  {drillPath.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleItemClick(item)}
                      className="flex items-center space-x-2 h-8 px-3"
                    >
                      <ZoomIn className="h-3 w-3" />
                      <span className="text-xs">Détailler</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Résumé rapide */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">Résumé</span>
            </div>
            <div className="text-xs text-blue-800 space-y-1">
              <div>• Patrimoine total: {formatCurrency(totalValue)}</div>
              <div>• Répartition sur {data.length} catégorie{data.length > 1 ? 's' : ''}</div>
              <div>• Catégorie principale: {data[0]?.name} ({data[0]?.percentage.toFixed(1)}%)</div>
              {drillPath.length === 0 && (
                <div>• Cliquez sur &quot;Détailler&quot; pour explorer une catégorie</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Fonctions utilitaires
function calculateTreemapPosition(
  percentage: number,
  index: number,
  totalItems: number,
  containerWidth: number,
  containerHeight: number,
  allPercentages: number[]
) {
  // Algorithme de placement basé sur les proportions réelles
  if (totalItems === 1) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  // Récupérer le pourcentage du premier élément (le plus grand)
  const firstItemPercentage = allPercentages[0];

  // Premier élément - calculer sa taille selon son pourcentage
  if (index === 0) {
    if (percentage > 95) {
      return {
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight * 0.95  // 95% de la hauteur
      };
    } else if (percentage > 80) {
      return {
        x: 0,
        y: 0, 
        width: containerWidth,
        height: containerHeight * 0.9  // 90% de la hauteur
      };
    } else if (percentage > 50) {
      return {
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight * 0.8  // 80% de la hauteur
      };
    } else {
      return {
        x: 0,
        y: 0,
        width: containerWidth * 0.7,
        height: containerHeight * 0.7
      };
    }
  }

  // Éléments suivants - calculer l'espace restant en fonction du premier élément
  let remainingHeight;
  if (firstItemPercentage > 95) {
    remainingHeight = containerHeight * 0.05; // 5% restant
  } else if (firstItemPercentage > 80) {
    remainingHeight = containerHeight * 0.1; // 10% restant
  } else if (firstItemPercentage > 50) {
    remainingHeight = containerHeight * 0.2; // 20% restant
  } else {
    remainingHeight = containerHeight * 0.3; // 30% restant
  }
  
  const remainingItems = totalItems - 1;
  const itemWidth = containerWidth / remainingItems;

  return {
    x: (index - 1) * itemWidth,
    y: containerHeight - remainingHeight,
    width: itemWidth,
    height: remainingHeight
  };
}

function calculateFontSize(width: number, height: number): number {
  const area = width * height;
  if (area < 5000) return 10;
  if (area < 10000) return 12;
  if (area < 20000) return 14;
  if (area < 40000) return 16;
  return 18;
}

function getEnhancedColor(category: string, type: 'primary' | 'light' | 'dark' | 'text'): string {
  const colors = ENHANCED_COLORS[category as keyof typeof ENHANCED_COLORS] || ENHANCED_COLORS['OTHER'];
  return colors[type];
} 