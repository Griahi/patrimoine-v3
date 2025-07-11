export interface ScenarioAction {
  id?: string;
  type: 'SELL' | 'BUY' | 'INVEST' | 'YIELD' | 'EXPENSE' | 'TAX';
  name: string;
  executionDate: Date;
  targetAssetId?: string;
  assetType?: string;
  amount: number;
  parameters: ScenarioActionParameters;
  order: number;
}

export interface ScenarioActionParameters {
  // Pour SELL
  sellPrice?: number;
  sellPriceType?: 'MARKET' | 'FIXED' | 'PERCENTAGE';
  capitalGainsTax?: boolean;
  
  // Pour BUY
  assetDetails?: {
    name: string;
    category: string;
    expectedReturn?: number;
  };
  financing?: {
    type: 'CASH' | 'LOAN' | 'MIXED';
    loanAmount?: number;
    interestRate?: number;
    duration?: number;
  };
  
  // Pour INVEST
  investmentType?: string;
  monthlyAmount?: number;
  expectedYield?: number;
  
  // Pour YIELD
  yieldPercentage?: number;
  targetAssets?: 'ALL' | 'CATEGORY' | 'SPECIFIC';
  assetCategory?: string;
  assetIds?: string[];
  
  // Pour EXPENSE
  expenseType?: string;
  isRecurring?: boolean;
  
  // Pour TAX
  taxType?: string;
  taxRate?: number;
  
  // Commun
  recurring?: boolean;
  recurringPeriod?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  endDate?: Date;
  notes?: string;
}

export interface ProjectionPoint {
  date: string;
  totalValue: number;
  liquidValue: number;
  netValue: number; // Après dettes
  breakdown: {
    [category: string]: number;
  };
  cashflow: number;
  debt: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
}

export interface ProjectionMetrics {
  initialValue: number;
  finalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  maxDrawdown: number;
  maxDrawdownDate?: string;
  volatility: number;
  sharpeRatio: number;
  liquidityRatio: number;
  debtRatio: number;
  taxImpact: number;
  bestMonth?: string;
  worstMonth?: string;
}

export interface ScenarioComparison {
  baseline: {
    data: ProjectionPoint[];
    metrics: ProjectionMetrics;
  };
  scenarios: {
    [scenarioId: string]: {
      name: string;
      data: ProjectionPoint[];
      metrics: ProjectionMetrics;
      insights: string[];
      betterThanBaseline: boolean;
      deltaPercentage: number;
    };
  };
}

export interface TimeHorizon {
  value: '1M' | '6M' | '1Y' | '5Y' | '10Y';
  label: string;
  months: number;
}

export const TIME_HORIZONS: TimeHorizon[] = [
  { value: '1M', label: '1 mois', months: 1 },
  { value: '6M', label: '6 mois', months: 6 },
  { value: '1Y', label: '1 an', months: 12 },
  { value: '5Y', label: '5 ans', months: 60 },
  { value: '10Y', label: '10 ans', months: 120 }
]; 