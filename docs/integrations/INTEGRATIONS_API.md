# Intégrations API - Documentation

## Vue d'ensemble

Le système d'intégrations API permet de connecter automatiquement des sources de données externes pour enrichir et mettre à jour le patrimoine des utilisateurs. Il supporte actuellement :

- **Bridge API** : Agrégation bancaire pour synchroniser les comptes et soldes
- **Yahoo Finance** : Données boursières en temps réel et historiques

## Architecture

### Services d'intégration

```
src/lib/integrations/
├── bridge.ts           # Service Bridge API
├── yahoo-finance.ts    # Service Yahoo Finance
└── scheduler.ts        # Tâches automatisées (à implémenter)
```

### API Routes

```
src/app/api/integrations/
├── bridge/
│   ├── auth/route.ts   # Authentification Bridge
│   └── sync/route.ts   # Synchronisation Bridge
└── yahoo-finance/
    ├── sync/route.ts   # Mise à jour des cours
    └── search/route.ts # Recherche de symboles
```

### Modèles de données

```sql
-- Connexions Bridge API
BridgeConnection {
  userId, accessToken, refreshToken, expiresAt, bankId, bankName
}

-- Comptes bancaires synchronisés
BridgeAccount {
  userId, bridgeAccountId, name, balance, currency, type, iban
}

-- Valorisations enrichies
Valuation {
  assetId, value, currency, source, metadata (JSON)
}
```

## Configuration

### Variables d'environnement

```env
# Bridge API
BRIDGE_CLIENT_ID="votre-client-id"
BRIDGE_CLIENT_SECRET="votre-client-secret"
BRIDGE_API_URL="https://api.bridgeapi.io"
BRIDGE_REDIRECT_URI="http://localhost:3000/api/integrations/bridge/callback"

# Yahoo Finance via RapidAPI
RAPIDAPI_KEY="votre-rapidapi-key"
```

### Migration de base de données

```bash
# Appliquer les nouveaux modèles
npx prisma migrate dev --name add_integrations

# Générer le client Prisma
npx prisma generate
```

## Bridge API - Agrégation bancaire

### Configuration

1. **Créer un compte Bridge** : https://dashboard.bridgeapi.io/
2. **Obtenir les credentials** : Client ID, Client Secret
3. **Configurer l'URL de retour** : `/api/integrations/bridge/callback`

### Utilisation

```typescript
import { BridgeService } from '@/lib/integrations/bridge'

const bridgeService = new BridgeService()

// Générer l'URL d'autorisation
const authUrl = bridgeService.generateAuthUrl(userId)

// Synchroniser les comptes
const result = await bridgeService.syncAccounts(userId)
```

### Flux d'autorisation

1. **Initiation** : `GET /api/integrations/bridge/auth`
2. **Redirection** : Vers Bridge pour autorisation
3. **Callback** : `POST /api/integrations/bridge/auth` avec le code
4. **Synchronisation** : Récupération automatique des comptes

### Données synchronisées

- **Comptes bancaires** : Nom, solde, IBAN, type
- **Valorisations** : Création automatique d'actifs correspondants
- **Historique** : Suivi des synchronisations

## Yahoo Finance - Données boursières

### Configuration

1. **S'inscrire sur RapidAPI** : https://rapidapi.com/
2. **Souscrire à Yahoo Finance API**
3. **Obtenir la clé API** : X-RapidAPI-Key

### Utilisation

```typescript
import { YahooFinanceService } from '@/lib/integrations/yahoo-finance'

const yahooService = new YahooFinanceService()

// Mettre à jour les cours
const result = await yahooService.updateStockPrices(userId)

// Rechercher des symboles
const symbols = await yahooService.searchSymbols('AAPL')

// Ajouter une action au portefeuille
const asset = await yahooService.addStockToPortfolio(userId, 'AAPL', 10)
```

### Fonctionnalités

- **Cours en temps réel** : Prix, variation, volume
- **Données historiques** : Historique des cours
- **Recherche** : Recherche de symboles boursiers
- **Performance** : Calcul de performance de portefeuille

## Interface utilisateur

### Page d'intégrations

```tsx
// Accès via /integrations
import IntegrationsManager from '@/components/integrations/IntegrationsManager'

// Fonctionnalités :
// - Connexion/déconnexion Bridge
// - Synchronisation manuelle
// - Recherche d'actions
// - Statut des intégrations
```

### Composants

- **IntegrationsManager** : Gestionnaire principal
- **BridgeConnection** : Statut et contrôles Bridge
- **StockSearch** : Recherche et ajout d'actions
- **SyncStatus** : Indicateurs de synchronisation

