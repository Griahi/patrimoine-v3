'use client'

import { useState, useEffect, useCallback } from "react"
import { useSession } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { 
  TrendingUp, 
  Users,
  Plus,
  Euro,
  AlertTriangle,
  Home,
  Banknote,
  CreditCard,
  Database,
  Info
} from "lucide-react"
import Link from "next/link"
import { calculateTotalPatrimony } from "@/lib/utils"
import { 
  formatCurrency 
} from "@/utils/financial-calculations"
import EntityFilter from "@/components/dashboard/EntityFilter"
import { useDashboardEntityFilter } from "@/hooks/useEntityFilter"

import { EnhancedTreemap } from "@/components/dashboard/enhanced-treemap"
import { EnhancedTreemapFilters, EnhancedTreemapFiltersData, defaultFilters } from "@/components/dashboard/enhanced-treemap-filters"
import { useEnhancedTreemapData } from "@/hooks/use-enhanced-treemap-data"

interface Entity {
  id: string
  name: string
  type: 'INDIVIDUAL' | 'LEGAL_ENTITY'
  userId: string
  metadata?: Record<string, unknown>
  notes?: string
}

interface Asset {
  id: string
  name: string
  description?: string
  assetType: {
    id: string
    name: string
    category: string
    icon?: string
    color?: string
  }
  ownerships: {
    ownerEntity: Entity
    percentage: number
  }[]
  valuations: {
    value: number
    currency: string
    valuationDate: string
  }[]
}

interface Debt {
  id: string
  name: string
  currentAmount: number
  monthlyPayment?: number
  lender?: string
  asset: Asset
}

interface DebtsData {
  debts: Debt[]
  summary?: {
    totalDebt: number
    totalInitialAmount: number
    totalMonthlyPayments: number
    activeDebtsCount: number
    totalDebtsCount: number
  }
}

interface DashboardData {
  entities: Entity[]
  assets: Asset[]
  debtsData: DebtsData
  loading: boolean
  error: string | null
}

