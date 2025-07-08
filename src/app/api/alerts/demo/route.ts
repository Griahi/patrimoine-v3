import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateId } from '@/utils/id';

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Supprimer les anciennes alertes de demo
    await prisma.alert.deleteMany({
      where: {
        userId,
        data: {
          path: ['isDemo'],
          equals: true
        }
      }
    });

    // Créer des alertes de démonstration
    const demoAlerts = [
      {
        id: generateId(),
        userId,
        type: 'concentration_risk',
        severity: 'high',
        title: '⚠️ Concentration excessive détectée',
        message: 'Immeuble Pasteur représente 65% de votre patrimoine. Il est recommandé de ne pas dépasser 40% sur un seul actif.',
        data: {
          isDemo: true,
          topAsset: 'Immeuble Pasteur',
          concentration: 0.65,
          recommendation: 'Diversifier le patrimoine',
          threshold: 0.4,
          current: 0.65
        },
        status: 'new',
        actions: [
          {
            id: 'view_diversification',
            label: 'Voir les suggestions de diversification',
            action: 'SHOW_DIVERSIFICATION',
            params: { assetId: 'demo-asset-1' }
          },
          {
            id: 'simulate_rebalance',
            label: 'Simuler un rééquilibrage',
            action: 'SIMULATE_REBALANCE',
            params: { targetConcentration: 0.3 }
          }
        ],
        createdAt: new Date()
      },
      {
        id: generateId(),
        userId,
        type: 'market_opportunity',
        severity: 'medium',
        title: '💡 Opportunité de marché détectée',
        message: 'Total SA a baissé de 18% ce mois. Historiquement, cela peut être un bon point d\'entrée.',
        data: {
          isDemo: true,
          ticker: 'FP.PA',
          change: -0.18,
          volatility: 0.22,
          recommendation: 'Considérer un achat progressif'
        },
        status: 'new',
        actions: [
          {
            id: 'research_opportunity',
            label: 'Rechercher l\'opportunité',
            action: 'RESEARCH_ASSET',
            params: { ticker: 'FP.PA' }
          },
          {
            id: 'simulate_buy',
            label: 'Simuler un achat',
            action: 'SIMULATE_BUY',
            params: { ticker: 'FP.PA', amount: 1000 }
          }
        ],
        createdAt: new Date()
      },
      {
        id: generateId(),
        userId,
        type: 'excessive_fees',
        severity: 'medium',
        title: '💸 Frais bancaires excessifs',
        message: 'Vous payez 85€/mois de frais bancaires (1,020€/an, soit 0.06% de votre patrimoine).',
        data: {
          isDemo: true,
          monthlyFees: 85,
          annualFees: 1020,
          feesPercentage: 0.06,
          threshold: 50,
          recommendation: 'Comparer les offres bancaires'
        },
        status: 'new',
        actions: [
          {
            id: 'compare_banks',
            label: 'Comparer les banques',
            action: 'COMPARE_BANKS',
            params: { currentFees: 85 }
          },
          {
            id: 'negotiate_fees',
            label: 'Négocier les frais',
            action: 'NEGOTIATE_FEES',
            params: { potentialSavings: 820 }
          }
        ],
        createdAt: new Date()
      },
      {
        id: generateId(),
        userId,
        type: 'tax_deadline',
        severity: 'high',
        title: '📅 Déclaration IFI à préparer',
        message: 'Échéance dans 45 jours. Patrimoine taxable estimé : 1.6M€.',
        data: {
          isDemo: true,
          daysUntilDeadline: 45,
          taxableWealth: 1600000,
          deadline: new Date(2025, 5, 15).toISOString(), // 15 juin
          estimatedTax: 2100
        },
        status: 'new',
        actions: [
          {
            id: 'prepare_ifi',
            label: 'Préparer la déclaration',
            action: 'PREPARE_IFI',
            params: { taxableWealth: 1600000 }
          },
          {
            id: 'ifi_optimizations',
            label: 'Voir les optimisations',
            action: 'IFI_OPTIMIZATIONS',
            params: { wealth: 1600000 }
          }
        ],
        createdAt: new Date()
      },
      {
        id: generateId(),
        userId,
        type: 'optimization_opportunity',
        severity: 'low',
        title: '🎯 Optimisation patrimoniale possible',
        message: 'Votre patrimoine immobilier de 10.3M€ pourrait bénéficier d\'optimisations fiscales.',
        data: {
          isDemo: true,
          realEstateValue: 10300000,
          potentialSavings: 206000,
          strategies: ['Déficit foncier', 'SCI familiale', 'Démembrement']
        },
        status: 'new',
        actions: [
          {
            id: 'analyze_optimizations',
            label: 'Analyser les optimisations',
            action: 'ANALYZE_OPTIMIZATIONS',
            params: { patrimonyValue: 15800000 }
          },
          {
            id: 'schedule_consultation',
            label: 'Programmer une consultation',
            action: 'SCHEDULE_CONSULTATION',
            params: { topic: 'optimisation_fiscale' }
          }
        ],
        createdAt: new Date()
      }
    ];

    // Insérer les alertes dans la base de données
    for (const alert of demoAlerts) {
      await prisma.alert.create({
        data: alert
      });
    }

    return NextResponse.json({
      message: 'Alertes de démonstration créées avec succès',
      alertsCreated: demoAlerts.length,
      alerts: demoAlerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title
      }))
    });

  } catch (error) {
    console.error('Demo Alerts API Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création des alertes de démonstration' },
      { status: 500 }
    );
  }
} 