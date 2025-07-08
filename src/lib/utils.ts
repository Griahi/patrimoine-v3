import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
    const assetValue = latestValuation ? Number(latestValuation.value) : 0
    const ownershipPercentage = Number(ownership?.percentage || 0) / 100
    return sum + (assetValue * ownershipPercentage)
  }, 0)
}

// Fonction utilitaire pour calculer la valeur totale du patrimoine
export function calculateTotalPatrimony(assets: any[]): number {
  if (!Array.isArray(assets)) {
    return 0
  }

  return assets.reduce((sum: number, asset: any) => {
    const latestValuation = asset?.valuations?.[0]
    const assetValue = latestValuation ? Number(latestValuation.value) : 0
    return sum + assetValue
  }, 0)
}

// Fonction utilitaire pour calculer la valeur totale des dettes
export function calculateTotalDebts(debts: any[]): number {
  if (!Array.isArray(debts)) {
    return 0
  }

  return debts.reduce((sum: number, debt: any) => {
    const debtValue = Number(debt?.currentAmount || 0)
    return sum + debtValue
  }, 0)
} 