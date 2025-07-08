import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { value, valuationDate, notes, source = 'MANUAL', currency = 'EUR' } = await request.json()
    const assetId = params.id

    // Vérifier que l'utilisateur possède cet actif
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        ownerships: {
          some: {
            ownerEntity: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Validation des données
    if (!value || isNaN(parseFloat(value))) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
    }

    if (!valuationDate || isNaN(new Date(valuationDate).getTime())) {
      return NextResponse.json({ error: 'Invalid valuation date' }, { status: 400 })
    }

    const parsedValue = parseFloat(value)
    const parsedDate = new Date(valuationDate)

    // Vérifier qu'il n'y a pas déjà une valorisation à cette date avec cette source
    const existingValuation = await prisma.valuation.findFirst({
      where: {
        assetId,
        valuationDate: parsedDate,
        source
      }
    })

    if (existingValuation) {
      // Mettre à jour la valorisation existante
      const updated = await prisma.valuation.update({
        where: { id: existingValuation.id },
        data: {
          value: parsedValue,
          notes: notes || null,
          currency,
          updatedAt: new Date()
        }
      })
      
      return NextResponse.json({ 
        ...updated, 
        message: 'Valorisation mise à jour avec succès' 
      })
    } else {
      // Créer une nouvelle valorisation
      const newValuation = await prisma.valuation.create({
        data: {
          assetId,
          value: parsedValue,
          valuationDate: parsedDate,
          source,
          currency,
          notes: notes || null
        }
      })
      
      return NextResponse.json({ 
        ...newValuation, 
        message: 'Valorisation créée avec succès' 
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error creating/updating valuation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assetId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const source = searchParams.get('source') // Optionnel: filtrer par source

    // Vérifier que l'utilisateur possède cet actif
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        ownerships: {
          some: {
            ownerEntity: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        assetType: {
          select: {
            name: true,
            color: true
          }
        }
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Construire le filtre
    const whereClause: { assetId: string; source?: string } = { assetId }
    if (source) {
      whereClause.source = source
    }

    const valuations = await prisma.valuation.findMany({
      where: whereClause,
      orderBy: { valuationDate: 'desc' },
      take: limit,
      skip: offset
    })

    // Calculer quelques statistiques
    const totalCount = await prisma.valuation.count({
      where: whereClause
    })

    const statistics = {
      totalCount,
      hasMore: offset + limit < totalCount,
      currentValue: valuations.length > 0 ? valuations[0].value : 0,
      oldestDate: valuations.length > 0 ? valuations[valuations.length - 1].valuationDate : null,
      newestDate: valuations.length > 0 ? valuations[0].valuationDate : null
    }

    // Calculer l'évolution si on a au moins 2 valorisations
    let evolution = null
    if (valuations.length >= 2) {
      const current = valuations[0].value
      const previous = valuations[1].value
      const change = current - previous
      const changePercent = (change / previous) * 100
      
      evolution = {
        change,
        changePercent,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      }
    }

    return NextResponse.json({
      asset: {
        id: asset.id,
        name: asset.name,
        assetType: asset.assetType
      },
      valuations,
      statistics,
      evolution
    })

  } catch (error) {
    console.error('Error fetching valuations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assetId = params.id
    const { searchParams } = new URL(request.url)
    const valuationId = searchParams.get('valuationId')

    if (!valuationId) {
      return NextResponse.json({ error: 'Valuation ID required' }, { status: 400 })
    }

    // Vérifier que l'utilisateur possède cet actif
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        ownerships: {
          some: {
            ownerEntity: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Vérifier que la valorisation existe et appartient à cet actif
    const valuation = await prisma.valuation.findFirst({
      where: {
        id: valuationId,
        assetId
      }
    })

    if (!valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Empêcher la suppression si c'est la seule valorisation
    const valuationCount = await prisma.valuation.count({
      where: { assetId }
    })

    if (valuationCount === 1) {
      return NextResponse.json({ 
        error: 'Cannot delete the only valuation. Asset must have at least one valuation.' 
      }, { status: 400 })
    }

    // Supprimer la valorisation
    await prisma.valuation.delete({
      where: { id: valuationId }
    })

    return NextResponse.json({ 
      message: 'Valorisation supprimée avec succès' 
    })

  } catch (error) {
    console.error('Error deleting valuation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 