import { NextRequest, NextResponse } from "next/server"
import { getToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { auth, requireApiAuth } from '@/lib/auth'
import { BehaviorTrackingService } from '@/services/dashboard/behavior-tracking'
import { suggestionEngine } from '@/services/dashboard/suggestion-engine'
import { 
  DashboardLayout, 
  UserBehavior, 
  Suggestion,
  WidgetConfig 
} from '@/types/dashboard'
import { getEntitiesByUserId, getAssetsByUserId } from '@/lib/json-storage'
import {
  calculatePortfolioValue,
  calculatePerformance,
  getRecentActivities,
  generateRealAlerts,
  generateRealAIInsights,
  calculateAssetTypeDistribution,
  getTopAssets,
  calculateEvolutionData,
  formatCurrency
} from '@/utils/dashboard-calculations'

// Couleurs prédéfinies pour les types d'actifs
const ASSET_TYPE_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'
]

// Fonction pour obtenir les données du tableau de bord
async function getDashboardData(userId: string, entityIds?: string[]) {
  console.log('getDashboardData called with:', { userId, entityIds })
  
  // Essayer d'abord Prisma, sinon utiliser les fichiers JSON
  try {
    const whereClause = entityIds && entityIds.length > 0 
      ? { 
          ownerships: {
            some: {
              ownerEntity: {
                userId: userId,
                id: { in: entityIds }
              }
            }
          }
        }
      : {
          ownerships: {
            some: {
              ownerEntity: { userId }
            }
          }
        }

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        assetType: true,
        ownerships: {
          include: {
            ownerEntity: true
          }
        },
        valuations: {
          orderBy: { valuationDate: 'desc' },
          take: 10 // Prendre plus de valuations pour les calculs d'évolution
        }
      }
    })

    const entities = await prisma.entity.findMany({
      where: { 
        userId,
        ...(entityIds && entityIds.length > 0 ? { id: { in: entityIds } } : {})
      },
      include: {
        ownedAssets: {
          include: {
            ownedAsset: {
              include: {
                assetType: true,
                valuations: {
                  orderBy: { valuationDate: 'desc' },
                  take: 10
                }
              }
            }
          }
        }
      }
    })

    return { assets, entities }
  } catch (error) {
    console.warn('⚠️ Prisma failed, using file storage:', error instanceof Error ? error.message : 'Unknown error');
    
    // Fallback vers fichiers JSON
    const [fileAssets, fileEntities] = await Promise.all([
      getAssetsByUserId(userId),
      getEntitiesByUserId(userId)
    ])

    // Filtrer par entités si spécifié
    const filteredAssets = entityIds && entityIds.length > 0 
      ? fileAssets.filter(asset => 
          asset.ownerships?.some((ownership: any) => 
            entityIds.includes(ownership.ownerEntityId)
          )
        )
      : fileAssets

    const filteredEntities = entityIds && entityIds.length > 0
      ? fileEntities.filter(entity => entityIds.includes(entity.id))
      : fileEntities

    return { assets: filteredAssets, entities: filteredEntities }
  }
}

