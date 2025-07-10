import { Asset, Entity, Valuation, AssetType, Debt } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface TaxAnalysis {
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

export interface Portfolio {
  totalValue: number;
  realEstateValue: number;
  financialAssets: number;
  professionalAssets: number;
  totalDebts: number;
  assets: EnrichedAsset[];
  realEstate: RealEstateAsset[];
  bankAccounts: BankAccount[];
}

export interface EnrichedAsset {
  id: string;
  name: string;
  type: string;
  currentValue: number;
  metadata: any;
  unrealizedPnL?: number;
  ticker?: string;
  isRental?: boolean;
}

export interface RealEstateAsset {
  id: string;
  name: string;
  address: string;
  currentValue: number;
  isRental: boolean;
  location?: {
    city: string;
    region: string;
  };
  size?: number;
  propertyType?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  monthlyFees: number;
}

export interface UserProfile {
  income: number;
  foyer: 'single' | 'married' | 'pacs';
  nbParts: number;
  age: number;
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
    
    // Déterminer la TMI
    const tmi = this.calculateTMI(userProfile.income, userProfile.foyer, userProfile.nbParts);
    
    return {
      currentBurden: {
        IR,
        IFI,
        plusValues,
        prelevementsSociaux,
        taxeFonciere,
        total: IR + IFI + plusValues + prelevementsSociaux + taxeFonciere
      },
      userProfile: {
        ...userProfile,
        tmi
      },
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

  async simulateOptimizations(userId: string, scenarios: {
    perContribution: number;
    deficitFoncier: number;
    donation: number;
    additionalIncome: number;
  }): Promise<TaxAnalysis> {
    // Récupérer l'analyse de base
    const baseAnalysis = await this.analyzeCurrentSituation(userId);
    
    // Calculer les économies d'impôt
    const perTaxSaving = scenarios.perContribution * baseAnalysis.userProfile.tmi;
    const deficitTaxSaving = scenarios.deficitFoncier * baseAnalysis.userProfile.tmi;
    
    // Calculer les nouveaux montants d'impôts
    const optimizedIR = Math.max(0, baseAnalysis.currentBurden.IR - perTaxSaving - deficitTaxSaving);
    
    // Retourner l'analyse optimisée
    return {
      ...baseAnalysis,
      currentBurden: {
        ...baseAnalysis.currentBurden,
        IR: optimizedIR,
        total: optimizedIR + baseAnalysis.currentBurden.IFI + 
               baseAnalysis.currentBurden.plusValues + 
               baseAnalysis.currentBurden.prelevementsSociaux + 
               baseAnalysis.currentBurden.taxeFonciere
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

  private calculateTMI(income: number, foyer: string, nbParts: number): number {
    // Déterminer la tranche marginale d'imposition
    const quotientFamilial = income / nbParts;
    
    if (quotientFamilial <= 11294) return 0;
    if (quotientFamilial <= 28797) return 0.11;
    if (quotientFamilial <= 82341) return 0.30;
    if (quotientFamilial <= 177106) return 0.41;
    return 0.45;
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

  private calculatePlusValues(assets: EnrichedAsset[]): number {
    // Calculer les plus-values réalisées (simulé)
    let totalPlusValues = 0;
    
    for (const asset of assets) {
      if (asset.type === 'stock' && asset.unrealizedPnL && asset.unrealizedPnL > 0) {
        // Simuler qu'on a réalisé 10% des plus-values latentes
        totalPlusValues += asset.unrealizedPnL * 0.1;
      }
    }
    
    // Appliquer la flat tax de 30%
    return totalPlusValues * 0.30;
  }

  private calculatePrelevementsSociaux(portfolio: Portfolio): number {
    // Prélèvements sociaux sur revenus financiers (17,2%)
    const estimatedFinancialIncome = portfolio.financialAssets * 0.02; // 2% de rendement estimé
    return estimatedFinancialIncome * 0.172;
  }

  private estimateTaxeFonciere(realEstate: RealEstateAsset[]): number {
    // Estimation de la taxe foncière (environ 1% de la valeur locative cadastrale)
    return realEstate.reduce((total, property) => {
      return total + (property.currentValue * 0.005); // 0.5% de la valeur
    }, 0);
  }

  public async getPortfolioData(userId: string): Promise<Portfolio> {
    // Récupérer les entités de l'utilisateur
    const entities = await prisma.entity.findMany({
      where: { userId }
    });

    // Récupérer les actifs via les ownerships
    const ownerships = await prisma.ownership.findMany({
      where: {
        ownerEntityId: { in: entities.map(e => e.id) }
      },
      include: {
        ownedAsset: {
          include: {
            assetType: true,
            valuations: {
              orderBy: { valuationDate: 'desc' },
              take: 1
            },
            debts: true
          }
        }
      }
    });

    // Traiter les données
    const assets: EnrichedAsset[] = [];
    const realEstate: RealEstateAsset[] = [];
    const bankAccounts: BankAccount[] = [];
    let totalValue = 0;
    let realEstateValue = 0;
    let financialAssets = 0;
    let professionalAssets = 0;
    let totalDebts = 0;

    for (const ownership of ownerships) {
      const asset = ownership.ownedAsset;
      if (!asset) continue;

      const currentValue = asset.valuations[0]?.value || 0;
      const debt = asset.debts?.[0]?.currentAmount || 0;
      const netValue = currentValue - debt;

      totalValue += netValue;
      totalDebts += debt;

      const enrichedAsset: EnrichedAsset = {
        id: asset.id,
        name: asset.name,
        type: asset.assetType.code,
        currentValue: netValue,
        metadata: asset.metadata,
        unrealizedPnL: this.calculateUnrealizedPnL(asset.metadata, currentValue),
        ticker: asset.metadata?.ticker
      };

      assets.push(enrichedAsset);

      // Catégoriser par type
      if (asset.assetType.code === 'real_estate') {
        realEstateValue += netValue;
        realEstate.push({
          id: asset.id,
          name: asset.name,
          address: asset.metadata?.address || '',
          currentValue: netValue,
          isRental: asset.metadata?.isRental || false,
          location: asset.metadata?.location,
          size: asset.metadata?.size,
          propertyType: asset.metadata?.propertyType
        });
      } else if (['stock', 'bond', 'fund', 'cryptocurrency'].includes(asset.assetType.code)) {
        financialAssets += netValue;
      } else if (asset.assetType.code === 'bank_account') {
        bankAccounts.push({
          id: asset.id,
          name: asset.name,
          monthlyFees: asset.metadata?.monthlyFees || 0
        });
      } else {
        professionalAssets += netValue;
      }
    }

    return {
      totalValue,
      realEstateValue,
      financialAssets,
      professionalAssets,
      totalDebts,
      assets,
      realEstate,
      bankAccounts
    };
  }

  private calculateUnrealizedPnL(metadata: any, currentValue: number): number {
    const purchasePrice = metadata?.purchasePrice || currentValue;
    return currentValue - purchasePrice;
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    // Récupérer le profil utilisateur (à adapter selon votre modèle)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Valeurs par défaut (à adapter selon vos données)
    return {
      income: user?.metadata?.income || 50000,
      foyer: user?.metadata?.foyer || 'single',
      nbParts: user?.metadata?.nbParts || 1,
      age: user?.metadata?.age || 35
    };
  }
} 