import { z } from 'zod'

// Schemas de validation Zod pour chaque type de données
export const EntitySchema = z.object({
  name: z.string().min(1, 'Le nom de l\'entité est requis'),
  type: z.enum(['PHYSICAL_PERSON', 'LEGAL_ENTITY'], {
    errorMap: () => ({ message: 'Le type doit être "PHYSICAL_PERSON" ou "LEGAL_ENTITY"' })
  }),
  taxId: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
})

export const AssetSchema = z.object({
  name: z.string().min(1, 'Le nom de l\'actif est requis'),
  type: z.string().min(1, 'Le type d\'actif est requis'),
  currentValue: z.number().positive('La valeur doit être positive'),
  currency: z.string().length(3, 'La devise doit faire 3 caractères (ex: EUR)'),
  valuationDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  description: z.string().optional(),
})

export const BankAccountSchema = z.object({
  bank: z.string().min(1, 'Le nom de la banque est requis'),
  type: z.enum(['current', 'savings', 'securities', 'pea']),
  iban: z.string().optional(),
  balance: z.number(),
  currency: z.string().length(3, 'La devise doit faire 3 caractères'),
  entityOwner: z.string().min(1, 'L\'entité propriétaire est requise'),
})

export const StockSchema = z.object({
  symbol: z.string().min(1, 'Le symbole est requis'),
  name: z.string().min(1, 'Le nom est requis'),
  quantity: z.number().positive('La quantité doit être positive'),
  averagePrice: z.number().positive('Le prix moyen doit être positif'),
  currency: z.string().length(3, 'La devise doit faire 3 caractères'),
  account: z.string().optional(),
})

export const RealEstateSchema = z.object({
  address: z.string().min(1, 'L\'adresse est requise'),
  type: z.enum(['apartment', 'house', 'land', 'commercial']),
  surface: z.number().positive('La surface doit être positive').optional(),
  rooms: z.number().int().positive('Le nombre de pièces doit être un entier positif').optional(),
  estimatedValue: z.number().positive('La valeur estimée doit être positive'),
  remainingDebt: z.number().min(0, 'La dette ne peut pas être négative').optional(),
  monthlyRent: z.number().min(0, 'Le loyer ne peut pas être négatif').optional(),
  entityOwner: z.string().min(1, 'L\'entité propriétaire est requise'),
})

export const OwnershipSchema = z.object({
  ownerEntity: z.string().min(1, 'L\'entité propriétaire est requise'),
  ownedAssetOrEntity: z.string().min(1, 'L\'actif ou entité détenu(e) est requis(e)'),
  percentage: z.number().min(0.01, 'Le pourcentage doit être supérieur à 0').max(100, 'Le pourcentage ne peut pas dépasser 100'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Date invalide').optional(),
})

// Interface pour les erreurs de validation
export interface ValidationError {
  sheet: string
  row: number
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  data: {
    entities: any[]
    assets: any[]
    bankAccounts: any[]
    stockPortfolio: any[]
    realEstate: any[]
    ownership: any[]
  }
}

// Mappage des colonnes Excel vers les champs de l'objet
const COLUMN_MAPPINGS = {
  entities: {
    'Nom Entité': 'name',
    'Type': 'type',
    'Numéro SIREN/INSEE': 'taxId',
    'Adresse': 'address',
    'Email Contact': 'email',
    'Notes': 'notes',
  },
  assets: {
    'Nom Actif': 'name',
    'Type': 'type',
    'Valeur Actuelle': 'currentValue',
    'Devise': 'currency',
    'Date Valorisation': 'valuationDate',
    'Description': 'description',
  },
  bankAccounts: {
    'Banque': 'bank',
    'Type Compte': 'type',
    'IBAN': 'iban',
    'Solde': 'balance',
    'Devise': 'currency',
    'Entité Titulaire': 'entityOwner',
  },
  stockPortfolio: {
    'Ticker': 'symbol',
    'Nom': 'name',
    'Quantité': 'quantity',
    'Prix Unitaire': 'averagePrice',
    'Devise': 'currency',
    'Compte Titres': 'account',
  },
  realEstate: {
    'Adresse': 'address',
    'Type Bien': 'type',
    'Surface': 'surface',
    'Valeur Estimée': 'estimatedValue',
    'Crédit Restant': 'remainingDebt',
    'Loyer Mensuel': 'monthlyRent',
    'Entité Propriétaire': 'entityOwner',
    'Nombre Pièces': 'rooms',
  },
  ownership: {
    'Entité Propriétaire': 'ownerEntity',
    'Actif/Entité Détenu': 'ownedAssetOrEntity',
    'Pourcentage': 'percentage',
    'Date Début': 'startDate',
  },
}

// Fonction de conversion des types Excel
function convertExcelValue(value: any, fieldType: string): any {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  switch (fieldType) {
    case 'number':
      return parseFloat(value.toString())
    case 'string':
      return value.toString().trim()
    case 'date':
      // Gestion des dates Excel (nombre de jours depuis 1900)
      if (typeof value === 'number') {
        const excelEpoch = new Date(1900, 0, 1)
        const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000)
        return date.toISOString().split('T')[0]
      }
      return value.toString()
    case 'enum':
      return value.toString().trim()
    default:
      return value
  }
}

