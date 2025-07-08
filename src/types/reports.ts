export interface FilterState {
  period: string
  customStartDate?: string
  customEndDate?: string
  entities: string[]
  currency: string
  reportType: string
  includeProjections: boolean
  liquidityFilter: string
  geographicFilter: string
  fiscalOptimization: boolean
}

export interface ReportEntity {
  id: string
  name: string
  type: string
}

export interface ReportAsset {
  id: string
  name: string
  assetType: {
    id: string
    name: string
    color?: string
  }
  valuations: Array<{
    value: number
    valuationDate: string
    currency: string
  }>
  ownerships: Array<{
    percentage: number
    ownerEntity: {
      id: string
      name: string
      type: string
    }
  }>
  metadata?: any
}

export interface ReportData {
  totalValue: number
  assetsByType: Record<string, {
    value: number
    count: number
    color: string
    percentage: number
  }>
  assetsByEntity: Array<{
    name: string
    value: number
    type: string
  }>
  performance: {
    totalReturn: number
    annualizedReturn: number
    volatility: number
    sharpeRatio: number
  }
  diversification: {
    herfindahlIndex: number
    concentrationTop3: number
    effectiveAssets: number
  }
  fiscal: {
    ifi: number
    potentialCapitalGains: number
    recommendations: Array<{
      type: 'optimization' | 'warning' | 'opportunity'
      title: string
      description: string
      priority: 'high' | 'medium' | 'low'
    }>
  }
}

export interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json'
  includeSummary: boolean
  includeDetails: boolean
  includeCharts: boolean
  customPeriod?: {
    startDate: string
    endDate: string
  }
}

export type ReportType = 
  | 'bilan_complet'
  | 'performance'
  | 'diversification'
  | 'fiscal'
  | 'liquidite'
  | 'stress_test'
  | 'projection'
  | 'consolidation'

export type Period = 
  | 'current'
  | 'ytd'
  | '1m'
  | '3m'
  | '6m'
  | '1y'
  | '3y'
  | '5y'
  | 'custom'

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY' | string

export type LiquidityFilter = 
  | 'all'
  | 'immediate'
  | 'short'
  | 'medium'
  | 'long'
  | 'illiquid' 