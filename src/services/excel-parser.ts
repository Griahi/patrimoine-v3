import * as XLSX from 'xlsx'
import { validateExcelData, type ValidationResult } from '@/utils/onboarding/excel-validator'

// Interface pour les données parsées
export interface ParsedExcelData {
  entities?: any[]
  assets?: any[]
  bankAccounts?: any[]
  stockPortfolio?: any[]
  realEstate?: any[]
  ownership?: any[]
}

// Configuration des feuilles Excel attendues
const EXPECTED_SHEETS = {
  'Entités': 'entities',
  'Actifs': 'assets',
  'Comptes Bancaires': 'bankAccounts',
  'Portefeuille Boursier': 'stockPortfolio',
  'Immobilier': 'realEstate',
  'Détentions': 'ownership',
}

// Fonction principale de parsing
export async function parseExcelFile(file: File): Promise<{
  data: ParsedExcelData
  validation: ValidationResult
}> {
  try {
    // Lire le fichier Excel
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
    })

    // Parser chaque feuille
    const parsedData = await parseWorkbook(workbook)

    // Valider les données
    const validation = await validateExcelData(parsedData)

    return {
      data: parsedData,
      validation,
    }
  } catch (error) {
    console.error('Erreur lors du parsing Excel:', error)
    throw new Error(`Impossible de lire le fichier Excel: ${error.message}`)
  }
}

// Parser le workbook Excel
export async function parseWorkbook(workbook: XLSX.WorkBook): Promise<ParsedExcelData> {
  const data: ParsedExcelData = {}

  // Vérifier quelles feuilles sont présentes
  const availableSheets = workbook.SheetNames
  console.log('Feuilles disponibles:', availableSheets)

  // Parser chaque feuille attendue
  for (const [expectedSheetName, dataKey] of Object.entries(EXPECTED_SHEETS)) {
    // Chercher la feuille avec une correspondance exacte ou approximative
    const sheetName = findMatchingSheetName(expectedSheetName, availableSheets)
    
    if (sheetName && workbook.Sheets[sheetName]) {
      console.log(`Parsing de la feuille: ${sheetName} -> ${dataKey}`)
      
      try {
        const sheetData = parseSheet(workbook.Sheets[sheetName], dataKey)
        if (sheetData && sheetData.length > 0) {
          data[dataKey as keyof ParsedExcelData] = sheetData
        }
      } catch (error) {
        console.error(`Erreur lors du parsing de la feuille ${sheetName}:`, error)
        // Ne pas arrêter le processus, continuer avec les autres feuilles
      }
    } else {
      console.log(`Feuille non trouvée: ${expectedSheetName}`)
    }
  }

  return data
}

// Trouver le nom de feuille correspondant (avec tolérance)
function findMatchingSheetName(expectedName: string, availableSheets: string[]): string | null {
  // Correspondance exacte
  if (availableSheets.includes(expectedName)) {
    return expectedName
  }

  // Correspondance insensible à la casse
  const lowerExpected = expectedName.toLowerCase()
  const exactMatch = availableSheets.find(sheet => sheet.toLowerCase() === lowerExpected)
  if (exactMatch) {
    return exactMatch
  }

  // Correspondance partielle (contient)
  const partialMatch = availableSheets.find(sheet => 
    sheet.toLowerCase().includes(lowerExpected) || 
    lowerExpected.includes(sheet.toLowerCase())
  )
  if (partialMatch) {
    return partialMatch
  }

  // Correspondances alternatives
  const alternatives: Record<string, string[]> = {
    'Entités': ['entites', 'entities', 'entity', 'personnes', 'societes'],
    'Actifs': ['actifs', 'assets', 'patrimoine', 'biens'],
    'Comptes Bancaires': ['comptes', 'banques', 'bank', 'banking', 'accounts'],
    'Portefeuille Boursier': ['bourse', 'actions', 'stocks', 'titres', 'portefeuille'],
    'Immobilier': ['immobilier', 'real estate', 'realestate', 'immob', 'biens'],
    'Détentions': ['detention', 'ownership', 'propriete', 'parts'],
  }

  const possibleNames = alternatives[expectedName] || []
  for (const altName of possibleNames) {
    const match = availableSheets.find(sheet => 
      sheet.toLowerCase().includes(altName) || 
      altName.includes(sheet.toLowerCase())
    )
    if (match) {
      return match
    }
  }

  return null
}

