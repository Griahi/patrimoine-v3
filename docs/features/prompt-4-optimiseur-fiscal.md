# 💰 Prompt 4 : Optimiseur Fiscal Intelligent

## Contexte
Tu développes une application de gestion de patrimoine avec React, Node.js, PostgreSQL et Prisma. L'application a déjà l'authentification, la gestion des entités et actifs implémentée avec un dashboard fonctionnel.

Je veux maintenant ajouter un module d'optimisation fiscale intelligent qui analyse automatiquement le patrimoine de l'utilisateur et propose des stratégies concrètes pour réduire ses impôts.

## Fonctionnalités à Implémenter

### 1. Service d'Analyse Fiscale Backend

Crée un service complet d'analyse fiscale qui calcule automatiquement :

```typescript
// services/tax/TaxAnalysisService.ts
interface TaxAnalysis {
  currentBurden: {
    IR: number;
    IFI: number;
    plusValues: number;
    prelevementsSociaux: number;
    taxeFonciere: number;
    total: number;
  };
  userProfile: {
    tmi: number; // Tranche marginale d'imposition
    foyer: 'single' | 'married' | 'pacs';
    nbParts: number;
    age: number;
    income: number;
  };
  patrimonialContext: {
    totalValue: number;
    realEstateValue: number;
    financialAssets: number;
    professionalAssets: number;
    debts: number;
    netWorth: number;
  };
}

export class TaxAnalysisService {
  async analyzeCurrentSituation(userId: string): Promise<TaxAnalysis> {
    // Récupérer les données patrimoniales
    const portfolio = await this.getPortfolioData(userId);
    const userProfile = await this.getUserProfile(userId);
    
    // Calculer l'IR
    const IR = this.calculateIR(userProfile.income, userProfile.foyer, userProfile.nbParts);
    
    // Calculer l'IFI si applicable
    const IFI = portfolio.realEstateValue > 1300000 ? 
      this.calculateIFI(portfolio.realEstateValue) : 0;
    
    // Calculer les plus-values
    const plusValues = this.calculatePlusValues(portfolio.assets);
    
    // Prélèvements sociaux
    const prelevementsSociaux = this.calculatePrelevementsSociaux(portfolio);
    
    // Taxe foncière estimée
    const taxeFonciere = this.estimateTaxeFonciere(portfolio.realEstate);
    
    return {
      currentBurden: {
        IR,
        IFI,
        plusValues,
        prelevementsSociaux,
        taxeFonciere,
        total: IR + IFI + plusValues + prelevementsSociaux + taxeFonciere
      },
      userProfile,
      patrimonialContext: {
        totalValue: portfolio.totalValue,
        realEstateValue: portfolio.realEstateValue,
        financialAssets: portfolio.financialAssets,
        professionalAssets: portfolio.professionalAssets,
        debts: portfolio.totalDebts,
        netWorth: portfolio.totalValue - portfolio.totalDebts
      }
    };
  }

  private calculateIR(income: number, foyer: string, nbParts: number): number {
    // Barème IR 2024
    const brackets = [
      { min: 0, max: 11294, rate: 0 },
      { min: 11294, max: 28797, rate: 0.11 },
      { min: 28797, max: 82341, rate: 0.30 },
      { min: 82341, max: 177106, rate: 0.41 },
      { min: 177106, max: Infinity, rate: 0.45 }
    ];
    
    const quotientFamilial = income / nbParts;
    let tax = 0;
    
    for (const bracket of brackets) {
      if (quotientFamilial > bracket.min) {
        const taxableInBracket = Math.min(quotientFamilial, bracket.max) - bracket.min;
        tax += taxableInBracket * bracket.rate;
      }
    }
    
    return tax * nbParts;
  }

  private calculateIFI(realEstateValue: number): number {
    // Barème IFI 2024
    const brackets = [
      { min: 800000, max: 1300000, rate: 0 },
      { min: 1300000, max: 2570000, rate: 0.005 },
      { min: 2570000, max: 5000000, rate: 0.007 },
      { min: 5000000, max: 10000000, rate: 0.01 },
      { min: 10000000, max: Infinity, rate: 0.0125 }
    ];
    
    let tax = 0;
    for (const bracket of brackets) {
      if (realEstateValue > bracket.min) {
        const taxableInBracket = Math.min(realEstateValue, bracket.max) - bracket.min;
        tax += taxableInBracket * bracket.rate;
      }
    }
    
    return tax;
  }
}
```

