export interface PredictionHorizon {
  value: number;
  confidence: {
    lower: number;
    upper: number;
    level: number; // 0.95 pour 95%
  };
}

export interface AssetPrediction {
  assetId: string;
  assetName: string;
  assetType: string;
  currentValue: number;
  predictions: {
    '1M': PredictionHorizon;
    '6M': PredictionHorizon;
    '1Y': PredictionHorizon;
    '5Y': PredictionHorizon;
  };
  factors: {
    trend: number;           // Tendance générale (-1 à 1)
    volatility: number;      // Volatilité (0 à 1)
    seasonality: number;     // Saisonnalité (-1 à 1)
    momentum: number;        // Momentum (-1 à 1)
    marketCorrelation: number; // Corrélation avec le marché (-1 à 1)
  };
  modelMetrics: {
    accuracy: number;        // Précision du modèle (0 à 1)
    mse: number;            // Mean Squared Error
    r2Score: number;        // R² Score
    lastTrainingDate: string;
    dataPointsUsed: number;
  };
  lastUpdated: string;
}

export interface PortfolioPrediction {
  userId: string;
  totalCurrentValue: number;
  predictions: {
    '1M': PredictionHorizon;
    '6M': PredictionHorizon;
    '1Y': PredictionHorizon;
    '5Y': PredictionHorizon;
  };
  assetBreakdown: AssetPrediction[];
  diversificationImpact: {
    currentDiversification: number;
    projectedRisk: number;
    correlationMatrix: number[][];
  };
  lastUpdated: string;
}

export interface MonteCarloScenario {
  scenarioId: number;
  finalValue: number;
  path: number[];          // Valeurs intermédiaires
  parameters: {
    inflation: number;
    marketVolatility: number;
    interestRates: number;
    realEstateGrowth: number;
    stockMarketReturn: number;
  };
}

export interface MonteCarloResult {
  totalScenarios: number;
  timeHorizonYears: number;
  currentValue: number;
  scenarios: MonteCarloScenario[];
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    percentiles: {
      p5: number;
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
    };
  };
  probabilityAnalysis: {
    probabilityOfGain: number;
    probabilityOfLoss: number;
    probabilityOfDoubling: number;
    probabilityOfTarget: (target: number) => number;
  };
  worstCaseScenario: MonteCarloScenario;
  bestCaseScenario: MonteCarloScenario;
  runDate: string;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  parameters: {
    interestRateChange?: number;     // Changement des taux (en points de %)
    inflationChange?: number;        // Changement de l'inflation
    realEstateMarketChange?: number; // Changement du marché immobilier
    stockMarketChange?: number;      // Changement du marché actions
    monthlyInvestment?: number;      // Investissement mensuel additionnel
    assetSale?: {                   // Vente d'un actif
      assetId: string;
      saleDate: string;
      salePrice?: number;
    };
    assetPurchase?: {               // Achat d'un actif
      assetType: string;
      purchasePrice: number;
      purchaseDate: string;
    };
  };
  impact: {
    currentValue: number;
    projectedValue1Y: number;
    projectedValue5Y: number;
    differenceFromBaseline: {
      absolute1Y: number;
      percentage1Y: number;
      absolute5Y: number;
      percentage5Y: number;
    };
  };
}

export interface PredictionFactors {
  macroEconomic: {
    currentInflation: number;
    currentInterestRate: number;
    gdpGrowth: number;
    unemploymentRate: number;
    lastUpdated: string;
  };
  marketFactors: {
    stockMarketVolatility: number;
    realEstateMarketTrend: number;
    commodityPrices: number;
    currencyStrength: number;
  };
  assetSpecificFactors: {
    [assetType: string]: {
      averageReturn: number;
      volatility: number;
      correlation: number;
      seasonality: number[];  // 12 mois
    };
  };
}

export interface TimeSeriesData {
  date: string;
  value: number;
  volume?: number;
  metadata?: Record<string, any>;
}

export interface ModelTrainingData {
  assetId: string;
  timeSeries: TimeSeriesData[];
  features: {
    movingAverage_30: number[];
    movingAverage_90: number[];
    volatility_30: number[];
    momentum: number[];
    seasonality: number[];
    marketCorrelation: number[];
  };
  labels: number[];  // Valeurs futures à prédire
}

export interface MLModelConfig {
  modelType: 'LSTM' | 'GRU' | 'TRANSFORMER' | 'LINEAR';
  hyperparameters: {
    sequenceLength: number;    // Nombre de points historiques
    hiddenUnits: number;      // Unités cachées
    learningRate: number;
    epochs: number;
    batchSize: number;
    dropoutRate: number;
  };
  features: string[];         // Features utilisées
  validationSplit: number;    // Pourcentage pour validation
}

export interface PredictionRequest {
  assetId?: string;           // Pour prédiction d'un actif spécifique
  userId: string;             // Pour prédiction de portfolio
  horizons: ('1M' | '6M' | '1Y' | '5Y')[];
  includeConfidenceIntervals: boolean;
  includeMonteCarlo?: {
    scenarios: number;
    timeHorizonYears: number;
  };
  whatIfScenarios?: WhatIfScenario[];
  forceRetrain?: boolean;     // Forcer le réentraînement du modèle
}

export interface PredictionResponse {
  success: boolean;
  data?: AssetPrediction | PortfolioPrediction;
  monteCarlo?: MonteCarloResult;
  whatIfResults?: WhatIfScenario[];
  errors?: string[];
  metadata: {
    processingTimeMs: number;
    modelVersion: string;
    dataPointsUsed: number;
    confidenceLevel: number;
  };
}

// Types pour les composants UI
export interface ChartDataPoint {
  date: string;
  historical?: number;
  predicted?: number;
  upperBound?: number;
  lowerBound?: number;
  isProjection: boolean;
}

export interface PredictionChartProps {
  assetId?: string;
  portfolioData?: PortfolioPrediction;
  selectedHorizon: '1M' | '6M' | '1Y' | '5Y';
  showConfidenceInterval: boolean;
  height?: number;
  onHorizonChange?: (horizon: '1M' | '6M' | '1Y' | '5Y') => void;
  onExportChart?: () => void;
}

export interface MonteCarloChartProps {
  result: MonteCarloResult;
  showPercentiles: boolean;
  highlightedScenarios?: number[];
  onScenarioHover?: (scenario: MonteCarloScenario | null) => void;
} 