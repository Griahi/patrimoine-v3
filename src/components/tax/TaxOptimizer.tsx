'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/Progress';
import { 
  Calculator, 
  TrendingUp, 
  Target,
  Euro,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { TaxSimulator } from './TaxSimulator';
import { TaxAnalysis } from '@/services/tax/TaxAnalysisService';
import { OptimizationStrategy } from '@/services/tax/TaxOptimizationEngine';

interface TaxOptimizerProps {
  userId: string;
}

export default function TaxOptimizer({ userId }: TaxOptimizerProps) {
  const [analysis, setAnalysis] = useState<TaxAnalysis | null>(null);
  const [optimizations, setOptimizations] = useState<OptimizationStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizationStrategy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaxAnalysis();
  }, [userId]);

  const loadTaxAnalysis = async () => {
    try {
      setLoading(true);
      const [analysisData, optimizationData] = await Promise.all([
        fetch(`/api/tax/analysis/${userId}`).then(r => r.json()),
        fetch(`/api/tax/optimize/${userId}`).then(r => r.json())
      ]);
      
      setAnalysis(analysisData);
      setOptimizations(optimizationData);
    } catch (error) {
      console.error('Error loading tax analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSeverityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement de l'analyse fiscale...</span>
      </div>
    );
  }

  const totalPotentialSavings = optimizations
    .filter(opt => opt.eligibility.isEligible)
    .reduce((sum, opt) => sum + opt.estimatedSavings, 0);

  return (
    <div className="space-y-6">
      {/* En-tête avec métriques clés */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Charge fiscale actuelle</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(analysis?.currentBurden.total || 0)}
                </p>
              </div>
              <Calculator className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Économies possibles</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPotentialSavings)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Optimisations trouvées</p>
                <p className="text-2xl font-bold text-blue-600">
                  {optimizations.filter(o => o.eligibility.isEligible).length}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réduction potentielle</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analysis ? ((totalPotentialSavings / analysis.currentBurden.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="optimizations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="optimizations">Optimisations</TabsTrigger>
          <TabsTrigger value="analysis">Analyse Détaillée</TabsTrigger>
          <TabsTrigger value="simulator">Simulateur</TabsTrigger>
        </TabsList>

        <TabsContent value="optimizations" className="space-y-4">
          <div className="grid gap-4">
            {optimizations.map((strategy) => (
              <Card 
                key={strategy.id} 
                className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
                  !strategy.eligibility.isEligible ? 'opacity-60' : 'hover:border-blue-200'
                }`}
                onClick={() => setSelectedStrategy(strategy)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{strategy.name}</h3>
                        <Badge className={getSeverityColor(strategy.complexity)}>
                          {strategy.complexity === 'low' ? 'Facile' : 
                           strategy.complexity === 'medium' ? 'Moyen' : 'Complexe'}
                        </Badge>
                        {strategy.eligibility.isEligible ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{strategy.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            {formatCurrency(strategy.estimatedSavings)} économisés
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span>ROI: {(strategy.roi * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span>{strategy.timeline}</span>
                        </div>
                      </div>

                      {!strategy.eligibility.isEligible && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">
                            <strong>Non éligible:</strong> {strategy.eligibility.reasons.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(strategy.estimatedSavings)}
                      </div>
                      <Button
                        variant={strategy.eligibility.isEligible ? "default" : "secondary"}
                        disabled={!strategy.eligibility.isEligible}
                        className="mt-2"
                      >
                        Voir Détails
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {optimizations.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Aucune optimisation trouvée
                  </h3>
                  <p className="text-gray-500">
                    Votre situation fiscale semble déjà optimisée ou nécessite plus d'informations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Analyse Fiscale Détaillée
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis && (
                <div className="space-y-6">
                  {/* Répartition de la charge fiscale */}
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Répartition de la charge fiscale</h4>
                    <div className="space-y-3">
                      {Object.entries(analysis.currentBurden).map(([key, value]) => {
                        if (key === 'total') return null;
                        const percentage = analysis.currentBurden.total > 0 ? 
                          (value / analysis.currentBurden.total) * 100 : 0;
                        
                        return (
                          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace('IR', 'Impôt sur le Revenu')}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              <span className="font-bold w-24 text-right">
                                {formatCurrency(value)}
                              </span>
                              <span className="text-sm text-gray-500 w-12 text-right">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Profil fiscal */}
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Profil Fiscal</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-600 font-medium">TMI</span>
                        <div className="text-2xl font-bold text-blue-800">
                          {(analysis.userProfile.tmi * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-600 font-medium">Revenus</span>
                        <div className="text-2xl font-bold text-green-800">
                          {formatCurrency(analysis.userProfile.income)}
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <span className="text-sm text-purple-600 font-medium">Situation</span>
                        <div className="text-lg font-bold text-purple-800 capitalize">
                          {analysis.userProfile.foyer === 'single' ? 'Célibataire' :
                           analysis.userProfile.foyer === 'married' ? 'Marié(e)' : 'Pacsé(e)'}
                        </div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <span className="text-sm text-orange-600 font-medium">Parts fiscales</span>
                        <div className="text-2xl font-bold text-orange-800">
                          {analysis.userProfile.nbParts}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contexte patrimonial */}
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Contexte Patrimonial</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Patrimoine Total</span>
                        <div className="text-xl font-bold">
                          {formatCurrency(analysis.patrimonialContext.totalValue)}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Immobilier</span>
                        <div className="text-xl font-bold">
                          {formatCurrency(analysis.patrimonialContext.realEstateValue)}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Actifs Financiers</span>
                        <div className="text-xl font-bold">
                          {formatCurrency(analysis.patrimonialContext.financialAssets)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator">
          <TaxSimulator analysis={analysis} userId={userId} />
        </TabsContent>
      </Tabs>

      {/* Modal détail stratégie */}
      {selectedStrategy && (
        <StrategyDetailModal
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
        />
      )}
    </div>
  );
}

// Composant modal pour les détails d'une stratégie
interface StrategyDetailModalProps {
  strategy: OptimizationStrategy;
  onClose: () => void;
}

function StrategyDetailModal({ strategy, onClose }: StrategyDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{strategy.name}</h2>
            <Button onClick={onClose} variant="outline" size="sm">
              ✕
            </Button>
          </div>

          <div className="space-y-6">
            {/* Résumé */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Résumé</h3>
              <p className="text-blue-700">{strategy.description}</p>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-sm">
                  <strong>Économies:</strong> {formatCurrency(strategy.estimatedSavings)}
                </span>
                <span className="text-sm">
                  <strong>ROI:</strong> {(strategy.roi * 100).toFixed(1)}%
                </span>
                <span className="text-sm">
                  <strong>Délai:</strong> {strategy.timeline}
                </span>
              </div>
            </div>

            {/* Étapes de mise en œuvre */}
            <div>
              <h3 className="font-semibold mb-3">Étapes de mise en œuvre</h3>
              <div className="space-y-2">
                {strategy.implementation.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents nécessaires */}
            <div>
              <h3 className="font-semibold mb-3">Documents nécessaires</h3>
              <ul className="space-y-1">
                {strategy.implementation.documents.map((doc, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Échéances */}
            <div>
              <h3 className="font-semibold mb-3">Échéances importantes</h3>
              <ul className="space-y-1">
                {strategy.implementation.deadlines.map((deadline, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>{deadline}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risques */}
            {strategy.risks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-red-600">Risques et contraintes</h3>
                <ul className="space-y-1">
                  {strategy.risks.map((risk, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prérequis */}
            <div>
              <h3 className="font-semibold mb-3">Prérequis</h3>
              <ul className="space-y-1">
                {strategy.requirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={onClose} variant="outline">
              Fermer
            </Button>
            {strategy.eligibility.isEligible && (
              <Button>
                Commencer cette optimisation
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 