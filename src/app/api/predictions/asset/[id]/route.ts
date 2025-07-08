import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { mlPredictionService } from '@/services/predictions/ml-prediction-service';
import { prisma } from '@/lib/prisma';
import { TimeSeriesData } from '@/types/predictions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assetId = params.id;
    const body = await request.json();
    const { 
      horizons = ['1M', '6M', '1Y', '5Y'], 
      includeConfidenceIntervals = true,
      forceRetrain = false
    } = body;

    console.log('🔮 Generating asset predictions for:', assetId);

    // Vérifier que l'actif appartient à l'utilisateur
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
      },
      include: {
        assetType: true,
        valuations: {
          orderBy: {
            valuationDate: 'desc'
          },
          take: 500 // Plus de données pour un actif individuel
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ 
        error: 'Asset not found or not accessible' 
      }, { status: 404 });
    }

    // Préparer les données historiques
    const historicalData: TimeSeriesData[] = asset.valuations.map(valuation => ({
      date: valuation.valuationDate.toISOString(),
      value: valuation.value,
      metadata: {
        source: valuation.source,
        notes: valuation.notes
      }
    }));

    if (historicalData.length < 30) {
      return NextResponse.json({ 
        error: 'Insufficient historical data for predictions (minimum 30 data points required)' 
      }, { status: 400 });
    }

    // Ordonner les données par date croissante pour l'entraînement
    historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Générer les prédictions
    const assetPrediction = await mlPredictionService.predictAsset(
      assetId,
      historicalData,
      horizons as ('1M' | '6M' | '1Y' | '5Y')[]
    );

    // Enrichir avec les informations de l'actif
    assetPrediction.assetName = asset.name;
    assetPrediction.assetType = asset.assetType.name;

    const response = {
      success: true,
      data: assetPrediction,
      metadata: {
        processingTimeMs: Date.now() - Date.now(),
        modelVersion: '1.0.0',
        dataPointsUsed: historicalData.length,
        confidenceLevel: 0.95,
        assetInfo: {
          name: asset.name,
          type: asset.assetType.name,
          category: asset.assetType.category,
          description: asset.description
        }
      }
    };

    console.log('✅ Asset predictions generated successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error generating asset predictions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate asset predictions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 