### 2. Moteur d'Optimisation Fiscale

Crée un moteur intelligent qui identifie toutes les opportunités d'optimisation :

```typescript
// services/tax/TaxOptimizationEngine.ts
interface OptimizationStrategy {
  id: string;
  name: string;
  category: 'reduction' | 'credit' | 'deficitFoncier' | 'PER' | 'donation' | 'structure';
  description: string;
  estimatedSavings: number;
  roi: number;
  complexity: 'low' | 'medium' | 'high';
  timeline: string;
  requirements: string[];
  implementation: {
    steps: string[];
    documents: string[];
    deadlines: string[];
  };
  risks: string[];
  eligibility: {
    isEligible: boolean;
    reasons: string[];
  };
}

export class TaxOptimizationEngine {
  async generateOptimizations(userId: string): Promise<OptimizationStrategy[]> {
    const analysis = await this.taxAnalysisService.analyzeCurrentSituation(userId);
    const portfolio = await this.getPortfolioData(userId);
    
    const strategies: OptimizationStrategy[] = [];
    
    // 1. Optimisation PER
    const perStrategy = this.optimizePER(analysis);
    if (perStrategy.eligibility.isEligible) {
      strategies.push(perStrategy);
    }
    
    // 2. Déficit foncier
    const deficitStrategy = this.analyzeDeficitFoncier(portfolio);
    if (deficitStrategy.eligibility.isEligible) {
      strategies.push(deficitStrategy);
    }
    
    // 3. Tax Loss Harvesting
    const harvestingStrategies = this.findHarvestingOpportunities(portfolio);
    strategies.push(...harvestingStrategies);
    
    // 4. Optimisation transmission
    const transmissionStrategies = this.optimizeTransmission(analysis, portfolio);
    strategies.push(...transmissionStrategies);
    
    // 5. Structure holding
    const holdingStrategy = this.analyzeHoldingStructure(analysis, portfolio);
    if (holdingStrategy.eligibility.isEligible) {
      strategies.push(holdingStrategy);
    }
    
    // 6. Investissements défiscalisants
    const defiscalizationStrategies = this.findDefiscalizationOpportunities(analysis);
    strategies.push(...defiscalizationStrategies);
    
    // Trier par ROI décroissant
    return strategies.sort((a, b) => b.roi - a.roi);
  }
}
```

### 3. Interface Utilisateur - Optimiseur Fiscal

Crée une interface complète pour l'optimiseur fiscal :

```typescript
// components/tax/TaxOptimizer.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TaxOptimizer({ userId }: { userId: string }) {
  const [analysis, setAnalysis] = useState(null);
  const [optimizations, setOptimizations] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaxAnalysis();
  }, [userId]);

  const loadTaxAnalysis = async () => {
    try {
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

  const totalPotentialSavings = optimizations.reduce((sum, opt) => sum + opt.estimatedSavings, 0);

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Charge fiscale actuelle</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(analysis?.currentBurden.total || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Économies possibles</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPotentialSavings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Optimisations trouvées</p>
                <p className="text-2xl font-bold">
                  {optimizations.filter(o => o.eligibility.isEligible).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réduction potentielle</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analysis ? ((totalPotentialSavings / analysis.currentBurden.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
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
              <Card key={strategy.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{strategy.name}</h3>
                        <Badge variant="outline">{strategy.complexity}</Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{strategy.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {formatCurrency(strategy.estimatedSavings)} économisés
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>ROI: {(strategy.roi * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{strategy.timeline}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(strategy.estimatedSavings)}
                      </div>
                      <Button
                        onClick={() => setSelectedStrategy(strategy)}
                        disabled={!strategy.eligibility.isEligible}
                        className="mt-2"
                      >
                        Voir Détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Fiscale Détaillée</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Répartition de la charge fiscale</h4>
                    <div className="space-y-3">
                      {Object.entries(analysis.currentBurden).map(([key, value]) => {
                        if (key === 'total') return null;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(value / analysis.currentBurden.total) * 100} 
                                className="w-24"
                              />
                              <span className="font-medium w-20 text-right">
                                {formatCurrency(value)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator">
          <TaxSimulator analysis={analysis} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 4. Routes API pour l'Optimiseur Fiscal

```typescript
// app/api/tax/analysis/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TaxAnalysisService } from '@/services/tax/TaxAnalysisService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taxAnalysisService = new TaxAnalysisService();
    const analysis = await taxAnalysisService.analyzeCurrentSituation(params.userId);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Tax analysis error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### 5. Extension du Modèle Prisma

