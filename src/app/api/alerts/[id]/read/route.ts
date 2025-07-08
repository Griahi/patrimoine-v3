import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id as string;
    const alertId = params.id;

    // Vérifier que l'alerte appartient à l'utilisateur
    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId
      }
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alerte non trouvée' }, { status: 404 });
    }

    // Marquer comme lue
    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'read',
        readAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, alert: updatedAlert });

  } catch (error) {
    console.error('Mark Alert as Read Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'alerte' },
      { status: 500 }
    );
  }
} 