## Sécurité

### Authentification

- **OAuth 2.0** : Bridge utilise OAuth 2.0
- **Tokens sécurisés** : Stockage chiffré des tokens
- **Refresh automatique** : Renouvellement des tokens

### Données sensibles

- **Chiffrement** : Tokens et données sensibles chiffrés
- **Permissions** : Accès limité aux données utilisateur
- **Audit** : Logs des accès et synchronisations

## Automatisation

### Tâches programmées

```typescript
// À implémenter avec node-cron ou similaire
// Synchronisation automatique toutes les 6 heures
'0 */6 * * *' => syncAllAccounts()
'0 9,15,21 * * 1-5' => updateStockPrices() // Heures de marché
```

### Webhooks

```typescript
// Endpoints pour les notifications externes
POST /api/webhooks/bridge      // Notifications Bridge
POST /api/webhooks/market      // Événements de marché
```

## Gestion des erreurs

### Types d'erreurs

- **API indisponible** : Retry avec backoff exponentiel
- **Token expiré** : Refresh automatique
- **Limites de taux** : Mise en cache et throttling
- **Données invalides** : Validation et logs

### Monitoring

```typescript
// Logs structurés
logger.info('Bridge sync completed', {
  userId,
  accountsCreated,
  accountsUpdated,
  duration: Date.now() - startTime
})

// Métriques
metrics.increment('integrations.bridge.sync.success')
metrics.histogram('integrations.bridge.sync.duration', duration)
```

## Extensions possibles

### Autres agrégateurs bancaires

- **Plaid** : Marché américain
- **Open Banking** : Standard européen
- **Tink** : Nordique et européen
- **Salt Edge** : Global

### Autres sources de données

- **Alpha Vantage** : Données financières
- **Finnhub** : Données de marché
- **IEX Cloud** : Données boursières US
- **Quandl** : Données économiques

### Fonctionnalités avancées

- **Notifications** : Alertes sur seuils
- **Recommandations** : IA pour suggestions
- **Reporting** : Rapports automatisés
- **Conformité** : Règles réglementaires

## API Endpoints

### Bridge API

```http
GET    /api/integrations/bridge/auth          # URL d'autorisation
POST   /api/integrations/bridge/auth          # Callback autorisation
GET    /api/integrations/bridge/sync          # Statut de synchronisation
POST   /api/integrations/bridge/sync          # Synchronisation manuelle
DELETE /api/integrations/bridge/disconnect    # Déconnexion
```

### Yahoo Finance API

```http
GET    /api/integrations/yahoo-finance/search?q={query}     # Recherche symboles
GET    /api/integrations/yahoo-finance/sync?symbols={list}  # Prix actuels
POST   /api/integrations/yahoo-finance/sync                 # Mise à jour complète
POST   /api/integrations/yahoo-finance/add                  # Ajouter action
```

## Exemples d'utilisation

### Synchronisation complète

```typescript
// Synchroniser toutes les sources pour un utilisateur
async function syncUserData(userId: string) {
  const results = await Promise.allSettled([
    bridgeService.syncAccounts(userId),
    yahooFinanceService.updateStockPrices(userId)
  ])
  
  return {
    bridge: results[0],
    stocks: results[1]
  }
}
```

### Ajout d'une action

```typescript
// Interface utilisateur pour ajouter une action
const addStock = async (symbol: string, quantity: number) => {
  try {
    const result = await fetch('/api/integrations/yahoo-finance/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, quantity })
    })
    
    if (result.success) {
      toast.success(`Action ${symbol} ajoutée avec succès`)
      refreshPortfolio()
    }
  } catch (error) {
    toast.error('Erreur lors de l\'ajout de l\'action')
  }
}
```

## Déploiement

### Variables d'environnement production

```env
# Bridge API Production
BRIDGE_CLIENT_ID="prod-client-id"
BRIDGE_CLIENT_SECRET="prod-client-secret"
BRIDGE_API_URL="https://api.bridgeapi.io"
BRIDGE_REDIRECT_URI="https://yourdomain.com/api/integrations/bridge/callback"

# Rate limiting
BRIDGE_RATE_LIMIT="100/hour"
YAHOO_RATE_LIMIT="500/hour"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="warn"
```

### Considérations de performance

- **Cache** : Redis pour les données fréquemment consultées
- **Queue** : Bull/Agenda pour les tâches asynchrones
- **Monitoring** : Surveillance des performances API
- **Backup** : Sauvegarde des données sensibles

Ce système d'intégrations offre une base solide pour l'automatisation de la gestion patrimoniale avec possibilité d'extension vers d'autres sources de données financières. 