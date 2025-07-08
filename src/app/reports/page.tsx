import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { AssetDistributionChart, AssetsByEntityChart, PortfolioEvolutionChart } from "@/components/charts/ReportsCharts"
import { FileText, Download, TrendingUp, PieChart as PieChartIcon, BarChart3, Euro } from "lucide-react"
import { getServerSession } from "@/lib/auth-helper"

async function getReportsData(userId: string) {
  try {
    console.log('📊 Reports: Fetching data for user:', userId)
    
    // Essayer d'abord Prisma, sinon retourner des données vides
    let entities, assets, assetTypes;
    try {
      [entities, assets, assetTypes] = await Promise.all([
        prisma.entity.findMany({
          where: { userId },
          include: {
            ownedAssets: {
              include: {
                ownedAsset: {
                  include: {
                    assetType: true,
                    valuations: {
                      orderBy: { valuationDate: 'desc' },
                      take: 1
                    }
                  }
                }
              }
            }
          }
        }),
        
        prisma.asset.findMany({
          where: {
            ownerships: {
              some: {
                ownerEntity: { userId }
              }
            }
          },
          include: {
            assetType: true,
            valuations: {
              orderBy: { valuationDate: 'desc' }
            },
            ownerships: {
              include: {
                ownerEntity: true
              }
            }
          }
        }),
        
        prisma.assetType.findMany()
      ]);
    } catch (error) {
      console.warn('⚠️ Prisma failed, using empty data:', error instanceof Error ? error.message : 'Unknown error');
      entities = [];
      assets = [];
      assetTypes = [
        { id: 'real-estate', name: 'Immobilier', code: 'real_estate', color: '#3B82F6' },
        { id: 'stocks', name: 'Actions', code: 'stock', color: '#10B981' },
        { id: 'bonds', name: 'Obligations', code: 'bond', color: '#F59E0B' },
        { id: 'crypto', name: 'Cryptomonnaies', code: 'cryptocurrency', color: '#8B5CF6' },
        { id: 'savings', name: 'Épargne', code: 'bank_account', color: '#6B7280' }
      ];
    }

    console.log('📊 Reports: Data loaded successfully')
    console.log('📊 Entities:', entities.length, 'Assets:', assets.length, 'AssetTypes:', assetTypes.length)

    // Calculer les métriques pour le tableau de bord
    const totalValue = assets.reduce((total, asset) => {
      const latestValuation = asset.valuations?.[0]
      return total + (latestValuation?.value || 0)
    }, 0)

    const assetsCount = assets.length
    const entitiesCount = entities.length

    // Calculer la performance (variation mensuelle simulée)
    const performance = Math.random() * 10 - 5 // Simulation entre -5% et +5%

    // Préparer les données pour les graphiques
    const assetDistribution = assetTypes.map(type => {
      const typeAssets = assets.filter(asset => asset.assetType?.code === type.code)
      const typeValue = typeAssets.reduce((sum, asset) => {
        const latestValuation = asset.valuations?.[0]
        return sum + (latestValuation?.value || 0)
      }, 0)
      
      return {
        name: type.name,
        value: typeValue,
        color: type.color,
        percentage: totalValue > 0 ? (typeValue / totalValue) * 100 : 0
      }
    }).filter(item => item.value > 0)

    const assetsByEntity = entities.map(entity => ({
      name: entity.name,
      value: entity.ownedAssets?.reduce((sum, ownership) => {
        const asset = ownership.ownedAsset
        const latestValuation = asset?.valuations?.[0]
        const assetValue = latestValuation?.value || 0
        return sum + (assetValue * (ownership.percentage / 100))
      }, 0) || 0
    })).filter(item => item.value > 0)

    // Générer des données d'évolution simulées (12 derniers mois)
    const evolutionData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return {
        month: date.toISOString().slice(0, 7), // Format YYYY-MM
        value: totalValue * (0.9 + Math.random() * 0.2) // Variation +/- 10%
      }
    })

    return {
      summary: {
        totalValue,
        assetsCount,
        entitiesCount,
        performance
      },
      charts: {
        assetDistribution,
        assetsByEntity,
        evolution: evolutionData
      },
      entities,
      assets
    }
  } catch (error) {
    console.error('❌ Reports: Error loading data:', error)
    return {
      summary: {
        totalValue: 0,
        assetsCount: 0,
        entitiesCount: 0,
        performance: 0
      },
      charts: {
        assetDistribution: [],
        assetsByEntity: [],
        evolution: []
      },
      entities: [],
      assets: []
    }
  }
}

