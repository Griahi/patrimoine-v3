import { formatCurrency } from './financial-calculations';

// Types pour les données financières
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

export interface PatrimoineMetrics {
  total: number;
  dettes: number;
  net: number;
  entites: string[];
  categories: CategoryData[];
}

// Interface pour les actifs financiers
export interface AssetForFinancial {
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
  debts: Array<{
    id: string;
    amount: number;
    interestRate: number;
    maturityDate: string;
  }>;
}

// Interface pour les entités financières
export interface EntityForFinancial {
  id: string;
  name: string;
  type: string;
}

// Fonction pour formater les valeurs financières
export function formatFinancialValue(value: number): string {
  return formatCurrency(value);
}

// Fonction pour formater les pourcentages
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

// Fonction pour calculer l'indice de diversification
export function calculateDiversificationIndex(categories: CategoryData[]): number {
  if (categories.length === 0) return 0;
  
  const total = categories.reduce((sum, cat) => sum + cat.montant, 0);
  if (total === 0) return 0;
  
  // Calcul de l'indice de diversification basé sur l'entropie
  let entropy = 0;
  categories.forEach(category => {
    if (category.montant > 0) {
      const proportion = category.montant / total;
      entropy += proportion * Math.log2(proportion);
    }
  });
  
  // Normaliser entre 0 et 100
  const maxEntropy = Math.log2(categories.length);
  return maxEntropy > 0 ? Math.round((-entropy / maxEntropy) * 100) : 0;
}

// Fonction pour traiter les actifs et générer les métriques financières
export function processAssetsForFinancialMetrics(
  assets: AssetForFinancial[], 
  selectedEntityIds: string[] = []
): PatrimoineMetrics {
  if (!assets || assets.length === 0) {
    return {
      total: 0,
      dettes: 0,
      net: 0,
      entites: [],
      categories: []
    };
  }

  // Filtrer par entités si nécessaire
  let filteredAssets = assets;
  if (selectedEntityIds.length > 0) {
    filteredAssets = assets.filter(asset => 
      asset.ownerships.some(ownership => 
        selectedEntityIds.includes(ownership.ownerEntity.id)
      )
    );
  }

  // Calculer les totaux
  let totalValue = 0;
  let totalDebts = 0;
  const categoriesMap = new Map<string, CategoryData>();

  filteredAssets.forEach(asset => {
    // Valeur de l'actif
    const latestValuation = asset.valuations
      .sort((a, b) => new Date(b.valuationDate).getTime() - new Date(a.valuationDate).getTime())[0];
    
    if (!latestValuation) return;

    const assetValue = latestValuation.value;
    totalValue += assetValue;

    // Dettes de l'actif
    const assetDebts = asset.debts.reduce((sum, debt) => sum + debt.amount, 0);
    totalDebts += assetDebts;

    // Regroupement par catégorie
    const categoryName = asset.assetType.category || 'Autres';
    const categoryId = asset.assetType.id;
    const categoryColor = asset.assetType.color || '#6B7280';

    if (categoriesMap.has(categoryName)) {
      const category = categoriesMap.get(categoryName)!;
      category.montant += assetValue;
      category.nombreActifs += 1;
    } else {
      categoriesMap.set(categoryName, {
        id: categoryId,
        nom: categoryName,
        montant: assetValue,
        pourcentage: 0, // Sera calculé après
        nombreActifs: 1,
        couleur: categoryColor
      });
    }
  });

  // Calculer les pourcentages
  const categories = Array.from(categoriesMap.values());
  categories.forEach(category => {
    category.pourcentage = totalValue > 0 ? (category.montant / totalValue) * 100 : 0;
  });

  // Trier par montant décroissant
  categories.sort((a, b) => b.montant - a.montant);

  return {
    total: totalValue,
    dettes: totalDebts,
    net: totalValue - totalDebts,
    entites: selectedEntityIds,
    categories
  };
}

// Fonction pour filtrer les actifs par entités
export function filterAssets(
  assets: AssetForFinancial[], 
  selectedEntityIds: string[]
): AssetForFinancial[] {
  if (selectedEntityIds.length === 0) return assets;
  
  return assets.filter(asset => 
    asset.ownerships.some(ownership => 
      selectedEntityIds.includes(ownership.ownerEntity.id)
    )
  );
} 