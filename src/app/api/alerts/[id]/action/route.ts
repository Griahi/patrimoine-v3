import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.string(),
  params: z.record(z.any()).optional()
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
    const { action, params: actionParams } = actionSchema.parse(body);

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

    // Logger l'action
    const alertAction = await prisma.alertAction.create({
      data: {
        alertId,
        action,
        metadata: actionParams || {},
        timestamp: new Date()
      }
    });

    // Optionnellement marquer l'alerte comme lue si elle ne l'était pas
    if (alert.status === 'new') {
      await prisma.alert.update({
        where: { id: alertId },
        data: {
          status: 'read',
          readAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      action: alertAction,
      message: 'Action enregistrée avec succès'
    });

  } catch (error) {
    console.error('Alert Action Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement de l\'action' },
      { status: 500 }
    );
  }
} 