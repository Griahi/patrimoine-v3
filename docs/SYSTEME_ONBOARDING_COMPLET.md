# Système d'Onboarding Complet - Documentation

## Vue d'ensemble

Le système d'onboarding de l'application de gestion de patrimoine permet aux nouveaux utilisateurs d'importer et configurer rapidement leurs données patrimoniales via deux approches distinctes :

1. **Import Excel** - Import rapide en masse depuis un fichier structuré
2. **Assistant Guidé** - Configuration étape par étape avec interface intuitive

## Architecture du Système

### Structure des Dossiers

```
src/
├── components/onboarding/
│   ├── OnboardingFlow.tsx          # Composant principal avec choix d'approche
│   ├── ExcelImporter.tsx           # Module d'import Excel complet
│   ├── OnboardingWizard.tsx        # Assistant guidé multi-étapes
│   ├── shared/
│   │   ├── DataPreview.tsx         # Aperçu des données Excel
│   │   ├── ImportProgress.tsx      # Barre de progression d'import
│   │   └── StepIndicator.tsx       # Indicateur d'étapes du wizard
│   └── steps/
│       └── PersonalProfile.tsx     # Première étape : profil personnel
├── stores/
│   └── onboarding-store.ts         # Store Zustand pour état du wizard
├── services/
│   └── excel-parser.ts             # Service de parsing Excel
├── utils/onboarding/
│   └── excel-validator.ts          # Validation des données Excel
└── app/onboarding/
    └── page.tsx                    # Page de démonstration
```

### Technologies Utilisées

- **React 18** + TypeScript pour l'interface
- **Zustand** pour la gestion d'état
- **Framer Motion** pour les animations
- **xlsx** pour le parsing Excel
- **react-dropzone** pour le drag & drop
- **Zod** pour la validation des données
- **Tailwind CSS** + Shadcn/ui pour le design

## Fonctionnalités Implémentées

### 1. OnboardingFlow Principal

**Fichier**: `src/components/onboarding/OnboardingFlow.tsx`

Interface de choix entre les deux approches avec :
- Design moderne avec animations fluides
- Cartes interactives pour chaque option
- Background décoratif avec éléments animés
- Transitions entre les modes

**Fonctionnalités** :
- Navigation fluide entre les modes
- Interface responsive
- Animations d'entrée/sortie
- Indicateurs visuels de temps estimé

### 2. Module Excel Importer

**Fichiers** :
- `src/components/onboarding/ExcelImporter.tsx`
- `src/services/excel-parser.ts`
- `src/utils/onboarding/excel-validator.ts`

**Fonctionnalités** :
- **Template Excel** automatiquement généré avec exemples
- **Drag & Drop** avec validation des formats (.xlsx, .xls)
- **Parsing intelligent** avec tolérance aux variations de noms de feuilles
- **Validation complète** avec Zod schemas
- **Aperçu des données** avant import
- **Gestion des erreurs** ligne par ligne
- **Validations croisées** (cohérence des références)
- **Progression animée** durant l'import
- **Gestion des types** automatique (dates Excel, devises, pourcentages)

**Structure Excel Supportée** :
- **Entités** : Personnes physiques et morales
- **Comptes Bancaires** : Différents types de comptes
- **Portefeuille Boursier** : Actions et titres
- **Immobilier** : Biens avec détails complets
- **Détentions** : Relations de propriété avec pourcentages

### 3. Assistant Guidé (Wizard)

**Fichiers** :
- `src/components/onboarding/OnboardingWizard.tsx`
- `src/components/onboarding/shared/StepIndicator.tsx`
- `src/components/onboarding/steps/PersonalProfile.tsx`
- `src/stores/onboarding-store.ts`

**Fonctionnalités** :
- **Navigation fluide** entre 8 étapes
- **Indicateur de progression** visuel
- **Validation en temps réel** des données
- **Sauvegarde automatique** des données
- **Interface responsive** et accessible
- **Animations** entre les étapes

**Étapes Définies** :
1. **Profil Personnel** (✅ Implémentée)
   - Informations de base
   - Situation familiale
   - Objectifs patrimoniaux
2. **Entités** (🚧 Placeholder)
3. **Comptes Bancaires** (🚧 Placeholder)
4. **Portefeuille Boursier** (🚧 Placeholder)
5. **Immobilier** (🚧 Placeholder)
6. **Autres Actifs** (🚧 Placeholder)
7. **Structure de Détention** (🚧 Placeholder)
8. **Résumé** (🚧 Placeholder)

### 4. Store Zustand

**Fichier**: `src/stores/onboarding-store.ts`

**Fonctionnalités** :
- **Persistance automatique** des données en localStorage
- **Actions complètes** pour manipulation des données
- **Validation** intégrée pour chaque étape
- **Gestion des erreurs** par étape
- **Import Excel** avec intégration directe

