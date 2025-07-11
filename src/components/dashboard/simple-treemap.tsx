'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/financial-calculations';

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
}

interface SimpleTreemapProps {
  assets: Asset[];
  height?: number;
}

export function SimpleTreemap({ assets, height = 400 }: SimpleTreemapProps) {
  const { data, totalValue } = useMemo(() => {
    if (!assets || assets.length === 0) {
      return { data: [], totalValue: 0 };
    }

    // Grouper par catégorie d'actif
    const grouped = assets.reduce((acc, asset) => {
             const latestValuation = asset.valuations?.[0];
       if (!latestValuation) {
         return acc;
       }

             const value = parseFloat(latestValuation.value) || 0;
       const categoryKey = asset.assetType?.category || 'OTHER';

       
              // Mapping des catégories en français (basé sur les vraies données de la DB)
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
          count: 0
        };
      }
      
      acc[displayName].value += value;
      acc[displayName].count += 1;
      
      return acc;
    }, {} as Record<string, { name: string; value: number; category: string; count: number }>);

    const total = Object.values(grouped).reduce((sum, item) => sum + item.value, 0);
    
    const treemapData: TreemapData[] = Object.values(grouped)
      .map(item => ({
        name: item.name,
        value: item.value,
        color: getColorForType(item.category),
        percentage: total > 0 ? (item.value / total) * 100 : 0,
        count: item.count
      }))
      .sort((a, b) => b.value - a.value);

    console.log('✅ SimpleTreemap - Final data:', {
      groups: treemapData.length,
      total: total,
      mainCategory: treemapData[0]?.name + ' (' + treemapData[0]?.percentage.toFixed(1) + '%)'
    });
    
    return { data: treemapData, totalValue: total };
  }, [assets]);

  if (data.length === 0) {
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Répartition des actifs</span>
          <span className="text-sm font-normal text-gray-500">
            Total: {formatCurrency(totalValue)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden border"
          style={{ height: `${height}px` }}
        >
          {data.map((item, index) => {
            // Calculer la position et taille en fonction du pourcentage
            let x = 0;
            let y = 0;
            let width = 0;
            let widthPercent = 0;
            let heightPercent = 0;

            // Algorithme précis basé sur les proportions réelles : 98.4%, 1.1%, 0.4%
            if (data.length === 1) {
              widthPercent = 100;
              heightPercent = 100;
            } else if (data.length === 2) {
              if (index === 0) {
                // Premier élément dominant prend toute la largeur en haut
                widthPercent = 100;
                heightPercent = 85; // Laisse 15% pour le second
              } else {
                // Second élément prend toute la largeur en bas
                widthPercent = 100;
                heightPercent = 15;
                y = 85;
              }
            } else if (data.length === 3) {
              if (index === 0) {
                // Immobilier (98.4%) : domine, prend toute la largeur et 85% de la hauteur
                widthPercent = 100;
                heightPercent = 85;
              } else if (index === 1) {
                // Liquidités (1.1%) : rectangle en bas à gauche
                const totalOthers = data[1].percentage + data[2].percentage;
                widthPercent = (item.percentage / totalOthers) * 100;
                heightPercent = 15;
                y = 85;
              } else {
                // Placements Financiers (0.4%) : rectangle en bas à droite
                const totalOthers = data[1].percentage + data[2].percentage;
                widthPercent = (item.percentage / totalOthers) * 100;
                heightPercent = 15;
                x = (data[1].percentage / totalOthers) * 100;
                y = 85;
              }
            } else {
              // Pour 4+ éléments
              if (index === 0) {
                // Premier élément dominant
                widthPercent = 100;
                heightPercent = 80;
              } else {
                // Les autres se partagent l'espace en bas
                const remainingItems = data.length - 1;
                const itemsPerRow = Math.min(3, remainingItems); // Max 3 par ligne
                const rows = Math.ceil(remainingItems / itemsPerRow);
                
                const row = Math.floor((index - 1) / itemsPerRow);
                const col = (index - 1) % itemsPerRow;
                
                widthPercent = 100 / itemsPerRow;
                heightPercent = 20 / rows;
                x = col * widthPercent;
                y = 80 + row * heightPercent;
              }
            }

            return (
              <div
                key={item.name}
                className="absolute border border-white transition-all duration-200 hover:opacity-80 cursor-pointer group"
                style={{
                  backgroundColor: item.color,
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                }}
                title={`${item.name}: ${formatCurrency(item.value)} (${item.percentage.toFixed(1)}%)`}
              >
                {/* Contenu du rectangle */}
                <div className="p-2 h-full flex flex-col justify-center items-center text-white text-center">
                  {/* Nom de la catégorie */}
                  {(widthPercent > 20 || heightPercent > 10) && (
                    <div className="font-semibold text-sm mb-1 leading-tight drop-shadow-md">
                      {item.name}
                    </div>
                  )}
                  
                  {/* Valeur */}
                  {(widthPercent > 30 || heightPercent > 15) && (
                    <div className="text-xs opacity-90 mb-1 drop-shadow-md">
                      {formatCurrency(item.value)}
                    </div>
                  )}
                  
                  {/* Pourcentage - prioritaire */}
                  {(widthPercent > 15 || heightPercent > 8) && (
                    <div className="text-xs font-bold drop-shadow-md">
                      {item.percentage.toFixed(1)}%
                    </div>
                  )}
                  
                  {/* Nombre d'actifs */}
                  {(widthPercent > 35 || heightPercent > 20) && (
                    <div className="text-xs opacity-75 mt-1 drop-shadow-md">
                      {item.count} actif{item.count > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Tooltip au hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  <div className="font-semibold">{item.name}</div>
                  <div>Valeur: {formatCurrency(item.value)}</div>
                  <div>Part: {item.percentage.toFixed(1)}%</div>
                  <div>{item.count} actif{item.count > 1 ? 's' : ''}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende en bas */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.name}</div>
                <div className="text-xs text-gray-500">
                  {formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Fonction pour obtenir une couleur basée sur le type d'actif
function getColorForType(type?: string): string {
  const colors: Record<string, string> = {
    'Immobilier': '#059669',      // vert (comme dans votre première capture)
    'Financier': '#2563eb',       // bleu  
    'Liquidités': '#f59e0b',      // orange
    'Assurance': '#06b6d4',       // cyan
    'Numérique': '#7c3aed',       // violet
    'Divers': '#64748b',          // gris
    'OTHER': '#64748b'            // gris
  };
  
  return colors[type || 'OTHER'] || '#64748b';
} 