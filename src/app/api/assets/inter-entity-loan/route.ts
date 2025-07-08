import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received body:', body)

    const {
      name,
      description,
      initialValue,
      valuationDate,
      metadata
    } = body

    // Validate required fields
    if (!name || !initialValue || !metadata) {
      return NextResponse.json(
        { error: 'Nom, montant et métadonnées sont requis' },
        { status: 400 }
      )
    }

    // Validate inter-entity loan specific fields
    if (!metadata.lenderEntityId || !metadata.borrowerEntityId) {
      return NextResponse.json(
        { error: 'Entité prêteuse et emprunteuse sont requises' },
        { status: 400 }
      )
    }

    if (metadata.lenderEntityId === metadata.borrowerEntityId) {
      return NextResponse.json(
        { error: 'Le prêteur et l\'emprunteur ne peuvent pas être la même entité' },
        { status: 400 }
      )
    }

    // Get the inter-entity loan asset type
    const assetType = await prisma.assetType.findUnique({
      where: { code: 'inter_entity_loan' }
    })

    if (!assetType) {
      return NextResponse.json(
        { error: 'Type d\'actif "Prêt Inter-Entité" non trouvé' },
        { status: 404 }
      )
    }

    // Create the inter-entity loan in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the asset (represents the receivable/claim)
      const asset = await tx.asset.create({
        data: {
          name,
          description: description || null,
          assetTypeId: assetType.id,
          metadata: metadata
        }
      })

      // 2. Create ownership for the lender entity (they own the receivable)
      await tx.ownership.create({
        data: {
          ownerEntityId: metadata.lenderEntityId,
          ownedAssetId: asset.id,
          percentage: 100,
          startDate: new Date(metadata.contractDate || new Date())
        }
      })

      // 3. Create initial valuation (amount of the loan)
      await tx.valuation.create({
        data: {
          assetId: asset.id,
          value: initialValue,
          valuationDate: new Date(valuationDate || new Date()),
          source: 'MANUAL',
          notes: 'Montant initial du prêt inter-entité'
        }
      })

      return { asset }
    })

    return NextResponse.json({
      message: 'Prêt inter-entité créé avec succès',
      asset: result.asset
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création du prêt inter-entité:', error)
    return NextResponse.json(
      { error: `Erreur interne du serveur: ${error.message}` },
      { status: 500 }
    )
  }
}

