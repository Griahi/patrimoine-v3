import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { ProjectionService } from '@/lib/services/projections/projection-service';
import { z } from 'zod';

// Schéma de validation pour mise à jour
const updateScenarioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  actions: z.array(z.object({
    type: z.enum(['SELL', 'BUY', 'INVEST', 'YIELD', 'EXPENSE', 'TAX']),
    name: z.string(),
    executionDate: z.string().transform(s => new Date(s)),
    targetAssetId: z.string().optional(),
    assetType: z.string().optional(),
    amount: z.number().positive(),
    parameters: z.record(z.any()),
    order: z.number().optional()
  })).optional()
});

// GET - Récupérer un scénario
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const service = new ProjectionService(session.user.id);
    const scenario = await service.getScenario(params.id);

    return NextResponse.json(scenario);
  } catch (error) {
    console.error('Erreur lors de la récupération du scénario:', error);
    return NextResponse.json(
      { error: 'Scénario non trouvé' },
      { status: 404 }
    );
  }
}

// PUT - Mettre à jour un scénario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateScenarioSchema.parse(body);

    const service = new ProjectionService(session.user.id);
    const scenario = await service.updateScenario(params.id, validatedData);

    return NextResponse.json(scenario);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Erreur lors de la mise à jour du scénario:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un scénario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const service = new ProjectionService(session.user.id);
    await service.deleteScenario(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du scénario:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 