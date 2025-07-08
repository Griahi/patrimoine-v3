import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { mlPredictionService } from '@/services/predictions/ml-prediction-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      assetId,
      currentValue,
      timeHorizonYears = 5,
      scenarios = 1000,
      baseVolatility = 0.15,
      baseTrend = 0.07,
      customParameters
    } = body;

    console.log('🎲 Running Monte Carlo simulation for user:', session.user.id);

    if (!currentValue || currentValue <= 0) {
      return NextResponse.json({ 
        error: 'Invalid current value for Monte Carlo simulation' 
      }, { status: 400 });
    }

    // Si aucune valeur actuelle n'est fournie, calculer depuis le portfolio
    if (!currentValue) {
      if (assetId) {
        // Simulation pour un actif spécifique
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
            valuations: {
              orderBy: { valuationDate: 'desc' },
              take: 1
            }
          }
        });

        if (!asset || !asset.valuations[0]) {
          return NextResponse.json({ 
            error: 'Asset not found or no valuation data' 
          }, { status: 404 });
        }

        currentValue = asset.valuations[0].value;
      } else {
        // Simulation pour tout le portfolio
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
            valuations: {
              orderBy: { valuationDate: 'desc' },
              take: 1
            }
          }
        });

        currentValue = assets.reduce((sum, asset) => {
          const latestValuation = asset.valuations[0];
          return sum + (latestValuation?.value || 0);
        }, 0);

        if (currentValue === 0) {
          return NextResponse.json({ 
            error: 'No portfolio value found for simulation' 
          }, { status: 404 });
        }
      }
    }

    // Valider les paramètres
    if (scenarios < 100 || scenarios > 10000) {
      return NextResponse.json({ 
        error: 'Number of scenarios must be between 100 and 10,000' 
      }, { status: 400 });
    }

    if (timeHorizonYears < 0.1 || timeHorizonYears > 20) {
      return NextResponse.json({ 
        error: 'Time horizon must be between 0.1 and 20 years' 
      }, { status: 400 });
    }

    const startTime = Date.now();

    // Exécuter la simulation Monte Carlo
    const monteCarloResult = await mlPredictionService.runMonteCarlo(
      currentValue,
      timeHorizonYears,
      scenarios,
      baseVolatility,
      baseTrend
    );

    // Calculer des métriques supplémentaires
    const processingTimeMs = Date.now() - startTime;
    
    // Probabilités d'objectifs communs
    const targetAnalysis = {
      probabilityOfPreservingCapital: monteCarloResult.probabilityAnalysis.probabilityOfTarget(currentValue),
      probabilityOf50PercentGain: monteCarloResult.probabilityAnalysis.probabilityOfTarget(currentValue * 1.5),
      probabilityOfDoubling: monteCarloResult.probabilityAnalysis.probabilityOfDoubling,
      probabilityOf25PercentLoss: monteCarloResult.scenarios.filter(s => s.finalValue <= currentValue * 0.75).length / scenarios,
      probabilityOf50PercentLoss: monteCarloResult.scenarios.filter(s => s.finalValue <= currentValue * 0.5).length / scenarios
    };

    // Analyse de distribution
    const distributionAnalysis = {
      skewness: calculateSkewness(monteCarloResult.scenarios.map(s => s.finalValue)),
      kurtosis: calculateKurtosis(monteCarloResult.scenarios.map(s => s.finalValue)),
      valueAtRisk95: monteCarloResult.statistics.percentiles.p5, // VaR 95%
      expectedShortfall: calculateExpectedShortfall(monteCarloResult.scenarios.map(s => s.finalValue), 0.05)
    };

    const response = {
      success: true,
      data: monteCarloResult,
      analysis: {
        targetAnalysis,
        distributionAnalysis,
        riskMetrics: {
          maxDrawdown: (currentValue - monteCarloResult.worstCaseScenario.finalValue) / currentValue,
          maxUpside: (monteCarloResult.bestCaseScenario.finalValue - currentValue) / currentValue,
          volatility: monteCarloResult.statistics.standardDeviation / monteCarloResult.statistics.mean,
          sharpeRatio: calculateSharpeRatio(monteCarloResult.scenarios.map(s => s.finalValue), currentValue, timeHorizonYears)
        }
      },
      metadata: {
        processingTimeMs,
        modelVersion: '1.0.0',
        scenariosGenerated: scenarios,
        timeHorizonYears
      }
    };

    console.log('✅ Monte Carlo simulation completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error running Monte Carlo simulation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run Monte Carlo simulation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Fonctions utilitaires pour l'analyse statistique
function calculateSkewness(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n;
  return skewness;
}

function calculateKurtosis(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;
  return kurtosis;
}

function calculateExpectedShortfall(values: number[], percentile: number): number {
  const sorted = values.sort((a, b) => a - b);
  const cutoffIndex = Math.floor(sorted.length * percentile);
  const worstCases = sorted.slice(0, cutoffIndex);
  return worstCases.reduce((a, b) => a + b, 0) / worstCases.length;
}

function calculateSharpeRatio(finalValues: number[], initialValue: number, timeHorizon: number): number {
  const returns = finalValues.map(val => Math.pow(val / initialValue, 1 / timeHorizon) - 1);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const returnVariance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const returnStdDev = Math.sqrt(returnVariance);
  
  const riskFreeRate = 0.02; // 2% taux sans risque
  return (avgReturn - riskFreeRate) / returnStdDev;
} 