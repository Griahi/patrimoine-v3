import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AlertsJob, runAlertsJob } from '@/services/alerts/alerts-job';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id as string;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'user' or 'all'

    if (mode === 'all') {
      // Lancer le job pour tous les utilisateurs (admin only)
      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
      }
      
      await runAlertsJob();
      
      return NextResponse.json({
        message: 'Job d\'alertes lancé pour tous les utilisateurs',
        mode: 'all'
      });
    } else {
      // Génération pour l'utilisateur actuel uniquement
      const alertsJob = new AlertsJob();
      const alertsCount = await alertsJob.generateTestAlerts(userId);
      
      return NextResponse.json({
        message: `Génération d'alertes terminée`,
        alertsGenerated: alertsCount,
        userId,
        mode: 'user'
      });
    }

  } catch (error) {
    console.error('Generate Alerts API Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des alertes' },
      { status: 500 }
    );
  }
} 