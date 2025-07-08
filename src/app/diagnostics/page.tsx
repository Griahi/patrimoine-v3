import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

export default async function DiagnosticsPage() {
  const diagnostics: DiagnosticResult[] = [];
  const timestamp = new Date().toISOString();

  // Test 1: Session Check
  try {
    const session = await auth();
    
    if (session?.user?.id) {
      diagnostics.push({
        test: 'Session Validation',
        status: 'success',
        message: `Session active pour ${session.user.email}`,
        details: {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          expires: session.expires
        },
        timestamp
      });
    } else {
      diagnostics.push({
        test: 'Session Validation',
        status: 'error',
        message: 'Aucune session active',
        details: { session },
        timestamp
      });
    }
  } catch (error) {
    diagnostics.push({
      test: 'Session Validation',
      status: 'error',
      message: `Erreur de session: ${error instanceof Error ? error.message : 'Unknown'}`,
      details: { error: error instanceof Error ? error.stack : error },
      timestamp
    });
  }

  // Test 2: Database Connection
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    diagnostics.push({
      test: 'Database Connection',
      status: 'success',
      message: `Base de données connectée (${userCount} utilisateurs)`,
      details: { userCount },
      timestamp
    });
  } catch (error) {
    diagnostics.push({
      test: 'Database Connection',
      status: 'error',
      message: `Erreur de base de données: ${error instanceof Error ? error.message : 'Unknown'}`,
      details: { error: error instanceof Error ? error.stack : error },
      timestamp
    });
  }

  // Test 3: User Assets (if session exists)
  const session = await auth();
  if (session?.user?.id) {
    try {
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
            take: 5
          }
        }
      });

      diagnostics.push({
        test: 'User Assets',
        status: assets.length > 0 ? 'success' : 'warning',
        message: `${assets.length} actifs trouvés`,
        details: {
          assetCount: assets.length,
          assets: assets.map(a => ({
            id: a.id,
            name: a.name,
            type: a.assetType.name,
            valuationsCount: a.valuations.length,
            lastValuation: a.valuations[0]?.value || 0
          }))
        },
        timestamp
      });
    } catch (error) {
      diagnostics.push({
        test: 'User Assets',
        status: 'error',
        message: `Erreur de récupération des actifs: ${error instanceof Error ? error.message : 'Unknown'}`,
        details: { error: error instanceof Error ? error.stack : error },
        timestamp
      });
    }
  }

  // Test 4: TensorFlow.js Dependencies (désactivé pour éviter les erreurs de build)
  diagnostics.push({
    test: 'TensorFlow.js',
    status: 'warning',
    message: 'TensorFlow.js désactivé temporairement pour éviter les erreurs de build',
    details: { 
      note: 'Import désactivé en raison de problèmes de compatibilité Node.js',
      platform: process.platform,
      nodeVersion: process.version
    },
    timestamp
  });

  // Test 5: Environment Variables
  const envVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
    'NODE_ENV'
  ];

  const envStatus = envVars.map(varName => ({
    name: varName,
    value: process.env[varName] ? 'Défini' : 'Manquant',
    present: !!process.env[varName]
  }));

  diagnostics.push({
    test: 'Environment Variables',
    status: envStatus.every(env => env.present) ? 'success' : 'warning',
    message: `${envStatus.filter(env => env.present).length}/${envVars.length} variables définies`,
    details: { envVars: envStatus },
    timestamp
  });

  // Test 6: Server Information
  diagnostics.push({
    test: 'Server Information',
    status: 'success',
    message: 'Informations serveur collectées',
    details: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      env: process.env.NODE_ENV,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    timestamp
  });

  const successCount = diagnostics.filter(d => d.status === 'success').length;
  const errorCount = diagnostics.filter(d => d.status === 'error').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Diagnostics Système
          </h1>
          <p className="text-gray-600">
            Vérification complète de l'état du système et des fonctionnalités
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">État Global</h2>
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✅ {successCount} Succès
                </Badge>
                {warningCount > 0 && (
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    ⚠️ {warningCount} Avertissements
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="default" className="bg-red-100 text-red-800">
                    ❌ {errorCount} Erreurs
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Diagnostic effectué le</div>
              <div className="font-medium">{new Date(timestamp).toLocaleString('fr-FR')}</div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/dashboard/predictions" className="block">
              <Button variant="outline" className="w-full h-20 bg-purple-50 border-purple-200 hover:bg-purple-100">
                <div className="text-center">
                  <div className="text-2xl mb-1">🔮</div>
                  <div className="font-medium">Prédictions Serveur</div>
                  <div className="text-xs text-gray-600">Contourne les extensions</div>
                </div>
              </Button>
            </a>
            <a href="/api/session-check" target="_blank" className="block">
              <Button variant="outline" className="w-full h-20 bg-blue-50 border-blue-200 hover:bg-blue-100">
                <div className="text-center">
                  <div className="text-2xl mb-1">🔍</div>
                  <div className="font-medium">Test Session API</div>
                  <div className="text-xs text-gray-600">Vérification directe</div>
                </div>
              </Button>
            </a>
            <a href="/login" className="block">
              <Button variant="outline" className="w-full h-20 bg-green-50 border-green-200 hover:bg-green-100">
                <div className="text-center">
                  <div className="text-2xl mb-1">🔐</div>
                  <div className="font-medium">Se connecter</div>
                  <div className="text-xs text-gray-600">Refaire l'authentification</div>
                </div>
              </Button>
            </a>
          </div>
        </Card>

        {/* Detailed Results */}
        <div className="space-y-4">
          {diagnostics.map((diagnostic, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`text-2xl ${
                      diagnostic.status === 'success' ? 'text-green-600' : 
                      diagnostic.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {diagnostic.status === 'success' ? '✅' : 
                       diagnostic.status === 'warning' ? '⚠️' : '❌'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{diagnostic.test}</h3>
                      <p className="text-gray-600">{diagnostic.message}</p>
                    </div>
                  </div>
                  
                  {diagnostic.details && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Voir les détails
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                          {JSON.stringify(diagnostic.details, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(diagnostic.timestamp).toLocaleTimeString('fr-FR')}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Chrome Extension Help */}
        <Card className="mt-8 p-6 border-l-4 border-yellow-400 bg-yellow-50">
          <h3 className="font-semibold text-yellow-800 mb-2">
            🔧 Problèmes avec les Extensions Chrome ?
          </h3>
          <p className="text-yellow-700 text-sm mb-4">
            Si vous rencontrez des erreurs de timeout ou des requêtes bloquées, voici les solutions :
          </p>
          <div className="space-y-2 text-sm text-yellow-700">
            <div>• <strong>Solution immédiate</strong> : Utilisez la page "Prédictions Serveur" ci-dessus</div>
            <div>• <strong>Extension ID</strong> : iohjgamcilhbgmhbnllfolmkmmekfmci bloque les requêtes</div>
            <div>• <strong>Désactiver</strong> : chrome://extensions/ → Désactiver l'extension</div>
            <div>• <strong>Navigation privée</strong> : Ctrl+Shift+N (extensions généralement désactivées)</div>
            <div>• <strong>Autre navigateur</strong> : Firefox, Safari, Edge</div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Diagnostic généré le {new Date().toLocaleString('fr-FR')} • 
            Tous les tests sont effectués côté serveur
          </p>
        </div>
      </div>
    </div>
  );
} 