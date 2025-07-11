import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { ProjectionService } from '@/lib/services/projections/projection-service';
import { z } from 'zod';

// Schéma de validation pour création
const createScenarioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['SIMPLE', 'COMPLEX']),
  actions: z.array(z.object({
    type: z.enum(['SELL', 'BUY', 'INVEST', 'YIELD', 'EXPENSE', 'TAX']),
    name: z.string(),
    executionDate: z.string().transform(s => new Date(s)),
    targetAssetId: z.string().optional(),
    assetType: z.string().optional(),
    amount: z.number().positive(),
    parameters: z.record(z.any()),
    order: z.number().optional()
  })).min(1)
});

// GET - Lister les scénarios
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const service = new ProjectionService(session.user.id);
    const scenarios = await service.getScenarios();

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error('Erreur lors de la récupération des scénarios:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un scénario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createScenarioSchema.parse(body);

    const service = new ProjectionService(session.user.id);
    const scenario = await service.createScenario(validatedData);

    return NextResponse.json(scenario);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erreur lors de la création du scénario:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
} 