/**
 * Bridge API Service - Agrégateur Bancaire
 * Documentation: https://docs.bridgeapi.io/
 */

import { prisma } from '@/lib/prisma'

interface BridgeAccount {
  id: string
  name: string
  balance: number
  currency: string
  type: 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment'
  bank_id: string
  iban?: string
  updated_at: string
}

interface BridgeTransaction {
  id: string
  account_id: string
  amount: number
  currency: string
  date: string
  description: string
  category: string
  updated_at: string
}

interface BridgeBank {
  id: string
  name: string
  logo_url: string
  country: string
}

interface BridgeAuthResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  token_type: 'Bearer'
}

export class BridgeService {
  private baseUrl: string
  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor() {
    this.baseUrl = process.env.BRIDGE_API_URL || 'https://api.bridgeapi.io'
    this.clientId = process.env.BRIDGE_CLIENT_ID || ''
    this.clientSecret = process.env.BRIDGE_CLIENT_SECRET || ''
    this.redirectUri = process.env.BRIDGE_REDIRECT_URI || ''

    // Ne pas lancer d'erreur, laisser les méthodes gérer l'absence de configuration
    if (!this.clientId || !this.clientSecret) {
      console.warn('Bridge API credentials are not configured')
    }
  }

  /**
   * Vérifie si l'API Bridge est configurée
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret)
  }

  /**
   * Génère l'URL d'autorisation pour connecter une banque
   */
  generateAuthUrl(userId: string, state?: string): string {
    if (!this.isConfigured()) {
      throw new Error('Bridge API credentials are not configured')
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'read_accounts read_transactions',
      state: state || userId
    })