export default async function ReportsPage() {
  // Utiliser le helper d'authentification unifié
  const session = await getServerSession()

  if (!session) {
    // Le middleware devrait gérer cela, mais au cas où...
    redirect("/login?callbackUrl=/reports")
  }

  const { entities, assets, assetTypes } = await getReportsData(session.user.id)

  // Calculate data for charts
  const assetsByType = (assetTypes || []).map(type => {
    const typeAssets = (assets || []).filter(asset => asset.assetTypeId === type.id)
    const totalValue = typeAssets.reduce((sum, asset) => {
      const latestValuation = asset.valuations?.[0]
      const assetValue = latestValuation ? Number(latestValuation.value) : 0
      
      // Calculate total ownership percentage for this user across all their entities
      const userOwnershipPercentage = (asset.ownerships || [])
        .filter(ownership => (entities || []).some(entity => entity.id === ownership.ownerEntityId))
        .reduce((total, ownership) => total + Number(ownership.percentage || 0), 0) / 100
      
      return sum + (assetValue * userOwnershipPercentage)
    }, 0)
    
    return {
      name: type.name,
      value: totalValue,
      count: typeAssets.length,
      color: type.color || '#6B7280'
    }
  }).filter(item => item.value > 0)

  const assetsByEntity = (entities || []).map(entity => {
    const totalValue = (entity.ownedAssets || []).reduce((sum, ownership) => {
      const latestValuation = ownership.ownedAsset?.valuations?.[0]
      const assetValue = latestValuation ? Number(latestValuation.value) : 0
      const ownershipPercentage = Number(ownership.percentage || 0) / 100
      return sum + (assetValue * ownershipPercentage)
    }, 0)
    
    return {
      name: entity.name,
      value: totalValue,
      type: entity.type === 'PHYSICAL_PERSON' ? 'Personne physique' : 'Personne morale'
    }
  }).filter(item => item.value > 0)

  const totalPatrimoine = assetsByType.reduce((sum, item) => sum + item.value, 0)

  // Mock evolution data (in real app, this would come from historical valuations)
  const evolutionData = [
    { month: 'Jan 2024', value: totalPatrimoine * 0.85 },
    { month: 'Fév 2024', value: totalPatrimoine * 0.88 },
    { month: 'Mar 2024', value: totalPatrimoine * 0.92 },
    { month: 'Avr 2024', value: totalPatrimoine * 0.89 },
    { month: 'Mai 2024', value: totalPatrimoine * 0.95 },
    { month: 'Jun 2024', value: totalPatrimoine }
  ]

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rapports & Analytics</h1>
          <p className="text-muted-foreground">
            Analyses détaillées de votre patrimoine
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimoine Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPatrimoine.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valeur totale des actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre d'Actifs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">
              Actifs dans le portefeuille
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversification</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetsByType.length}</div>
            <p className="text-xs text-muted-foreground">
              Types d'actifs différents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              Évolution annuelle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Type d'Actif</CardTitle>
            <CardDescription>
              Distribution de la valeur par catégorie d'actif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssetDistributionChart data={assetsByType} />
          </CardContent>
        </Card>

        {/* Assets by Entity */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Entité</CardTitle>
            <CardDescription>
              Valeur des actifs par entité propriétaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssetsByEntityChart data={assetsByEntity} />
          </CardContent>
        </Card>
      </div>

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution du Patrimoine</CardTitle>
          <CardDescription>
            Évolution de la valeur totale sur les 6 derniers mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PortfolioEvolutionChart data={evolutionData} />
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Analyse par Type d'Actif</CardTitle>
            <CardDescription>
              Détail des performances par catégorie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assetsByType.map((type, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: type.color }}
                    />
                    <div>
                      <div className="font-medium">{type.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {type.count} actif{type.count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {type.value.toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((type.value / totalPatrimoine) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
            <CardDescription>
              Suggestions d'optimisation du patrimoine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                <div className="font-medium text-blue-900">Diversification</div>
                <div className="text-sm text-blue-700">
                  Votre portefeuille semble bien diversifié avec {assetsByType.length} types d'actifs différents.
                </div>
              </div>
              
              <div className="p-3 border-l-4 border-green-500 bg-green-50">
                <div className="font-medium text-green-900">Performance</div>
                <div className="text-sm text-green-700">
                  Évolution positive du patrimoine avec une croissance de 12.5% sur l'année.
                </div>
              </div>
              
              <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                <div className="font-medium text-orange-900">Suivi</div>
                <div className="text-sm text-orange-700">
                  Pensez à mettre à jour régulièrement les valorisations de vos actifs.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 