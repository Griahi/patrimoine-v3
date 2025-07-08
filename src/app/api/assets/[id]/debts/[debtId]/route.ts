import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; debtId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const assetId = params.id;
    const debtId = params.debtId;
    const body = await request.json();

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
      return NextResponse.json({ error: 'Actif non trouvé' }, { status: 404 });
    }

    // Verify debt exists and belongs to this asset
    const existingDebt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        assetId: assetId
      }
    });

    if (!existingDebt) {
      return NextResponse.json({ error: 'Financement non trouvé' }, { status: 404 });
    }

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

    if (!name || !debtType || !initialAmount || !interestRate || !duration || !amortizationType || !startDate) {
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
        if (monthlyRate === 0) {
          monthlyPayment = principal / totalMonths;
        } else {
          monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }
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
      default:
        monthlyPayment = 0;
    }

    // Update debt
    const updatedDebt = await prisma.debt.update({
      where: { id: debtId },
      data: {
        name,
        debtType,
        initialAmount: parseFloat(initialAmount),
        currentAmount: parseFloat(initialAmount), // Reset to initial amount on update
        interestRate: parseFloat(interestRate),
        duration: parseInt(duration),
        amortizationType,
        startDate: new Date(startDate),
        endDate,
        monthlyPayment,
        lender: lender || null,
        notes: notes || null
      }
    });

    return NextResponse.json(updatedDebt);
  } catch (error) {
    console.error('Error updating debt:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; debtId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const assetId = params.id;
    const debtId = params.debtId;

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
      return NextResponse.json({ error: 'Actif non trouvé' }, { status: 404 });
    }

    // Verify debt exists and belongs to this asset
    const existingDebt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        assetId: assetId
      }
    });

    if (!existingDebt) {
      return NextResponse.json({ error: 'Financement non trouvé' }, { status: 404 });
    }

    // Delete the debt and all related payments
    await prisma.$transaction(async (tx) => {
      // Delete all payments first
      await tx.payment.deleteMany({
        where: { debtId: debtId }
      });

      // Then delete the debt
      await tx.debt.delete({
        where: { id: debtId }
      });
    });

    return NextResponse.json({ message: 'Financement supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 