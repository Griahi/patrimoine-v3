import { NextRequest, NextResponse } from 'next/server';
import { TaxAnalysisService } from '@/services/tax/TaxAnalysisService';
import { getServerSession } from '@/lib/auth';

import { z } from 'zod';

const simulationSchema = z.object({
  userId: z.string(),
  scenarios: z.object({
    perContribution: z.number().min(0).max(35194),
    deficitFoncier: z.number().min(0).max(50000),
    donation: z.number().min(0).max(100000),
    additionalIncome: z.number().min(-100000).max(100000)
  })
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = simulationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, scenarios } = validation.data;

    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taxAnalysisService = new TaxAnalysisService();
    const currentAnalysis = await taxAnalysisService.analyzeCurrentSituation(userId);
    
    // Calculate optimized scenario
    const optimizedAnalysis = await taxAnalysisService.simulateOptimizations(userId, scenarios);

    const result = {
      current: currentAnalysis.currentBurden,
      optimized: optimizedAnalysis.currentBurden,
      savings: {
        total: currentAnalysis.currentBurden.total - optimizedAnalysis.currentBurden.total,
        IR: currentAnalysis.currentBurden.IR - optimizedAnalysis.currentBurden.IR,
        IFI: currentAnalysis.currentBurden.IFI - optimizedAnalysis.currentBurden.IFI,
        plusValues: currentAnalysis.currentBurden.plusValues - optimizedAnalysis.currentBurden.plusValues,
        prelevementsSociaux: currentAnalysis.currentBurden.prelevementsSociaux - optimizedAnalysis.currentBurden.prelevementsSociaux,
        taxeFonciere: currentAnalysis.currentBurden.taxeFonciere - optimizedAnalysis.currentBurden.taxeFonciere
      },
      comparison: [
        { name: 'IR', current: currentAnalysis.currentBurden.IR, optimized: optimizedAnalysis.currentBurden.IR },
        { name: 'IFI', current: currentAnalysis.currentBurden.IFI, optimized: optimizedAnalysis.currentBurden.IFI },
        { name: 'Plus-values', current: currentAnalysis.currentBurden.plusValues, optimized: optimizedAnalysis.currentBurden.plusValues },
        { name: 'Prélèvements sociaux', current: currentAnalysis.currentBurden.prelevementsSociaux, optimized: optimizedAnalysis.currentBurden.prelevementsSociaux },
        { name: 'Taxe foncière', current: currentAnalysis.currentBurden.taxeFonciere, optimized: optimizedAnalysis.currentBurden.taxeFonciere }
      ],
      scenarios
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tax simulation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 