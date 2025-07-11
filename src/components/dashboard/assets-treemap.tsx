'use client';

import { useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
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

// TreemapData interface - unused but kept for future use
// interface TreemapData {
//   name: string;
//   value: number;
//   color?: string;
//   children?: TreemapData[];
// }



interface AssetsTreemapProps {
  assets: Asset[];
  height?: number;
}

export function AssetsTreemap({ 
  assets, 
  height = 400 
}: AssetsTreemapProps) {
  const data = useMemo(() => {
    console.log('🔍 AssetsTreemap - Processing assets:', assets?.length || 0);
    
    if (!assets || assets.length === 0) {
      console.log('❌ AssetsTreemap - No assets found');
      return { name: 'Patrimoine', children: [] };
    }

    // Grouper par catégorie d'actif (plus général que par nom)
    const grouped = assets.reduce((acc, asset) => {
      const latestValuation = asset.valuations?.[0];
      if (!latestValuation) {
        console.log('❌ Asset without valuation:', asset.name);
        return acc;
      }

      const value = latestValuation.value || 0;
      const categoryKey = asset.assetType?.category || 'OTHER';
      
      // Mapping des catégories en français
      const categoryNames: Record<string, string> = {
        'REAL_ESTATE': 'Immobilier',
        'STOCK': 'Placements Financiers',
        'INVESTMENT_FUND': 'Placements Financiers',
        'BANK_ACCOUNT': 'Liquidités',
        'CRYPTOCURRENCY': 'Crypto-monnaies',
        'LIFE_INSURANCE': 'Assurance Vie',
        'PRECIOUS_METALS': 'Métaux Précieux',
        'VALUABLE_OBJECTS': 'Objets de Valeur',
        'VEHICLES': 'Véhicules',
        'INTER_ENTITY_LOAN': 'Prêts Inter-Entités',
        'OTHER': 'Autres'
      };
      
      const displayName = categoryNames[categoryKey] || 'Autres';
      const color = getColorForType(categoryKey);
      
      if (!acc[displayName]) {
        acc[displayName] = {
          name: displayName,
          value: 0,
          color,
          category: categoryKey,
          assets: [],
          children: []
        };
      }
      
      acc[displayName].value += value;
      acc[displayName].assets.push(asset);
      acc[displayName].children.push({
        name: asset.name,
        value: value,
        color: color,
        category: categoryKey
      });
      
      return acc;
    }, {} as Record<string, {
      name: string;
      value: number;
      color: string;
      category: string;
      assets: Asset[];
      children: { name: string; value: number; color: string; category: string }[];
    }>);

    const result = Object.values(grouped);
    console.log('✅ AssetsTreemap - Grouped data:', result);
    
    return result;
  }, [assets]);

  const totalValue = useMemo(() => {
    return assets.reduce((sum, asset) => {
      const latestValuation = asset.valuations?.[0];
      return sum + (latestValuation?.value || 0);
    }, 0);
  }, [assets]);



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
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">📊</div>
              <p>Aucun actif à afficher</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <Treemap
              data={data}
              dataKey="value"
              aspectRatio={4/3}
              stroke="#fff"
              fill={(entry) => entry.color}
            >
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Valeur']}
                labelFormatter={(label) => `Catégorie: ${label}`}
              />
            </Treemap>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}



// Fonction pour obtenir une couleur basée sur le type d'actif
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