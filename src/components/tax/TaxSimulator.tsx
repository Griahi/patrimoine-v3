'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/slider';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TaxAnalysis } from '@/services/tax/TaxAnalysisService';
import { Calculator, TrendingDown, Lightbulb, Zap } from 'lucide-react';

interface TaxSimulatorProps {
  analysis: TaxAnalysis | null;
  userId: string;
}

interface SimulationScenarios {
  perContribution: number;
  deficitFoncier: number;
  donation: number;
  additionalIncome: number;
}

interface SimulationResults {
  current: any;
  optimized: any;
  savings: any;
  comparison: any[];
}

export function TaxSimulator({ analysis, userId }: TaxSimulatorProps) {
  const [scenarios, setScenarios] = useState<SimulationScenarios>({
    perContribution: 0,
    deficitFoncier: 0,
    donation: 0,
    additionalIncome: 0
  });

  const [results, setResults] = useState<SimulationResults | null>(null);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculs en temps réel
  const currentTax = analysis?.currentBurden.total || 0;
  const perTaxSaving = scenarios.perContribution * (analysis?.userProfile.tmi || 0);
  const deficitTaxSaving = scenarios.deficitFoncier * (analysis?.userProfile.tmi || 0);
  const simulatedTax = Math.max(0, currentTax - perTaxSaving - deficitTaxSaving);
  const savings = currentTax - simulatedTax;

  const simulateDetailed = async () => {
    if (!analysis) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/tax/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          scenarios
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Données pour les graphiques
  const comparisonData = [
    {
      name: 'Situation actuelle',
      value: currentTax,
      fill: '#ef4444'
    },
    {
      name: 'Avec optimisations',
      value: simulatedTax,
      fill: '#22c55e'
    }
  ];

  const savingsBreakdown = [
    {
      name: 'PER',
      value: perTaxSaving,
      fill: '#3b82f6'
    },
    {
      name: 'Déficit foncier',
      value: deficitTaxSaving,
      fill: '#8b5cf6'
    }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Simulateur d'Optimisation Fiscale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contrôles de simulation */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Paramètres de simulation</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="per" className="font-medium">Versement PER</Label>
                    <span className="text-sm text-gray-500">
                      Max: {formatCurrency(35194)}
                    </span>
                  </div>
                  <Slider
                    id="per"
                    min={0}
                    max={35194}
                    step={1000}
                    value={[scenarios.perContribution]}
                    onValueChange={(value) => 
                      setScenarios(prev => ({ ...prev, perContribution: value[0] }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(scenarios.perContribution)}
                    </span>
                    <span className="text-sm text-green-600">
                      Économie: {formatCurrency(perTaxSaving)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="deficit" className="font-medium">Déficit Foncier</Label>
                    <span className="text-sm text-gray-500">
                      Max: {formatCurrency(50000)}
                    </span>
                  </div>
                  <Slider
                    id="deficit"
                    min={0}
                    max={50000}
                    step={1000}
                    value={[scenarios.deficitFoncier]}
                    onValueChange={(value) => 
                      setScenarios(prev => ({ ...prev, deficitFoncier: value[0] }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold text-purple-600">
                      {formatCurrency(scenarios.deficitFoncier)}
                    </span>
                    <span className="text-sm text-green-600">
                      Économie: {formatCurrency(deficitTaxSaving)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="donation" className="font-medium">Donation</Label>
                    <span className="text-sm text-gray-500">
                      Max: {formatCurrency(100000)}
                    </span>
                  </div>
                  <Slider
                    id="donation"
                    min={0}
                    max={100000}
                    step={5000}
                    value={[scenarios.donation]}
                    onValueChange={(value) => 
                      setScenarios(prev => ({ ...prev, donation: value[0] }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-bold text-indigo-600">
                      {formatCurrency(scenarios.donation)}
                    </span>
                    <span className="text-sm text-green-600">
                      Économie future: {formatCurrency(scenarios.donation * 0.2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={simulateDetailed} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Simulation en cours...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Simuler l'Impact Détaillé
                  </>
                )}
              </Button>
            </div>

            {/* Résultats en temps réel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Impact Simulé</h3>
              
              <div className="grid gap-4">
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-red-700 font-medium">Impôts actuels</span>
                      <span className="text-xl font-bold text-red-800">
                        {formatCurrency(currentTax)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 font-medium">Impôts optimisés</span>
                      <span className="text-xl font-bold text-green-800">
                        {formatCurrency(simulatedTax)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-blue-700 font-medium">Économies totales</span>
                        <div className="text-xs text-blue-600">
                          Réduction: {currentTax > 0 ? ((savings / currentTax) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-blue-800">
                        {formatCurrency(savings)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <TrendingDown className="w-4 h-4 inline text-blue-600 mr-1" />
                      <span className="text-sm text-blue-600">
                        vs situation actuelle
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Graphique comparaison */}
              {comparisonData[0].value > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-4">Comparaison visuelle</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Répartition des économies */}
          {savingsBreakdown.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Répartition des économies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={savingsBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                      >
                        {savingsBreakdown.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-3">
                    {savingsBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Résultats détaillés de la simulation */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Résultats de simulation détaillée</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Situation actuelle</h4>
                    <div className="space-y-2">
                      {Object.entries(results.current).map(([key, value]) => (
                        key !== 'total' && (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}</span>
                            <span>{formatCurrency(Number(value))}</span>
                          </div>
                        )
                      ))}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(results.current.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Après optimisations</h4>
                    <div className="space-y-2">
                      {Object.entries(results.optimized).map(([key, value]) => (
                        key !== 'total' && (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}</span>
                            <span>{formatCurrency(Number(value))}</span>
                          </div>
                        )
                      ))}
                      <div className="border-t pt-2 flex justify-between font-bold text-green-600">
                        <span>Total</span>
                        <span>{formatCurrency(results.optimized.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Comparaison par type d'impôt</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results.comparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="current" fill="#ef4444" name="Actuel" />
                      <Bar dataKey="optimized" fill="#22c55e" name="Optimisé" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conseils contextuels */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Conseils d'optimisation
              </h4>
              <div className="space-y-2 text-blue-700">
                {scenarios.perContribution === 0 && analysis?.userProfile.tmi && analysis.userProfile.tmi > 0.11 && (
                  <p>• Considérez un versement PER pour réduire votre TMI de {(analysis.userProfile.tmi * 100).toFixed(0)}%</p>
                )}
                {scenarios.deficitFoncier === 0 && analysis?.patrimonialContext.realEstateValue && analysis.patrimonialContext.realEstateValue > 0 && (
                  <p>• Explorez les possibilités de déficit foncier si vous avez des biens locatifs</p>
                )}
                {savings > 5000 && (
                  <p>• Économies importantes possibles ! Consultez un conseiller fiscal pour optimiser votre stratégie</p>
                )}
                {savings < 1000 && (
                  <p>• Votre situation fiscale semble déjà bien optimisée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
} 