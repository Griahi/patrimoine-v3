import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth-utils';

// Import Prisma avec try/catch pour éviter les erreurs de compilation
let prisma: any = null;
try {
  const { prisma: importedPrisma } = require('@/lib/prisma');
  prisma = importedPrisma;
} catch (error) {
  console.warn('⚠️ Prisma import failed, returning empty debts');
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('📋 GET /api/debts - userId:', userId)

    // Essayer d'abord Prisma, sinon retourner un tableau vide
    let debtsData;
    try {
      if (!prisma) throw new Error('Prisma not available');
      debtsData = await prisma.debt.findMany({
        where: {
          asset: {
            ownerships: {
              some: {
                ownerEntity: {
                  userId: userId
                }
              }
            }
          }
        },
        include: {
          asset: {
            include: {
              assetType: true,
              ownerships: {
                include: {
                  ownerEntity: true
                }
              }
            }
          },
          payments: {
            orderBy: {
              paymentDate: 'asc'
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        }
      });
    } catch (error) {
      console.warn('⚠️ Prisma failed, returning empty debts:', error instanceof Error ? error.message : 'Unknown error');
      debtsData = [];
    }

    console.log('✅ Returning', debtsData.length, 'debts')
    return NextResponse.json(debtsData)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dettes:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json()
    console.log('📝 Body reçu:', body)
    
    const { 
      assetId, 
      name, 
      debtType, 
      initialAmount, 
      interestRate, 
      duration, 
      amortizationType,
      startDate,
      lender,
      notes 
    } = body

    if (!assetId || !name || !initialAmount || !interestRate || !duration || !startDate) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
    }

    console.log('➕ POST /api/debts - Creating debt:', { name, assetId, initialAmount, duration })

    // Essayer d'abord Prisma, sinon retourner une erreur
    let newDebt;
    try {
      if (!prisma) throw new Error('Prisma not available');
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + duration);

      const debtData = {
        assetId,
        name,
        debtType: debtType || 'LOAN',
        initialAmount: parseFloat(initialAmount),
        currentAmount: parseFloat(initialAmount),
        interestRate: parseFloat(interestRate),
        duration: parseInt(duration),
        amortizationType: amortizationType || 'PROGRESSIVE',
        startDate: new Date(startDate),
        endDate,
        lender: lender || null,
        notes: notes || null
      }

      newDebt = await prisma.debt.create({
        data: debtData,
        include: {
          asset: {
            include: {
              assetType: true,
              ownerships: {
                include: {
                  ownerEntity: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Prisma failed, cannot create debt:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json({ error: "Service de base de données indisponible" }, { status: 503 })
    }

    console.log('✅ Created debt:', newDebt.id)
    return NextResponse.json(newDebt)
  } catch (error) {
    console.error('❌ Erreur lors de la création de la dette:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 