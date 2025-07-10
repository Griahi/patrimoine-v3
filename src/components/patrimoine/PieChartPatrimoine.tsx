import React, { useMemo } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  PieChart, 
  TreeMap, 
  RefreshCw, 
  Eye,
  Info
} from 'lucide-react';
import { 
  CategoryData, 
  formatTreemapValue, 
  formatPercentage,
  calculateDiversificationIndex 
} from '@/utils/treemap-calculations';

interface PieChartPatrimoineProps {
  categories: CategoryData[];
  title?: string;
  height?: number;
  loading?: boolean;
  onCategoryClick?: (category: CategoryData) => void;
  onRefresh?: () => void;
  onToggleView?: () => void;
}

export function PieChartPatrimoine({ 
  categories, 
  title = "Répartition du Patrimoine",
  height = 400,
  loading = false,
  onCategoryClick,
  onRefresh,
  onToggleView
}: PieChartPatrimoineProps) {
  const diversificationIndex = useMemo(() => calculateDiversificationIndex(categories), [categories]);
  const totalValue = useMemo(() => categories.reduce((sum, cat) => sum + cat.montant, 0), [categories]);

  const pieData = useMemo(() => {
    return categories.map(category => ({
      id: category.id,
      label: category.nom,
      value: category.montant,
      color: category.couleur,
      percentage: category.pourcentage,
      nombreActifs: category.nombreActifs
    }));
  }, [categories]);

  const handleSliceClick = (slice: any) => {
    if (onCategoryClick) {
      const category = categories.find(cat => cat.id === slice.id);
      if (category) {
        onCategoryClick(category);
      }
    }
  };

  const CustomTooltip = ({ datum }: { datum: any }) => (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2 mb-2">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: datum.color }}
        />
        <span className="font-semibold text-gray-900">{datum.label}</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Valeur:</span>
          <span className="font-medium">{formatTreemapValue(datum.value)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Pourcentage:</span>
          <span className="font-medium">{formatPercentage(datum.percentage)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Actifs:</span>
          <span className="font-medium">{datum.nombreActifs}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
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
            <PieChart className="w-5 h-5" />
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
            <PieChart className="w-5 h-5" />
            <span>{title}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {categories.length} catégorie{categories.length > 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Diversification: {diversificationIndex}%
            </Badge>
            {onToggleView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleView}
                className="p-2"
              >
                <TreeMap className="w-4 h-4" />
              </Button>
            )}
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
        <div className="w-full" style={{ height }}>
          <ResponsivePie
            data={pieData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            borderWidth={1}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 0.2]]
            }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{
              from: 'color',
              modifiers: [['darker', 2]]
            }}
            colors={(datum: any) => datum.color}
            onClick={handleSliceClick}
            tooltip={CustomTooltip}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 56,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: '#999',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000'
                    }
                  }
                ]
              }
            ]}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
          />
        </div>

        {/* Statistiques supplémentaires */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">Valeur totale</div>
            <div className="text-lg font-bold text-blue-600">{formatTreemapValue(totalValue)}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">Actifs totaux</div>
            <div className="text-lg font-bold text-green-600">
              {categories.reduce((sum, cat) => sum + cat.nombreActifs, 0)}
            </div>
          </div>
        </div>

        {/* Légende personnalisée */}
        <div className="mt-4 space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => onCategoryClick && onCategoryClick(category)}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.couleur }}
                />
                <div>
                  <div className="font-medium text-gray-900">{category.nom}</div>
                  <div className="text-sm text-gray-500">{category.nombreActifs} actifs</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{formatTreemapValue(category.montant)}</div>
                <div className="text-sm text-gray-500">{formatPercentage(category.pourcentage)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 