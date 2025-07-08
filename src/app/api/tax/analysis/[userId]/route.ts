import { NextRequest, NextResponse } from 'next/server';
import { TaxAnalysisService } from '@/services/tax/TaxAnalysisService';
import { getServerSession } from '@/lib/auth';


export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taxAnalysisService = new TaxAnalysisService();
    const analysis = await taxAnalysisService.analyzeCurrentSituation(params.userId);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Tax analysis error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 