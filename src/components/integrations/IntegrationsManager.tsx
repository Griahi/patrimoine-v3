'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import { 
  Building2, 
  TrendingUp, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

interface BridgeConnection {
  id: string
  bankName?: string
  createdAt: string
  lastSync?: string
}

interface BridgeAccount {
  id: string
  name: string
  balance: number
  currency: string
  type: string
  iban?: string
  lastSyncAt?: string
}

interface BridgeStatus {
  connected: boolean
  connection?: BridgeConnection
  accounts: BridgeAccount[]
  message?: string
}

interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
  currency: string
}

export default function IntegrationsManager() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({ connected: false, accounts: [] })
  const [bridgeSyncing, setBridgeSyncing] = useState(false)
  const [stocksSyncing, setStocksSyncing] = useState(false)
  const [stockSearch, setStockSearch] = useState('')
  const [stockResults, setStockResults] = useState<StockSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBridgeStatus()
  }, [])

  const fetchBridgeStatus = async () => {
    try {
      const response = await fetch('/api/integrations/bridge/sync')
      const data = await response.json()
      setBridgeStatus(data)
    } catch (error) {
      console.error('Erreur lors de la récupération du statut Bridge:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectBridge = async () => {
    try {
      const response = await fetch('/api/integrations/bridge/auth')
      const data = await response.json()
      
      if (data.authUrl) {
        // Redirection vers Bridge pour l'autorisation
        window.location.href = data.authUrl
      } else {
        toast.error('Erreur lors de la génération de l\'URL d\'autorisation')
      }
    } catch (error) {
      console.error('Erreur lors de la connexion Bridge:', error)
      toast.error('Erreur lors de la connexion à Bridge')
    }
  }

  const syncBridge = async () => {
    setBridgeSyncing(true)
    try {
      const response = await fetch('/api/integrations/bridge/sync', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        await fetchBridgeStatus()
      } else {
        toast.error(data.message || 'Erreur lors de la synchronisation')
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation Bridge:', error)
      toast.error('Erreur lors de la synchronisation')
    } finally {
      setBridgeSyncing(false)
    }
  }

  const syncStocks = async () => {
    setStocksSyncing(true)
    try {
      const response = await fetch('/api/integrations/yahoo-finance/sync', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message || 'Erreur lors de la mise à jour des cours')
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation des actions:', error)
      toast.error('Erreur lors de la mise à jour des cours')
    } finally {
      setStocksSyncing(false)
    }
  }

  const searchStocks = async () => {
    if (!stockSearch.trim() || stockSearch.length < 2) return
    
    setSearching(true)
    try {
      const response = await fetch(`/api/integrations/yahoo-finance/search?q=${encodeURIComponent(stockSearch)}`)
      const data = await response.json()
      
      if (data.success) {
        setStockResults(data.results)
      } else {
        toast.error('Erreur lors de la recherche')
        setStockResults([])
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      toast.error('Erreur lors de la recherche')
      setStockResults([])
    } finally {
      setSearching(false)
    }
  }

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Jamais'
    const date = new Date(lastSync)
    return date.toLocaleString('fr-FR')
  }

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(balance)
  }

  const getAccountTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'checking': 'Compte courant',
      'savings': 'Livret d\'épargne',
      'credit_card': 'Carte de crédit',
      'loan': 'Prêt',
      'investment': 'Compte titres'
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bridge Banking Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6" />
              <div>
                <CardTitle>Intégration Bancaire - Bridge</CardTitle>
                <CardDescription>
                  Synchronisez automatiquement vos comptes bancaires
                </CardDescription>
              </div>
            </div>
            {bridgeStatus.connected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connecté
              </Badge>
            ) : (
              <Badge variant="secondary">
                <WifiOff className="h-3 w-3 mr-1" />
                Non connecté
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!bridgeStatus.connected ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Connectez vos comptes bancaires pour synchroniser automatiquement vos soldes
              </p>
              <Button onClick={connectBridge}>
                <Plus className="h-4 w-4 mr-2" />
                Connecter ma banque
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connection Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">
                    {bridgeStatus.connection?.bankName || 'Banque connectée'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Connecté le {formatLastSync(bridgeStatus.connection?.createdAt)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Dernière sync: {formatLastSync(bridgeStatus.connection?.lastSync)}
                  </div>
                </div>
                <Button 
                  onClick={syncBridge} 
                  disabled={bridgeSyncing}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${bridgeSyncing ? 'animate-spin' : ''}`} />
                  {bridgeSyncing ? 'Synchronisation...' : 'Synchroniser'}
                </Button>
              </div>

              {/* Accounts List */}
              {bridgeStatus.accounts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comptes synchronisés</Label>
                  {bridgeStatus.accounts.map(account => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getAccountTypeLabel(account.type)}
                          {account.iban && ` • ${account.iban.slice(-4)}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatBalance(account.balance, account.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatLastSync(account.lastSyncAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yahoo Finance Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6" />
              <div>
                <CardTitle>Données Boursières - Yahoo Finance</CardTitle>
                <CardDescription>
                  Mise à jour automatique des cours de vos actions
                </CardDescription>
              </div>
            </div>
            <Badge variant="default" className="bg-blue-500">
              <Wifi className="h-3 w-3 mr-1" />
              Actif
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stock Sync */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="font-medium">Synchronisation des cours</div>
              <div className="text-sm text-muted-foreground">
                Met à jour automatiquement les valorisations de vos actions
              </div>
            </div>
            <Button 
              onClick={syncStocks} 
              disabled={stocksSyncing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${stocksSyncing ? 'animate-spin' : ''}`} />
              {stocksSyncing ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>

          {/* Stock Search */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Rechercher des actions</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Rechercher par nom ou symbole (ex: AAPL, Apple)"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchStocks()}
              />
              <Button 
                onClick={searchStocks} 
                disabled={searching || stockSearch.length < 2}
              >
                <Search className={`h-4 w-4 ${searching ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Search Results */}
            {stockResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stockResults.map(result => (
                  <div key={result.symbol} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium">{result.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.name} • {result.exchange}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{result.currency}</Badge>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des intégrations</CardTitle>
          <CardDescription>
            Paramètres avancés et gestion des connexions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Synchronisation automatique</Label>
              <div className="text-sm text-muted-foreground">
                Les données sont synchronisées automatiquement toutes les 6 heures
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sécurité</Label>
              <div className="text-sm text-muted-foreground">
                Toutes les connexions utilisent des protocoles sécurisés (OAuth 2.0)
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Documentation</div>
                <div className="text-sm text-muted-foreground">
                  Consultez la documentation pour plus d'informations
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.open('#', '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir la doc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 