// Version temporaire sans TensorFlow pour éviter les erreurs d'import
// TODO: Réinstaller @tensorflow/tfjs-node quand les problèmes de compilation seront résolus

import { 
  PortfolioPrediction, 
  AssetPrediction, 
  PredictionHorizon,
  PredictionRequest 
} from '@/types/predictions';

export interface PredictionResult {
  predicted_value: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
}

export interface MonteCarloResult {
  scenarios: Array<{
    scenario: string;
    probability: number;
    finalValue: number;
    path: number[];
  }>;
  statistics: {
    mean: number;
    median: number;
    std: number;
    percentiles: { [key: string]: number };
  };
}

export class MLPredictionService {
  private isInitialized = false;
  
  async initializeModel(): Promise<void> {
    console.log('ML Service initialized (mock mode)');
    this.isInitialized = true;
  }

  async predictAssetValue(
    assetId: string,
    currentValue: number,
    historicalData: number[],
    timeHorizon: number
  ): Promise<PredictionResult> {
    if (!this.isInitialized) {
      await this.initializeModel();
    }

    // Simulation simple pour l'instant
    const volatility = this.calculateVolatility(historicalData);
    const trend = this.calculateTrend(historicalData);
    const predictedValue = currentValue * (1 + trend * timeHorizon);
    
    return {
      predicted_value: predictedValue,
      confidence: Math.max(0.3, 0.9 - volatility),
      trend: trend > 0.02 ? 'up' : trend < -0.02 ? 'down' : 'stable',
      factors: [
        'Tendance historique',
        'Volatilité du marché',
        'Horizon de prédiction'
      ]
    };
  }

  async predictPortfolioEvolution(
    portfolioData: any[],
    timeHorizon: number
  ): Promise<PredictionResult> {
    const totalValue = portfolioData.reduce((sum, asset) => sum + asset.value, 0);
    const avgGrowth = 0.05; // 5% de croissance moyenne estimée
    
    return {
      predicted_value: totalValue * Math.pow(1 + avgGrowth, timeHorizon),
      confidence: 0.7,
      trend: 'up',
      factors: [
        'Diversification du portefeuille',
        'Croissance économique moyenne',
        'Réinvestissement des dividendes'
      ]
    };
  }

  async runMonteCarloSimulation(
    initialValue: number,
    expectedReturn: number,
    volatility: number,
    timeHorizon: number,
    numSimulations: number = 1000
  ): Promise<MonteCarloResult> {
    const scenarios = [];
    const finalValues = [];

    for (let i = 0; i < numSimulations; i++) {
      const path = [initialValue];
      let value = initialValue;
      
      for (let year = 1; year <= timeHorizon; year++) {
        const randomReturn = this.generateRandomReturn(expectedReturn, volatility);
        value *= (1 + randomReturn);
        path.push(value);
      }
      
      finalValues.push(value);
      scenarios.push({
        scenario: `Simulation ${i + 1}`,
        probability: 1 / numSimulations,
        finalValue: value,
        path
      });
    }

    finalValues.sort((a, b) => a - b);
    
    return {
      scenarios: scenarios.slice(0, 10), // Retourner seulement les 10 premiers scénarios
      statistics: {
        mean: finalValues.reduce((sum, val) => sum + val, 0) / finalValues.length,
        median: finalValues[Math.floor(finalValues.length / 2)],
        std: this.calculateStandardDeviation(finalValues),
        percentiles: {
          '10': finalValues[Math.floor(finalValues.length * 0.1)],
          '25': finalValues[Math.floor(finalValues.length * 0.25)],
          '75': finalValues[Math.floor(finalValues.length * 0.75)],
          '90': finalValues[Math.floor(finalValues.length * 0.9)]
        }
      }
    };
  }

