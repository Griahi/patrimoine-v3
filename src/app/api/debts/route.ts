import { getUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const entityIdsParam = searchParams.get('entityIds');
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parse entity filter
    const entityIds = entityIdsParam 
      ? entityIdsParam.split(',').filter(id => id.trim())
      : null;

    console.log('📋 GET /api/debts - filters:', {
      assetId,
      entityIds: entityIds ? `${entityIds.length} entities` : 'all entities'
    });

    // Si assetId est fourni, filtrer par cet actif
    if (assetId) {
      console.log('📋 GET /api/debts - assetId:', assetId)

      // Vérifier que l'actif appartient à l'utilisateur
      const asset = await prisma.asset.findFirst({
        where: {
          id: assetId,
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

      const debts = await prisma.debt.findMany({
        where: { assetId },
        include: {
          asset: {
            include: {
              assetType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log('✅ Returning', debts.length, 'debts for asset', assetId)
      return NextResponse.json(debts)
    }

    // Si pas d'assetId, retourner toutes les dettes de l'utilisateur avec filtrage par entités
    console.log('📋 GET /api/debts - getting all debts for user:', user.id)

    // Build where clause based on entity filter
    let whereClause = {
      asset: {
        ownerships: {
          some: {
            ownerEntity: {
              userId: user.id
            }
          }
        }
      }
    };

    if (entityIds && entityIds.length > 0) {
      whereClause = {
        asset: {
          ownerships: {
            some: {
              ownerEntity: {
                userId: user.id,
                id: { in: entityIds }
              }
            }
          }
        }
      };
    }

    const debts = await prisma.debt.findMany({
      where: whereClause,
      include: {
        asset: {
          include: {
            assetType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculer un résumé des dettes
    const summary = {
      totalDebt: debts.reduce((sum, debt) => sum + debt.currentAmount, 0),
      totalInitialAmount: debts.reduce((sum, debt) => sum + debt.initialAmount, 0),
      totalMonthlyPayments: debts.reduce((sum, debt) => sum + (debt.monthlyPayment || 0), 0),
      activeDebtsCount: debts.filter(debt => debt.currentAmount > 0).length,
      totalDebtsCount: debts.length
    };

    console.log('✅ Returning', debts.length, 'debts with summary', entityIds ? `for ${entityIds.length} entities` : 'for all entities')
    return NextResponse.json({ debts, summary })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dettes:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/debts - Start')
    
    const user = await getUserFromRequest(request);
    console.log('🔑 Auth result:', { userId: user?.id })
    
    if (!user) {
      console.log('❌ No user, returning 401')
      return NextResponse.json({ 
        error: 'Non autorisé', 
        message: 'Session invalide ou expirée. Veuillez vous reconnecter.' 
      }, { status: 401 });
    }

    console.log('📦 Reading request body...')
    const body = await request.json()
    console.log('📝 Body reçu:', body)
    
    const { assetId, amount, interestRate, startDate, endDate, description, lenderName } = body

    if (!assetId || !amount || !interestRate || !startDate) {
      console.log('❌ Missing required fields, returning 400')
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
    }

    // Vérifier que l'actif appartient à l'utilisateur
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
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

    const debtData = {
      assetId,
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      description: description || null,
      lenderName: lenderName || null
    }
    
    console.log('💾 Debt data to create:', debtData)

    console.log('📡 Calling prisma.debt.create...')
    const newDebt = await prisma.debt.create({
      data: debtData,
      include: {
        asset: {
          include: {
            assetType: true
          }
        }
      }
    });

    console.log('✅ Created debt:', newDebt.id)
    return NextResponse.json(newDebt)
  } catch (error) {
    console.error('❌ Erreur lors de la création de la dette:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 