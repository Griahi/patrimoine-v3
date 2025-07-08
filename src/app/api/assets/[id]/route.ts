import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assetId = params.id
    const body = await request.json()
    const { 
      name, 
      description, 
      assetTypeId, 
      owners,
      valuationValue, 
      valuationDate,
      metadata 
    } = body

    // Validation
    if (!name || !assetTypeId || !owners || !Array.isArray(owners) || owners.length === 0) {
      return NextResponse.json(
        { error: 'Name, asset type, and at least one owner are required' },
        { status: 400 }
      )
    }

    // Validate that all owners have entityId and percentage
    for (const owner of owners) {
      if (!owner.entityId || typeof owner.percentage !== 'number') {
        return NextResponse.json(
          { error: 'Each owner must have an entityId and percentage' },
          { status: 400 }
        )
      }
    }

    // Validate total percentage equals 100%
    const totalPercentage = owners.reduce((sum, owner) => sum + owner.percentage, 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Total ownership percentage must equal 100%' },
        { status: 400 }
      )
    }

    // Check if asset exists and user has access
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        ownerships: {
          some: {
            ownerEntity: {
              userId: userId
            }
          }
        }
      },
      include: {
        ownerships: true
      }
    })

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Asset not found or not accessible' },
        { status: 404 }
      )
    }

    // Verify that all owner entities belong to the user
    const ownerEntityIds = owners.map(owner => owner.entityId)
    const ownerEntities = await prisma.entity.findMany({
      where: {
        id: { in: ownerEntityIds },
        userId: userId
      }
    })

    if (ownerEntities.length !== ownerEntityIds.length) {
      return NextResponse.json(
        { error: 'One or more owner entities not found or not owned by user' },
        { status: 404 }
      )
    }

    // Verify that the asset type exists
    const assetType = await prisma.assetType.findUnique({
      where: { id: assetTypeId }
    })

    if (!assetType) {
      return NextResponse.json(
        { error: 'Asset type not found' },
        { status: 404 }
      )
    }

    // Update asset in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the asset
      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: {
          name,
          description: description || null,
          assetTypeId,
          metadata: metadata || null
        }
      })

      // Delete existing ownership relationships
      await tx.ownership.deleteMany({
        where: { ownedAssetId: assetId }
      })

      // Create new ownership relationships
      const ownershipPromises = owners.map(owner => 
        tx.ownership.create({
          data: {
            ownerEntityId: owner.entityId,
            ownedAssetId: assetId,
            percentage: owner.percentage,
            startDate: new Date(),
          }
        })
      )
      
      await Promise.all(ownershipPromises)

      // Add new valuation if value has changed
      if (valuationValue && valuationValue > 0) {
        // Get the latest valuation
        const latestValuation = await tx.valuation.findFirst({
          where: { assetId },
          orderBy: { valuationDate: 'desc' }
        })

        // Only create a new valuation if the value has changed
        if (!latestValuation || Number(latestValuation.value) !== valuationValue) {
          await tx.valuation.create({
            data: {
              assetId,
              value: valuationValue,
              valuationDate: new Date(valuationDate || new Date()),
              source: 'MANUAL'
            }
          })
        }
      }

      return updatedAsset
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating asset:', error)
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
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const assetId = params.id

    // Check if asset exists and user has access
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        ownerships: {
          some: {
            ownerEntity: {
              userId: userId
            }
          }
        }
      },
      include: {
        ownerships: {
          include: {
            ownerEntity: true
          }
        },
        debts: {
          include: {
            payments: true
          }
        },
        valuations: true
      }
    })

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Actif non trouvé ou non accessible' },
        { status: 404 }
      )
    }

    // Check if there are any debts with payments
    const hasActiveDebts = existingAsset.debts.some(debt => 
      debt.payments.some(payment => payment.isPaid)
    )

    if (hasActiveDebts) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer un actif avec des dettes ayant des paiements effectués',
          details: 'Veuillez d\'abord gérer les financements associés'
        },
        { status: 400 }
      )
    }

    // Delete asset and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all debt payments first
      for (const debt of existingAsset.debts) {
        await tx.debtPayment.deleteMany({
          where: { debtId: debt.id }
        })
      }

      // Delete all debts
      await tx.debt.deleteMany({
        where: { assetId: assetId }
      })

      // Delete all ownerships
      await tx.ownership.deleteMany({
        where: { ownedAssetId: assetId }
      })

      // Delete all valuations
      await tx.valuation.deleteMany({
        where: { assetId: assetId }
      })

      // Finally delete the asset
      await tx.asset.delete({
        where: { id: assetId }
      })
    })

    return NextResponse.json({ 
      success: true,
      message: 'Actif supprimé avec succès' 
    })

  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 