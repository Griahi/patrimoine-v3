import { describe, it, expect } from 'vitest'

// Utility functions pour les calculs financiers
export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  durationMonths: number,
  amortizationType: 'PROGRESSIVE' | 'LINEAR' | 'IN_FINE' | 'BULLET'
): number => {
  if (!principal || !durationMonths) return 0

  const monthlyRate = annualRate / 100 / 12

  switch (amortizationType) {
    case 'PROGRESSIVE':
      if (monthlyRate === 0) return principal / durationMonths
      return principal * (monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) / (Math.pow(1 + monthlyRate, durationMonths) - 1)
    case 'LINEAR':
      return (principal / durationMonths) + (principal * monthlyRate)
    case 'IN_FINE':
      return principal * monthlyRate
    case 'BULLET':
      return 0
    default:
      return 0
  }
}

export const calculatePerformance = (
  currentValue: number,
  previousValue: number,
  daysDifference: number
): number => {
  if (!previousValue || previousValue === 0) return 0
  
  const performance = (currentValue - previousValue) / previousValue
  
  // Normaliser sur une base mensuelle si nécessaire
  if (daysDifference > 45) { // Plus d'un mois et demi
    return performance * (30 / daysDifference)
  }
  
  return performance
}

export const calculateVolatility = (performances: number[]): number => {
  if (performances.length < 2) return 0
  
  const mean = performances.reduce((sum, p) => sum + p, 0) / performances.length
  const variance = performances.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / (performances.length - 1)
  
  return Math.sqrt(variance)
}

export const calculateIFI = (taxableWealth: number): number => {
  if (taxableWealth <= 1300000) return 0
  if (taxableWealth <= 1400000) return (taxableWealth - 1300000) * 0.005
  if (taxableWealth <= 2570000) return 500 + (taxableWealth - 1400000) * 0.007
  if (taxableWealth <= 5000000) return 8690 + (taxableWealth - 2570000) * 0.01
  if (taxableWealth <= 10000000) return 32990 + (taxableWealth - 5000000) * 0.0125
  return 95490 + (taxableWealth - 10000000) * 0.015
}

export const calculatePEROptimization = (
  income: number,
  tmi: number
): { maxPER: number; optimalAmount: number; estimatedSavings: number } => {
  const maxPER = Math.min(income * 0.1, 35194) // Plafond 2024
  const optimalAmount = Math.min(maxPER, income * tmi * 0.3) // Estimation
  const estimatedSavings = optimalAmount * tmi
  
  return {
    maxPER,
    optimalAmount,
    estimatedSavings
  }
}

export const calculateConfidenceInterval = (
  value: number,
  volatility: number,
  timeInYears: number
): { lower: number; upper: number } => {
  const adjustedVolatility = volatility * Math.sqrt(timeInYears)
  const margin = value * adjustedVolatility * 1.96 // 95% confidence interval
  
  return {
    lower: Math.max(0, value - margin),
    upper: value + margin
  }
}

