import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AlertsEngine } from '@/services/alerts/alerts-engine';

// FALLBACK ALERTS - SANS BASE DE DONNÉES
const FALLBACK_ALERTS = [
  {
    id: 'alert-demo-1',
    userId: 'user-demo-1',
    type: 'concentration_risk',
    severity: 'high',
    title: 'Risque de concentration',
    message: 'Votre portefeuille présente une concentration élevée (65%) sur l\'immobilier. Diversifiez vos investissements.',
    data: { concentration: 0.65, assetType: 'real_estate' },
    status: 'new',
    actions: [
      { id: 'diversify', label: 'Voir suggestions', action: 'SHOW_DIVERSIFICATION' }
    ],
    createdAt: new Date('2025-01-05T10:00:00Z'),
    readAt: null,
    snoozedUntil: null,
    dismissedAt: null,
    updatedAt: new Date('2025-01-05T10:00:00Z')
  },
  {
    id: 'alert-demo-2',
    userId: 'user-demo-1',
    type: 'performance_anomaly',
    severity: 'medium',
    title: 'Performance en baisse',
    message: 'Votre portefeuille actions a sous-performé de -5.2% ce mois-ci par rapport à l\'indice de référence.',
    data: { underperformance: -0.052, period: 'monthly' },
    status: 'new',
    actions: [
      { id: 'analyze', label: 'Analyser', action: 'ANALYZE_PORTFOLIO' }
    ],
    createdAt: new Date('2025-01-04T14:30:00Z'),
    readAt: null,
    snoozedUntil: null,
    dismissedAt: null,
    updatedAt: new Date('2025-01-04T14:30:00Z')
  },
  {
    id: 'alert-demo-3',
    userId: 'user-demo-1',
    type: 'excessive_fees',
    severity: 'low',
    title: 'Frais bancaires élevés',
    message: 'Vos frais bancaires mensuels (45€) sont supérieurs à la moyenne. Comparez les offres.',
    data: { monthlyFees: 45, averageFees: 12 },
    status: 'read',
    actions: [
      { id: 'compare', label: 'Comparer banques', action: 'COMPARE_BANKS' }
    ],
    createdAt: new Date('2025-01-03T09:15:00Z'),
    readAt: new Date('2025-01-03T16:20:00Z'),
    snoozedUntil: null,
    dismissedAt: null,
    updatedAt: new Date('2025-01-03T16:20:00Z')
  }
];

