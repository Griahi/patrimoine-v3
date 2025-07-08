import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const assetId = params.id;

    // Get asset with all related data
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
        assetType: true,
        debts: {
          include: {
            payments: {
              orderBy: {
                paymentDate: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        ownerships: {
          include: {
            ownerEntity: true
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

    if (!asset) {
      return NextResponse.json({ error: 'Actif non trouvé' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Erreur lors de la récupération des dettes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const assetId = params.id;
    const body = await request.json();
    
    console.log('POST /api/assets/[id]/debts - Creating debt for asset:', assetId);
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Verify asset exists and user has access
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
    });

    if (!asset) {
      console.log('Asset not found for ID:', assetId, 'User:', session.user.id);
      return NextResponse.json({ error: 'Actif non trouvé' }, { status: 404 });
    }
    
    console.log('Asset found:', asset.name, 'ID:', asset.id);

    // Validate required fields
    const {
      name,
      debtType,
      initialAmount,
      interestRate,
      duration,
      amortizationType,
      startDate,
      lender,
      notes
    } = body;

    if (!name || !initialAmount || !interestRate || !duration || !amortizationType || !startDate) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(duration));

    // Calculate monthly payment
    const principal = parseFloat(initialAmount);
    const monthlyRate = parseFloat(interestRate) / 100 / 12;
    const totalMonths = parseInt(duration);
    
    let monthlyPayment = 0;
    switch (amortizationType) {
      case 'PROGRESSIVE':
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        break;
      case 'LINEAR':
        monthlyPayment = (principal / totalMonths) + (principal * monthlyRate);
        break;
      case 'IN_FINE':
        monthlyPayment = principal * monthlyRate;
        break;
      case 'BULLET':
        monthlyPayment = 0;
        break;
    }

    // Create debt
    const debt = await prisma.debt.create({
      data: {
        assetId,
        name,
        debtType: debtType || 'LOAN',
        initialAmount: parseFloat(initialAmount),
        currentAmount: parseFloat(initialAmount), // Initially, current amount equals initial amount
        interestRate: parseFloat(interestRate),
        duration: parseInt(duration),
        amortizationType,
        startDate: new Date(startDate),
        endDate,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        lender: lender || null,
        notes: notes || null
      }
    });

    // Generate payment schedule
    await generatePaymentSchedule(debt.id, debt);

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la dette:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

async function generatePaymentSchedule(debtId: string, debt: any) {
  const {
    initialAmount,
    interestRate,
    duration,
    amortizationType,
    startDate
  } = debt;

  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = duration;
  const payments = [];
  let remainingBalance = initialAmount;

  for (let month = 1; month <= totalMonths; month++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + month);

    let principalPayment = 0;
    let interestPayment = 0;
    let totalPayment = 0;

    switch (amortizationType) {
      case 'PROGRESSIVE':
        // Fixed monthly payment
        totalPayment = initialAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        interestPayment = remainingBalance * monthlyRate;
        principalPayment = totalPayment - interestPayment;
        break;

      case 'LINEAR':
        // Fixed principal payment
        principalPayment = initialAmount / totalMonths;
        interestPayment = remainingBalance * monthlyRate;
        totalPayment = principalPayment + interestPayment;
        break;

      case 'IN_FINE':
        // Interest only, except last payment
        interestPayment = initialAmount * monthlyRate;
        principalPayment = month === totalMonths ? initialAmount : 0;
        totalPayment = interestPayment + principalPayment;
        break;

      case 'BULLET':
        // Single payment at the end
        if (month === totalMonths) {
          principalPayment = initialAmount;
          interestPayment = initialAmount * (interestRate / 100) * (duration / 12);
          totalPayment = principalPayment + interestPayment;
        } else {
          continue; // Skip intermediate payments
        }
        break;
    }

    remainingBalance -= principalPayment;

    payments.push({
      debtId,
      paymentNumber: month,
      paymentDate,
      principalAmount: principalPayment,
      interestAmount: interestPayment,
      totalAmount: totalPayment,
      remainingBalance: Math.max(0, remainingBalance),
      isPaid: false
    });
  }

  // Create payment records
  if (payments.length > 0) {
    await prisma.debtPayment.createMany({
      data: payments
    });
  }
} 