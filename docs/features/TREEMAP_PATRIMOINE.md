# Treemap Patrimoine - Visualisation Interactive

## Vue d'ensemble

Le système de treemap patrimoine permet de visualiser de façon interactive la répartition d'un patrimoine financier par catégories. Il offre une interface moderne et intuitive pour explorer les données patrimoniales.

## Fonctionnalités

### 🎯 Fonctionnalités principales

- **Visualisation Treemap** : Affichage hiérarchique des catégories d'actifs
- **Vue Alternative** : Basculement entre treemap et graphique en secteurs
- **Filtres Multi-entités** : Sélection des entités à afficher
- **Métriques en temps réel** : Calcul automatique des totaux et ratios
- **Interactions** : Clic sur les catégories pour explorer les détails
- **Animations** : Transitions fluides entre les vues

### 📊 Métriques affichées

- **Patrimoine Total** : Valeur totale des actifs
- **Dettes Total** : Montant total des dettes
- **Patrimoine Net** : Différence entre actifs et dettes
- **Sélecteur d'entités** : Filtrage par entités

### 🏷️ Catégories d'actifs

Le système reconnaît automatiquement les catégories suivantes :

- **Immobilier** (`REAL_ESTATE`) - Vert foncé `#2E7D32`
- **Placements Financiers** (`FINANCIAL`) - Bleu `#1976D2`
- **Liquidités** (`CASH`) - Orange `#F57C00`
- **Cryptomonnaies** (`CRYPTO`) - Violet `#9C27B0`
- **Métaux Précieux** (`PRECIOUS`) - Orange doré `#FF6F00`
- **Véhicules** (`VEHICLE`) - Vert `#4CAF50`
- **Entreprises** (`BUSINESS`) - Rouge-orange `#FF5722`
- **Autres** (`OTHER`) - Gris `#757575`

## Utilisation

### Intégration dans une page

```tsx
import { PatrimoineContainer } from '@/components/patrimoine';

export default function MyPage() {
  const handleCategoryDetail = (category) => {
    // Gérer les détails d'une catégorie
    console.log('Category:', category);
  };

  return (
    <PatrimoineContainer
      height={600}
      onCategoryDetail={handleCategoryDetail}
    />
  );
}
```

### Utilisation avec des données personnalisées

```tsx
import { TreemapPatrimoine } from '@/components/patrimoine';

const categories = [
  {
    id: 'real_estate',
    nom: 'Immobilier',
    montant: 1500000,
    pourcentage: 68.0,
    nombreActifs: 3,
    couleur: '#2E7D32'
  },
  // ... autres catégories
];

export default function CustomTreemap() {
  return (
    <TreemapPatrimoine
      categories={categories}
      height={400}
      onCategoryClick={(category) => console.log(category)}
    />
  );
}
```

### Composants disponibles

#### PatrimoineContainer
Le composant principal qui orchestre tout le système :

```tsx
interface PatrimoineContainerProps {
  initialAssets?: AssetForTreemap[];
  initialEntities?: EntityForTreemap[];
  height?: number;
  onCategoryDetail?: (category: CategoryData) => void;
}
```

#### TreemapPatrimoine
Le composant treemap principal :

```tsx
interface TreemapPatrimoineProps {
  categories: CategoryData[];
  title?: string;
  height?: number;
  loading?: boolean;
  onCategoryClick?: (category: CategoryData) => void;
  onRefresh?: () => void;
}
```

#### PatrimoineHeader
Le header avec les métriques :

```tsx
interface PatrimoineHeaderProps {
  data: PatrimoineMetrics;
  entities: EntityForTreemap[];
  selectedEntityIds: string[];
  onEntityChange: (entityIds: string[]) => void;
  loading?: boolean;
}
```

## Structure des données

### AssetForTreemap
```typescript
interface AssetForTreemap {
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
```

### CategoryData
```typescript
interface CategoryData {
  id: string;
  nom: string;
  montant: number;
  pourcentage: number;
  nombreActifs: number;
  couleur: string;
  sousCategories?: SubCategoryData[];
}
```

## Fonctions utilitaires