export async function GET(request: NextRequest) {
  try {
    // Check for fallback session first
    const fallbackSession = request.cookies.get('auth-session')?.value
    let userId: string | null = null;
    
    if (fallbackSession) {
      try {
        const sessionData = JSON.parse(fallbackSession)
        // Check if session hasn't expired
        const expiresAt = new Date(sessionData.expires)
        if (expiresAt > new Date()) {
          userId = sessionData.userId;
        }
      } catch (parseError) {
        console.warn('Failed to parse fallback session:', parseError)
      }
    }

    // If no fallback session, try regular session
    if (!userId) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
      userId = session.user.id;
    }

    try {
      // Try to get alerts from database
      const alerts = await prisma.alert.findMany({
        where: { 
          userId,
          status: { not: 'dismissed' }
        },
        orderBy: [
          { severity: 'asc' }, // critical first
          { createdAt: 'desc' }
        ]
      });

      // Calculer les métriques
      const metrics = {
        total: alerts.length,
        unreadCount: alerts.filter(alert => alert.status === 'new').length,
        criticalCount: alerts.filter(alert => alert.severity === 'critical').length,
        byType: alerts.reduce((acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: alerts.reduce((acc, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return NextResponse.json({
        alerts,
        metrics
      });

    } catch (_dbError) {
      console.warn('Database unavailable for alerts, using fallback data');
      
      // Use fallback alerts for demo users
      const userAlerts = FALLBACK_ALERTS.filter(alert => alert.userId === userId);
      
      const metrics = {
        total: userAlerts.length,
        unreadCount: userAlerts.filter(alert => alert.status === 'new').length,
        criticalCount: userAlerts.filter(alert => alert.severity === 'critical').length,
        byType: userAlerts.reduce((acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: userAlerts.reduce((acc, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return NextResponse.json({
        alerts: userAlerts,
        metrics,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Alerts API Error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des alertes',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for fallback session first
    const fallbackSession = request.cookies.get('auth-session')?.value
    let userId: string | null = null;
    
    if (fallbackSession) {
      try {
        const sessionData = JSON.parse(fallbackSession)
        // Check if session hasn't expired
        const expiresAt = new Date(sessionData.expires)
        if (expiresAt > new Date()) {
          userId = sessionData.userId;
        }
      } catch (parseError) {
        console.warn('Failed to parse fallback session:', parseError)
      }
    }

    // If no fallback session, try regular session
    if (!userId) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
      userId = session.user.id;
    }

    try {
      // Try to generate alerts using database
      const patrimonyData = await getPatrimonyData(userId);
      
      // Générer les nouvelles alertes
      const alertsEngine = new AlertsEngine();
      const newAlerts = await alertsEngine.processUserAlerts(userId, patrimonyData);

      return NextResponse.json({
        generated: newAlerts.length,
        alerts: newAlerts
      });

    } catch (_dbError) {
      console.warn('Database unavailable for alert generation, using demo response');
      
      // Return demo response for fallback users
      return NextResponse.json({
        generated: 0,
        alerts: [],
        message: 'Alertes déjà générées (mode démo)',
        fallback: true
      });
    }

  } catch (error) {
    console.error('Generate Alerts API Error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération des alertes',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  }
}

async function getPatrimonyData(userId: string) {
  // Récupérer les actifs avec leurs valorisations
  const assets = await prisma.asset.findMany({
    where: {
      ownerships: {
        some: {
          ownerEntity: {
            userId
          }
        }
      }
    },
    include: {
      assetType: true,
      valuations: {
        orderBy: { valuationDate: 'desc' },
        take: 2 // Dernière et avant-dernière valorisation
      },
      ownerships: {
        include: {
          ownerEntity: true
        }
      }
    }
  });

  // Calculer la valeur totale et les performances
  let totalValue = 0;
  let monthlyFees = 0;
  const assetData = [];
  
  for (const asset of assets) {
    const latestValuation = asset.valuations[0];
    const previousValuation = asset.valuations[1];
    
    if (!latestValuation) continue;

    const assetValue = latestValuation.value;
    totalValue += Number(assetValue);

    // Calculer la performance mensuelle si possible
    let monthlyPerformance = undefined;
    if (previousValuation) {
      monthlyPerformance = (Number(assetValue) - Number(previousValuation.value)) / Number(previousValuation.value);
    }

    // Simuler des frais mensuels pour certains types d'actifs
    if (asset.assetType.code === 'bank_account') {
      monthlyFees += 15; // 15€ de frais par compte
    }

    assetData.push({
      id: asset.id,
      name: asset.name,
      type: asset.assetType.code,
      value: Number(assetValue),
      percentage: 0, // Sera calculé après
      monthlyPerformance,
      ticker: asset.metadata && typeof asset.metadata === 'object' && 'ticker' in asset.metadata ? 
        asset.metadata.ticker as string : null
    });
  }

  // Calculer les pourcentages
  assetData.forEach(asset => {
    asset.percentage = asset.value / totalValue;
  });

  // Calculer la diversification
  const diversification = calculateDiversification(assetData);

  return {
    totalValue,
    assets: assetData,
    monthlyFees,
    diversification
  };
}

function calculateDiversification(assets: any[]) {
  const byAssetType: Record<string, number> = {};
  let maxConcentration = 0;

  // Grouper par type d'actif
  assets.forEach(asset => {
    byAssetType[asset.type] = (byAssetType[asset.type] || 0) + asset.percentage;
    maxConcentration = Math.max(maxConcentration, asset.percentage);
  });

  return {
    byAssetType,
    concentration: maxConcentration
  };
} 