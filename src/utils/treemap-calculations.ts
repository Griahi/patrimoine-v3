import { formatCurrency } from './financial-calculations';

// Types pour le treemap
export interface TreemapData {
  id: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  nombreActifs: number;
  children?: TreemapData[];
}

export interface PatrimoineMetrics {
  total: number;
  dettes: number;
  net: number;
  entites: string[];
  categories: CategoryData[];
}

export interface CategoryData {
  id: string;
  nom: string;
  montant: number;
  pourcentage: number;
  nombreActifs: number;
  couleur: string;
  sousCategories?: SubCategoryData[];
}

export interface SubCategoryData {
  id: string;
  nom: string;
  montant: number;
  pourcentage: number;
  nombreActifs: number;
}

// Couleurs par catégorie d'actif
export const CATEGORY_COLORS = {
  'REAL_ESTATE': '#2E7D32',      // Vert foncé pour Immobilier
  'FINANCIAL': '#1976D2',         // Bleu pour Placements Financiers
  'CASH': '#F57C00',              // Orange pour Liquidités
  'OTHER': '#757575',             // Gris pour Autres
  'CRYPTO': '#9C27B0',            // Violet pour Crypto
  'PRECIOUS': '#FF6F00',          // Orange doré pour Métaux précieux
  'VEHICLE': '#4CAF50',           // Vert pour Véhicules
  'BUSINESS': '#FF5722',          // Rouge-orange pour Entreprises
} as const;

// Mapping des catégories
export const CATEGORY_MAPPING = {
  'REAL_ESTATE': 'Immobilier',
  'FINANCIAL': 'Placements Financiers',
  'CASH': 'Liquidités',
  'OTHER': 'Autres',
  'CRYPTO': 'Cryptomonnaies',
  'PRECIOUS': 'Métaux Précieux',
  'VEHICLE': 'Véhicules',
  'BUSINESS': 'Entreprises',
} as const;

// Interface pour les actifs (basée sur la structure existante)
export interface AssetForTreemap {
  id: string;
  name: string;
  assetType: {
    id: string;
    name: string;
    category: string;
    color?: string;
  };
  valuations: Array<{
    value: number;
    valuationDate: string;
    currency: string;
  }>;
  ownerships: Array<{
    percentage: number;
    ownerEntity: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  debts?: Array<{
    currentAmount: number;
    currency: string;
  }>;
}

// Interface pour les entités
export interface EntityForTreemap {
  id: string;
  name: string;
  type: string;
}

/**
 * Calcule la valeur actuelle d'un actif
 */
export function calculateAssetCurrentValue(asset: AssetForTreemap): number {
  const latestValuation = asset.valuations?.[0];
  if (!latestValuation) return 0;
  
  // Soustraire les dettes si présentes
  const debts = asset.debts?.reduce((sum, debt) => sum + debt.currentAmount, 0) || 0;
  return Math.max(0, latestValuation.value - debts);
}

/**
 * Calcule le pourcentage de propriété d'un utilisateur sur un actif
 */
export function calculateOwnershipPercentageForUser(
  asset: AssetForTreemap, 
  selectedEntityIds: string[]
): number {
  if (!selectedEntityIds.length) {
    // Si aucune entité sélectionnée, prendre tout
    return asset.ownerships.reduce((sum, ownership) => sum + ownership.percentage, 0) / 100;
  }
  
  return asset.ownerships
    .filter(ownership => selectedEntityIds.includes(ownership.ownerEntity.id))
    .reduce((sum, ownership) => sum + ownership.percentage, 0) / 100;
}

/**
 * Transforme les actifs en données pour le treemap
 */
export function processAssetsForTreemap(
  assets: AssetForTreemap[],
  selectedEntityIds: string[] = []
): PatrimoineMetrics {
  const categoriesMap = new Map<string, CategoryData>();
  let totalPatrimoine = 0;
  let totalDettes = 0;
  
  // Traiter chaque actif
  assets.forEach(asset => {
    const currentValue = calculateAssetCurrentValue(asset);
    const ownershipPercentage = calculateOwnershipPercentageForUser(asset, selectedEntityIds);
    const userValue = currentValue * ownershipPercentage;
    
    if (userValue <= 0) return;
    
    const category = asset.assetType.category || 'OTHER';
    const categoryKey = category as keyof typeof CATEGORY_COLORS;
    
    // Calculer les dettes
    const assetDebts = asset.debts?.reduce((sum, debt) => sum + debt.currentAmount, 0) || 0;
    totalDettes += assetDebts * ownershipPercentage;
    
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, {
        id: category,
        nom: CATEGORY_MAPPING[categoryKey] || category,
        montant: 0,
        pourcentage: 0,
        nombreActifs: 0,
        couleur: CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.OTHER,
        sousCategories: []
      });
    }
    
    const categoryData = categoriesMap.get(category)!;
    categoryData.montant += userValue;
    categoryData.nombreActifs += 1;
    
    // Ajouter à la sous-catégorie
    if (!categoryData.sousCategories) {
      categoryData.sousCategories = [];
    }
    
    categoryData.sousCategories.push({
      id: asset.id,
      nom: asset.name,
      montant: userValue,
      pourcentage: 0, // Sera calculé plus tard
      nombreActifs: 1
    });
    
    totalPatrimoine += userValue;
  });
  
  // Calculer les pourcentages
  const categories = Array.from(categoriesMap.values());
  categories.forEach(category => {
    category.pourcentage = totalPatrimoine > 0 ? (category.montant / totalPatrimoine) * 100 : 0;
    
    // Calculer les pourcentages des sous-catégories
    category.sousCategories?.forEach(subCategory => {
      subCategory.pourcentage = category.montant > 0 ? (subCategory.montant / category.montant) * 100 : 0;
    });
  });
  
  // Trier par montant décroissant
  categories.sort((a, b) => b.montant - a.montant);
  
  return {
    total: totalPatrimoine,
    dettes: totalDettes,
    net: totalPatrimoine - totalDettes,
    entites: [], // Sera rempli par le composant
    categories
  };
}