### Traitement des données
```typescript
import { processAssetsForTreemap } from '@/utils/treemap-calculations';

const patrimoineMetrics = processAssetsForTreemap(assets, selectedEntityIds);
```

### Filtrage des actifs
```typescript
import { filterAssets } from '@/utils/treemap-calculations';

const filteredAssets = filterAssets(assets, {
  entityIds: ['entity1', 'entity2'],
  assetTypes: ['REAL_ESTATE', 'FINANCIAL'],
  valueRange: { min: 1000, max: 100000 }
});
```

### Calculs financiers
```typescript
import { 
  calculateAssetCurrentValue,
  calculateDiversificationIndex,
  formatTreemapValue,
  formatPercentage
} from '@/utils/treemap-calculations';
```

## Personnalisation

### Couleurs des catégories
Les couleurs sont définies dans `CATEGORY_COLORS` et peuvent être personnalisées :

```typescript
export const CATEGORY_COLORS = {
  'REAL_ESTATE': '#2E7D32',
  'FINANCIAL': '#1976D2',
  'CASH': '#F57C00',
  // ... autres couleurs
};
```

### Styles CSS
Les styles sont définis dans `src/styles/patrimoine.css` et peuvent être personnalisés :

```css
.patrimoine-treemap-node:hover {
  opacity: 0.8;
  transform: scale(1.02);
}
```

## Responsive Design

Le composant est entièrement responsive :
- **Desktop** : Affichage complet avec tous les détails
- **Tablet** : Adaptation de la taille du treemap
- **Mobile** : Vue compacte avec navigation simplifiée

## Accessibilité

- **Keyboard Navigation** : Navigation au clavier supportée
- **Screen Readers** : Labels appropriés pour les lecteurs d'écran
- **Contrast** : Couleurs respectant les standards WCAG
- **Focus Management** : Gestion appropriée du focus

## Intégration avec l'API

Le système s'intègre automatiquement avec les APIs existantes :
- `/api/assets` - Récupération des actifs
- `/api/entities` - Récupération des entités
- `/api/debts` - Récupération des dettes

## Dépendances

- `@nivo/treemap` : Composant treemap
- `@nivo/pie` : Composant graphique en secteurs
- `react-select` : Sélecteur d'entités
- `date-fns` : Manipulation des dates
- `d3` : Utilitaires de visualisation

## Exemples d'utilisation

### Dashboard principal
```tsx
// Intégré dans src/components/DashboardContent.tsx
<TreemapPatrimoine
  categories={treemapData.categories}
  height={320}
  loading={dashboardData.loading}
  onCategoryClick={handleCategoryClick}
/>
```

### Page dédiée
```tsx
// Disponible sur /dashboard/treemap
export default function TreemapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PatrimoineContainer
        height={600}
        onCategoryDetail={handleCategoryDetail}
      />
    </div>
  );
}
```

## Performance

- **Memoization** : Optimisation des calculs coûteux
- **Virtualisation** : Gestion efficace des grandes listes
- **Debouncing** : Limitation des appels API
- **Lazy Loading** : Chargement différé des composants

## Debugging

Mode développement avec informations de debug :
```jsx
{process.env.NODE_ENV === 'development' && (
  <div className="debug-info">
    <p>Assets: {assets.length}</p>
    <p>Categories: {categories.length}</p>
    <p>Total Value: {totalValue}</p>
  </div>
)}
```

## Roadmap

### Prochaines fonctionnalités
- [ ] Export PDF/PNG des graphiques
- [ ] Drill-down dans les sous-catégories
- [ ] Comparaison temporelle
- [ ] Alertes et notifications
- [ ] Mode plein écran
- [ ] Synchronisation temps réel

### Améliorations techniques
- [ ] Tests unitaires complets
- [ ] Documentation Storybook
- [ ] Optimisations performance
- [ ] Support offline

## Support

Pour des questions ou des problèmes :
1. Vérifiez la console pour les erreurs
2. Consultez les logs de debug
3. Vérifiez la structure des données
4. Testez avec des données simplifiées

## Contribution

Pour contribuer au système :
1. Respectez la structure des types existants
2. Ajoutez des tests pour les nouvelles fonctionnalités
3. Documentez les changements
4. Suivez les conventions de nommage 