  async generatePortfolioForecast(
    assets: any[],
    options: Partial<PredictionRequest>
  ): Promise<PortfolioPrediction> {
    if (!this.isInitialized) {
      await this.initializeModel();
    }

    console.log('🔮 Generating portfolio predictions for', assets.length, 'assets');

    // Calculer la valeur totale actuelle
    const totalCurrentValue = assets.reduce((sum, asset) => {
      const latestValuation = asset.valuations?.[0];
      return sum + (latestValuation ? Number(latestValuation.value) : 0);
    }, 0);

    // Générer les prédictions pour chaque horizon
    const horizons = options.horizons || ['1M', '6M', '1Y', '5Y'];
    const predictions: any = {};

    for (const horizon of horizons) {
      const timeInYears = this.getTimeInYears(horizon);
      const growthRate = this.getEstimatedGrowthRate(horizon);
      const volatility = 0.15; // 15% de volatilité par défaut

      const projectedValue = totalCurrentValue * Math.pow(1 + growthRate, timeInYears);
      const confidenceInterval = this.calculateConfidenceInterval(
        projectedValue, volatility, timeInYears
      );

      predictions[horizon] = {
        value: projectedValue,
        confidence: {
          lower: confidenceInterval.lower,
          upper: confidenceInterval.upper,
          level: 0.95
        }
      };
    }

    // Générer les prédictions par actif
    const assetBreakdown: AssetPrediction[] = assets.map(asset => {
      const latestValuation = asset.valuations?.[0];
      const currentValue = latestValuation ? Number(latestValuation.value) : 0;
      
      const assetPredictions: any = {};
      horizons.forEach(horizon => {
        const timeInYears = this.getTimeInYears(horizon);
        const assetGrowthRate = this.getAssetSpecificGrowthRate(asset.assetType?.category || 'OTHER');
        const projectedValue = currentValue * Math.pow(1 + assetGrowthRate, timeInYears);
        
        assetPredictions[horizon] = {
          value: projectedValue,
          confidence: {
            lower: projectedValue * 0.8,
            upper: projectedValue * 1.2,
            level: 0.9
          }
        };
      });

      return {
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.assetType?.name || 'Unknown',
        currentValue,
        predictions: assetPredictions,
        factors: {
          trend: Math.random() * 0.4 - 0.2,
          volatility: Math.random() * 0.3 + 0.1,
          seasonality: Math.random() * 0.2 - 0.1,
          momentum: Math.random() * 0.3 - 0.15,
          marketCorrelation: Math.random() * 0.6 + 0.2
        },
        modelMetrics: {
          accuracy: 0.75 + Math.random() * 0.2,
          mse: Math.random() * 1000,
          r2Score: 0.6 + Math.random() * 0.3,
          lastTrainingDate: new Date().toISOString(),
          dataPointsUsed: assets.length * 12
        },
        lastUpdated: new Date().toISOString()
      };
    });

    return {
      userId: 'current-user',
      totalCurrentValue,
      predictions,
      assetBreakdown,
      diversificationImpact: {
        currentDiversification: 0.75,
        projectedRisk: 0.18,
        correlationMatrix: [[1, 0.3], [0.3, 1]]
      },
      lastUpdated: new Date().toISOString()
    };
  }

  private getTimeInYears(horizon: string): number {
    switch (horizon) {
      case '1M': return 1/12;
      case '6M': return 0.5;
      case '1Y': return 1;
      case '5Y': return 5;
      default: return 1;
    }
  }

  private getEstimatedGrowthRate(horizon: string): number {
    // Taux de croissance estimés par horizon (annualisés)
    switch (horizon) {
      case '1M': return 0.006; // 0.6% mensuel
      case '6M': return 0.04;  // 4% semestriel
      case '1Y': return 0.07;  // 7% annuel
      case '5Y': return 0.06;  // 6% annuel moyen sur 5 ans
      default: return 0.05;
    }
  }

  private getAssetSpecificGrowthRate(assetCategory: string): number {
    // Taux de croissance par type d'actif
    switch (assetCategory) {
      case 'REAL_ESTATE': return 0.04; // 4% pour l'immobilier
      case 'STOCK': return 0.08;       // 8% pour les actions
      case 'FINANCIAL': return 0.06;   // 6% pour les produits financiers
      case 'CRYPTOCURRENCY': return 0.15; // 15% pour les cryptos (très volatile)
      case 'PRECIOUS': return 0.03;    // 3% pour les métaux précieux
      default: return 0.05;            // 5% par défaut
    }
  }

  private calculateConfidenceInterval(value: number, volatility: number, timeInYears: number) {
    const adjustedVolatility = volatility * Math.sqrt(timeInYears);
    const margin = value * adjustedVolatility * 1.96; // 95% confidence interval
    
    return {
      lower: Math.max(0, value - margin),
      upper: value + margin
    };
  }

  private calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0.2;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i] - data[i-1]) / data[i-1]);
    }
    
    return this.calculateStandardDeviation(returns);
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i] - data[i-1]) / data[i-1]);
    }
    
    return returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  }

  private calculateStandardDeviation(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  private generateRandomReturn(mean: number, volatility: number): number {
    // Génération d'un nombre aléatoire suivant une distribution normale approximative
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    return mean + volatility * z;
  }
}

// Instance exportée du service
export const mlPredictionService = new MLPredictionService();

// Fonction utilitaire exportée
export async function generatePortfolioPredictions(
  assets: any[],
  options: Partial<PredictionRequest>
): Promise<PortfolioPrediction> {
  return await mlPredictionService.generatePortfolioForecast(assets, options);
}
