import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  calculateAssetValue, 
  calculateOwnershipPercentage, 
  validateValuation, 
  sanitizeAmount 
} from "@/utils/financial-calculations"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fonction utilitaire pour calculer la valeur totale d'une entité
export function calculateEntityTotalValue(entity: any): number {
  if (!entity?.ownedAssets || !Array.isArray(entity.ownedAssets)) {
    return 0
  }

  return entity.ownedAssets.reduce((sum: number, ownership: any) => {
    const latestValuation = ownership?.ownedAsset?.valuations?.[0]
    if (!latestValuation) return sum

    const validatedValuation = validateValuation(latestValuation)
    if (!validatedValuation.isValid) return sum

    const ownershipPercentage = sanitizeAmount(ownership?.percentage)
    const assetValue = calculateAssetValue(validatedValuation.value, ownershipPercentage)
    
    return sum + assetValue
  }, 0)
}

// Fonction utilitaire pour calculer la valeur totale du patrimoine (avec ownership)
export function calculateTotalPatrimony(assets: any[], entityIds?: string[]): number {
  if (!Array.isArray(assets)) {
    return 0
  }

  return assets.reduce((sum: number, asset: any) => {
    const latestValuation = asset?.valuations?.[0]
    if (!latestValuation) return sum

    const validatedValuation = validateValuation(latestValuation)
    if (!validatedValuation.isValid) return sum

    // Filtrer les ownerships par entités si spécifié
    const relevantOwnerships = asset.ownerships ? asset.ownerships.filter((ownership: any) => 
      !entityIds || entityIds.length === 0 || entityIds.includes(ownership.ownerEntity?.id)
    ) : []

    const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships)
    const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
    
    return sum + assetValue
  }, 0)
}

// Fonction utilitaire pour calculer la valeur totale des dettes
export function calculateTotalDebts(debts: any[]): number {
  if (!Array.isArray(debts)) {
    return 0
  }

  return debts.reduce((sum: number, debt: any) => {
    const debtValue = sanitizeAmount(debt?.currentAmount)
    return sum + debtValue
  }, 0)
} 