import { NextRequest, NextResponse } from 'next/server';
import { TaxOptimizationEngine } from '@/services/tax/TaxOptimizationEngine';
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

    const taxOptimizationEngine = new TaxOptimizationEngine();
    const optimizations = await taxOptimizationEngine.generateOptimizations(params.userId);

    return NextResponse.json(optimizations);
  } catch (error) {
    console.error('Tax optimization error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 