**Actions Principales** :
- `setStepData()` - Mettre à jour une étape complète
- `updateStepField()` - Mettre à jour un champ spécifique
- `addToStepArray()` - Ajouter un élément à un tableau
- `nextStep()` / `prevStep()` - Navigation
- `canGoNext()` - Validation avant progression
- `importExcelData()` - Intégration des données Excel

### 5. Validation et Parsing Excel

**Fichier**: `src/utils/onboarding/excel-validator.ts`

**Schémas Zod** pour :
- **Entités** avec types et validation email
- **Comptes bancaires** avec IBAN et devises
- **Actions** avec symboles et quantités
- **Immobilier** avec adresses et valeurs
- **Détentions** avec pourcentages totaux

**Fonctionnalités** :
- **Transformation automatique** des types (ex: "Société" → "LEGAL_ENTITY")
- **Validation croisée** des références entre feuilles
- **Gestion des dates Excel** (format numérique)
- **Nettoyage des données** (symboles monétaires, espaces)
- **Messages d'erreur** localisés en français

## Interface Utilisateur

### Design Moderne
- **Gradients animés** et effets de glassmorphism
- **Micro-interactions** avec Framer Motion
- **Cards interactives** avec effets hover
- **Indicateurs de progression** sophistiqués
- **Palette de couleurs** cohérente

### Responsive Design
- **Mobile-first** approach
- **Breakpoints** adaptatifs
- **Navigation** optimisée pour mobile
- **Touch-friendly** interactions

### Accessibilité
- **Contrastes** respectés
- **Navigation clavier** supportée
- **Screen readers** compatibles
- **Indicateurs visuels** clairs

## Gestion des Erreurs

### Excel Import
- **Validation des fichiers** (format, taille)
- **Erreurs de parsing** avec localisation précise
- **Aperçu** avant import avec possibilité d'annulation
- **Retry automatique** en cas d'échec temporaire

### Wizard
- **Validation en temps réel** avec feedback visuel
- **Empêchement** de progression si données invalides
- **Messages d'erreur** contextuels
- **Récupération automatique** des données sauvegardées

## Performance

### Optimisations
- **Lazy loading** des composants
- **Memoization** des calculs coûteux
- **Debouncing** des validations
- **Parallélisation** du parsing Excel

### Monitoring
- **Logs détaillés** en mode développement
- **Métriques** de temps de parsing
- **Indicateurs** de progression en temps réel

## Sécurité

### Validation
- **Sanitization** des données d'entrée
- **Validation stricte** des types
- **Limites** de taille de fichier
- **Protection** contre les injections

### Données Sensibles
- **Chiffrement** en transit
- **Pas de stockage** côté serveur des fichiers temporaires
- **Nettoyage automatique** des données temporaires

## Tests

### Types de Tests à Implémenter
- **Tests unitaires** pour les validators
- **Tests d'intégration** pour le parsing Excel
- **Tests E2E** pour les parcours complets
- **Tests de performance** pour gros fichiers

### Couverture Cible
- **Parsing Excel** : 90%
- **Validation** : 95%
- **Composants UI** : 80%
- **Store Zustand** : 85%

## Déploiement

### Prérequis
```bash
npm install xlsx zustand framer-motion react-dropzone
```

### Variables d'Environnement
```env
NODE_ENV=development  # Pour afficher les infos debug
```

### Utilisation
```tsx
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

function App() {
  return (
    <OnboardingFlow 
      onComplete={() => router.push('/dashboard')} 
    />
  )
}
```

## Roadmap

### Phase 2 : Étapes Complètes du Wizard
- [ ] Implémentation de l'étape "Entités"
- [ ] Intégration API bancaire (Bridge/Budget Insight)
- [ ] Recherche de titres avec API externe
- [ ] Estimation immobilière automatique
- [ ] Interface drag & drop pour structure de détention

### Phase 3 : Fonctionnalités Avancées
- [ ] Import depuis autres formats (CSV, PDF)
- [ ] OCR pour documents papier
- [ ] Mode démo avec données fictives
- [ ] Export de configuration
- [ ] Templates sectoriels

### Phase 4 : Intelligence
- [ ] Suggestions automatiques
- [ ] Détection de doublons
- [ ] Validation de cohérence avancée
- [ ] Recommandations personnalisées

## Support et Maintenance

### Contact
- Documentation technique complète disponible
- Exemples d'utilisation fournis
- Support pour intégration personnalisée

### Mise à jour
- **Versioning sémantique**
- **Changelog détaillé**
- **Migration guides** pour breaking changes
- **Backward compatibility** maintenue quand possible

---

**Système d'onboarding développé pour optimiser l'expérience utilisateur et réduire le temps de configuration initial à moins de 15 minutes.** 