export default function DashboardContent() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    entities: [],
    assets: [],
    debtsData: { debts: [] },
    loading: true,
    error: null
  })
  const [hasInitialized, setHasInitialized] = useState(false)
  const [treemapFilters, setTreemapFilters] = useState<EnhancedTreemapFiltersData>(defaultFilters)
  
  // Entity filter state
  const {
    selectedEntityIds,
    setSelectedEntityIds,
    hasSelection
  } = useDashboardEntityFilter()
  
  // Enhanced treemap data hook
  const treemapData = useEnhancedTreemapData(
    dashboardData.assets,
    dashboardData.entities,
    treemapFilters
  )

  const loadDashboardData = useCallback(async () => {
    try {
      console.log('📊 Loading dashboard data...')
      console.log('📊 Session status:', status)
      console.log('📊 Session data:', session)
      console.log('📊 Entity filter:', hasSelection ? selectedEntityIds : 'all entities')
      
      setDashboardData(prev => ({ ...prev, loading: true, error: null }))

      // Build query parameters for entity filtering
      const entityQueryParam = hasSelection && selectedEntityIds.length > 0 
        ? `?entityIds=${selectedEntityIds.join(',')}` 
        : ''

      // Charger les données en parallèle
      console.log('🔄 Fetching entities...')
      const entitiesResponse = await fetch('/api/entities').catch(err => {
        console.error('❌ Error fetching entities:', err)
        return { ok: false, error: err.message }
      })

      console.log('🔄 Fetching assets with filter...')
      const assetsResponse = await fetch(`/api/assets${entityQueryParam}`).catch(err => {
        console.error('❌ Error fetching assets:', err)
        return { ok: false, error: err.message }
      })

      console.log('🔄 Fetching debts with filter...')
      const debtsResponse = await fetch(`/api/debts${entityQueryParam}`).catch(err => {
        console.error('❌ Error fetching debts:', err)
        return { ok: false, error: err.message }
      })

      console.log('📊 API Responses status:', {
        entities: entitiesResponse.ok,
        assets: assetsResponse.ok,
        debts: debtsResponse.ok
      })

      // Gérer les réponses avec des fallbacks
      let entities = []
      let assets = []
      let debtsData = { debts: [] }

      if (entitiesResponse.ok) {
        entities = await entitiesResponse.json()
        console.log('✅ Entities loaded:', entities.length)
      } else {
        console.warn('⚠️ Failed to load entities')
      }

      if (assetsResponse.ok) {
        assets = await assetsResponse.json()
        console.log('✅ Assets loaded:', assets.length)
      } else {
        console.warn('⚠️ Failed to load assets')
      }

      if (debtsResponse.ok) {
        debtsData = await debtsResponse.json()
        console.log('✅ Debts loaded:', debtsData.debts?.length || 0)
      } else {
        console.warn('⚠️ Failed to load debts')
      }

      // Vérifier si c'est un Array (pour les cas où l'API retourne directement un tableau)
      const entitiesArray = Array.isArray(entities) ? entities : []
      const assetsArray = Array.isArray(assets) ? assets : []
      const debtsArray = Array.isArray(debtsData) ? { debts: debtsData } : debtsData

      // Calculer un résumé des dettes si non fourni
      if (debtsArray.debts && !debtsArray.summary) {
        const totalDebt = debtsArray.debts.reduce((sum: number, debt: Debt) => sum + debt.currentAmount, 0)
        const activeDebtsCount = debtsArray.debts.filter((debt: Debt) => debt.currentAmount > 0).length
        debtsArray.summary = {
          totalDebt,
          totalInitialAmount: totalDebt,
          totalMonthlyPayments: debtsArray.debts.reduce((sum: number, debt: Debt) => sum + (debt.monthlyPayment || 0), 0),
          activeDebtsCount,
          totalDebtsCount: debtsArray.debts.length
        }
      }

      setDashboardData({
        entities: entitiesArray,
        assets: assetsArray,
        debtsData: debtsArray,
        loading: false,
        error: null
      })
      
      setHasInitialized(true)
      console.log('✅ Dashboard data loaded successfully')
    } catch (error) {
      console.error('❌ Erreur dashboard:', error)
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }))
      setHasInitialized(true)
    }
  }, [status, session, hasSelection, selectedEntityIds])

  useEffect(() => {
    // Simplified logic: load data when authenticated and not yet initialized
    if (status === 'authenticated' && !hasInitialized) {
      console.log('🔄 useEffect: Loading dashboard data (authenticated)')
      loadDashboardData()
    } else if (status === 'loading') {
      console.log('⏳ useEffect: Waiting for authentication status')
    } else if (status === 'unauthenticated') {
      console.log('🚫 useEffect: User not authenticated')
      setHasInitialized(true)
      setDashboardData(prev => ({ ...prev, loading: false }))
    }
  }, [status, hasInitialized, loadDashboardData])

  // Reset state when session changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      setHasInitialized(false)
      setDashboardData({
        entities: [],
        assets: [],
        debtsData: { debts: [] },
        loading: false,
        error: null
      })
    }
  }, [status])

  // Reload data when entity filter changes (after initial load)
  useEffect(() => {
    if (status === 'authenticated' && hasInitialized) {
      console.log('🔄 Entity filter changed, reloading data...')
      loadDashboardData()
    }
  }, [selectedEntityIds, hasInitialized, status, loadDashboardData])

  // Show loading state
  if (status === 'loading' || (status === 'authenticated' && !hasInitialized)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="space-y-2">
            <p className="text-gray-700">Chargement du tableau de bord...</p>
            <p className="text-sm text-gray-500">Status: {status}</p>
            <p className="text-sm text-gray-500">Session: {session ? 'Oui' : 'Non'}</p>
            <p className="text-sm text-gray-500">Initialisé: {hasInitialized ? 'Oui' : 'Non'}</p>
            <p className="text-sm text-gray-500">Données chargées: {dashboardData.loading ? 'En cours' : 'Terminé'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <p className="text-amber-600 mb-4">Vous devez être connecté pour accéder au tableau de bord</p>
        <Link href="/login">
          <Button>Se connecter</Button>
        </Link>
      </div>
    )
  }

  if (dashboardData.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Database className="h-12 w-12 text-amber-500 mb-4" />
        <p className="text-amber-600 mb-2">Service temporairement indisponible</p>
        <p className="text-sm text-gray-500 mb-4">{dashboardData.error}</p>
        <div className="space-y-2 text-center">
          <p className="text-xs text-gray-400">Debug info:</p>
          <p className="text-xs text-gray-400">Status: {status}</p>
          <p className="text-xs text-gray-400">Session: {session ? session.user.email : 'Non connecté'}</p>
          <p className="text-xs text-gray-400">Initialisé: {hasInitialized ? 'Oui' : 'Non'}</p>
        </div>
        <div className="mt-4 space-x-2">
          <Button onClick={() => {
            setHasInitialized(false)
            loadDashboardData()
          }} variant="outline">
            Réessayer
          </Button>
          <Button onClick={() => {
            console.log('📊 Dashboard Debug Info:', {
              status,
              session,
              hasInitialized,
              dashboardData,
              error: dashboardData.error
            })
            alert('Informations de debug affichées dans la console (F12)')
          }} variant="outline" size="sm">
            Voir les logs
          </Button>
        </div>
      </div>
    )
  }

  // Si aucune donnée, afficher l'état vide avec guide d'onboarding
  const hasNoData = dashboardData.entities.length === 0 && dashboardData.assets.length === 0

  if (hasNoData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bienvenue !</h1>
            <p className="text-gray-600">Commencez par configurer votre patrimoine</p>
          </div>
        </div>

        {/* Onboarding Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Info className="h-5 w-5 mr-2" />
                Commencer
              </CardTitle>
              <CardDescription>
                Pour utiliser le tableau de bord, vous devez d'abord ajouter des entités et des actifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3">1</div>
                  <span>Ajoutez une entité (personne ou société)</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3">2</div>
                  <span>Créez vos premiers actifs</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3">3</div>
                  <span>Visualisez votre patrimoine</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Actions rapides
              </CardTitle>
              <CardDescription>
                Commencez par ces étapes essentielles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/entities" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Créer ma première entité
                  </Button>
                </Link>
                <Link href="/assets" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Ajouter un actif
                  </Button>
                </Link>
                <Link href="/onboarding" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Assistant d'import
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques vides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patrimoine Total</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">0 €</div>
              <p className="text-xs text-muted-foreground">Aucun actif</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entités</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">0</div>
              <p className="text-xs text-muted-foreground">Aucune entité</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dettes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">0 €</div>
              <p className="text-xs text-muted-foreground">Aucune dette</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">--</div>
              <p className="text-xs text-muted-foreground">Pas de données</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Dashboard normal avec données
  const totalPatrimoine = calculateTotalPatrimony(
    dashboardData.assets, 
    hasSelection ? selectedEntityIds : undefined
  )
  const totalDebts = dashboardData.debtsData.summary?.totalDebt || 0
  const patrimoineNet = totalPatrimoine - totalDebts





  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de votre patrimoine</p>
        </div>
        <Link href="/assets">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel actif
          </Button>
        </Link>
      </div>

      {/* Filtre d'entités */}
      {dashboardData.entities.length > 0 && (
        <EntityFilter
          entities={dashboardData.entities}
          selectedEntityIds={selectedEntityIds}
          onSelectionChange={setSelectedEntityIds}
          loading={dashboardData.loading}
          className="mb-6"
        />
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimoine Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPatrimoine)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.assets.length} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dettes Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebts)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.debtsData.summary?.activeDebtsCount || 0} dettes actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimoine Net</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${patrimoineNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(patrimoineNet)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPatrimoine > 0 ? ((patrimoineNet / totalPatrimoine) * 100).toFixed(1) : '0'}% ratio net
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entités</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.entities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Personnes et sociétés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition des actifs - Treemap pleine largeur */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Répartition du Patrimoine
          </CardTitle>
          <CardDescription>
            Visualisation hiérarchique de vos actifs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.assets.length > 0 ? (
            <div className="space-y-6">
              <EnhancedTreemapFilters
                filters={treemapFilters}
                onFiltersChange={setTreemapFilters}
                availableEntities={treemapData.availableEntities}
                availableAssetTypes={treemapData.availableAssetTypes}
                totalAssets={treemapData.totalAssets}
                totalValue={treemapData.totalValue}
                className="mb-4"
              />
              <EnhancedTreemap
                assets={treemapData.filteredAssets}
                responsive={true}
                className="shadow-lg"
              />
              {treemapData.error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  <div className="font-medium">Erreur lors du chargement des données</div>
                  <div className="mt-1">{treemapData.error.message}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun actif à afficher</p>
              <p className="text-sm text-gray-400 mt-2">
                Commencez par ajouter des actifs pour voir votre treemap
              </p>
            </div>
          )}
        </CardContent>
              </Card>

      {/* Entités récentes */}
      {dashboardData.entities.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Entités récentes
                </CardTitle>
                <CardDescription>
                  Vos dernières entités créées ou modifiées
                </CardDescription>
              </div>
              <Link href="/entities">
                <Button variant="outline" size="sm">
                  Voir toutes
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.entities
                .slice(0, 3) // Limiter à 3 entités maximum
                .map((entity) => {
                  // Calculer le nombre d'actifs par entité
                  const entityAssets = dashboardData.assets.filter(asset => 
                    asset.ownerships.some(ownership => ownership.ownerEntity.id === entity.id)
                  )
                  
                  // Calculer la valeur totale des actifs de cette entité
                  const entityValue = entityAssets.reduce((total, asset) => {
                    const latestValuation = asset.valuations?.[0]
                    if (!latestValuation) return total
                    
                    const ownership = asset.ownerships.find(o => o.ownerEntity.id === entity.id)
                    const ownershipPercentage = ownership?.percentage || 0
                    const assetValue = parseFloat(latestValuation.value) || 0
                    
                    return total + (assetValue * ownershipPercentage / 100)
                  }, 0)

                  return (
                    <Link key={entity.id} href={`/entities/${entity.id}`}>
                      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border-l-4 border-l-blue-500 h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                entity.type === 'INDIVIDUAL' ? 'bg-blue-500' : 'bg-purple-500'
                              }`}>
                                {entity.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 truncate max-w-[140px]" title={entity.name}>
                                  {entity.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {entity.type === 'INDIVIDUAL' ? 'Personne physique' : 'Personne morale'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Actifs</span>
                              <span className="font-medium text-gray-900">{entityAssets.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Valeur</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(entityValue)}
                              </span>
                            </div>
                          </div>
                          
                          {entity.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500 truncate" title={entity.notes}>
                                {entity.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Gérer votre patrimoine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/entities" className="flex flex-col items-center justify-center">
              <Button variant="outline" className="h-20 w-full">
                <Users className="h-6 w-6 mb-2" />
                Ajouter une entité
              </Button>
            </Link>
            <Link href="/assets" className="flex flex-col items-center justify-center">
              <Button variant="outline" className="h-20 w-full">
                <Home className="h-6 w-6 mb-2" />
                Ajouter un actif
              </Button>
            </Link>
            <Link href="/reports" className="flex flex-col items-center justify-center">
              <Button variant="outline" className="h-20 w-full">
                <Banknote className="h-6 w-6 mb-2" />
                Générer un rapport
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 