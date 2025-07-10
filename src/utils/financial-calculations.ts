/**
 * Utilitaires pour les calculs financiers et le formatage des montants
 */

// Constantes pour les seuils de validation
export const FINANCIAL_CONSTANTS = {
  MAX_REASONABLE_AMOUNT: 1000000000, // 1 milliard d'euros
  MIN_REASONABLE_AMOUNT: -1000000000, // -1 milliard d'euros (pour les dettes)
  DECIMAL_PLACES: 2,
  CURRENCY_CODE: 'EUR',
  LOCALE: 'fr-FR'
} as const

/**
 * Valide qu'un montant est dans une fourchette raisonnable
 */
export function isValidAmount(amount: number): boolean {
  return (
    typeof amount === 'number' &&
    !isNaN(amount) &&
    isFinite(amount) &&
    amount >= FINANCIAL_CONSTANTS.MIN_REASONABLE_AMOUNT &&
    amount <= FINANCIAL_CONSTANTS.MAX_REASONABLE_AMOUNT
  )
}

/**
 * Nettoie et valide un montant
 */
export function sanitizeAmount(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined) return 0
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (!isValidAmount(numAmount)) {
    console.warn('Montant invalide détecté:', amount, '-> converti en 0')
    return 0
  }
  
  return numAmount
}

/**
 * Formate un montant en euros avec le formatage français
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: {
    currency?: string
    showSign?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {}
): string {
  const {
    currency = FINANCIAL_CONSTANTS.CURRENCY_CODE,
    showSign = false,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options
  
  const sanitizedAmount = sanitizeAmount(amount)
  
  try {
    const formatted = new Intl.NumberFormat(FINANCIAL_CONSTANTS.LOCALE, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(sanitizedAmount)
    
    if (showSign && sanitizedAmount > 0) {
      return `+${formatted}`
    }
    
    return formatted
  } catch (error) {
    console.error('Erreur lors du formatage de la devise:', error)
    return `${sanitizedAmount.toFixed(2)} ${currency}`
  }
}

/**
 * Formate un montant sans symbole de devise
 */
export function formatNumber(
  amount: number | string | null | undefined,
  options: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    showSign?: boolean
  } = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    showSign = false
  } = options
  
  const sanitizedAmount = sanitizeAmount(amount)
  
  try {
    const formatted = new Intl.NumberFormat(FINANCIAL_CONSTANTS.LOCALE, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(sanitizedAmount)
    
    if (showSign && sanitizedAmount > 0) {
      return `+${formatted}`
    }
    
    return formatted
  } catch (error) {
    console.error('Erreur lors du formatage du nombre:', error)
    return sanitizedAmount.toFixed(maximumFractionDigits)
  }
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(
  value: number | string | null | undefined,
  options: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    showSign?: boolean
  } = {}
): string {
  const {
    minimumFractionDigits = 1,
    maximumFractionDigits = 2,
    showSign = false
  } = options
  
  const sanitizedValue = sanitizeAmount(value)
  
  try {
    const formatted = new Intl.NumberFormat(FINANCIAL_CONSTANTS.LOCALE, {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(sanitizedValue / 100)
    
    if (showSign && sanitizedValue > 0) {
      return `+${formatted}`
    }
    
    return formatted
  } catch (error) {
    console.error('Erreur lors du formatage du pourcentage:', error)
    return `${sanitizedValue.toFixed(maximumFractionDigits)}%`
  }
}

/**
 * Calcule la somme de montants en s'assurant qu'ils sont valides
 */
export function safeSum(amounts: (number | string | null | undefined)[]): number {
  return amounts.reduce((sum, amount) => sum + sanitizeAmount(amount), 0)
}

/**
 * Calcule un pourcentage de propriété total de façon sécurisée
 */
export function calculateOwnershipPercentage(
  ownerships: Array<{ percentage: number }>
): number {
  const total = ownerships.reduce((sum, ownership) => {
    const percentage = sanitizeAmount(ownership.percentage)
    return sum + percentage
  }, 0)
  
  // S'assurer que le pourcentage est dans une fourchette raisonnable
  return Math.max(0, Math.min(100, total))
}

/**
 * Calcule la valeur d'un actif avec pourcentage de propriété
 */
export function calculateAssetValue(
  baseValue: number | string | null | undefined,
  ownershipPercentage: number | string | null | undefined
): number {
  const sanitizedValue = sanitizeAmount(baseValue)
  const sanitizedPercentage = sanitizeAmount(ownershipPercentage)
  
  // Valider que le pourcentage est dans une fourchette raisonnable
  const validPercentage = Math.max(0, Math.min(100, sanitizedPercentage))
  
  return sanitizedValue * (validPercentage / 100)
}

/**
 * Valide et nettoie une valeur de valorisation d'actif
 */
export function validateValuation(valuation: {
  value: number | string
  currency?: string
  valuationDate?: string
}): { value: number; currency: string; isValid: boolean } {
  const sanitizedValue = sanitizeAmount(valuation.value)
  const currency = valuation.currency || FINANCIAL_CONSTANTS.CURRENCY_CODE
  
  const isValid = isValidAmount(sanitizedValue) && sanitizedValue >= 0
  
  if (!isValid) {
    console.warn('Valorisation invalide détectée:', valuation)
  }
  
  return {
    value: sanitizedValue,
    currency,
    isValid
  }
}

/**
 * Formate un montant pour l'affichage dans les rapports
 */
export function formatReportCurrency(
  amount: number | string | null | undefined,
  currency: string = FINANCIAL_CONSTANTS.CURRENCY_CODE
): string {
  const sanitizedAmount = sanitizeAmount(amount)
  
  // Pour les très gros montants, utiliser une notation abrégée
  if (Math.abs(sanitizedAmount) >= 1000000) {
    const millions = sanitizedAmount / 1000000
    return `${formatNumber(millions, { maximumFractionDigits: 1 })} M€`
  }
  
  if (Math.abs(sanitizedAmount) >= 1000) {
    const thousands = sanitizedAmount / 1000
    return `${formatNumber(thousands, { maximumFractionDigits: 1 })} K€`
  }
  
  return formatCurrency(sanitizedAmount, { currency })
}

/**
 * Calcule et formate un ratio de façon sécurisée
 */
export function calculateAndFormatRatio(
  numerator: number | string | null | undefined,
  denominator: number | string | null | undefined,
  options: {
    isPercentage?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {}
): string {
  const {
    isPercentage = false,
    minimumFractionDigits = 1,
    maximumFractionDigits = 2
  } = options
  
  const sanitizedNumerator = sanitizeAmount(numerator)
  const sanitizedDenominator = sanitizeAmount(denominator)
  
  if (sanitizedDenominator === 0) {
    return isPercentage ? '0,0%' : '0,0'
  }
  
  const ratio = sanitizedNumerator / sanitizedDenominator
  
  if (isPercentage) {
    return formatPercentage(ratio * 100, {
      minimumFractionDigits,
      maximumFractionDigits
    })
  }
  
  return formatNumber(ratio, {
    minimumFractionDigits,
    maximumFractionDigits
  })
} 