import React from 'react';
import { Euro, BarChart3, TrendingUp, Users } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { EntitySelector } from './EntitySelector';
import { PatrimoineMetrics, EntityForTreemap } from '@/utils/treemap-calculations';

interface PatrimoineHeaderProps {
  data: PatrimoineMetrics;
  entities: EntityForTreemap[];
  selectedEntityIds: string[];
  onEntityChange: (entityIds: string[]) => void;
  loading?: boolean;
}

export function PatrimoineHeader({ 
  data, 
  entities, 
  selectedEntityIds, 
  onEntityChange, 
  loading = false 
}: PatrimoineHeaderProps) {
  const totalActifs = data.categories.reduce((sum, category) => sum + category.nombreActifs, 0);
  const totalDettes = data.dettes > 0 ? Math.round(data.dettes / 1000) : 0; // Approximation du nombre de dettes
  
  if (loading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard 
          icon={<Euro className="w-5 h-5" />}
          label="Patrimoine Total" 
          value={data.total}
          subtext={`${totalActifs} actifs`}
          variant="default"
        />
        <MetricCard 
          icon={<BarChart3 className="w-5 h-5" />}
          label="Dettes Total" 
          value={data.dettes}
          subtext={data.dettes > 0 ? `${totalDettes} dettes actives` : '0 dettes actives'}
          variant={data.dettes > 0 ? "danger" : "success"}
        />
        <MetricCard 
          icon={<TrendingUp className="w-5 h-5" />}
          label="Patrimoine Net" 
          value={data.net}
          subtext={data.total > 0 ? `${((data.net / data.total) * 100).toFixed(1)}% ratio net` : '0% ratio net'}
          variant="success"
        />
        <div className="flex items-center justify-center">
          <EntitySelector
            entities={entities}
            selectedEntityIds={selectedEntityIds}
            onChange={onEntityChange}
            placeholder="Toutes les entités"
          />
        </div>
      </div>
      
      {/* Informations supplémentaires */}
      <div className="flex items-center justify-between text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>
              {selectedEntityIds.length > 0 
                ? `${selectedEntityIds.length} entité${selectedEntityIds.length > 1 ? 's' : ''}`
                : `${entities.length} entité${entities.length > 1 ? 's' : ''}`
              }
            </span>
          </span>
          <span>•</span>
          <span>{data.categories.length} catégorie{data.categories.length > 1 ? 's' : ''}</span>
        </div>
        <div className="text-xs text-gray-500">
          Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
} 