import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { ProjectionService } from '@/lib/services/projections/projection-service';
import { z } from 'zod';

const calculateSchema = z.object({
  timeHorizon: z.enum(['1M', '6M', '1Y', '5Y', '10Y'])
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { timeHorizon } = calculateSchema.parse(body);

    const service = new ProjectionService(session.user.id);
    const result = await service.calculateProjections(params.id, timeHorizon);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Erreur lors du calcul:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 