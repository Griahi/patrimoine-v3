# 🚀 Accès Rapide Provisoire

## Vue d'ensemble

L'accès rapide provisoire permet de contourner temporairement le système d'authentification pour faciliter le développement et les tests.

## Méthodes d'accès

### 1. Bouton d'accès rapide sur la page de login

- Rendez-vous sur `/login`
- Cliquez sur le bouton "🚀 Accès Rapide (Sans mot de passe)"
- Vous serez automatiquement connecté avec un utilisateur de test

### 2. Contrôles de mode développement dans le Navbar

En mode développement, vous verrez des contrôles dans le navbar :
- **Badge DEV** : Indique que vous êtes en mode développement
- **Accès Rapide** : Active l'accès rapide
- **Auth Normale** : Retourne à l'authentification normale

### 3. Bypass complet via variable d'environnement

Ajoutez cette variable à votre fichier `.env.local` :

```env
QUICK_ACCESS=true
```

Avec cette variable, toutes les pages seront accessibles sans authentification en mode développement.

## Utilisateur de test

L'accès rapide crée automatiquement un utilisateur de test :
- **Email** : test@example.com
- **Nom** : Utilisateur Test
- **Mot de passe** : Aucun (accès sans mot de passe)

## Nettoyage

Pour supprimer l'accès rapide :
1. Utilisez le bouton "Auth Normale" dans le navbar
2. Ou appelez directement l'API : `POST /api/auth/clear-quick-access`

## Sécurité

⚠️ **Important** : Cette fonctionnalité est uniquement disponible en mode développement (`NODE_ENV=development`).

## Routes API

- `POST /api/auth/quick-access` : Créer un accès rapide
- `POST /api/auth/clear-quick-access` : Supprimer l'accès rapide

## Notes

- L'accès rapide est idéal pour :
  - Les tests de développement
  - Les démonstrations
  - Le développement rapide de fonctionnalités
  - Le débogage sans avoir à se connecter constamment

- N'oubliez pas de revenir à l'authentification normale avant de passer en production ! 