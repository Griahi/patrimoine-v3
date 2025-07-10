import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CategoryData, formatFinancialValue, formatPercentage } from '@/utils/financial-utils';

interface CategoryBarProps {
  categories: CategoryData[];
  onCategoryClick?: (category: CategoryData) => void;
}

export function CategoryBar({ categories, onCategoryClick }: CategoryBarProps) {
  if (categories.length === 0) {
    return null;
  }

  const handleCategoryClick = (category: CategoryData) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  return (
    <Card className="w-full mt-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all duration-200"
            >
              {/* Pastille colorée */}
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.couleur }}
              />
              
              {/* Informations de la catégorie */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {category.nom}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {category.nombreActifs} actif{category.nombreActifs > 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    {formatFinancialValue(category.montant)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatPercentage(category.pourcentage)} du patrimoine
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Résumé total */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Total: {categories.length} catégorie{categories.length > 1 ? 's' : ''}
            </span>
            <span>
              {categories.reduce((sum, cat) => sum + cat.nombreActifs, 0)} actif{categories.reduce((sum, cat) => sum + cat.nombreActifs, 0) > 1 ? 's' : ''}
            </span>
            <span>
              {formatFinancialValue(categories.reduce((sum, cat) => sum + cat.montant, 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 