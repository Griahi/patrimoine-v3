'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';

interface BackupFile {
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

interface BackupStats {
  file: string;
  size: number;
  entities: number;
  assets: number;
  valuations: number;
  debts: number;
  alerts: number;
  taxOptimizations: number;
  dashboardLayouts: number;
}

export default function BackupManager() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBackupStats, setLastBackupStats] = useState<BackupStats | null>(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/backup?action=list');
      const data = await response.json();

      if (data.success) {
        setBackups(data.backups.map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
          modifiedAt: new Date(b.modifiedAt)
        })));
      } else {
        setError(data.error || 'Erreur lors du chargement des sauvegardes');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create' })
      });

      const data = await response.json();

      if (data.success) {
        setLastBackupStats(data.stats);
        setShowStatsDialog(true);
        await loadBackups();
      } else {
        setError(data.error || 'Erreur lors de la création de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsCreating(false);
    }
  };

  const downloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/backup?action=download&filename=${encodeURIComponent(filename)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors du téléchargement');
      }
    } catch (err) {
      setError('Erreur de téléchargement');
    }
  };

  const deleteBackup = async (filename: string) => {
    try {
      const response = await fetch('/api/backup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename })
      });

      const data = await response.json();

      if (data.success) {
        await loadBackups();
        setShowDeleteDialog(false);
        setFileToDelete(null);
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const cleanupOldBackups = async () => {
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cleanup' })
      });

      const data = await response.json();

      if (data.success) {
        await loadBackups();
      } else {
        setError(data.error || 'Erreur lors du nettoyage');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Sauvegardes</h2>
          <p className="text-gray-600">Créez et gérez vos sauvegardes de données patrimoniales</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={createBackup}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                📦 Créer une Sauvegarde
              </>
            )}
          </Button>
          <Button 
            onClick={loadBackups}
            disabled={isLoading}
            variant="outline"
          >
            🔄 Actualiser
          </Button>
          <Button 
            onClick={cleanupOldBackups}
            variant="outline"
            className="text-orange-600 hover:text-orange-700"
          >
            🧹 Nettoyer
          </Button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Informations sur la sauvegarde */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{backups.length}</div>
            <div className="text-sm text-gray-600">Sauvegardes disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatFileSize(backups.reduce((acc, b) => acc + b.size, 0))}
            </div>
            <div className="text-sm text-gray-600">Taille totale</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {backups.length > 0 ? formatDate(backups[0].createdAt) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Dernière sauvegarde</div>
          </div>
        </div>
      </Card>

      {/* Liste des sauvegardes */}
      <Card>
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Mes Sauvegardes</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              📦 Aucune sauvegarde disponible
              <br />
              Créez votre première sauvegarde pour sécuriser vos données
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.filename} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{backup.filename}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(backup.size)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>📅 Créé le {formatDate(backup.createdAt)}</div>
                        <div>🔄 Modifié le {formatDate(backup.modifiedAt)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => downloadBackup(backup.filename)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        📥 Télécharger
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFileToDelete(backup.filename);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        🗑️ Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Dialog des statistiques */}
      <Dialog open={showStatsDialog} onClose={() => setShowStatsDialog(false)}>
        <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-4">✅ Sauvegarde Terminée</h3>
          {lastBackupStats && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <strong>Taille:</strong> {formatFileSize(lastBackupStats.size)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>🏢 Entités: {lastBackupStats.entities}</div>
                <div>💰 Actifs: {lastBackupStats.assets}</div>
                <div>📈 Valorisations: {lastBackupStats.valuations}</div>
                <div>💳 Dettes: {lastBackupStats.debts}</div>
                <div>🔔 Alertes: {lastBackupStats.alerts}</div>
                <div>📊 Optimisations: {lastBackupStats.taxOptimizations}</div>
                <div>🎛️ Layouts: {lastBackupStats.dashboardLayouts}</div>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded text-sm text-green-700">
                💡 Votre sauvegarde est maintenant disponible dans la liste ci-dessus
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setShowStatsDialog(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Confirmer la Suppression</h3>
          <p className="text-gray-600 mb-4">
            Êtes-vous sûr de vouloir supprimer cette sauvegarde ?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            <strong>Fichier:</strong> {fileToDelete}
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => fileToDelete && deleteBackup(fileToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
} 