// GET /api/dashboard - Get user dashboard configuration
export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard API called - using unified authentication...')
    
    // 🛡️ AUTHENTIFICATION UNIFIÉE - Plus de systèmes multiples
    const authResult = await requireApiAuth(request)
    
    if ('errorResponse' in authResult) {
      return authResult.errorResponse
    }
    
    const { userId } = authResult
    console.log('✅ Authenticated user:', userId)

    const { searchParams } = new URL(request.url)
    const entityIdsParam = searchParams.get('entityIds')
    
    // Parse entity IDs from comma-separated string
    const entityIds = entityIdsParam 
      ? entityIdsParam.split(',').filter(id => id.trim()) 
      : undefined
      
    console.log('Entity filter:', entityIds || 'all entities')

    const { assets, entities } = await getDashboardData(
      userId, 
      entityIds
    )

    // Calculer toutes les données nécessaires pour le dashboard
    const portfolioValue = calculatePortfolioValue(assets);
    const performance = calculatePerformance(assets);
    const recentActivities = getRecentActivities(assets, entities);
    const alerts = generateRealAlerts(assets, entities);
    const aiInsights = generateRealAIInsights(assets, entities);
    const assetDistribution = calculateAssetTypeDistribution(assets);
    const topAssets = getTopAssets(assets, 5);
    const evolutionData = calculateEvolutionData(assets, 12);

    // Calculer des statistiques supplémentaires
    const statistics = {
      totalAssets: assets.length,
      totalEntities: entities.length,
      lastUpdate: new Date().toISOString(),
      hasData: assets.length > 0,
      averageAssetValue: assets.length > 0 ? portfolioValue / assets.length : 0,
      mostValuableAsset: topAssets[0] || null,
      oldestAsset: assets.reduce((oldest, asset) => {
        if (!oldest || !asset.createdAt) return oldest;
        return asset.createdAt < oldest.createdAt ? asset : oldest;
      }, null as any),
      newestAsset: assets.reduce((newest, asset) => {
        if (!newest || !asset.createdAt) return newest;
        return asset.createdAt > newest.createdAt ? asset : newest;
      }, null as any)
    };

    console.log('Dashboard data processed successfully', {
      portfolioValue,
      performance,
      assetsCount: assets.length,
      entitiesCount: entities.length,
      alertsCount: alerts.length,
      insightsCount: aiInsights.length
    });

    return NextResponse.json({ 
      // Données brutes
      assets, 
      entities,
      
      // Données calculées pour les widgets
      portfolioValue,
      performance,
      recentActivities,
      alerts,
      aiInsights,
      assetDistribution,
      topAssets,
      evolutionData,
      statistics,
      
      // Métadonnées
      meta: {
        calculatedAt: new Date().toISOString(),
        entityFilter: entityIds || null,
        dataSource: 'real-time'
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/dashboard - Update dashboard configuration
export async function POST(request: NextRequest) {
  try {
    // 🛡️ AUTHENTIFICATION UNIFIÉE 
    const authResult = await requireApiAuth(request)
    
    if ('errorResponse' in authResult) {
      return authResult.errorResponse
    }
    
    const { userId } = authResult
    const { layout, behavior, action } = await request.json()

    switch (action) {
      case 'save_layout':
        // Save or update layout
        const savedLayout = await prisma.dashboardLayout.upsert({
          where: {
            userId_isActive: {
              userId,
              isActive: true
            }
          },
          update: {
            widgets: JSON.stringify(layout.widgets),
            breakpoints: JSON.stringify(layout.breakpoints),
            updatedAt: new Date()
          },
          create: {
            userId,
            name: layout.name || 'Mon Dashboard',
            widgets: JSON.stringify(layout.widgets),
            breakpoints: JSON.stringify(layout.breakpoints),
            isActive: true,
            isDefault: false
          }
        })

        return NextResponse.json({ success: true, layout: savedLayout })

      case 'update_behavior':
        // Update user behavior
        const behaviorService = new BehaviorTrackingService()
        await behaviorService.updateUserBehavior(userId, behavior)
        
        return NextResponse.json({ success: true })

      case 'track_interaction':
        // Track widget interaction
        const { widgetId, actionType, params } = behavior
        await prisma.widgetInteraction.create({
          data: {
            userId,
            widgetId,
            action: actionType,
            params: params || {},
            timestamp: new Date()
          }
        })

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get default layout
function getDefaultLayout(userId: string): DashboardLayout {
  return {
    id: 'default',
    userId,
    name: 'Layout par défaut',
    widgets: [
      {
        id: 'patrimony-overview',
        type: 'patrimony-overview',
        title: 'Vue d\'ensemble du patrimoine',
        description: 'Aperçu global de votre patrimoine',
        position: { x: 0, y: 0, w: 6, h: 4 },
        priority: 1,
        isVisible: true,
        config: { showChart: true, showMetrics: true, period: '1Y' },
        minSize: { w: 4, h: 3 },
        maxSize: { w: 12, h: 8 },
        resizable: true,
        draggable: true
      },
      {
        id: 'performance-chart',
        type: 'performance-chart',
        title: 'Performance',
        description: 'Graphique de performance de vos actifs',
        position: { x: 6, y: 0, w: 6, h: 4 },
        priority: 2,
        isVisible: true,
        config: { period: '6M', showBenchmark: true, chartType: 'line' },
        minSize: { w: 4, h: 3 },
        maxSize: { w: 12, h: 8 },
        resizable: true,
        draggable: true
      },
      {
        id: 'quick-actions',
        type: 'quick-actions',
        title: 'Actions rapides',
        description: 'Raccourcis vers les actions fréquentes',
        position: { x: 0, y: 4, w: 4, h: 3 },
        priority: 3,
        isVisible: true,
        config: { maxActions: 6, showRecent: true },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 6, h: 4 },
        resizable: true,
        draggable: true
      },
      {
        id: 'recent-activity',
        type: 'recent-activity',
        title: 'Activité récente',
        description: 'Dernières transactions et modifications',
        position: { x: 4, y: 4, w: 4, h: 3 },
        priority: 4,
        isVisible: true,
        config: { maxItems: 5, showDates: true },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 6, h: 4 },
        resizable: true,
        draggable: true
      },
      {
        id: 'alerts',
        type: 'alerts',
        title: 'Alertes',
        description: 'Notifications et alertes importantes',
        position: { x: 8, y: 4, w: 4, h: 3 },
        priority: 5,
        isVisible: true,
        config: { maxAlerts: 5, showSeverity: true },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 8, h: 6 },
        resizable: true,
        draggable: true
      }
    ],
    breakpoints: {
      lg: 1200,
      md: 996,
      sm: 768,
      xs: 480
    },
    isActive: true,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
} 