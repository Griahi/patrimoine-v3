import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const entityId = params.id
    const userId = session.user.id

    const entity = await prisma.entity.findFirst({
      where: {
        id: entityId,
        userId: userId
      },
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
        },
        ownedEntities: {
          include: {
            ownedEntity: true
          }
        }
      }
    })

    if (!entity) {
      return NextResponse.json({ error: "Entité non trouvée" }, { status: 404 })
    }

    return NextResponse.json(entity)
  } catch (error) {
    console.error('Entity fetch error:', error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération de l'entité" 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, taxId, address, metadata } = body

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if entity exists and belongs to user
    const existingEntity = await prisma.entity.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingEntity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Update entity
    const updatedEntity = await prisma.entity.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        taxId: taxId?.trim() || null,
        address: address || null,
        metadata: metadata || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedEntity)
  } catch (error) {
    console.error('Error updating entity:', error)
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
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const entityId = params.id
    const userId = session.user.id

    // Vérifier que l'entité appartient à l'utilisateur
    const entity = await prisma.entity.findFirst({
      where: {
        id: entityId,
        userId: userId
      },
      include: {
        ownedAssets: {
          include: {
            ownedAsset: true
          }
        },
        ownedEntities: {
          include: {
            ownedEntity: true
          }
        }
      }
    })

    if (!entity) {
      return NextResponse.json({ error: "Entité non trouvée" }, { status: 404 })
    }

    // Vérifier si l'entité détient des actifs ou d'autres entités
    if (entity.ownedAssets.length > 0 || entity.ownedEntities.length > 0) {
      return NextResponse.json({ 
        error: "Impossible de supprimer une entité qui détient des actifs ou d'autres entités",
        details: {
          assets: entity.ownedAssets.length,
          entities: entity.ownedEntities.length
        }
      }, { status: 400 })
    }

    // Supprimer l'entité (les relations de propriété seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.entity.delete({
      where: { id: entityId }
    })

    return NextResponse.json({ 
      success: true,
      message: "Entité supprimée avec succès" 
    })

  } catch (error) {
    console.error('Entity deletion error:', error)
    return NextResponse.json({ 
      error: "Erreur lors de la suppression de l'entité" 
    }, { status: 500 })
  }
}