describe('Financial Calculations', () => {
  describe('calculateMonthlyPayment', () => {
    it('should calculate progressive loan payment correctly', () => {
      const result = calculateMonthlyPayment(100000, 2.5, 240, 'PROGRESSIVE')
      expect(result).toBeCloseTo(530, 0) // Valeur calculée correcte
    })

    it('should calculate linear loan payment correctly', () => {
      const result = calculateMonthlyPayment(100000, 2.5, 240, 'LINEAR')
      expect(result).toBeCloseTo(625, 1) // Capital + intérêts
    })

    it('should calculate in-fine loan payment correctly', () => {
      const result = calculateMonthlyPayment(100000, 2.5, 240, 'IN_FINE')
      expect(result).toBeCloseTo(208.33, 1) // Seulement les intérêts
    })

    it('should return 0 for bullet payment', () => {
      const result = calculateMonthlyPayment(100000, 2.5, 240, 'BULLET')
      expect(result).toBe(0)
    })

    it('should handle edge cases', () => {
      expect(calculateMonthlyPayment(0, 2.5, 240, 'PROGRESSIVE')).toBe(0)
      expect(calculateMonthlyPayment(100000, 0, 240, 'PROGRESSIVE')).toBeCloseTo(417, 0) // Remboursement du capital seulement
      expect(calculateMonthlyPayment(100000, 2.5, 0, 'PROGRESSIVE')).toBe(0)
    })
  })

  describe('calculatePerformance', () => {
    it('should calculate simple performance correctly', () => {
      const result = calculatePerformance(110000, 100000, 30)
      expect(result).toBeCloseTo(0.1, 2) // 10% sur 30 jours
    })

    it('should normalize performance for long periods', () => {
      const result = calculatePerformance(120000, 100000, 60) // 20% sur 60 jours
      const expected = 0.2 * (30 / 60) // Normalisé à 30 jours = 10%
      expect(result).toBeCloseTo(expected, 2)
    })

    it('should handle negative performance', () => {
      const result = calculatePerformance(90000, 100000, 30)
      expect(result).toBeCloseTo(-0.1, 2) // -10%
    })

    it('should handle edge cases', () => {
      expect(calculatePerformance(100000, 0, 30)).toBe(0)
      expect(calculatePerformance(0, 100000, 30)).toBe(-1)
    })
  })

  describe('calculateVolatility', () => {
    it('should calculate volatility correctly', () => {
      const performances = [0.05, -0.03, 0.08, -0.01, 0.02]
      const result = calculateVolatility(performances)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('should return 0 for insufficient data', () => {
      expect(calculateVolatility([])).toBe(0)
      expect(calculateVolatility([0.05])).toBe(0)
    })

    it('should handle identical values', () => {
      const result = calculateVolatility([0.05, 0.05, 0.05])
      expect(result).toBeCloseTo(0, 10) // Très proche de 0 (erreurs d'arrondi possibles)
    })
  })

  describe('calculateIFI', () => {
    it('should return 0 for wealth below threshold', () => {
      expect(calculateIFI(1000000)).toBe(0)
      expect(calculateIFI(1300000)).toBe(0)
    })

    it('should calculate IFI for first bracket', () => {
      const result = calculateIFI(1350000)
      expect(result).toBe(250) // (1350000 - 1300000) * 0.005
    })

    it('should calculate IFI for second bracket', () => {
      const result = calculateIFI(1500000)
      const expected = 500 + (1500000 - 1400000) * 0.007
      expect(result).toBe(expected)
    })

    it('should calculate IFI for higher brackets', () => {
      const result = calculateIFI(5500000)
      const expected = 32990 + (5500000 - 5000000) * 0.0125
      expect(result).toBeCloseTo(expected, 0)
    })

    it('should calculate IFI for highest bracket', () => {
      const result = calculateIFI(12000000)
      const expected = 95490 + (12000000 - 10000000) * 0.015
      expect(result).toBeCloseTo(expected, 0)
    })
  })

  describe('calculatePEROptimization', () => {
    it('should calculate PER optimization correctly', () => {
      const result = calculatePEROptimization(100000, 0.3)
      expect(result.maxPER).toBe(10000) // 10% du revenu
      expect(result.optimalAmount).toBe(9000) // 30% du TMI * revenu
      expect(result.estimatedSavings).toBe(2700) // 30% de l'apport
    })

    it('should respect PER ceiling', () => {
      const result = calculatePEROptimization(500000, 0.45)
      expect(result.maxPER).toBe(35194) // Plafond 2024
    })

    it('should handle low income', () => {
      const result = calculatePEROptimization(30000, 0.11)
      expect(result.maxPER).toBe(3000)
      expect(result.optimalAmount).toBeLessThan(result.maxPER)
    })
  })

  describe('calculateConfidenceInterval', () => {
    it('should calculate confidence interval correctly', () => {
      const result = calculateConfidenceInterval(100000, 0.15, 1)
      expect(result.lower).toBeLessThan(100000)
      expect(result.upper).toBeGreaterThan(100000)
      expect(result.lower).toBeGreaterThan(0)
    })

    it('should handle longer time periods', () => {
      const result1 = calculateConfidenceInterval(100000, 0.15, 1)
      const result2 = calculateConfidenceInterval(100000, 0.15, 4)
      
      // L'intervalle devrait être plus large pour une période plus longue
      expect(result2.upper - result2.lower).toBeGreaterThan(result1.upper - result1.lower)
    })

    it('should not allow negative lower bound', () => {
      const result = calculateConfidenceInterval(1000, 0.9, 10)
      expect(result.lower).toBe(0)
    })
  })
}) 