```prisma
// prisma/schema.prisma - Ajout des modèles fiscaux

model TaxProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Profil fiscal
  tmi       Float    // Tranche marginale d'imposition
  foyer     String   // 'single', 'married', 'pacs'
  nbParts   Float    // Nombre de parts fiscales
  income    Float    // Revenus annuels
  
  // Préférences d'optimisation
  riskTolerance     String   // 'low', 'medium', 'high'
  optimizationGoals String[] // ['reduce_IR', 'reduce_IFI', 'transmission', etc.]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TaxOptimization {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  strategyId  String   // ID de la stratégie d'optimisation
  name        String   // Nom de la stratégie
  category    String   // 'PER', 'deficitFoncier', 'donation', etc.
  
  // Données de l'optimisation
  estimatedSavings Float
  actualSavings    Float?
  status          String   // 'proposed', 'in_progress', 'completed', 'dismissed'
  
  // Métadonnées
  data        Json?    // Données spécifiques à la stratégie
  notes       String?
  
  // Suivi
  proposedAt  DateTime @default(now())
  startedAt   DateTime?
  completedAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 6. Simulateur Fiscal Interactif

```typescript
// components/tax/TaxSimulator.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function TaxSimulator({ analysis }) {
  const [scenarios, setScenarios] = useState({
    perContribution: 0,
    deficitFoncier: 0,
    donation: 0,
    additionalIncome: 0
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const currentTax = analysis?.currentBurden.total || 0;
  const simulatedTax = currentTax - (scenarios.perContribution * (analysis?.userProfile.tmi || 0)) - scenarios.deficitFoncier;
  const savings = currentTax - simulatedTax;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulateur d'Optimisation Fiscale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="per">Versement PER (€)</Label>
                <Slider
                  id="per"
                  min={0}
                  max={35194}
                  step={1000}
                  value={[scenarios.perContribution]}
                  onValueChange={(value) => 
                    setScenarios(prev => ({ ...prev, perContribution: value[0] }))
                  }
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatCurrency(scenarios.perContribution)}
                </div>
              </div>

              <div>
                <Label htmlFor="deficit">Déficit Foncier (€)</Label>
                <Slider
                  id="deficit"
                  min={0}
                  max={50000}
                  step={1000}
                  value={[scenarios.deficitFoncier]}
                  onValueChange={(value) => 
                    setScenarios(prev => ({ ...prev, deficitFoncier: value[0] }))
                  }
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatCurrency(scenarios.deficitFoncier)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Impact Simulé</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Impôts actuels:</span>
                    <span className="font-medium">{formatCurrency(currentTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impôts optimisés:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(simulatedTax)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Économies:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(savings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Réduction:</span>
                    <span className="font-medium text-green-600">
                      {currentTax > 0 ? ((savings / currentTax) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Instructions d'Implémentation

1. **Créer les services fiscaux** :
   - Implémente `TaxAnalysisService` avec tous les calculs fiscaux français
   - Crée `TaxOptimizationEngine` avec toutes les stratégies d'optimisation

2. **Développer l'interface utilisateur** :
   - Composant `TaxOptimizer` avec vue d'ensemble et détails
   - Simulateur interactif avec sliders et graphiques

3. **Configurer les routes API** :
   - Routes pour l'analyse, l'optimisation et la simulation
   - Sécurisation et validation des données

4. **Étendre la base de données** :
   - Ajouter les modèles Prisma pour les profils et optimisations fiscales
   - Créer les migrations nécessaires

5. **Tester l'intégration** :
   - Tests unitaires pour les calculs fiscaux
   - Tests d'intégration pour l'API
   - Tests E2E pour l'interface utilisateur

Cette implémentation fournira un optimiseur fiscal complet et intelligent qui analysera automatiquement la situation de chaque utilisateur et proposera des stratégies personnalisées d'optimisation. 