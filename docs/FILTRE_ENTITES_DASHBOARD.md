# Système de Filtrage par Entité - Tableau de Bord

## Vue d'ensemble

Le tableau de bord dispose maintenant d'un système de filtrage avancé permettant de visualiser le patrimoine soit de toutes les entités, soit d'une entité spécifique.

## Fonctionnalités

### 1. Filtre Principal
- **Position** : Carte dédiée en haut du tableau de bord
- **Sélecteur** : Menu déroulant avec toutes les entités disponibles
- **Option par défaut** : "Toutes les entités" 🌍
- **Icônes distinctives** :
  - 👤 Personnes physiques (INDIVIDUAL)
  - 🏢 Personnes morales (LEGAL_ENTITY)

### 2. Adaptation Dynamique
Lorsqu'une entité est sélectionnée, tous les éléments du tableau de bord s'adaptent :

#### Métriques Clés
- **Patrimoine Total** : Calculé uniquement pour l'entité sélectionnée
- **Entités** : Affiche "1" au lieu du nombre total
- **Actifs** : Nombre d'actifs appartenant à l'entité
- **Performance** : Basée sur les actifs de l'entité

#### Graphiques
- **Répartition du Patrimoine** : Filtré par entité
- **Évolution du Patrimoine** : Historique spécifique à l'entité
- **Descriptions** : Mentionnent le nom de l'entité sélectionnée

#### Top 5 Actifs
- **Actifs listés** : Uniquement ceux de l'entité sélectionnée
- **Informations** : Nom du propriétaire masqué quand une entité est sélectionnée

## Architecture Technique

### API Routes
1. **`/api/dashboard`** : Données globales (toutes entités)
2. **`/api/dashboard?entityId=<id>`** : Données filtrées par entité
3. **`/api/entities`** : Liste des entités pour le sélecteur

### Composants
- **`DashboardContent.tsx`** : Composant client principal
- **État géré** : `selectedEntityId` contrôle le filtrage
- **Chargement asynchrone** : Données mises à jour automatiquement

### Logique de Filtrage
```typescript
// Dans l'API dashboard
const entityFilter = entityId ? { id: entityId } : {}

const entities = await prisma.entity.findMany({
  where: { 
    userId,
    ...entityFilter
  },
  // ... rest of query
})
```

## Interface Utilisateur

### Indicateurs Visuels
- **Titre** : "Vue d'ensemble • [Nom de l'entité]"
- **Descriptions** : Adaptées selon le contexte
- **Bouton Reset** : "Voir toutes les entités" quand filtré

### États de Chargement
- **Spinner** : Pendant le chargement initial
- **Mise à jour** : Transparent lors du changement de filtre
- **Gestion d'erreur** : Messages d'erreur avec bouton de réessai

## Cas d'Usage

### Conseillers en Gestion de Patrimoine
- **Analyse client** : Voir le patrimoine d'un client spécifique
- **Comparaison** : Basculer entre différentes entités
- **Présentation** : Vue claire pour les réunions client

### Gestion Familiale
- **Patrimoine personnel** : Filtrer sur sa propre entité
- **Patrimoine familial** : Vue globale de la famille
- **Société** : Patrimoine d'une société spécifique

## Avantages

### Performance
- **Calculs ciblés** : Uniquement les données nécessaires
- **Requêtes optimisées** : Filtrage au niveau base de données
- **Rendu efficace** : Pas de filtrage côté client

### Expérience Utilisateur
- **Navigation fluide** : Changement de filtre instantané
- **Clarté** : Information contextuelle claire
- **Flexibilité** : Basculement facile entre vues

### Évolutivité
- **Ajout d'entités** : Automatiquement disponibles
- **Nouveaux filtres** : Architecture extensible
- **Intégration** : Compatible avec les fonctionnalités existantes

## Utilisation

1. **Accéder au tableau de bord** : `/dashboard`
2. **Utiliser le filtre** : Sélectionner une entité dans la liste
3. **Voir les données** : Toutes les métriques se mettent à jour
4. **Revenir à la vue globale** : Sélectionner "Toutes les entités"

## Maintenance

### Ajout d'une nouvelle entité
Le système est automatique - aucune modification nécessaire.

### Modification des calculs
Les calculs sont centralisés dans l'API route `/api/dashboard`.

### Personnalisation
Les couleurs et styles peuvent être modifiés dans `DashboardContent.tsx`.

---

*Cette fonctionnalité améliore significativement l'expérience utilisateur en permettant une analyse ciblée du patrimoine par entité.* 