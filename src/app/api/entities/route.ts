import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('📋 GET /api/entities - userId:', userId)

    const entities = await prisma.entity.findMany({
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
    });

    console.log('✅ Returning', entities.length, 'entities')
    return NextResponse.json(entities)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des entités:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/entities - Start')
    
    const userId = await getUserIdFromRequest(request);
    console.log('🔑 Auth result:', { userId })
    
    if (!userId) {
      console.log('❌ No userId, returning 401')
      return NextResponse.json({ 
        error: 'Non autorisé', 
        message: 'Session invalide ou expirée. Veuillez vous reconnecter.' 
      }, { status: 401 });
    }

    console.log('📦 Reading request body...')
    const body = await request.json()
    console.log('📝 Body reçu:', body)
    
    const { name, type, taxId, address, metadata, notes } = body

    if (!name || !type) {
      console.log('❌ Missing name or type, returning 400')
      return NextResponse.json({ error: "Nom et type requis" }, { status: 400 })
    }

    // Validate entity type
    if (!['PHYSICAL_PERSON', 'LEGAL_ENTITY'].includes(type)) {
      console.log('❌ Invalid entity type:', type)
      return NextResponse.json({ error: "Type d'entité invalide. Utilisez PHYSICAL_PERSON ou LEGAL_ENTITY" }, { status: 400 })
    }

    console.log('➕ POST /api/entities - Creating entity:', { name, type, userId })

    const entityData = {
      name,
      type,
      userId,
      taxId: taxId || null,
      address: address && Object.keys(address).length > 0 ? address : null,
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : null,
      notes: notes || null
    }
    
    console.log('💾 Entity data to create:', entityData)

    console.log('📡 Calling prisma.entity.create...')
    const newEntity = await prisma.entity.create({
      data: entityData
    });

    console.log('✅ Created entity:', newEntity.id)
    return NextResponse.json(newEntity)
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'entité:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('entities_userId_fkey')) {
      console.error('❌ Foreign key constraint error - userId not found in database')
      return NextResponse.json({ 
        error: "Session invalide", 
        message: "Votre session est invalide ou expirée. Veuillez vous reconnecter.",
        code: "INVALID_SESSION"
      }, { status: 401 })
    }
    
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json()
    const { id, name, type, taxId, address, metadata, notes } = body

    if (!id || !name || !type) {
      return NextResponse.json(
        { error: 'ID, name and type are required' },
        { status: 400 }
      )
    }

    console.log('🔄 PUT /api/entities - Updating entity:', { id, name, type, userId })

    // Vérifier que l'entité existe
    const existingEntity = await prisma.entity.findFirst({
      where: { id, userId }
    });
    
    if (!existingEntity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const entityData = {
      name,
      type,
      taxId: taxId || null,
      address: address && Object.keys(address).length > 0 ? address : null,
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : null,
      notes: notes || null,
      updatedAt: new Date()
    }

    const updatedEntity = await prisma.entity.update({
      where: { id },
      data: entityData,
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
    });

    console.log('✅ Updated entity:', updatedEntity.id)
    return NextResponse.json(updatedEntity)
  } catch (error) {
    console.error('❌ Error updating entity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 