/**
 * Convertit les données de catégories en format pour le treemap Nivo
 */
export function convertToTreemapData(categories: CategoryData[]): TreemapData {
  return {
    id: 'patrimoine',
    name: 'Patrimoine',
    value: 0,
    percentage: 100,
    color: '#000000',
    nombreActifs: categories.reduce((sum, cat) => sum + cat.nombreActifs, 0),
    children: categories.map(category => ({
      id: category.id,
      name: category.nom,
      value: category.montant,
      percentage: category.pourcentage,
      color: category.couleur,
      nombreActifs: category.nombreActifs,
      children: category.sousCategories?.map(subCategory => ({
        id: subCategory.id,
        name: subCategory.nom,
        value: subCategory.montant,
        percentage: subCategory.pourcentage,
        color: category.couleur,
        nombreActifs: subCategory.nombreActifs
      }))
    }))
  };
}

/**
 * Calcule l'indice de diversification (Herfindahl-Hirschman Index)
 */
export function calculateDiversificationIndex(categories: CategoryData[]): number {
  const total = categories.reduce((sum, cat) => sum + cat.montant, 0);
  if (total === 0) return 0;
  
  const hhi = categories.reduce((sum, cat) => {
    const share = cat.montant / total;
    return sum + (share * share);
  }, 0);
  
  return Math.round((1 - hhi) * 100);
}

/**
 * Formate les données pour l'affichage dans le treemap
 */
export function formatTreemapValue(value: number): string {
  return formatCurrency(value);
}

/**
 * Formate le pourcentage pour l'affichage
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

/**
 * Obtient la couleur d'une catégorie
 */
export function getCategoryColor(category: string): string {
  const categoryKey = category as keyof typeof CATEGORY_COLORS;
  return CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.OTHER;
}

/**
 * Obtient le nom d'affichage d'une catégorie
 */
export function getCategoryDisplayName(category: string): string {
  const categoryKey = category as keyof typeof CATEGORY_MAPPING;
  return CATEGORY_MAPPING[categoryKey] || category;
}

/**
 * Filtre les actifs selon les critères donnés
 */
export function filterAssets(
  assets: AssetForTreemap[],
  filters: {
    entityIds?: string[];
    assetTypes?: string[];
    dateRange?: { start: Date; end: Date };
    valueRange?: { min: number; max: number };
    searchTerm?: string;
  }
): AssetForTreemap[] {
  return assets.filter(asset => {
    // Filtre par entité
    if (filters.entityIds && filters.entityIds.length > 0) {
      const hasSelectedEntity = asset.ownerships.some(ownership => 
        filters.entityIds!.includes(ownership.ownerEntity.id)
      );
      if (!hasSelectedEntity) return false;
    }
    
    // Filtre par type d'actif
    if (filters.assetTypes && filters.assetTypes.length > 0) {
      if (!filters.assetTypes.includes(asset.assetType.category)) return false;
    }
    
    // Filtre par plage de dates
    if (filters.dateRange) {
      const latestValuation = asset.valuations?.[0];
      if (!latestValuation) return false;
      
      const valuationDate = new Date(latestValuation.valuationDate);
      if (valuationDate < filters.dateRange.start || valuationDate > filters.dateRange.end) {
        return false;
      }
    }
    
    // Filtre par plage de valeur
    if (filters.valueRange) {
      const currentValue = calculateAssetCurrentValue(asset);
      if (currentValue < filters.valueRange.min || currentValue > filters.valueRange.max) {
        return false;
      }
    }
    
    // Filtre par terme de recherche
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const nameMatch = asset.name.toLowerCase().includes(searchLower);
      const typeMatch = asset.assetType.name.toLowerCase().includes(searchLower);
      if (!nameMatch && !typeMatch) return false;
    }
    
    return true;
  });
} 