import { getUserFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface OwnershipData {
  entityId: string;
  percentage: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parse entity filter from URL parameters
    const { searchParams } = new URL(request.url)
    const entityIdsParam = searchParams.get('entityIds')
    const entityIds = entityIdsParam 
      ? entityIdsParam.split(',').filter(id => id.trim())
      : null

    console.log('📊 GET /api/assets - Entity filter:', entityIds ? `${entityIds.length} entities` : 'all entities')

    // Build the where clause based on entity filter
    let whereClause = {
      ownerships: {
        some: {
          ownerEntity: {
            userId: user.id
          }
        }
      }
    }

    if (entityIds && entityIds.length > 0) {
      whereClause = {
        ownerships: {
          some: {
            ownerEntity: {
              userId: user.id,
              id: { in: entityIds }
            }
          }
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
        debts: {
          include: {
            asset: {
              include: {
                assetType: true
              }
            }
          }
        },
        valuations: {
          orderBy: {
            valuationDate: 'desc'
          },
          take: 1
        }
      }
    });

    console.log('✅ Returning', assets.length, 'assets', entityIds ? `for ${entityIds.length} entities` : 'for all entities')
    return NextResponse.json(assets)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des actifs:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/assets - Start')
    
    const user = await getUserFromRequest(request);
    console.log('🔑 Auth result:', { userId: user?.id })
    
    if (!user) {
      console.log('❌ No user, returning 401')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('📦 Reading request body...')
    const body = await request.json()
    console.log('📝 Body received:', JSON.stringify(body, null, 2))
    
    const { 
      name, 
      description, 
      assetTypeId, 
      owners,
      initialValue,
      valuationDate,
      metadata 
    } = body

    console.log('🔍 Extracted data:', {
      name,
      assetTypeId,
      ownersCount: owners?.length,
      owners,
      initialValue,
      valuationDate
    })

    // Validation
    if (!name || !assetTypeId || !owners || !Array.isArray(owners) || owners.length === 0) {
      console.log('❌ Validation failed - missing required fields:', {
        hasName: !!name,
        hasAssetTypeId: !!assetTypeId,
        hasOwners: !!owners,
        isOwnersArray: Array.isArray(owners),
        ownersLength: owners?.length
      })
      return NextResponse.json(
        { error: 'Name, asset type, and at least one owner are required' },
        { status: 400 }
      )
    }

    // Validate that all owners have entityId and percentage
    for (const owner of owners) {
      if (!owner.entityId || typeof owner.percentage !== 'number') {
        console.log('❌ Invalid owner data:', owner)
        return NextResponse.json(
          { error: 'Each owner must have an entityId and percentage' },
          { status: 400 }
        )
      }
    }

    // Validate total percentage equals 100%
    const totalPercentage = owners.reduce((sum, owner) => sum + owner.percentage, 0)
    console.log('📊 Total percentage:', totalPercentage)
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      console.log('❌ Total percentage validation failed:', totalPercentage)
      return NextResponse.json(
        { error: 'Total ownership percentage must equal 100%' },
        { status: 400 }
      )
    }

    // Verify that all owner entities belong to the user
    const ownerEntityIds = owners.map(owner => owner.entityId)
    console.log('🔍 Looking for owner entities:', ownerEntityIds)
    
    const ownerEntities = await prisma.entity.findMany({
      where: {
        id: { in: ownerEntityIds },
        userId: user.id
      }
    })

    console.log('👥 Found owner entities:', ownerEntities.length, 'expected:', ownerEntityIds.length)

    if (ownerEntities.length !== ownerEntityIds.length) {
      console.log('❌ Owner entities mismatch. Found:', ownerEntities.map(e => e.id), 'Expected:', ownerEntityIds)
      return NextResponse.json(
        { error: 'One or more owner entities not found or not owned by user' },
        { status: 404 }
      )
    }

    // Verify that the asset type exists
    console.log('🔍 Looking for asset type:', assetTypeId)
    const assetType = await prisma.assetType.findUnique({
      where: { id: assetTypeId }
    })

    console.log('📋 Asset type found:', !!assetType, assetType?.name)

    if (!assetType) {
      console.log('❌ Asset type not found:', assetTypeId)
      return NextResponse.json(
        { error: 'Asset type not found' },
        { status: 404 }
      )
    }

    console.log('💾 Starting transaction...')
    // Create asset in a transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('📝 Creating asset...')
      // Create the asset
      const newAsset = await tx.asset.create({
        data: {
          name,
          description: description || null,
          assetTypeId,
          metadata: metadata || null
        }
      })
      console.log('✅ Asset created:', newAsset.id)

      console.log('👥 Creating ownership relationships...')
      // Create ownership relationships
      const ownershipPromises = owners.map(owner => 
        tx.ownership.create({
          data: {
            ownerEntityId: owner.entityId,
            ownedAssetId: newAsset.id,
            percentage: owner.percentage,
            startDate: new Date(),
          }
        })
      )
      
      await Promise.all(ownershipPromises)
      console.log('✅ Ownerships created')

      // Add initial valuation if provided
      if (initialValue && initialValue > 0) {
        console.log('💰 Creating initial valuation:', initialValue)
        await tx.valuation.create({
          data: {
            assetId: newAsset.id,
            value: initialValue,
            valuationDate: new Date(valuationDate || new Date()),
            source: 'MANUAL'
          }
        })
        console.log('✅ Valuation created')
      }

      return newAsset
    })

    console.log('✅ Transaction completed successfully, returning asset:', result.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error creating asset:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 