import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PredictionChart from '@/components/predictions/PredictionChart';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { generatePortfolioPredictions } from '@/services/predictions/ml-prediction-service';
import { PortfolioPrediction } from '@/types/predictions';
import { getServerSession } from '@/lib/auth-helper';

interface SearchParams {
  generate?: string;
  error?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PredictionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Utiliser le helper d'authentification unifié
  const session = await getServerSession();
  
  if (!session) {
    // Le middleware devrait gérer cela, mais au cas où...
    redirect('/login?callbackUrl=/dashboard/predictions');
  }

  const userId = session.user.id;
  const userEmail = session.user.email;
  console.log('🔮 Dashboard Predictions page: User authenticated:', userEmail);

  let prediction: PortfolioPrediction | null = null;
  let error: string | null = null;
  let isDemo = false;
  let processingTime = 0;

  // Generate predictions if requested
  if (params.generate === 'true') {
    const startTime = Date.now();
    
    try {
      console.log('🔮 Server-side prediction generation for user:', userId);
      
      // Essayer de récupérer les actifs de l'utilisateur
      let assets;
      try {
        assets = await prisma.asset.findMany({
          where: {
            ownerships: {
              some: {
                ownerEntity: {
                  userId: userId
                }
              }
            }
          },
          include: {
            assetType: true,
            valuations: {
              orderBy: {
                valuationDate: 'desc'
              }
            },
            ownerships: {
              include: {
                ownerEntity: true
              }
            }
          }
        });
      } catch (prismaError) {
        console.warn('⚠️ Prisma failed, using empty assets:', prismaError instanceof Error ? prismaError.message : 'Unknown error');
        assets = [];
      }

      if (assets.length === 0) {
        // Generate demo data
        console.log('📊 No assets found, generating demo predictions...');
        
        const demoAssets = [
          {
            id: 'demo-real-estate',
            name: 'Résidence Principale',
            assetType: { name: 'Immobilier', category: 'REAL_ESTATE' },
            valuations: Array.from({ length: 24 }, (_, i) => ({
              value: 450000 + Math.random() * 50000 - 25000,
              valuationDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
              currency: 'EUR'
            })).reverse()
          },
          {
            id: 'demo-stocks',
            name: 'Portefeuille Actions',
            assetType: { name: 'Actions', category: 'STOCK' },
            valuations: Array.from({ length: 24 }, (_, i) => ({
              value: 85000 + Math.random() * 20000 - 10000,
              valuationDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
              currency: 'EUR'
            })).reverse()
          },
          {
            id: 'demo-investment-fund',
            name: 'Fonds d\'Investissement',
            assetType: { name: 'Fonds', category: 'INVESTMENT_FUND' },
            valuations: Array.from({ length: 24 }, (_, i) => ({
              value: 35000 + Math.random() * 8000 - 4000,
              valuationDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
              currency: 'EUR'
            })).reverse()
          },
          {
            id: 'demo-crypto',
            name: 'Cryptomonnaies',
            assetType: { name: 'Crypto', category: 'CRYPTOCURRENCY' },
            valuations: Array.from({ length: 24 }, (_, i) => ({
              value: 12000 + Math.random() * 8000 - 4000,
              valuationDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
              currency: 'EUR'
            })).reverse()
          }
        ];

        // Generate predictions for demo data
        prediction = await generatePortfolioPredictions(demoAssets as any, {
          horizons: ['1M', '6M', '1Y', '5Y'],
          includeConfidenceIntervals: true,
          includeMonteCarlo: {
            scenarios: 1000,
            timeHorizonYears: 5
          }
        });

        isDemo = true;
        
      } else {
        // Generate real predictions
        console.log('🔮 Generating real predictions for', assets.length, 'assets');
        
        prediction = await generatePortfolioPredictions(assets, {
          horizons: ['1M', '6M', '1Y', '5Y'],
          includeConfidenceIntervals: true,
          includeMonteCarlo: {
            scenarios: 1000,
            timeHorizonYears: 5
          }
        });
      }
      
      processingTime = Math.round((Date.now() - startTime) / 1000);
      console.log('✅ Server-side predictions generated in', processingTime, 'seconds');
      
    } catch (err) {
      console.error('❌ Server-side prediction error:', err);
      error = err instanceof Error ? err.message : 'Erreur lors de la génération des prédictions';
    }
  }

