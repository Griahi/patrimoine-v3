# Système de Formulaires Dynamiques pour les Actifs

## Vue d'ensemble

Le système de formulaires dynamiques permet de créer des formulaires spécialisés pour chaque type d'actif dans l'application de gestion de patrimoine. Chaque type d'actif dispose de ses propres champs spécifiques en plus des champs de base communs.

## Structure des fichiers

```
src/
├── types/
│   └── assets.ts                           # Types TypeScript pour tous les types d'actifs
└── components/
    └── forms/
        ├── DynamicAssetForm.tsx           # Composant principal du formulaire
        └── asset-types/                   # Composants spécifiques par type d'actif
            ├── StockFormFields.tsx        # Actions et titres
            ├── RealEstateFormFields.tsx   # Immobilier
            ├── CryptocurrencyFormFields.tsx # Cryptomonnaies
            ├── BankAccountFormFields.tsx  # Comptes bancaires
            ├── LifeInsuranceFormFields.tsx # Assurances vie
            ├── InvestmentFundFormFields.tsx # Fonds d'investissement
            ├── PreciousMetalFormFields.tsx # Métaux précieux
            ├── ValuableObjectFormFields.tsx # Objets de valeur
            ├── VehicleFormFields.tsx      # Véhicules
            └── OtherFormFields.tsx        # Autres (avec champs personnalisés)
```

## Types d'actifs supportés

### 1. Actions (`ASSET_TYPE_CODES.STOCKS`)
**Champs spécifiques :**
- Code ISIN
- Symbole/Ticker
- Quantité
- Prix d'achat unitaire
- Prix actuel
- Devise
- Place de marché
- Frais de courtage

**Fonctionnalités :**
- Calcul automatique des plus/moins-values
- Support multi-devises
- Indicateurs de performance

### 2. Immobilier (`ASSET_TYPE_CODES.REAL_ESTATE`)
**Champs spécifiques :**
- Type de bien (appartement/maison/terrain/commercial)
- Adresse complète
- Surface (m²)
- Nombre de pièces
- Prix d'acquisition
- Frais de notaire
- Travaux réalisés
- Valeur locative mensuelle
- Taxe foncière annuelle

**Fonctionnalités :**
- Calcul du rendement brut/net
- Estimation de l'investissement total
- Indicateurs immobiliers

### 3. Cryptomonnaies (`ASSET_TYPE_CODES.CRYPTO`)
**Champs spécifiques :**
- Symbole (BTC, ETH, etc.)
- Quantité
- Prix d'achat moyen
- Plateforme/Wallet
- Adresse du wallet (optionnel)

**Fonctionnalités :**
- Support des principales cryptomonnaies
- Gestion des wallets
- Notes de sécurité

### 4. Comptes Bancaires (`ASSET_TYPE_CODES.BANK_ACCOUNTS`)
**Champs spécifiques :**
- IBAN
- BIC
- Banque
- Type de compte (courant/épargne/terme)
- Solde actuel
- Devise
- Taux d'intérêt

**Fonctionnalités :**
- Calcul des intérêts annuels
- Support multi-devises
- Confidentialité des données

### 5. Assurance Vie (`ASSET_TYPE_CODES.LIFE_INSURANCE`)
**Champs spécifiques :**
- Numéro de contrat
- Compagnie d'assurance
- Date de souscription
- Type (épargne/prévoyance)
- Montant des versements
- Valeur de rachat
- Bénéficiaires

### 6. Fonds d'Investissement (`ASSET_TYPE_CODES.INVESTMENT_FUNDS`)
**Champs spécifiques :**
- Code ISIN
- Nom du fonds
- Type (OPCVM, FCP, SICAV, ETF)
- Nombre de parts
- Valeur liquidative d'achat
- Valeur liquidative actuelle
- Frais de gestion

### 7. Métaux Précieux (`ASSET_TYPE_CODES.PRECIOUS_METALS`)
**Champs spécifiques :**
- Type de métal (Or/Argent/Platine/Palladium)
- Forme (lingot/pièce)
- Poids (grammes/onces)
- Pureté
- Prix d'achat au gramme/once
- Lieu de stockage

### 8. Objets de Valeur (`ASSET_TYPE_CODES.VALUABLE_OBJECTS`)
**Champs spécifiques :**
- Catégorie (Art/Bijoux/Montres/Collection)
- Marque/Artiste
- Modèle/Titre
- Année
- État de conservation
- Certificat d'authenticité (oui/non)
- Assurance spécifique

### 9. Véhicules (`ASSET_TYPE_CODES.VEHICLES`)
**Champs spécifiques :**
- Type (voiture/moto/bateau/autre)
- Marque
- Modèle
- Immatriculation
- Date de première mise en circulation
- Kilométrage
- Carburant
- Prix d'achat
- Valeur Argus actuelle