    return `${this.baseUrl}/v2/authorize?${params.toString()}`
  }

  /**
   * Échange le code d'autorisation contre un access token
   */
  async exchangeAuthCode(code: string): Promise<BridgeAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri
        })
      })

      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Bridge auth error:', error)
      throw new Error('Failed to authenticate with Bridge API')
    }
  }

  /**
   * Refresh du token d'accès
   */
  async refreshToken(refreshToken: string): Promise<BridgeAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Bridge token refresh error:', error)
      throw new Error('Failed to refresh Bridge API token')
    }
  }

  /**
   * Récupère les comptes bancaires d'un utilisateur
   */
  async getAccounts(accessToken: string): Promise<BridgeAccount[]> {
    if (!this.clientId || !this.clientSecret) {
      console.warn('Bridge API credentials are not configured')
      return []
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/accounts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': this.clientId
        }
      })

      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status}`)
      }

      const data = await response.json()
      return data.resources || []
    } catch (error) {
      console.error('Bridge accounts error:', error)
      throw new Error('Failed to fetch accounts from Bridge API')
    }
  }

  /**
   * Récupère les transactions d'un compte
   */
  async getTransactions(accessToken: string, accountId: string, limit = 100): Promise<BridgeTransaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/accounts/${accountId}/transactions?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': this.clientId
        }
      })

      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status}`)
      }

      const data = await response.json()
      return data.resources || []
    } catch (error) {
      console.error('Bridge transactions error:', error)
      throw new Error('Failed to fetch transactions from Bridge API')
    }
  }

  /**
   * Synchronise les comptes bancaires pour un utilisateur
   */
  async syncAccounts(userId: string): Promise<{ success: boolean; message: string; accountsCreated: number; accountsUpdated: number }> {
    if (!this.clientId || !this.clientSecret) {
      return {
        success: false,
        message: 'Bridge API non configuré - variables d\'environnement manquantes',
        accountsCreated: 0,
        accountsUpdated: 0
      }
    }

    try {
      // Récupération des tokens Bridge de l'utilisateur
      const bridgeConnection = await prisma.bridgeConnection.findFirst({
        where: { userId }
      })

      if (!bridgeConnection) {
        return {
          success: false,
          message: 'Aucune connexion Bridge trouvée pour cet utilisateur',
          accountsCreated: 0,
          accountsUpdated: 0
        }
      }

      let accessToken = bridgeConnection.accessToken
      
      // Vérification et refresh du token si nécessaire
      if (new Date() > bridgeConnection.expiresAt) {
        try {
          const refreshResponse = await this.refreshToken(bridgeConnection.refreshToken)
          accessToken = refreshResponse.access_token
          
          // Mise à jour des tokens en base
          await prisma.bridgeConnection.update({
            where: { id: bridgeConnection.id },
            data: {
              accessToken: refreshResponse.access_token,
              refreshToken: refreshResponse.refresh_token,
              expiresAt: new Date(Date.now() + refreshResponse.expires_in * 1000)
            }
          })
        } catch (error) {
          return {
            success: false,
            message: 'Erreur lors du refresh du token Bridge',
            accountsCreated: 0,
            accountsUpdated: 0
          }
        }
      }

      // Récupération des comptes depuis Bridge
      const bridgeAccounts = await this.getAccounts(accessToken)
      let accountsCreated = 0
      let accountsUpdated = 0

      // Traitement de chaque compte
      for (const bridgeAccount of bridgeAccounts) {
        try {
          // Vérification si le compte existe déjà
          const existingAccount = await prisma.bridgeAccount.findFirst({
            where: {
              bridgeAccountId: bridgeAccount.id,
              userId
            }
          })

          if (existingAccount) {
            // Mise à jour du compte existant
            await prisma.bridgeAccount.update({
              where: { id: existingAccount.id },
              data: {
                name: bridgeAccount.name,
                balance: bridgeAccount.balance,
                currency: bridgeAccount.currency,
                type: bridgeAccount.type,
                iban: bridgeAccount.iban,
                lastSyncAt: new Date()
              }
            })
            accountsUpdated++
          } else {
            // Création d'un nouveau compte
            await prisma.bridgeAccount.create({
              data: {
                userId,
                bridgeAccountId: bridgeAccount.id,
                name: bridgeAccount.name,
                balance: bridgeAccount.balance,
                currency: bridgeAccount.currency,
                type: bridgeAccount.type,
                iban: bridgeAccount.iban,
                bankId: bridgeAccount.bank_id,
                lastSyncAt: new Date()
              }
            })
            accountsCreated++
          }

          // Création/mise à jour d'un actif correspondant
          await this.createOrUpdateAsset(userId, bridgeAccount)

        } catch (error) {
          console.error(`Erreur lors du traitement du compte ${bridgeAccount.id}:`, error)
        }
      }

      return {
        success: true,
        message: `Synchronisation terminée: ${accountsCreated} comptes créés, ${accountsUpdated} comptes mis à jour`,
        accountsCreated,
        accountsUpdated
      }

    } catch (error) {
      console.error('Bridge sync error:', error)
      return {
        success: false,
        message: 'Erreur lors de la synchronisation avec Bridge API',
        accountsCreated: 0,
        accountsUpdated: 0
      }
    }
  }

  /**
   * Crée ou met à jour un actif basé sur un compte Bridge
   */
  private async createOrUpdateAsset(userId: string, bridgeAccount: BridgeAccount): Promise<void> {
    try {
      // Recherche du type d'actif "Comptes Bancaires"
      let assetType = await prisma.assetType.findFirst({
        where: { name: 'Comptes Bancaires' }
      })

      if (!assetType) {
        // Création du type d'actif s'il n'existe pas
        assetType = await prisma.assetType.create({
          data: {
            name: 'Comptes Bancaires',
            category: 'FINANCIAL',
            fields: {
              iban: { type: 'string', label: 'IBAN', required: false },
              bankName: { type: 'string', label: 'Banque', required: false },
              accountType: { type: 'string', label: 'Type de compte', required: false }
            }
          }
        })
      }

      // Recherche de l'entité utilisateur par défaut
      const userEntity = await prisma.entity.findFirst({
        where: { userId, type: 'INDIVIDUAL' }
      })

      if (!userEntity) {
        console.error('Aucune entité utilisateur trouvée pour créer l\'actif')
        return
      }

      // Vérification si l'actif existe déjà
      const existingAsset = await prisma.asset.findFirst({
        where: {
          name: bridgeAccount.name,
          assetTypeId: assetType.id,
          metadata: {
            path: ['bridgeAccountId'],
            equals: bridgeAccount.id
          }
        }
      })

      if (existingAsset) {
        // Mise à jour de l'actif existant
        await prisma.asset.update({
          where: { id: existingAsset.id },
          data: {
            metadata: {
              ...existingAsset.metadata as any,
              bridgeAccountId: bridgeAccount.id,
              iban: bridgeAccount.iban,
              bankId: bridgeAccount.bank_id,
              accountType: bridgeAccount.type
            }
          }
        })

        // Mise à jour de la valorisation
        await prisma.valuation.create({
          data: {
            assetId: existingAsset.id,
            value: bridgeAccount.balance,
            currency: bridgeAccount.currency,
            valuationDate: new Date(),
            source: 'BRIDGE_API'
          }
        })
      } else {
        // Création d'un nouvel actif
        const newAsset = await prisma.asset.create({
          data: {
            name: bridgeAccount.name,
            assetTypeId: assetType.id,
            metadata: {
              bridgeAccountId: bridgeAccount.id,
              iban: bridgeAccount.iban,
              bankId: bridgeAccount.bank_id,
              accountType: bridgeAccount.type
            }
          }
        })

        // Création de la possession à 100% pour l'utilisateur
        await prisma.assetOwnership.create({
          data: {
            assetId: newAsset.id,
            entityId: userEntity.id,
            percentage: 100
          }
        })

        // Création de la valorisation initiale
        await prisma.valuation.create({
          data: {
            assetId: newAsset.id,
            value: bridgeAccount.balance,
            currency: bridgeAccount.currency,
            valuationDate: new Date(),
            source: 'BRIDGE_API'
          }
        })
      }
    } catch (error) {
      console.error('Erreur lors de la création/mise à jour de l\'actif:', error)
    }
  }

  /**
   * Récupère les banques disponibles
   */
  async getBanks(country = 'FR'): Promise<BridgeBank[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/banks?country=${country}`, {
        headers: {
          'Client-Id': this.clientId
        }
      })

      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status}`)
      }

      const data = await response.json()
      return data.resources || []
    } catch (error) {
      console.error('Bridge banks error:', error)
      throw new Error('Failed to fetch banks from Bridge API')
    }
  }

  /**
   * Supprime une connexion Bridge
   */
  async disconnectBridge(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Suppression de la connexion en base
      await prisma.bridgeConnection.deleteMany({
        where: { userId }
      })

      // Suppression des comptes Bridge associés
      await prisma.bridgeAccount.deleteMany({
        where: { userId }
      })

      return {
        success: true,
        message: 'Connexion Bridge supprimée avec succès'
      }
    } catch (error) {
      console.error('Bridge disconnect error:', error)
      return {
        success: false,
        message: 'Erreur lors de la déconnexion de Bridge'
      }
    }
  }
}

/**
 * Utilitaire pour créer et valider une instance Bridge
 */
export async function connectBridge(): Promise<{ bridge: BridgeService; configured: boolean; error?: string }> {
  try {
    const bridge = new BridgeService()
    
    if (!bridge.isConfigured()) {
      return {
        bridge,
        configured: false,
        error: 'Bridge API non configuré - variables d\'environnement manquantes'
      }
    }

    return {
      bridge,
      configured: true
    }
  } catch (error) {
    return {
      bridge: new BridgeService(),
      configured: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la connexion Bridge'
    }
  }
} 