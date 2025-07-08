import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { UserDataBackup } from '@/../scripts/backup-user-data';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { action } = await request.json();
    const backup = new UserDataBackup();
    const userId = session.user.id;

    switch (action) {
      case 'create':
        const stats = await backup.backupUserData(userId);
        return NextResponse.json({
          success: true,
          message: 'Sauvegarde créée avec succès',
          stats
        });

      case 'list':
        const backups = await backup.listBackups();
        // Filtrer les sauvegardes de l'utilisateur actuel
        const userBackups = backups.filter(b => b.filename.includes(userId));
        return NextResponse.json({
          success: true,
          backups: userBackups
        });

      case 'cleanup':
        const deleted = await backup.cleanupOldBackups(5);
        return NextResponse.json({
          success: true,
          message: `${deleted} anciennes sauvegardes supprimées`
        });

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur API backup:', error);
    return NextResponse.json({
      error: 'Erreur lors de la sauvegarde',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const action = searchParams.get('action');

    if (action === 'list') {
      const backup = new UserDataBackup();
      const backups = await backup.listBackups();
      // Filtrer les sauvegardes de l'utilisateur actuel
      const userBackups = backups.filter(b => b.filename.includes(session.user.id));
      return NextResponse.json({
        success: true,
        backups: userBackups
      });
    }

    if (action === 'download' && filename) {
      // Vérifier que le fichier appartient à l'utilisateur
      if (!filename.includes(session.user.id)) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }

      const backupDir = path.join(process.cwd(), 'backups');
      const filepath = path.join(backupDir, filename);

      if (!fs.existsSync(filepath)) {
        return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filepath);
      const response = new NextResponse(fileBuffer);
      
      response.headers.set('Content-Type', 'application/json');
      response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      
      return response;
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Erreur API backup GET:', error);
    return NextResponse.json({
      error: 'Erreur lors de la récupération',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { filename } = await request.json();

    // Vérifier que le fichier appartient à l'utilisateur
    if (!filename.includes(session.user.id)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const backup = new UserDataBackup();
    const deleted = await backup.deleteBackup(filename);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Sauvegarde supprimée avec succès'
      });
    } else {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }
  } catch (error) {
    console.error('Erreur API backup DELETE:', error);
    return NextResponse.json({
      error: 'Erreur lors de la suppression',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
} 