**Fonctionnalités :**
- Calcul de la dépréciation
- Indicateurs de perte de valeur

### 10. Autres (`ASSET_TYPE_CODES.OTHER`)
**Champs spécifiques :**
- Catégorie personnalisée
- Champs personnalisés dynamiques (paires clé-valeur)

**Fonctionnalités :**
- Champs totalement personnalisables
- Types de données multiples (texte, nombre, date, booléen)
- Parfait pour les investissements atypiques

## Utilisation

### Intégration dans votre composant

```tsx
import { DynamicAssetForm } from "@/components/forms/DynamicAssetForm"
import { BaseAssetFormData } from "@/types/assets"

function MyComponent() {
  const handleSubmit = async (formData: BaseAssetFormData) => {
    // Traiter les données du formulaire
    console.log(formData)
  }

  const handleCancel = () => {
    // Annuler l'opération
  }

  return (
    <DynamicAssetForm
      assetTypes={assetTypes}
      entities={entities}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={false}
      mode="create" // ou "edit" pour l'édition
    />
  )
}
```

### Modes d'utilisation

Le composant supporte deux modes :

- **Mode création** (`mode="create"`) : Interface optimisée pour créer un nouvel actif
- **Mode édition** (`mode="edit"`) : Interface adaptée pour modifier un actif existant avec données pré-remplies

### Structure des données

```typescript
interface BaseAssetFormData {
  name: string
  description: string
  assetTypeId: string
  owners: Array<{
    entityId: string
    percentage: number
  }>
  initialValue: number
  valuationDate: string
  metadata: Record<string, any> // Champs spécifiques selon le type d'actif
}
```

## Fonctionnalités communes

### Gestion de la propriété
- Support des propriétaires multiples
- Calcul automatique des pourcentages
- Répartition rapide (parts égales, 50/50, etc.)
- Validation que le total atteint 100%

### Validation
- Validation en temps réel
- Messages d'erreur contextuels
- Champs obligatoires clairement identifiés

### Interface utilisateur
- Design responsive
- Thème cohérent avec l'application
- Indicateurs visuels de progression
- Résumés calculés automatiquement

## Extension du système

### Ajouter un nouveau type d'actif

1. **Créer l'interface TypeScript** dans `src/types/assets.ts`
2. **Créer le composant de formulaire** dans `src/components/forms/asset-types/`
3. **Ajouter le code du type** dans `ASSET_TYPE_CODES`
4. **Mettre à jour le switch** dans `DynamicAssetForm.tsx`

### Exemple d'ajout

```typescript
// 1. Dans types/assets.ts
export interface NewAssetTypeMetadata {
  specificField: string
  numericField: number
}

// 2. Créer NewAssetTypeFormFields.tsx
export function NewAssetTypeFormFields({ metadata, onMetadataChange, errors }) {
  // Composant de formulaire spécialisé
}

// 3. Dans ASSET_TYPE_CODES
export const ASSET_TYPE_CODES = {
  // ... existing codes
  NEW_TYPE: 'new_type'
} as const

// 4. Dans DynamicAssetForm.tsx
case ASSET_TYPE_CODES.NEW_TYPE:
  return <NewAssetTypeFormFields {...props} />
```

## Bonnes pratiques

1. **Validation côté client** : Utilisez des règles de validation appropriées pour chaque champ
2. **Feedback utilisateur** : Affichez des résumés et calculs en temps réel
3. **Accessibilité** : Utilisez des labels appropriés et des indicateurs visuels
4. **Performance** : Utilisez `useCallback` pour les fonctions de mise à jour
5. **Types stricts** : Maintenez des types TypeScript précis pour chaque métadonnée

## État de l'implémentation

✅ **Complètement intégré** : Le système DynamicAssetForm est maintenant utilisé pour :
- ✅ **Création d'actifs** : Formulaires dynamiques complets avec champs spécialisés
- ✅ **Édition d'actifs** : Interface cohérente avec pré-remplissage des données
- ✅ **Validation** : Règles de validation centralisées et coherentes
- ✅ **Gestion de propriété** : Système unifié pour les propriétaires multiples

## Support et maintenance

Le système est conçu pour être facilement extensible. Chaque type d'actif est isolé dans son propre composant, facilitant la maintenance et l'ajout de nouvelles fonctionnalités.

### Migration complète effectuée

L'ancien système de formulaires a été entièrement remplacé par le système DynamicAssetForm, offrant une expérience utilisateur cohérente et des fonctionnalités avancées pour tous les types d'actifs.

Pour toute question ou suggestion d'amélioration, consultez la documentation du projet principal. 