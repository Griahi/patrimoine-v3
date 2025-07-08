'use client'

import { useState, useEffect, useCallback } from "react"
import { useSession } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { 
  TrendingUp, 
  Users, 
  Building2, 
  PieChart as PieChartIcon,
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
import { calculateTotalPatrimony, calculateTotalDebts } from "@/lib/utils"

interface Entity {
  id: string
  name: string
  type: 'INDIVIDUAL' | 'LEGAL_ENTITY'
  userId: string
  metadata?: any
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

  const loadDashboardData = useCallback(async () => {
    if (dashboardData.loading && hasInitialized) {
      console.log('⏭️ Skipping loadDashboardData - already loading')
      return // Éviter les appels multiples
    }

    try {
      console.log('📊 Loading dashboard data...')
      setDashboardData(prev => ({ ...prev, loading: true, error: null }))

      // Charger les données en parallèle
      const [entitiesResponse, assetsResponse, debtsResponse] = await Promise.all([
        fetch('/api/entities').catch(err => ({ ok: false, error: err.message })),
        fetch('/api/assets').catch(err => ({ ok: false, error: err.message })),
        fetch('/api/debts').catch(err => ({ ok: false, error: err.message }))
      ])

      // Gérer les réponses avec des fallbacks
      const entities = entitiesResponse.ok ? await entitiesResponse.json() : []
      const assets = assetsResponse.ok ? await assetsResponse.json() : []
      const debtsData = debtsResponse.ok ? await debtsResponse.json() : { debts: [] }

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
  }, [dashboardData.loading, hasInitialized])

  useEffect(() => {
    // Éviter les boucles infinies en vérifiant l'état et la session
    if (status === 'authenticated' && !hasInitialized && !dashboardData.loading) {
      console.log('🔄 useEffect: Loading dashboard data (authenticated)')
      loadDashboardData()
    } else if (status === 'loading') {
      console.log('⏳ useEffect: Waiting for authentication status')
    } else if (status === 'unauthenticated') {
      console.log('🚫 useEffect: User not authenticated')
      setHasInitialized(true)
    }
  }, [status, hasInitialized, dashboardData.loading, loadDashboardData])

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

  if (status === 'loading' || (dashboardData.loading && !hasInitialized)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement du tableau de bord...</span>
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
        <p className="text-amber-600 mb-4">Service temporairement indisponible</p>
        <p className="text-sm text-gray-500 mb-4">Les données seront disponibles une fois la base de données configurée</p>
        <Button onClick={() => {
          setHasInitialized(false)
          loadDashboardData()
        }} variant="outline">
          Réessayer
        </Button>
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
                <Link href="/entities/new" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Créer ma première entité
                  </Button>
                </Link>
                <Link href="/assets/new" className="block">
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
  const totalPatrimoine = calculateTotalPatrimony(dashboardData.assets)
  const totalDebts = dashboardData.debtsData.summary?.totalDebt || 0
  const patrimoineNet = totalPatrimoine - totalDebts

  const assetsByType = dashboardData.assets.reduce((acc, asset) => {
    const category = asset.assetType.category
    if (!acc[category]) {
      acc[category] = { count: 0, value: 0, name: category }
    }
    acc[category].count += 1
    const latestValuation = asset.valuations[0]
    acc[category].value += latestValuation?.value || 0
    return acc
  }, {} as Record<string, { count: number; value: number; name: string }>)

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de votre patrimoine</p>
        </div>
        <Link href="/assets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel actif
          </Button>
        </Link>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimoine Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalPatrimoine.toLocaleString('fr-FR')} €
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
              {totalDebts.toLocaleString('fr-FR')} €
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
              {patrimoineNet.toLocaleString('fr-FR')} €
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

      {/* Répartition des actifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2" />
              Répartition par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(assetsByType).length > 0 ? (
              <div className="space-y-4">
                {Object.values(assetsByType).map((category) => (
                  <div key={category.name} className="flex justify-between items-center">
                    <span className="font-medium">{category.name}</span>
                    <div className="text-right">
                      <div className="font-bold">{category.value.toLocaleString('fr-FR')} €</div>
                      <div className="text-sm text-gray-500">{category.count} actifs</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun actif à afficher</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Entités récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.entities.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.entities.slice(0, 5).map((entity) => (
                  <div key={entity.id} className="flex justify-between items-center p-2 rounded border">
                    <div>
                      <div className="font-medium">{entity.name}</div>
                      <div className="text-sm text-gray-500">
                        {entity.type === 'INDIVIDUAL' ? 'Personne physique' : 'Personne morale'}
                      </div>
                    </div>
                    <Link href={`/entities/${entity.id}`}>
                      <Button variant="outline" size="sm">Voir</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune entité créée</p>
                <Link href="/entities/new" className="inline-block mt-2">
                  <Button variant="outline" size="sm">
                    Créer une entité
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Gérer votre patrimoine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/entities/new" className="flex flex-col items-center justify-center">
              <Button variant="outline" className="h-20 w-full">
                <Users className="h-6 w-6 mb-2" />
                Ajouter une entité
              </Button>
            </Link>
            <Link href="/assets/new" className="flex flex-col items-center justify-center">
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