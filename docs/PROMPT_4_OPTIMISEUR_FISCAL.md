# 💰 Prompt 4 : Optimiseur Fiscal Intelligent

## Contexte
Tu développes une application de gestion de patrimoine avec React, Node.js, PostgreSQL et Prisma. L'application a déjà l'authentification, la gestion des entités et actifs implémentée avec un dashboard fonctionnel.

Je veux maintenant ajouter un module d'optimisation fiscale intelligent qui analyse automatiquement le patrimoine de l'utilisateur et propose des stratégies concrètes pour réduire ses impôts.

## Fonctionnalités à Implémenter

### 1. Service d'Analyse Fiscale Backend

Crée un service complet d'analyse fiscale qui calcule automatiquement :
- IR (Impôt sur le Revenu) avec barème progressif
- IFI (Impôt sur la Fortune Immobilière) si patrimoine > 1.3M€
- Plus-values mobilières et immobilières
- Prélèvements sociaux
- Taxe foncière estimée

### 2. Moteur d'Optimisation Fiscale

Implémente un moteur intelligent qui identifie les opportunités d'optimisation :
- Optimisation PER (Plan Épargne Retraite)
- Déficit foncier avec travaux déductibles
- Tax Loss Harvesting sur actions
- Stratégies de transmission (donations, SCI)
- Structure holding si pertinente
- Investissements défiscalisants (Pinel, etc.)

### 3. Interface Utilisateur Complète

Interface avec :
- Dashboard fiscal avec métriques clés
- Liste des optimisations classées par ROI
- Simulateur interactif
- Détails de chaque stratégie
- Timeline de mise en œuvre

### 4. Simulateur Fiscal Interactif

Simulateur permettant de tester différents scénarios :
- Modification des paramètres en temps réel
- Comparaison avant/après
- Graphiques d'impact
- Export PDF des recommandations

### 5. Calculs Conformes à la Législation

Tous les calculs doivent respecter :
- Barèmes fiscaux 2024
- Plafonds et limites légales
- Règles de déductibilité
- Calendrier fiscal

Génère le code complet avec :
- Service d'analyse fiscale avec tous les calculs
- Moteur d'optimisation avec toutes les stratégies
- Interface utilisateur moderne et intuitive
- Routes API sécurisées
- Modèles Prisma pour les données fiscales
- Simulateur interactif
- Tests unitaires et d'intégration

L'objectif est d'avoir un assistant fiscal intelligent qui guide l'utilisateur vers les meilleures optimisations selon sa situation. 