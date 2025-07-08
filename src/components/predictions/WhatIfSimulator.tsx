'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { WhatIfScenario } from '@/types/predictions';
import { generateId } from '@/utils/id';

interface WhatIfSimulatorProps {
  currentValue: number;
  onRunScenarios: (scenarios: WhatIfScenario[]) => Promise<void>;
  isLoading?: boolean;
  results?: WhatIfScenario[];
}

const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  currentValue,
  onRunScenarios,
  isLoading = false,
  results = []
}) => {
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<Partial<WhatIfScenario>>({
    name: '',
    description: '',
    parameters: {}
  });

  // Scénarios prédéfinis
  const predefinedScenarios = [
    {
      name: "Hausse des taux à 5%",
      description: "Impact d'une hausse des taux d'intérêt à 5%",
      parameters: { interestRateChange: 2 }, // +2 points
      icon: "📈"
    },
    {
      name: "Inflation à 4%",
      description: "Scénario d'inflation élevée à 4%",
      parameters: { inflationChange: 1.5 }, // +1.5 points
      icon: "💰"
    },
    {
      name: "Chute immobilier -20%",
      description: "Correction du marché immobilier de 20%",
      parameters: { realEstateMarketChange: -0.2 },
      icon: "🏠"
    },
    {
      name: "Bull market actions +15%",
      description: "Marché haussier avec +15% sur les actions",
      parameters: { stockMarketChange: 0.15 },
      icon: "📊"
    },
    {
      name: "Épargne +500€/mois",
      description: "Investissement supplémentaire de 500€ par mois",
      parameters: { monthlyInvestment: 500 },
      icon: "💵"
    }
  ];

  const addPredefinedScenario = useCallback((predefined: any) => {
    const scenario: WhatIfScenario = {
      id: generateId(),
      name: predefined.name,
      description: predefined.description,
      parameters: predefined.parameters,
      impact: {
        currentValue: 0,
        projectedValue1Y: 0,
        projectedValue5Y: 0,
        differenceFromBaseline: {
          absolute1Y: 0,
          percentage1Y: 0,
          absolute5Y: 0,
          percentage5Y: 0
        }
      }
    };
    
    setScenarios(prev => [...prev, scenario]);
  }, []);

  const addCustomScenario = useCallback(() => {
    if (!activeScenario.name) return;

    const scenario: WhatIfScenario = {
      id: generateId(),
      name: activeScenario.name,
      description: activeScenario.description || '',
      parameters: activeScenario.parameters || {},
      impact: {
        currentValue: 0,
        projectedValue1Y: 0,
        projectedValue5Y: 0,
        differenceFromBaseline: {
          absolute1Y: 0,
          percentage1Y: 0,
          absolute5Y: 0,
          percentage5Y: 0
        }
      }
    };

    setScenarios(prev => [...prev, scenario]);
    setActiveScenario({ name: '', description: '', parameters: {} });
  }, [activeScenario]);

  const removeScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleParameterChange = useCallback((param: string, value: number) => {
    setActiveScenario(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: value
      }
    }));
  }, []);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getImpactColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getResultForScenario = (scenarioId: string) => {
    return results.find(r => r.id === scenarioId);
  };

  return (
    <Card className="p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🔍 Simulateur "Que se passe-t-il si..."
          </h3>
          <p className="text-sm text-gray-600">
            Testez l'impact de différents scénarios sur votre patrimoine
          </p>
        </div>
        
        {scenarios.length > 0 && (
          <Button
            onClick={() => onRunScenarios(scenarios)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? '⏳' : '🚀'} 
            {isLoading ? 'Calcul...' : 'Simuler'}
          </Button>
        )}
      </div>

      {/* Scénarios prédéfinis */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">📋 Scénarios prédéfinis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {predefinedScenarios.map((predefined, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => addPredefinedScenario(predefined)}
              className="text-left h-auto p-3 flex flex-col items-start"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{predefined.icon}</span>
                <span className="font-medium text-sm">{predefined.name}</span>
              </div>
              <span className="text-xs text-gray-600">{predefined.description}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Créateur de scénario personnalisé */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">⚙️ Scénario personnalisé</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="scenario-name">Nom du scénario</Label>
              <Input
                id="scenario-name"
                value={activeScenario.name || ''}
                onChange={(e) => setActiveScenario(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Crise économique"
              />
            </div>
            <div>
              <Label htmlFor="scenario-description">Description</Label>
              <Input
                id="scenario-description"
                value={activeScenario.description || ''}
                onChange={(e) => setActiveScenario(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Scénario de récession..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="interest-rate">Changement taux d'intérêt (%)</Label>
              <Input
                id="interest-rate"
                type="number"
                step="0.1"
                value={activeScenario.parameters?.interestRateChange || ''}
                onChange={(e) => handleParameterChange('interestRateChange', parseFloat(e.target.value) || 0)}
                placeholder="Ex: +2.0"
              />
            </div>
            
            <div>
              <Label htmlFor="inflation">Changement inflation (%)</Label>
              <Input
                id="inflation"
                type="number"
                step="0.1"
                value={activeScenario.parameters?.inflationChange || ''}
                onChange={(e) => handleParameterChange('inflationChange', parseFloat(e.target.value) || 0)}
                placeholder="Ex: +1.5"
              />
            </div>
            
            <div>
              <Label htmlFor="monthly-investment">Investissement mensuel (€)</Label>
              <Input
                id="monthly-investment"
                type="number"
                value={activeScenario.parameters?.monthlyInvestment || ''}
                onChange={(e) => handleParameterChange('monthlyInvestment', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="real-estate">Marché immobilier (%)</Label>
              <Input
                id="real-estate"
                type="number"
                step="0.01"
                value={activeScenario.parameters?.realEstateMarketChange || ''}
                onChange={(e) => handleParameterChange('realEstateMarketChange', parseFloat(e.target.value) || 0)}
                placeholder="Ex: -0.20 (pour -20%)"
              />
            </div>
            
            <div>
              <Label htmlFor="stock-market">Marché actions (%)</Label>
              <Input
                id="stock-market"
                type="number"
                step="0.01"
                value={activeScenario.parameters?.stockMarketChange || ''}
                onChange={(e) => handleParameterChange('stockMarketChange', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 0.15 (pour +15%)"
              />
            </div>
          </div>

          <Button
            onClick={addCustomScenario}
            disabled={!activeScenario.name}
            variant="outline"
            size="sm"
          >
            ➕ Ajouter le scénario
          </Button>
        </div>
      </div>

      {/* Liste des scénarios à simuler */}
      {scenarios.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">
            📋 Scénarios à simuler ({scenarios.length})
          </h4>
          <div className="space-y-3">
            {scenarios.map((scenario) => {
              const result = getResultForScenario(scenario.id);
              
              return (
                <div
                  key={scenario.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-900">{scenario.name}</h5>
                        {result && (
                          <Badge 
                            variant={result.impact.differenceFromBaseline.percentage5Y >= 0 ? 'default' : 'outline'}
                            className={
                              result.impact.differenceFromBaseline.percentage5Y >= 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            Simulé
                          </Badge>
                        )}
                      </div>
                      
                      {scenario.description && (
                        <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                      )}
                      
                      {/* Paramètres du scénario */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Object.entries(scenario.parameters).map(([key, value]) => {
                          let label = key;
                          let displayValue = value;
                          
                          switch (key) {
                            case 'interestRateChange':
                              label = 'Taux';
                              displayValue = `${value >= 0 ? '+' : ''}${value}%`;
                              break;
                            case 'inflationChange':
                              label = 'Inflation';
                              displayValue = `${value >= 0 ? '+' : ''}${value}%`;
                              break;
                            case 'monthlyInvestment':
                              label = 'Épargne';
                              displayValue = `${value}€/mois`;
                              break;
                            case 'realEstateMarketChange':
                              label = 'Immobilier';
                              displayValue = `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
                              break;
                            case 'stockMarketChange':
                              label = 'Actions';
                              displayValue = `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
                              break;
                          }
                          
                          return (
                            <Badge key={key} variant="outline" className="text-xs">
                              {label}: {displayValue}
                            </Badge>
                          );
                        })}
                      </div>

                      {/* Résultats si disponibles */}
                      {result && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 p-3 bg-gray-50 rounded">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {formatValue(result.impact.projectedValue1Y)}
                            </div>
                            <div className="text-xs text-gray-600">Valeur 1 an</div>
                            <div className={`text-xs font-medium ${getImpactColor(result.impact.differenceFromBaseline.percentage1Y)}`}>
                              {formatPercent(result.impact.differenceFromBaseline.percentage1Y)}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {formatValue(result.impact.projectedValue5Y)}
                            </div>
                            <div className="text-xs text-gray-600">Valeur 5 ans</div>
                            <div className={`text-xs font-medium ${getImpactColor(result.impact.differenceFromBaseline.percentage5Y)}`}>
                              {formatPercent(result.impact.differenceFromBaseline.percentage5Y)}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-sm font-medium ${getImpactColor(result.impact.differenceFromBaseline.absolute1Y)}`}>
                              {result.impact.differenceFromBaseline.absolute1Y >= 0 ? '+' : ''}{formatValue(result.impact.differenceFromBaseline.absolute1Y)}
                            </div>
                            <div className="text-xs text-gray-600">Diff. 1 an</div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-sm font-medium ${getImpactColor(result.impact.differenceFromBaseline.absolute5Y)}`}>
                              {result.impact.differenceFromBaseline.absolute5Y >= 0 ? '+' : ''}{formatValue(result.impact.differenceFromBaseline.absolute5Y)}
                            </div>
                            <div className="text-xs text-gray-600">Diff. 5 ans</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeScenario(scenario.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message d'aide si aucun scénario */}
      {scenarios.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-lg font-medium mb-2">Aucun scénario sélectionné</p>
          <p className="text-sm">
            Ajoutez des scénarios prédéfinis ou créez vos propres simulations personnalisées
          </p>
        </div>
      )}
    </Card>
  );
};

export default WhatIfSimulator; 