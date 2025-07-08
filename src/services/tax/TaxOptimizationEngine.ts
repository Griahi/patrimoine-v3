import { TaxAnalysisService, TaxAnalysis, Portfolio, EnrichedAsset, RealEstateAsset } from './TaxAnalysisService';

export interface OptimizationStrategy {
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
  private taxAnalysisService: TaxAnalysisService;

  constructor() {
    this.taxAnalysisService = new TaxAnalysisService();
  }

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
    
    // 7. Optimisation frais bancaires
    const bankFeesStrategy = this.optimizeBankFees(portfolio);
    if (bankFeesStrategy.eligibility.isEligible) {
      strategies.push(bankFeesStrategy);
    }
    
    // Trier par ROI décroissant
    return strategies.sort((a, b) => b.roi - a.roi);
  }

  private optimizePER(analysis: TaxAnalysis): OptimizationStrategy {
    const maxPER = Math.min(analysis.userProfile.income * 0.1, 35194); // Plafond 2024
    const optimalAmount = Math.min(maxPER, analysis.currentBurden.IR / analysis.userProfile.tmi);
    const estimatedSavings = optimalAmount * analysis.userProfile.tmi;
    
    return {
      id: 'per-optimization',
      name: 'Optimisation PER',
      category: 'PER',
      description: `Versement optimal de ${optimalAmount.toLocaleString('fr-FR')}€ sur un PER`,
      estimatedSavings,
      roi: optimalAmount > 0 ? estimatedSavings / optimalAmount : 0,
      complexity: 'low',
      timeline: 'Avant le 31 décembre',
      requirements: [
        'Capacité d\'épargne disponible',
        'Horizon de placement long terme'
      ],
      implementation: {
        steps: [
          'Choisir un PER adapté à votre profil',
          'Effectuer le versement avant le 31/12',
          'Déclarer la déduction lors de la déclaration d\'impôts'
        ],
        documents: [
          'Justificatif de versement PER',
          'Relevé annuel du PER'
        ],
        deadlines: [
          '31/12 : Versement sur le PER',
          'Mai N+1 : Déclaration fiscale'
        ]
      },
      risks: [
        'Blocage jusqu\'à la retraite',
        'Imposition à la sortie'
      ],
      eligibility: {
        isEligible: analysis.userProfile.tmi > 0.11 && optimalAmount > 1000,
        reasons: analysis.userProfile.tmi <= 0.11 ? 
          ['TMI trop faible pour optimiser'] : 
          optimalAmount <= 1000 ? ['Montant d\'optimisation trop faible'] : []
      }
    };
  }

  private analyzeDeficitFoncier(portfolio: Portfolio): OptimizationStrategy {
    const rentalProperties = portfolio.realEstate.filter(p => p.isRental);
    
    if (rentalProperties.length === 0) {
      return {
        id: 'deficit-foncier',
        name: 'Déficit Foncier',
        category: 'deficitFoncier',
        description: 'Pas de bien locatif détecté',
        estimatedSavings: 0,
        roi: 0,
        complexity: 'medium',
        timeline: 'Non applicable',
        requirements: [],
        implementation: { steps: [], documents: [], deadlines: [] },
        risks: [],
        eligibility: {
          isEligible: false,
          reasons: ['Aucun bien locatif en portefeuille']
        }
      };
    }
    
    // Calcul du potentiel de déficit foncier
    let totalDeficitPotential = 0;
    const worksByProperty = [];
    
    for (const property of rentalProperties) {
      const estimatedWorks = this.estimateDeductibleWorks(property);
      const maxDeductible = Math.min(estimatedWorks, 10700); // Plafond déficit foncier
      totalDeficitPotential += maxDeductible;
      
      worksByProperty.push({
        property: property.name,
        estimatedWorks,
        maxDeductible,
        workTypes: this.getRecommendedWorks(property)
      });
    }
    
    const estimatedSavings = totalDeficitPotential * 0.45; // TMI moyen
    
    return {
      id: 'deficit-foncier',
      name: 'Déficit Foncier',
      category: 'deficitFoncier',
      description: `Travaux déductibles sur ${rentalProperties.length} bien(s) locatif(s)`,
      estimatedSavings,
      roi: totalDeficitPotential > 0 ? estimatedSavings / totalDeficitPotential : 0,
      complexity: 'medium',
      timeline: '3 à 6 mois',
      requirements: [
        'Travaux d\'amélioration nécessaires',
        'Bien loué ou destiné à la location'
      ],
      implementation: {
        steps: [
          'Évaluer les travaux nécessaires',
          'Obtenir des devis détaillés',
          'Réaliser les travaux avant le 31/12',
          'Conserver toutes les factures'
        ],
        documents: [
          'Devis détaillés des travaux',
          'Factures acquittées',
          'Justificatifs de paiement'
        ],
        deadlines: [
          '31/12 : Travaux terminés et payés',
          'Mai N+1 : Déclaration du déficit'
        ]
      },
      risks: [
        'Requalification en charges déductibles',
        'Contrôle fiscal sur la nature des travaux'
      ],
      eligibility: {
        isEligible: totalDeficitPotential > 1000,
        reasons: totalDeficitPotential <= 1000 ? 
          ['Potentiel de déficit foncier insuffisant'] : []
      }
    };
  }

  private findHarvestingOpportunities(portfolio: Portfolio): OptimizationStrategy[] {
    const strategies = [];
    const stocks = portfolio.assets.filter(a => a.type === 'stock');
    
    // Séparer gains et pertes latentes
    const latentLosses = stocks.filter(s => s.unrealizedPnL && s.unrealizedPnL < 0);
    const latentGains = stocks.filter(s => s.unrealizedPnL && s.unrealizedPnL > 0);
    
    if (latentLosses.length > 0 && latentGains.length > 0) {
      const totalLosses = latentLosses.reduce((sum, s) => sum + Math.abs(s.unrealizedPnL!), 0);
      const totalGains = latentGains.reduce((sum, s) => sum + s.unrealizedPnL!, 0);
      const compensationAmount = Math.min(totalLosses, totalGains);
      const taxSavings = compensationAmount * 0.30; // Flat tax
      
      strategies.push({
        id: 'tax-loss-harvesting',
        name: 'Tax Loss Harvesting',
        category: 'reduction',
        description: 'Compensation des plus-values par des moins-values',
        estimatedSavings: taxSavings,
        roi: compensationAmount > 0 ? taxSavings / compensationAmount : 0,
        complexity: 'low',
        timeline: 'Immédiat',
        requirements: [
          'Positions perdantes disponibles',
          'Stratégie de réinvestissement'
        ],
        implementation: {
          steps: [
            'Identifier les positions perdantes',
            'Vendre les actions en moins-value',
            'Réaliser les plus-values',
            'Réinvestir selon la stratégie'
          ],
          documents: [
            'Ordres de bourse',
            'Relevés de positions'
          ],
          deadlines: [
            '31/12 : Réalisation des opérations'
          ]
        },
        risks: [
          'Règle des 30 jours',
          'Modification de l\'allocation'
        ],
        eligibility: {
          isEligible: compensationAmount > 500,
          reasons: compensationAmount <= 500 ? 
            ['Montant de compensation trop faible'] : []
        }
      });
    }
    
    return strategies;
  }

  private optimizeTransmission(analysis: TaxAnalysis, portfolio: Portfolio): OptimizationStrategy[] {
    const strategies = [];
    
    // Donations si patrimoine important et âge approprié
    if (analysis.patrimonialContext.netWorth > 500000 && analysis.userProfile.age > 50) {
      const donationAmount = Math.min(100000, analysis.patrimonialContext.netWorth * 0.1);
      const taxSavings = donationAmount * 0.2; // Économie future sur IFI/droits de succession
      
      strategies.push({
        id: 'donation-optimization',
        name: 'Optimisation Donations',
        category: 'donation',
        description: `Donation de ${donationAmount.toLocaleString('fr-FR')}€ pour optimiser la transmission`,
        estimatedSavings: taxSavings,
        roi: donationAmount > 0 ? taxSavings / donationAmount : 0,
        complexity: 'medium',
        timeline: '2 à 3 mois',
        requirements: [
          'Patrimoine important',
          'Héritiers identifiés'
        ],
        implementation: {
          steps: [
            'Consulter un notaire',
            'Choisir les biens à donner',
            'Effectuer la donation',
            'Déclarer la donation'
          ],
          documents: [
            'Acte de donation',
            'Déclaration de donation'
          ],
          deadlines: [
            '1 mois : Déclaration de donation'
          ]
        },
        risks: [
          'Dessaisissement définitif',
          'Réduction si succession dans les 15 ans'
        ],
        eligibility: {
          isEligible: true,
          reasons: []
        }
      });
    }
    
    return strategies;
  }

  private analyzeHoldingStructure(analysis: TaxAnalysis, portfolio: Portfolio): OptimizationStrategy {
    const eligibleForHolding = analysis.patrimonialContext.netWorth > 500000 && 
                              analysis.userProfile.tmi >= 0.41;
    
    if (!eligibleForHolding) {
      return {
        id: 'holding-structure',
        name: 'Structure Holding',
        category: 'structure',
        description: 'Structure holding non recommandée',
        estimatedSavings: 0,
        roi: 0,
        complexity: 'high',
        timeline: 'Non applicable',
        requirements: [],
        implementation: { steps: [], documents: [], deadlines: [] },
        risks: [],
        eligibility: {
          isEligible: false,
          reasons: ['Patrimoine ou TMI insuffisant']
        }
      };
    }
    
    const estimatedSavings = analysis.patrimonialContext.netWorth * 0.05; // 5% d'économie estimée
    
    return {
      id: 'holding-structure',
      name: 'Structure Holding',
      category: 'structure',
      description: 'Création d\'une structure holding pour optimiser la fiscalité',
      estimatedSavings,
      roi: 0.25, // 25% sur les coûts de mise en place
      complexity: 'high',
      timeline: '6 à 12 mois',
      requirements: [
        'Patrimoine important',
        'TMI élevée',
        'Activité entrepreneuriale'
      ],
      implementation: {
        steps: [
          'Consulter un expert-comptable',
          'Constituer la holding',
          'Transférer les actifs',
          'Optimiser la rémunération'
        ],
        documents: [
          'Statuts de la holding',
          'Actes de transfert',
          'Déclarations fiscales'
        ],
        deadlines: [
          '6 mois : Constitution de la holding',
          '12 mois : Transfert des actifs'
        ]
      },
      risks: [
        'Complexité administrative',
        'Risque de requalification',
        'Coûts de fonctionnement'
      ],
      eligibility: {
        isEligible: true,
        reasons: []
      }
    };
  }

  private findDefiscalizationOpportunities(analysis: TaxAnalysis): OptimizationStrategy[] {
    const strategies = [];
    
    // Loi Pinel (si éligible)
    if (analysis.userProfile.tmi >= 0.30) {
      const investmentAmount = Math.min(300000, analysis.patrimonialContext.netWorth * 0.2);
      const taxReduction = investmentAmount * 0.12; // 12% sur 6 ans minimum
      
      strategies.push({
        id: 'loi-pinel',
        name: 'Investissement Pinel',
        category: 'reduction',
        description: 'Réduction d\'impôt de 12% à 21% sur 6 à 12 ans',
        estimatedSavings: taxReduction,
        roi: 0.12, // Minimum 12%
        complexity: 'high',
        timeline: '6 à 12 mois',
        requirements: [
          'Capacité d\'investissement',
          'Engagement locatif',
          'Plafonds de loyers respectés'
        ],
        implementation: {
          steps: [
            'Identifier un programme éligible',
            'Réserver le logement',
            'Finaliser le financement',
            'Signer l\'acte authentique'
          ],
          documents: [
            'Contrat de réservation',
            'Attestation Pinel',
            'Acte de vente'
          ],
          deadlines: [
            '31/12 : Signature de l\'acte'
          ]
        },
        risks: [
          'Risques locatifs',
          'Évolution du marché immobilier',
          'Modification de la législation'
        ],
        eligibility: {
          isEligible: analysis.userProfile.tmi >= 0.30,
          reasons: analysis.userProfile.tmi < 0.30 ? 
            ['TMI insuffisante pour optimiser'] : []
        }
      });
    }
    
    return strategies;
  }

  private optimizeBankFees(portfolio: Portfolio): OptimizationStrategy {
    const totalMonthlyFees = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.monthlyFees, 0);
    const annualFees = totalMonthlyFees * 12;
    
    if (annualFees < 300) {
      return {
        id: 'bank-fees',
        name: 'Optimisation Frais Bancaires',
        category: 'reduction',
        description: 'Frais bancaires acceptables',
        estimatedSavings: 0,
        roi: 0,
        complexity: 'low',
        timeline: 'Non applicable',
        requirements: [],
        implementation: { steps: [], documents: [], deadlines: [] },
        risks: [],
        eligibility: {
          isEligible: false,
          reasons: ['Frais bancaires déjà optimisés']
        }
      };
    }
    
    const potentialSavings = annualFees * 0.6; // 60% d'économie possible
    
    return {
      id: 'bank-fees',
      name: 'Optimisation Frais Bancaires',
      category: 'reduction',
      description: `Réduction des frais bancaires de ${annualFees.toLocaleString('fr-FR')}€/an`,
      estimatedSavings: potentialSavings,
      roi: 5, // ROI très élevé
      complexity: 'low',
      timeline: '1 à 2 mois',
      requirements: [
        'Négociation avec sa banque',
        'Comparaison des offres'
      ],
      implementation: {
        steps: [
          'Analyser ses frais bancaires',
          'Comparer les offres bancaires',
          'Négocier avec sa banque',
          'Changer de banque si nécessaire'
        ],
        documents: [
          'Relevés bancaires',
          'Grilles tarifaires'
        ],
        deadlines: [
          '2 mois : Négociation terminée'
        ]
      },
      risks: [
        'Changement de banque',
        'Procédures administratives'
      ],
      eligibility: {
        isEligible: true,
        reasons: []
      }
    };
  }

  private estimateDeductibleWorks(property: RealEstateAsset): number {
    // Estimation basée sur l'âge et la valeur du bien
    const baseAmount = property.currentValue * 0.02; // 2% de la valeur
    const ageBonus = property.metadata?.age > 20 ? property.currentValue * 0.03 : 0;
    return Math.min(baseAmount + ageBonus, 50000); // Plafond raisonnable
  }

  private getRecommendedWorks(property: RealEstateAsset): string[] {
    return [
      'Travaux d\'amélioration',
      'Rénovation énergétique',
      'Mise aux normes',
      'Aménagement locatif'
    ];
  }

  private async getPortfolioData(userId: string): Promise<Portfolio> {
    // Réutiliser la méthode du TaxAnalysisService
    return await this.taxAnalysisService.getPortfolioData(userId);
  }
} 