// Fonction de mappage des données Excel
function mapRowData(rowData: any, mapping: Record<string, string>, fieldTypes: Record<string, string> = {}): any {
  const mapped: any = {}
  
  for (const [excelColumn, objectField] of Object.entries(mapping)) {
    if (rowData[excelColumn] !== undefined) {
      const fieldType = fieldTypes[objectField] || 'string'
      mapped[objectField] = convertExcelValue(rowData[excelColumn], fieldType)
    }
  }
  
  return mapped
}

// Transformation des types pour les entités
function transformEntityType(type: string): string {
  if (!type) return type
  
  const normalizedType = type.toString().trim().toLowerCase()
  
  const typeMap: Record<string, string> = {
    // Personne physique
    'personne physique': 'PHYSICAL_PERSON',
    'personne': 'PHYSICAL_PERSON',
    'physical person': 'PHYSICAL_PERSON',
    'physical': 'PHYSICAL_PERSON',
    'individual': 'PHYSICAL_PERSON',
    'particulier': 'PHYSICAL_PERSON',
    
    // Entité légale
    'société': 'LEGAL_ENTITY',
    'societe': 'LEGAL_ENTITY',
    'entreprise': 'LEGAL_ENTITY',
    'legal entity': 'LEGAL_ENTITY',
    'legal': 'LEGAL_ENTITY',
    'company': 'LEGAL_ENTITY',
    'corporation': 'LEGAL_ENTITY',
    'sci': 'LEGAL_ENTITY',
    'sarl': 'LEGAL_ENTITY',
    'sas': 'LEGAL_ENTITY',
    'sa': 'LEGAL_ENTITY',
  }
  
  // Chercher une correspondance exacte
  if (typeMap[normalizedType]) {
    return typeMap[normalizedType]
  }
  
  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(typeMap)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value
    }
  }
  
  return type
}

// Transformation des types pour les comptes bancaires
function transformBankAccountType(type: string): string {
  if (!type) return type
  
  const normalizedType = type.toString().trim().toLowerCase()
  
  // Mapping exhaustif des types de comptes
  const typeMap: Record<string, string> = {
    // Compte courant
    'compte courant': 'current',
    'courant': 'current',
    'current': 'current',
    'checking': 'current',
    
    // Épargne
    'livret': 'savings',
    'livret a': 'savings',
    'livret A': 'savings',
    'épargne': 'savings',
    'epargne': 'savings',
    'savings': 'savings',
    'saving': 'savings',
    'ldd': 'savings',
    'ldds': 'savings',
    'cel': 'savings',
    
    // Titres
    'compte-titres': 'securities',
    'compte titres': 'securities',
    'titres': 'securities',
    'securities': 'securities',
    'cto': 'securities',
    
    // PEA
    'pea': 'pea',
    'plan épargne actions': 'pea',
    'plan epargne actions': 'pea',
  }
  
  // Chercher une correspondance exacte d'abord
  if (typeMap[normalizedType]) {
    return typeMap[normalizedType]
  }
  
  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(typeMap)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value
    }
  }
  
  // Si aucune correspondance, retourner tel quel
  return type.toLowerCase()
}