  // Handle error from URL parameters
  if (params.error) {
    error = decodeURIComponent(params.error);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔮 Prédictions ML - Mode Serveur
          </h1>
          <p className="text-gray-600">
            Génération de prédictions côté serveur pour éviter les interférences d'extensions
          </p>
        </div>

        {/* Extension Warning */}
        <Card className="mb-6 p-4 border-l-4 border-yellow-400 bg-yellow-50">
          <div className="flex items-start">
            <div className="text-yellow-400 mr-3">
              ⚠️
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-1">
                Extension Chrome Détectée
              </h3>
              <p className="text-yellow-700 text-sm mb-3">
                Une extension Chrome bloque les requêtes HTTP sur cette page. Cette page utilise un traitement côté serveur pour éviter ce problème.
              </p>
              <div className="flex gap-2 mb-3">
                <a href="/diagnostics" className="inline-block">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                  >
                    🔍 Diagnostics Complets
                  </Button>
                </a>
                <a href="/api/session-check" target="_blank" className="inline-block">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
                  >
                    🔍 Test Session
                  </Button>
                </a>
              </div>
              <details className="text-sm text-yellow-600">
                <summary className="cursor-pointer font-medium hover:text-yellow-800">
                  Solutions recommandées
                </summary>
                <div className="mt-2 pl-4 space-y-1">
                  <div>• Désactivez temporairement l'extension ID: iohjgamcilhbgmhbnllfolmkmmekfmci</div>
                  <div>• Allez dans chrome://extensions/ et désactivez les extensions de blocage HTTP</div>
                  <div>• Utilisez un profil Chrome différent pour le développement</div>
                  <div>• Ouvrez un onglet de navigation privée</div>
                </div>
              </details>
            </div>
          </div>
        </Card>

        {/* Generate Predictions Form */}
        {!prediction && !error && (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Prédictions Intelligentes
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Utilisez l'intelligence artificielle pour projeter l'évolution de votre patrimoine. 
              Cette version utilise un traitement côté serveur pour éviter les interférences d'extensions.
            </p>
            
            <form method="GET" className="inline-block">
              <input type="hidden" name="generate" value="true" />
              <Button 
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
              >
                🚀 Générer les Prédictions
              </Button>
            </form>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="p-4">
                <div className="text-3xl mb-2">🔮</div>
                <div className="font-semibold">Modèles LSTM</div>
                <div className="text-gray-600 text-sm">Deep Learning pour séries temporelles</div>
              </div>
              <div className="p-4">
                <div className="text-3xl mb-2">🎲</div>
                <div className="font-semibold">Monte Carlo</div>
                <div className="text-gray-600 text-sm">Simulations de 1000+ scénarios</div>
              </div>
              <div className="p-4">
                <div className="text-3xl mb-2">📊</div>
                <div className="font-semibold">Rendu Serveur</div>
                <div className="text-gray-600 text-sm">Aucune requête client bloquée</div>
              </div>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-start">
              <div className="text-red-400 mr-3">
                ❌
              </div>
              <div>
                <h3 className="font-semibold text-red-800 mb-2">
                  Erreur de Génération
                </h3>
                <p className="text-red-700 mb-4">
                  {error}
                </p>
                <form method="GET" className="inline-block">
                  <Button 
                    type="submit"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    🔄 Réessayer
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        )}

        {/* Predictions Display */}
        {prediction && (
          <div className="space-y-6">
            {/* Success Message */}
            {isDemo && (
              <Card className="p-4 border-blue-200 bg-blue-50">
                <div className="flex items-start">
                  <div className="text-blue-400 mr-3">
                    🎭
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">
                      Mode Démonstration
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Aucun actif trouvé dans votre portefeuille. Ces prédictions sont basées sur des données de démonstration. 
                      Ajoutez de vrais actifs dans la section "Actifs" pour obtenir des prédictions personnalisées.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Processing Time */}
            <Card className="p-4 border-green-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-green-400 mr-3">
                    ✅
                  </div>
                  <div>
                    <span className="font-semibold text-green-800">
                      Prédictions générées avec succès
                    </span>
                    <span className="text-green-700 text-sm ml-2">
                      (Temps de traitement: {processingTime}s)
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form method="GET" className="inline">
                    <input type="hidden" name="generate" value="true" />
                    <Button 
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      🔄 Actualiser
                    </Button>
                  </form>
                  <a href="/dashboard" className="inline-block">
                    <Button 
                      variant="outline"
                      size="sm"
                    >
                      ← Retour
                    </Button>
                  </a>
                </div>
              </div>
            </Card>

            {/* Predictions Chart */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                📈 Prédictions de Portefeuille
              </h3>
              <PredictionChart
                portfolioData={prediction}
                selectedHorizon="1Y"
                showConfidenceInterval={true}
                height={400}
              />
            </Card>

            {/* Detailed Results */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                📊 Résultats Détaillés
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Valeur Actuelle</div>
                  <div className="text-2xl font-bold">
                    {(prediction.totalCurrentValue || 0).toLocaleString('fr-FR')} €
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600">Prédiction 1 An</div>
                  <div className="text-2xl font-bold text-blue-800">
                    {(prediction.predictions['1Y']?.value || 0).toLocaleString('fr-FR')} €
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Croissance 1 An</div>
                  <div className="text-2xl font-bold text-green-800">
                    {prediction.predictions['1Y']?.value && prediction.totalCurrentValue ? 
                      `${(((prediction.predictions['1Y'].value - prediction.totalCurrentValue) / prediction.totalCurrentValue) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600">Confiance</div>
                  <div className="text-2xl font-bold text-purple-800">
                    {prediction.predictions['1Y']?.confidence?.level ? 
                      `${(prediction.predictions['1Y'].confidence.level * 100).toFixed(0)}%`
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 