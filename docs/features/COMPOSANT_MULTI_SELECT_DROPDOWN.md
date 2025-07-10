# Composant MultiSelectDropdown

## Vue d'ensemble

Le composant `MultiSelectDropdown` est une liste déroulante réutilisable qui permet la sélection multiple d'éléments avec des cases à cocher. Il offre une interface utilisateur moderne et intuitive pour la sélection d'entités ou d'autres éléments.

## Fonctionnalités

### 🎯 Sélection Multiple
- **Cases à cocher** : Chaque élément dispose d'une case à cocher
- **Sélection individuelle** : Cliquer sur un élément pour le sélectionner/désélectionner
- **Indicateur visuel** : Badge affichant le nombre d'éléments sélectionnés

### 🔍 Recherche Intégrée
- **Recherche en temps réel** : Filtre les éléments en tapant
- **Recherche par nom** : Recherche dans le libellé et la valeur
- **Placeholder personnalisable** : Texte d'aide pour la recherche

### 🚀 Actions Rapides
- **Tout sélectionner** : Bouton pour sélectionner tous les éléments visibles
- **Tout désélectionner** : Bouton pour effacer la sélection
- **Boutons conditionnels** : Affichés uniquement quand pertinents

### 🎨 Interface Utilisateur
- **Bouton déclencheur** : Affiche le résumé de la sélection
- **Icônes personnalisées** : Support des icônes pour chaque élément
- **Descriptions** : Texte d'aide sous chaque élément
- **États de chargement** : Indicateur de chargement intégré

## Utilisation

### Import
```typescript
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown"
```

### Exemple de base
```typescript
<MultiSelectDropdown
  options={[
    {
      id: "1",
      label: "John Doe",
      value: "john",
      description: "Personne physique",
      type: "INDIVIDUAL",
      icon: "👤"
    },
    {
      id: "2",
      label: "Société ABC",
      value: "abc",
      description: "Personne morale",
      type: "LEGAL_ENTITY",
      icon: "🏢"
    }
  ]}
  selectedValues={selectedIds}
  onSelectionChange={setSelectedIds}
  placeholder="Sélectionner des entités"
  searchPlaceholder="Rechercher une entité..."
/>
```

### Exemple avec entités
```typescript
<MultiSelectDropdown
  options={entities.map(entity => ({
    id: entity.id,
    label: entity.name,
    value: entity.id,
    description: entity.type === 'INDIVIDUAL' ? 'Personne physique' : 'Personne morale',
    type: entity.type,
    icon: entity.type === 'INDIVIDUAL' ? '👤' : '🏢'
  }))}
  selectedValues={selectedEntityIds}
  onSelectionChange={setSelectedEntityIds}
  placeholder="Sélectionner des entités"
  searchPlaceholder="Rechercher une entité..."
  maxDisplayItems={3}
  showSelectAll={true}
  showClearAll={true}
  emptyStateText="Aucune entité disponible"
  loading={loadingEntities}
  loadingText="Chargement des entités..."
/>
```

## Props

### Obligatoires
- `options`: Array d'objets avec `id`, `label`, `value`
- `selectedValues`: Array des valeurs sélectionnées
- `onSelectionChange`: Fonction appelée lors des changements de sélection

### Optionnelles
- `placeholder`: Texte affiché quand aucun élément n'est sélectionné
- `searchPlaceholder`: Texte d'aide pour la recherche
- `maxDisplayItems`: Nombre max d'éléments affichés dans le résumé
- `className`: Classes CSS personnalisées
- `disabled`: Désactive le composant
- `showSelectAll`: Affiche le bouton "Tout sélectionner"
- `showClearAll`: Affiche le bouton "Tout désélectionner"
- `emptyStateText`: Texte affiché quand aucun élément n'est disponible
- `loadingText`: Texte affiché pendant le chargement
- `loading`: Indicateur de chargement

### Interface Option
```typescript
interface Option {
  id: string        // Identifiant unique
  label: string     // Texte affiché
  value: string     // Valeur utilisée pour la sélection
  icon?: React.ReactNode  // Icône personnalisée
  description?: string    // Description sous le label
  type?: string     // Type pour l'icône automatique
}
```

## Comportement

### Affichage du résumé
- **Aucune sélection** : Affiche le placeholder
- **1 élément** : Affiche le nom de l'élément
- **≤ maxDisplayItems** : Affiche tous les noms séparés par des virgules
- **> maxDisplayItems** : Affiche les premiers + nombre d'autres

### Gestion des icônes
- **Icône fournie** : Utilise l'icône de l'option
- **Type INDIVIDUAL** : Affiche une icône utilisateur
- **Type LEGAL_ENTITY** : Affiche une icône entreprise
- **Par défaut** : Affiche une icône groupe

### Fermeture automatique
- **Clic extérieur** : Ferme la liste déroulante
- **Échappement** : Ferme la liste déroulante (à implémenter)

## Intégration

### Tableau de bord
Le composant remplace l'ancienne interface de sélection d'entités dans `DashboardContent.tsx` :
- Interface plus compacte
- Recherche intégrée
- Boutons d'action rapide

### Rapports
Utilisé dans `ReportFilters.tsx` pour la sélection d'entités :
- Cohérence avec le tableau de bord
- Meilleure expérience utilisateur
- Moins d'espace vertical utilisé

## Avantages

### 🎯 Expérience Utilisateur
- **Interface intuitive** : Familière pour les utilisateurs
- **Recherche rapide** : Trouve rapidement les éléments
- **Actions rapides** : Sélection/désélection en masse
- **Feedback visuel** : Indications claires de l'état

### 🔧 Développement
- **Réutilisable** : Peut être utilisé partout dans l'application
- **Configurable** : Nombreuses options de personnalisation
- **TypeScript** : Types stricts pour la sécurité
- **Responsive** : Fonctionne sur mobile et desktop

### 📊 Performance
- **Recherche côté client** : Filtrage instantané
- **Rendu optimisé** : Pas de re-rendu inutile
- **Fermeture automatique** : Économise les ressources
- **Lazy loading** : Support du chargement différé

## Cas d'usage

### Sélection d'entités
- **Tableau de bord** : Filtrer les données par entité
- **Rapports** : Inclure certaines entités dans l'analyse
- **Exports** : Choisir les entités à exporter

### Autres utilisations possibles
- **Sélection de types d'actifs** : Filtrer par catégorie
- **Sélection de devises** : Analyses multi-devises
- **Sélection de périodes** : Comparaisons temporelles
- **Sélection d'utilisateurs** : Gestion des permissions

## Maintenance

### Ajout de nouvelles fonctionnalités
1. **Clavier** : Navigation avec les flèches
2. **Groupes** : Regroupement d'options
3. **Recherche avancée** : Filtres multiples
4. **Sélection partielle** : États intermédiaires

### Améliorations possibles
- **Virtualisation** : Pour de grandes listes
- **Tri** : Options de tri personnalisées
- **Thèmes** : Personnalisation de l'apparence
- **Animations** : Transitions plus fluides

## Migration

### Depuis l'ancienne interface
1. **Remplacer** les grilles de cases à cocher
2. **Adapter** les données au format `Option`
3. **Connecter** les handlers de sélection
4. **Tester** le comportement

### Compatibilité
- **Données existantes** : Aucune migration nécessaire
- **API** : Pas de changement des endpoints
- **État** : Même format de données (array de strings) 