// Parser une feuille spécifique
function parseSheet(worksheet: XLSX.WorkSheet, dataType: string): any[] {
  try {
    // Convertir la feuille en JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Utiliser la première ligne comme headers
      defval: '', // Valeur par défaut pour les cellules vides
      raw: false, // Convertir les nombres en strings d'abord
    }) as any[][]

    if (rawData.length < 2) {
      console.log(`Feuille ${dataType} vide ou sans données`)
      return []
    }

    // Première ligne = headers
    const headers = rawData[0].map((header: any) => 
      typeof header === 'string' ? header.trim() : String(header).trim()
    ).filter(h => h !== '')

    if (headers.length === 0) {
      console.log(`Pas d'en-têtes trouvés dans la feuille ${dataType}`)
      return []
    }

    console.log(`Headers trouvés pour ${dataType}:`, headers)

    // Convertir les données en objets
    const jsonData = []
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      
      // Ignorer les lignes complètement vides
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        continue
      }

      const rowData: any = {}
      let hasData = false

      for (let j = 0; j < headers.length && j < row.length; j++) {
        const header = headers[j]
        const cellValue = row[j]

        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          rowData[header] = processExcelValue(cellValue, dataType, header)
          hasData = true
        }
      }

      if (hasData) {
        jsonData.push(rowData)
      }
    }

    console.log(`${jsonData.length} lignes de données trouvées pour ${dataType}`)
    return jsonData

  } catch (error) {
    console.error(`Erreur lors du parsing de la feuille ${dataType}:`, error)
    return []
  }
}

// Traitement spécialisé des valeurs Excel
function processExcelValue(value: any, dataType: string, columnName: string): any {
  if (value === null || value === undefined) {
    return null
  }

  // Convertir en string d'abord
  const stringValue = String(value).trim()

  // Gestion des valeurs vides
  if (stringValue === '' || stringValue === 'N/A' || stringValue === '-') {
    return null
  }

  // Gestion des colonnes numériques
  const numericColumns = [
    'Valeur Actuelle', 'Solde', 'Quantité', 'Prix Unitaire', 'Surface', 
    'Valeur Estimée', 'Crédit Restant', 'Loyer Mensuel', 'Pourcentage',
    'Nombre Pièces'
  ]

  if (numericColumns.some(col => columnName.includes(col))) {
    // Nettoyer les symboles monétaires et espaces
    const cleanValue = stringValue
      .replace(/[€$£¥]/g, '')
      .replace(/\s/g, '')
      .replace(/,/g, '.')
    
    const numValue = parseFloat(cleanValue)
    return isNaN(numValue) ? 0 : numValue
  }

  // Gestion des dates
  const dateColumns = ['Date Valorisation', 'Date Début']
  if (dateColumns.some(col => columnName.includes(col))) {
    // Si c'est déjà un objet Date d'Excel
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]
    }
    
    // Essayer de parser différents formats de date
    const date = new Date(stringValue)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
    
    return stringValue
  }

  // Gestion des emails
  if (columnName.includes('Email') && stringValue.includes('@')) {
    return stringValue.toLowerCase()
  }

  // Gestion des pourcentages
  if (columnName.includes('Pourcentage')) {
    const percentValue = stringValue.replace('%', '')
    const numValue = parseFloat(percentValue)
    return isNaN(numValue) ? 0 : numValue
  }

  return stringValue
}

