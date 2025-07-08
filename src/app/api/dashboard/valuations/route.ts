import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityIds = searchParams.get('entityIds')?.split(',') || []
    const limit = parseInt(searchParams.get('limit') || '500')
    const months = parseInt(searchParams.get('months') || '12')

    // Calculer la date limite
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - months)

    // Construire la requête
    const whereClause: {
      asset: {
        ownerships: {
          some: {
            ownerEntity: {
              userId: string;
              id?: { in: string[] };
            }
          }
        }
      };
      valuationDate: {
        gte: Date;
      }
    } = {
      asset: {
        ownerships: {
          some: {
            ownerEntity: {
              userId: session.user.id
            }
          }
        }
      },
      valuationDate: {
        gte: cutoffDate
      }
    }

    // Filtrer par entités si spécifié
    if (entityIds.length > 0) {
      whereClause.asset.ownerships.some.ownerEntity.id = {
        in: entityIds
      }
    }

    const valuations = await prisma.valuation.findMany({
      where: whereClause,
      include: {
        asset: {
          include: {
            assetType: {
              select: {
                name: true,
                color: true
              }
            },
            ownerships: {
              include: {
                ownerEntity: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        valuationDate: 'desc'
      },
      take: limit
    })

    // Transformer les données pour le graphique
    const transformedData = valuations.map(valuation => {
      // Calculer la valeur pondérée par la propriété de l'utilisateur
      const userOwnership = valuation.asset.ownerships
        .filter(ownership => 
          entityIds.length === 0 || entityIds.includes(ownership.ownerEntity.id)
        )
        .reduce((total, ownership) => total + ownership.percentage, 0) / 100

      return {
        date: valuation.valuationDate.toISOString().split('T')[0],
        value: valuation.value * userOwnership,
        assetId: valuation.asset.id,
        assetName: valuation.asset.name,
        assetType: valuation.asset.assetType.name,
        source: valuation.source,
        currency: valuation.currency
      }
    })

    // Grouper par date et sommer les valeurs
    const groupedData = transformedData.reduce((acc, item) => {
      const date = item.date
      if (!acc[date]) {
        acc[date] = {
          date,
          value: 0,
          assets: []
        }
      }
      acc[date].value += item.value
      acc[date].assets.push({
        assetId: item.assetId,
        assetName: item.assetName,
        assetType: item.assetType,
        value: item.value
      })
      return acc
    }, {} as Record<string, { date: string; value: number; assets: Array<{ assetId: string; assetName: string; assetType: string; value: number }> }>)

    // Convertir en array et trier par date
    const finalData = Object.values(groupedData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculer quelques statistiques
    const totalValuations = valuations.length
    const uniqueAssets = new Set(valuations.map(v => v.asset.id)).size
    const dateRange = {
      oldest: finalData.length > 0 ? finalData[0].date : null,
      newest: finalData.length > 0 ? finalData[finalData.length - 1].date : null
    }

    return NextResponse.json({
      data: finalData.map(item => ({
        date: item.date,
        value: item.value,
        assetId: item.assets[0]?.assetId || '',
        assetName: item.assets.length === 1 ? item.assets[0].assetName : 'Plusieurs actifs',
        assetType: item.assets.length === 1 ? item.assets[0].assetType : 'Mixte'
      })),
      statistics: {
        totalValuations,
        uniqueAssets,
        dateRange,
        dataPoints: finalData.length
      }
    })

  } catch (error) {
    console.error('Error fetching valuation history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 