// Transformation des types pour l'immobilier
function transformRealEstateType(type: string): string {
  if (!type) return type
  
  const normalizedType = type.toString().trim().toLowerCase()
  
  const typeMap: Record<string, string> = {
    // Appartement
    'appartement': 'apartment',
    'appart': 'apartment',
    'apartment': 'apartment',
    'flat': 'apartment',
    'condo': 'apartment',
    'studio': 'apartment',
    
    // Maison
    'maison': 'house',
    'house': 'house',
    'villa': 'house',
    'pavillon': 'house',
    'chalet': 'house',
    
    // Terrain
    'terrain': 'land',
    'land': 'land',
    'parcelle': 'land',
    'foncier': 'land',
    
    // Commercial
    'commercial': 'commercial',
    'bureau': 'commercial',
    'office': 'commercial',
    'magasin': 'commercial',
    'boutique': 'commercial',
    'entrepôt': 'commercial',
    'entrepot': 'commercial',
    'local commercial': 'commercial',
    'local': 'commercial',
  }
  
  // Chercher une correspondance exacte
  if (typeMap[normalizedType]) {
    return typeMap[normalizedType]
  }
  
  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(typeMap)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value
    }
  }
  
  return type.toLowerCase()
}

// Validation principale
export async function validateExcelData(data: {
  entities?: any[]
  assets?: any[]
  bankAccounts?: any[]
  stockPortfolio?: any[]
  realEstate?: any[]
  ownership?: any[]
}): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const validatedData = {
    entities: [],
    assets: [],
    bankAccounts: [],
    stockPortfolio: [],
    realEstate: [],
    ownership: [],
  }

  // Validation des entités
  if (data.entities) {
    for (let i = 0; i < data.entities.length; i++) {
      const row = data.entities[i]
      try {
        const mapped = mapRowData(row, COLUMN_MAPPINGS.entities)
        // Transformation du type
        if (mapped.type) {
          mapped.type = transformEntityType(mapped.type)
        }
        
        const validated = EntitySchema.parse(mapped)
        validatedData.entities.push(validated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors.push({
              sheet: 'Entités',
              row: i + 2, // +2 car ligne 1 = headers, index commence à 0
              field: err.path.join('.'),
              message: err.message,
              value: row[Object.keys(COLUMN_MAPPINGS.entities)[err.path[0] as any] || err.path[0]],
            })
          })
        }
      }
    }
  }

  // Validation des comptes bancaires
  if (data.bankAccounts) {
    const fieldTypes = {
      balance: 'number',
    }
    
    for (let i = 0; i < data.bankAccounts.length; i++) {
      const row = data.bankAccounts[i]
      try {
        const mapped = mapRowData(row, COLUMN_MAPPINGS.bankAccounts, fieldTypes)
        // Transformation du type
        if (mapped.type) {
          mapped.type = transformBankAccountType(mapped.type)
        }
        
        const validated = BankAccountSchema.parse(mapped)
        validatedData.bankAccounts.push(validated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors.push({
              sheet: 'Comptes Bancaires',
              row: i + 2,
              field: err.path.join('.'),
              message: err.message,
              value: row[Object.keys(COLUMN_MAPPINGS.bankAccounts)[err.path[0] as any] || err.path[0]],
            })
          })
        }
      }
    }
  }

  // Validation du portefeuille boursier
  if (data.stockPortfolio) {
    const fieldTypes = {
      quantity: 'number',
      averagePrice: 'number',
    }
    
    for (let i = 0; i < data.stockPortfolio.length; i++) {
      const row = data.stockPortfolio[i]
      try {
        const mapped = mapRowData(row, COLUMN_MAPPINGS.stockPortfolio, fieldTypes)
        const validated = StockSchema.parse(mapped)
        validatedData.stockPortfolio.push(validated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors.push({
              sheet: 'Portefeuille Boursier',
              row: i + 2,
              field: err.path.join('.'),
              message: err.message,
              value: row[Object.keys(COLUMN_MAPPINGS.stockPortfolio)[err.path[0] as any] || err.path[0]],
            })
          })
        }
      }
    }
  }

  // Validation de l'immobilier
  if (data.realEstate) {
    const fieldTypes = {
      surface: 'number',
      rooms: 'number',
      estimatedValue: 'number',
      remainingDebt: 'number',
      monthlyRent: 'number',
    }
    
    for (let i = 0; i < data.realEstate.length; i++) {
      const row = data.realEstate[i]
      try {
        const mapped = mapRowData(row, COLUMN_MAPPINGS.realEstate, fieldTypes)
        // Transformation du type
        if (mapped.type) {
          mapped.type = transformRealEstateType(mapped.type)
        }
        
        const validated = RealEstateSchema.parse(mapped)
        validatedData.realEstate.push(validated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors.push({
              sheet: 'Immobilier',
              row: i + 2,
              field: err.path.join('.'),
              message: err.message,
              value: row[Object.keys(COLUMN_MAPPINGS.realEstate)[err.path[0] as any] || err.path[0]],
            })
          })
        }
      }
    }
  }

  // Validation des détentions
  if (data.ownership) {
    const fieldTypes = {
      percentage: 'number',
      startDate: 'date',
    }
    
    for (let i = 0; i < data.ownership.length; i++) {
      const row = data.ownership[i]
      try {
        const mapped = mapRowData(row, COLUMN_MAPPINGS.ownership, fieldTypes)
        const validated = OwnershipSchema.parse(mapped)
        validatedData.ownership.push(validated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors.push({
              sheet: 'Détentions',
              row: i + 2,
              field: err.path.join('.'),
              message: err.message,
              value: row[Object.keys(COLUMN_MAPPINGS.ownership)[err.path[0] as any] || err.path[0]],
            })
          })
        }
      }
    }
  }

  // Validations croisées
  performCrossValidation(validatedData, warnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: validatedData,
  }
}

