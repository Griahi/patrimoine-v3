import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        ownerships: {
          some: {
            ownerEntity: {
              userId: user.id
            }
          }
        }
      },
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
          }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'asset:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { name, description, customFields } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        description,
        customFields
      },
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
          }
        }
      }
    });

    return NextResponse.json(asset)
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'asset:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'asset appartient à l'utilisateur
    const asset = await prisma.asset.findFirst({
      where: {
        id,
        ownerships: {
          some: {
            ownerEntity: {
              userId: user.id
            }
          }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Supprimer l'asset et tous ses éléments liés
    await prisma.asset.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Asset supprimé avec succès' })
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'asset:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 