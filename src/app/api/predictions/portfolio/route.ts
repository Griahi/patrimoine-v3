import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { mlPredictionService } from '@/services/predictions/ml-prediction-service';
import { prisma } from '@/lib/prisma';
import { TimeSeriesData } from '@/types/predictions';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📝 Headers received:', Object.fromEntries(request.headers.entries()));
    console.log('🍪 Cookies:', request.headers.get('cookie'));
    
    const session = await auth();
    console.log('🔐 Session details:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });
    
    if (!session?.user?.id) {
      console.log('❌ Authentication failed - no valid session');
      console.log('💡 User needs to log in at /login before using predictions');
      return NextResponse.json({ 
        error: 'Authentication required. Please log in to use predictions.',
        details: 'No valid session found',
        action: 'Please visit /login to authenticate'
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      horizons = ['1M', '6M', '1Y', '5Y'], 
      includeConfidenceIntervals = true,
      includeMonteCarlo,
      whatIfScenarios = []
    } = body;

    console.log('🔮 Generating portfolio predictions for user:', session.user.id);

    // Récupérer les données des actifs de l'utilisateur
    const assets = await prisma.asset.findMany({
      where: {
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
          take: 365 // Dernière année
        },
        ownerships: {
          include: {
            ownerEntity: true
          }
        }
      }
    });

    if (assets.length === 0) {
      console.log('⚠️ No assets found, generating demo data for testing...');
      
      // Générer des données de démonstration pour les tests
      const demoAssetsData = [
        {
          assetId: 'demo-stocks',
          data: generateDemoTimeSeriesData('stock', 100000),
          weight: 0.4
        },
        {
          assetId: 'demo-real-estate',
          data: generateDemoTimeSeriesData('real_estate', 300000),
          weight: 0.5
        },
        {
          assetId: 'demo-crypto',
          data: generateDemoTimeSeriesData('crypto', 20000),
          weight: 0.1
        }
      ];

      // Générer les prédictions avec les données de démo
      const portfolioPrediction = await mlPredictionService.predictPortfolio(
        session.user.id,
        demoAssetsData
      );

      // Générer Monte Carlo si demandé
      let monteCarloResult;
      if (includeMonteCarlo) {
        console.log('🎲 Running Monte Carlo simulation with demo data...');
        monteCarloResult = await mlPredictionService.runMonteCarlo(
          portfolioPrediction.totalCurrentValue,
          includeMonteCarlo.timeHorizonYears || 5,
          includeMonteCarlo.scenarios || 1000
        );
      }

      const response = {
        success: true,
        data: portfolioPrediction,
        monteCarlo: monteCarloResult,
        whatIfResults: [],
        isDemo: true,
        demoMessage: 'Ces prédictions utilisent des données de démonstration car aucun actif n\'a été trouvé dans votre patrimoine.',
        metadata: {
          processingTimeMs: Date.now() - startTime,
          modelVersion: '1.0.0',
          dataPointsUsed: demoAssetsData.reduce((sum, asset) => sum + asset.data.length, 0),
          confidenceLevel: 0.95
        }
      };

      console.log('✅ Demo portfolio predictions generated successfully');
      return NextResponse.json(response);
    }

    // Préparer les données pour les prédictions
    const assetsData = assets.map(asset => {
      const historicalData: TimeSeriesData[] = asset.valuations.map(valuation => ({
        date: valuation.valuationDate.toISOString(),
        value: valuation.value
      }));

      // Calculer le poids de l'actif dans le portfolio
      const totalPortfolioValue = assets.reduce((sum, a) => {
        const latestValuation = a.valuations[0];
        return sum + (latestValuation?.value || 0);
      }, 0);

      const assetValue = asset.valuations[0]?.value || 0;
      const weight = totalPortfolioValue > 0 ? assetValue / totalPortfolioValue : 0;

      return {
        assetId: asset.id,
        data: historicalData,
        weight
      };
    }).filter(asset => asset.data.length > 0); // Accepter tous les actifs avec au moins une valorisation

    if (assetsData.length === 0) {
      return NextResponse.json({ 
        error: 'No assets found for predictions' 
      }, { status: 404 });
    }

    // Enrichir les données historiques avec des données simulées si nécessaire
    const enrichedAssetsData = assetsData.map(asset => {
      if (asset.data.length < 30) {
        // Générer des données historiques simulées pour avoir au moins 30 points
        const missingDays = 30 - asset.data.length;
        const latestValue = asset.data[0]?.value || 0;
        const currentDate = new Date();
        
        for (let i = missingDays; i > 0; i--) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() - i);
          
          // Variation aléatoire de ±2% par jour
          const variation = (Math.random() - 0.5) * 0.04;
          const simulatedValue = latestValue * (1 + variation * Math.sqrt(i / 30));
          
          asset.data.unshift({
            date: date.toISOString(),
            value: simulatedValue
          });
        }
      }
      return asset;
    });

    // Générer les prédictions du portfolio
    const portfolioPrediction = await mlPredictionService.predictPortfolio(
      session.user.id,
      enrichedAssetsData
    );

    // Générer Monte Carlo si demandé
    let monteCarloResult;
    if (includeMonteCarlo) {
      console.log('🎲 Running Monte Carlo simulation...');
      monteCarloResult = await mlPredictionService.runMonteCarlo(
        portfolioPrediction.totalCurrentValue,
        includeMonteCarlo.timeHorizonYears || 5,
        includeMonteCarlo.scenarios || 1000
      );
    }

    // Analyser les scénarios What-If si fournis
    let whatIfResults = [];
    if (whatIfScenarios.length > 0) {
      console.log('🔍 Analyzing What-If scenarios...');
      whatIfResults = await mlPredictionService.analyzeWhatIfScenarios(
        portfolioPrediction,
        whatIfScenarios
      );
    }

    const response = {
      success: true,
      data: portfolioPrediction,
      monteCarlo: monteCarloResult,
      whatIfResults,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        modelVersion: '1.0.0',
        dataPointsUsed: enrichedAssetsData.reduce((sum, asset) => sum + asset.data.length, 0),
        confidenceLevel: 0.95
      }
    };

    console.log('✅ Portfolio predictions generated successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error generating portfolio predictions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate portfolio predictions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Fonction utilitaire pour générer des données de démonstration
function generateDemoTimeSeriesData(assetType: string, baseValue: number): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];
  const currentDate = new Date();
  
  // Paramètres par type d'actif
  const params = {
    stock: { volatility: 0.15, trend: 0.08, seasonality: 0.02 },
    real_estate: { volatility: 0.08, trend: 0.05, seasonality: 0.01 },
    crypto: { volatility: 0.3, trend: 0.12, seasonality: 0.05 }
  };
  
  const assetParams = params[assetType as keyof typeof params] || params.stock;
  let currentValue = baseValue;
  
  // Générer 120 jours de données historiques (plus que 30 pour LSTM)
  for (let i = 120; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    // Calcul de la variation quotidienne
    const randomVariation = (Math.random() - 0.5) * assetParams.volatility * 0.1;
    const trendEffect = assetParams.trend / 365; // Tendance quotidienne
    const seasonalEffect = Math.sin(2 * Math.PI * i / 365) * assetParams.seasonality;
    
    const dailyChange = trendEffect + randomVariation + seasonalEffect;
    currentValue *= (1 + dailyChange);
    
    data.push({
      date: date.toISOString(),
      value: Math.round(currentValue * 100) / 100
    });
  }
  
  return data;
} 