// Générer un template Excel
export function generateExcelTemplate(): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // Feuille Entités
  const entitiesData = [
    ['Nom Entité', 'Type', 'Numéro SIREN/INSEE', 'Adresse', 'Email Contact', 'Notes'],
    ['Jean Dupont', 'Personne physique', '', '123 Rue de la Paix, Paris', 'jean.dupont@email.com', 'Chef de famille'],
    ['Marie Dupont', 'Personne', '', '123 Rue de la Paix, Paris', 'marie.dupont@email.com', 'Épouse'],
    ['SCI Familiale', 'Société', '123456789', '456 Avenue des Champs, Lyon', 'contact@sci.com', 'SCI pour immobilier'],
    ['SARL Investissement', 'SARL', '987654321', '789 Boulevard Haussmann, Paris', 'info@sarl-invest.fr', 'Société d\'investissement'],
  ]
  const entitiesWS = XLSX.utils.aoa_to_sheet(entitiesData)
  XLSX.utils.book_append_sheet(workbook, entitiesWS, 'Entités')

  // Feuille Comptes Bancaires
  const bankAccountsData = [
    ['Banque', 'Type Compte', 'IBAN', 'Solde', 'Devise', 'Entité Titulaire'],
    ['BNP Paribas', 'Compte courant', 'FR76123456789', 15000, 'EUR', 'Jean Dupont'],
    ['Crédit Agricole', 'Épargne', 'FR76987654321', 22950, 'EUR', 'Marie Dupont'],
    ['BNP Paribas', 'Compte-titres', 'FR76555444333', 50000, 'EUR', 'Jean Dupont'],
    ['La Banque Postale', 'PEA', 'FR76111222333', 25000, 'EUR', 'Jean Dupont'],
    ['Société Générale', 'Compte courant', 'FR76444555666', 75000, 'EUR', 'SCI Familiale'],
  ]
  const bankAccountsWS = XLSX.utils.aoa_to_sheet(bankAccountsData)
  XLSX.utils.book_append_sheet(workbook, bankAccountsWS, 'Comptes Bancaires')

  // Feuille Portefeuille Boursier
  const stockData = [
    ['Ticker', 'Nom', 'Quantité', 'Prix Unitaire', 'Devise', 'Compte Titres'],
    ['AAPL', 'Apple Inc.', 10, 150.50, 'USD', 'BNP Paribas Titres'],
    ['MC.PA', 'LVMH', 5, 720.00, 'EUR', 'BNP Paribas Titres'],
  ]
  const stockWS = XLSX.utils.aoa_to_sheet(stockData)
  XLSX.utils.book_append_sheet(workbook, stockWS, 'Portefeuille Boursier')

  // Feuille Immobilier
  const realEstateData = [
    ['Adresse', 'Type Bien', 'Surface', 'Valeur Estimée', 'Crédit Restant', 'Loyer Mensuel', 'Entité Propriétaire', 'Nombre Pièces'],
    ['123 Rue Victor Hugo, Paris 16', 'Appartement', 75, 650000, 350000, 0, 'SCI Familiale', 3],
    ['456 Avenue de la République, Lyon', 'Maison', 120, 450000, 200000, 1500, 'SCI Familiale', 5],
  ]
  const realEstateWS = XLSX.utils.aoa_to_sheet(realEstateData)
  XLSX.utils.book_append_sheet(workbook, realEstateWS, 'Immobilier')

  // Feuille Détentions
  const ownershipData = [
    ['Entité Propriétaire', 'Actif/Entité Détenu', 'Pourcentage', 'Date Début'],
    ['Jean Dupont', 'SCI Familiale', 60, '2020-01-01'],
    ['Marie Dupont', 'SCI Familiale', 40, '2020-01-01'],
    ['SCI Familiale', '123 Rue Victor Hugo, Paris 16', 100, '2020-01-01'],
    ['SCI Familiale', '456 Avenue de la République, Lyon', 100, '2021-06-15'],
    ['Jean Dupont', 'SARL Investissement', 80, '2022-03-01'],
    ['Marie Dupont', 'SARL Investissement', 20, '2022-03-01'],
  ]
  const ownershipWS = XLSX.utils.aoa_to_sheet(ownershipData)
  XLSX.utils.book_append_sheet(workbook, ownershipWS, 'Détentions')

  // Feuille Métadonnées (explications)
  const metadataData = [
    ['GUIDE D\'UTILISATION DU TEMPLATE'],
    [''],
    ['1. TYPES D\'ENTITÉS ACCEPTÉS:'],
    ['   - Personne physique, Personne, Particulier'],
    ['   - Société, Entreprise, SCI, SARL, SAS'],
    [''],
    ['2. TYPES DE COMPTES BANCAIRES ACCEPTÉS:'],
    ['   - Compte courant, Courant'],
    ['   - Épargne, Livret, Livret A'],
    ['   - Compte-titres, Titres, CTO'],
    ['   - PEA, Plan Épargne Actions'],
    [''],
    ['3. TYPES DE BIENS IMMOBILIERS ACCEPTÉS:'],
    ['   - Appartement, Appart, Studio'],
    ['   - Maison, Villa, Pavillon'],
    ['   - Terrain, Parcelle'],
    ['   - Commercial, Bureau, Local'],
    [''],
    ['4. DEVISES ACCEPTÉES:'],
    ['   - EUR, USD, GBP, CHF, CAD, etc.'],
    [''],
    ['5. CONSEILS:'],
    ['   - Respectez les noms d\'entités exactement'],
    ['   - Les montants doivent être des nombres'],
    ['   - Les pourcentages de 0 à 100'],
    ['   - Les dates au format AAAA-MM-JJ'],
  ]
  const metadataWS = XLSX.utils.aoa_to_sheet(metadataData)
  XLSX.utils.book_append_sheet(workbook, metadataWS, 'Guide')

  return workbook
}

// Exporter le template vers un buffer
export function exportTemplateToBuffer(): Uint8Array {
  const workbook = generateExcelTemplate()
  return XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
    compression: true,
  }) as Uint8Array
} 