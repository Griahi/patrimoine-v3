import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const snoozeSchema = z.object({
  snoozedUntil: z.string().datetime()
});

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
    
    const body = await request.json();
    const { snoozedUntil } = snoozeSchema.parse(body);

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

    // Mettre en snooze
    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'snoozed',
        snoozedUntil: new Date(snoozedUntil),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, alert: updatedAlert });

  } catch (error) {
    console.error('Snooze Alert Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise en snooze de l\'alerte' },
      { status: 500 }
    );
  }
} 