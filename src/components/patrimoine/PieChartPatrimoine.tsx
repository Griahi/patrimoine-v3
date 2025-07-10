import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  PieChart as PieChartIcon, 
  RefreshCw, 
  Eye,
  Info
} from 'lucide-react';
import { 
  CategoryData, 
  formatFinancialValue, 
  formatPercentage,
  calculateDiversificationIndex 
} from '@/utils/financial-utils';

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

  // Transformer les données pour recharts
  const pieData = useMemo(() => {
    return categories.map(category => ({
      name: category.nom,
      value: category.montant,
      percentage: category.pourcentage,
      color: category.couleur,
      nombreActifs: category.nombreActifs,
      id: category.id
    }));
  }, [categories]);

  // Fonction pour tronquer les noms longs
  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  // Fonction pour obtenir un label personnalisé pour le pie chart
  const renderCustomLabel = ({ name, percentage }: { name: string; percentage: number }) => {
    if (percentage < 5) return ''; // Ne pas afficher les labels pour les segments < 5%
    return `${truncateName(name, 12)}: ${percentage.toFixed(1)}%`;
  };

  // Gestionnaire de clic sur les segments
  const handleSliceClick = (data: any, index: number) => {
    if (onCategoryClick) {
      const category = categories.find(cat => cat.nom === data.name);
      if (category) {
        onCategoryClick(category);
      }
    }
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2 mb-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-gray-900">{data.name}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Valeur:</span>
            <span className="font-medium">{formatFinancialValue(data.value)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pourcentage:</span>
            <span className="font-medium">{formatPercentage(data.percentage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Actifs:</span>
            <span className="font-medium">{data.nombreActifs}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5" />
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
            <PieChartIcon className="w-5 h-5" />
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
            <PieChartIcon className="w-5 h-5" />
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
                <Info className="w-4 h-4" />
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
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={Math.min(height * 0.35, 120)}
                innerRadius={Math.min(height * 0.2, 60)}
                fill="#8884d8"
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
                onClick={handleSliceClick}
                style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value: string) => truncateName(value, 20)}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">Valeur totale</div>
            <div className="text-lg font-bold text-blue-600">{formatFinancialValue(totalValue)}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">Nombre d'actifs</div>
            <div className="text-lg font-bold text-green-600">{categories.reduce((sum, cat) => sum + cat.nombreActifs, 0)}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">Indice de diversification</div>
            <div className="text-lg font-bold text-purple-600">{diversificationIndex}%</div>
          </div>
        </div>

        {/* Liste des catégories */}
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
                <span className="font-medium text-gray-900">{category.nom}</span>
                <Badge variant="outline" className="text-xs">
                  {category.nombreActifs} actif{category.nombreActifs > 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{formatFinancialValue(category.montant)}</div>
                <div className="text-sm text-gray-500">{formatPercentage(category.pourcentage)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 