// Validations croisées entre les données
function performCrossValidation(data: any, warnings: ValidationError[]) {
  const entityNames = new Set(data.entities.map((e: any) => e.name))
  
  // Vérifier que les entités référencées dans les comptes bancaires existent
  data.bankAccounts.forEach((account: any, index: number) => {
    if (account.entityOwner && !entityNames.has(account.entityOwner)) {
      warnings.push({
        sheet: 'Comptes Bancaires',
        row: index + 2,
        field: 'entityOwner',
        message: `L'entité "${account.entityOwner}" n'existe pas dans la feuille Entités`,
        value: account.entityOwner,
      })
    }
  })

  // Vérifier que les entités référencées dans l'immobilier existent
  data.realEstate.forEach((property: any, index: number) => {
    if (property.entityOwner && !entityNames.has(property.entityOwner)) {
      warnings.push({
        sheet: 'Immobilier',
        row: index + 2,
        field: 'entityOwner',
        message: `L'entité "${property.entityOwner}" n'existe pas dans la feuille Entités`,
        value: property.entityOwner,
      })
    }
  })

  // Vérifier les pourcentages de détention
  const ownershipByAsset = new Map()
  data.ownership.forEach((ownership: any) => {
    const key = ownership.ownedAssetOrEntity
    if (!ownershipByAsset.has(key)) {
      ownershipByAsset.set(key, [])
    }
    ownershipByAsset.get(key).push(ownership)
  })

  ownershipByAsset.forEach((ownerships, assetName) => {
    const totalPercentage = ownerships.reduce((sum: number, o: any) => sum + o.percentage, 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      warnings.push({
        sheet: 'Détentions',
        row: 0,
        field: 'percentage',
        message: `Le total des pourcentages pour "${assetName}" est de ${totalPercentage}% au lieu de 100%`,
        value: totalPercentage,
      })
    }
  })
} 