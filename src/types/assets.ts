// Financing form data interface
export interface FinancingFormData {
  name: string
  debtType: 'LOAN' | 'MORTGAGE' | 'CREDIT_LINE' | 'BOND' | 'OTHER'
  initialAmount: number
  interestRate: number
  duration: number
  amortizationType: 'PROGRESSIVE' | 'LINEAR' | 'IN_FINE' | 'BULLET'
  startDate: string
  lender: string
  notes: string
}

// Base asset form data interface
export interface BaseAssetFormData {
  name: string
  description: string
  assetTypeId: string
  owners: Array<{
    entityId: string
    percentage: number
  }>
  initialValue: number
  valuationDate: string
  metadata: Record<string, any>
  // Optional financing data
  hasFinancing?: boolean
  financing?: FinancingFormData
}

// Specific metadata interfaces for each asset type
export interface StockMetadata {
  isin: string
  symbol: string
  quantity: number
  unitPurchasePrice: number
  currentPrice: number
  currency: string
  marketPlace: string
  brokerFees: number
}

export interface LifeInsuranceMetadata {
  contractNumber: string
  insuranceCompany: string
  subscriptionDate: string
  type: 'savings' | 'provident'
  premiumPayments: number
  surrenderValue: number
  beneficiaries: string
}

export interface BankAccountMetadata {
  iban: string
  bic: string
  bank: string
  accountType: 'current' | 'savings' | 'term'
  currentBalance: number
  currency: string
  interestRate: number
}

export interface CryptocurrencyMetadata {
  symbol: string
  quantity: number
  averagePurchasePrice: number
  platform: string
  walletAddress?: string
}

export interface InvestmentFundMetadata {
  isin: string
  fundName: string
  fundType: 'OPCVM' | 'FCP' | 'SICAV' | 'ETF'
  numberOfShares: number
  purchaseNavPrice: number
  currentNavPrice: number
  managementFees: number
}

export interface RealEstateMetadata {
  propertyType: 'apartment' | 'house' | 'land' | 'commercial'
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  surface: number
  rooms: number
  purchasePrice: number
  notaryFees: number
  renovationCosts: number
  monthlyRent: number
  annualPropertyTax: number
}

export interface PreciousMetalMetadata {
  metalType: 'gold' | 'silver' | 'platinum' | 'palladium'
  form: 'ingot' | 'coin'
  weight: number
  weightUnit: 'grams' | 'ounces'
  purity: number
  pricePerUnit: number
  storageLocation: string
}

export interface ValuableObjectMetadata {
  category: 'art' | 'jewelry' | 'watches' | 'collection'
  brand: string
  model: string
  year: number
  condition: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor'
  hasAuthenticityCertificate: boolean
  hasSpecificInsurance: boolean
  insuranceValue?: number
}

export interface VehicleMetadata {
  vehicleType: 'car' | 'motorcycle' | 'boat' | 'other'
  brand: string
  model: string
  registrationNumber: string
  firstRegistrationDate: string
  mileage: number
  fuelType: string
  purchasePrice: number
  currentMarketValue: number
}

export interface InterEntityLoanMetadata {
  borrowerEntityId: string
  borrowerEntityName: string
  lenderEntityId: string
  lenderEntityName: string
  loanPurpose: string
  contractDate: string
  guarantees?: string
  legalDocumentRef?: string
}

export interface OtherMetadata {
  customCategory: string
  customFields: Array<{
    key: string
    value: string
    type: 'text' | 'number' | 'date' | 'boolean'
  }>
}

// Union type for all possible metadata
export type AssetMetadata = 
  | StockMetadata
  | LifeInsuranceMetadata
  | BankAccountMetadata
  | CryptocurrencyMetadata
  | InvestmentFundMetadata
  | RealEstateMetadata
  | PreciousMetalMetadata
  | ValuableObjectMetadata
  | VehicleMetadata
  | InterEntityLoanMetadata
  | OtherMetadata

// Asset type codes mapping
export const ASSET_TYPE_CODES = {
  STOCKS: 'stocks',
  LIFE_INSURANCE: 'life_insurance',
  BANK_ACCOUNTS: 'bank_accounts',
  CRYPTO: 'crypto',
  INVESTMENT_FUNDS: 'investment_funds',
  REAL_ESTATE: 'real_estate',
  PRECIOUS_METALS: 'precious_metals',
  VALUABLE_OBJECTS: 'collectibles',
  VEHICLES: 'vehicles',
  INTER_ENTITY_LOAN: 'inter_entity_loan',
  OTHER: 'other'
} as const

export type AssetTypeCode = typeof ASSET_TYPE_CODES[keyof typeof ASSET_TYPE_CODES]

// Form validation rules
export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface FieldConfig {
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox'
  validation?: ValidationRule
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  unit?: string
} 