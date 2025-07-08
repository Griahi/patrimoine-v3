"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Zap, 
  Activity, 
  TrendingUp, 
  Bell, 
  DollarSign, 
  PieChart, 
  FileText,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { WidgetConfig } from '@/types/dashboard';

interface WidgetLibraryProps {
  currentWidgets: WidgetConfig[];
  onAddWidget: (widgetType: string) => void;
}

const availableWidgets = [
  {
    id: 'market-news',
    type: 'market-news',
    title: 'Actualités marché',
    description: 'Actualités financières pertinentes à votre portefeuille',
    icon: FileText,
    category: 'Information',
    isPopular: true
  },
  {
    id: 'tax-optimization',
    type: 'tax-optimization',
    title: 'Optimisation fiscale',
    description: 'Suggestions d\'optimisation fiscale personnalisées',
    icon: DollarSign,
    category: 'Fiscalité',
    isNew: true
  },
  {
    id: 'ai-insights',
    type: 'ai-insights',
    title: 'Insights IA',
    description: 'Analyses et recommandations intelligentes',
    icon: Zap,
    category: 'IA',
    isPremium: true
  },
  {
    id: 'portfolio-allocation',
    type: 'portfolio-allocation',
    title: 'Allocation portfolio',
    description: 'Répartition détaillée de vos investissements',
    icon: PieChart,
    category: 'Analyse'
  },
  {
    id: 'performance-tracker',
    type: 'performance-tracker',
    title: 'Suivi performance',
    description: 'Tracking avancé des performances',
    icon: TrendingUp,
    category: 'Performance'
  },
  {
    id: 'risk-monitor',
    type: 'risk-monitor',
    title: 'Moniteur de risque',
    description: 'Surveillance des risques en temps réel',
    icon: Activity,
    category: 'Risque'
  }
];

export default function WidgetLibrary({ currentWidgets, onAddWidget }: WidgetLibraryProps) {
  const currentWidgetIds = currentWidgets.map(w => w.id);
  const availableToAdd = availableWidgets.filter(w => !currentWidgetIds.includes(w.id));

  const categories = Array.from(new Set(availableToAdd.map(w => w.category)));

  return (
    <div className="max-h-96 overflow-y-auto">
      {categories.map(category => (
        <div key={category} className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">{category}</h3>
          <div className="grid gap-3">
            {availableToAdd
              .filter(widget => widget.category === category)
              .map(widget => (
                <motion.div
                  key={widget.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <widget.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {widget.title}
                            </h4>
                            
                            {widget.isNew && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                Nouveau
                              </Badge>
                            )}
                            
                            {widget.isPopular && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                                Populaire
                              </Badge>
                            )}
                            
                            {widget.isPremium && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                Premium
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => onAddWidget(widget.type)}
                        className="ml-3"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
          </div>
        </div>
      ))}

      {availableToAdd.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">
            Tous les widgets sont ajoutés
          </h3>
          <p className="text-gray-600 text-sm">
            Vous utilisez déjà tous les widgets disponibles dans votre dashboard.
          </p>
        </div>
      )}
    </div>
  );
} 