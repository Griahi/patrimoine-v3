import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BackupManager from '@/components/BackupManager';

export default async function BackupPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête de la page */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h8a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sauvegardes</h1>
              <p className="text-gray-600">Gérez vos sauvegardes de données patrimoniales</p>
            </div>
          </div>
        </div>

        {/* Informations importantes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">À propos des sauvegardes</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Vos sauvegardes incluent toutes vos données patrimoniales : entités, actifs, valorisations, dettes, alertes, optimisations fiscales, etc.</p>
                <p>• Les fichiers sont au format JSON et peuvent être téléchargés et stockés en sécurité.</p>
                <p>• Vous pouvez restaurer vos données à tout moment en utilisant le script de restauration.</p>
                <p>• Les sauvegardes sont automatiquement nettoyées (les 10 plus récentes sont conservées).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Composant de gestion des sauvegardes */}
        <BackupManager />

        {/* Guide d'utilisation */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Comment utiliser les sauvegardes</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📦 Créer une sauvegarde</h4>
              <p className="text-sm text-gray-600 mb-3">
                Cliquez sur "Créer une Sauvegarde" pour générer un fichier JSON complet de vos données.
              </p>
              <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700">
                # Ou via CLI:<br/>
                node scripts/backup-user-data.js &lt;user-id&gt;
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📥 Télécharger une sauvegarde</h4>
              <p className="text-sm text-gray-600 mb-3">
                Téléchargez vos sauvegardes pour les stocker en sécurité hors ligne.
              </p>
              <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700">
                # Fichier téléchargé:<br/>
                backup_&lt;user-id&gt;_&lt;timestamp&gt;.json
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">♻️ Restaurer des données</h4>
              <p className="text-sm text-gray-600 mb-3">
                Utilisez le script de restauration pour récupérer vos données depuis une sauvegarde.
              </p>
              <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700">
                # Simuler la restauration:<br/>
                node scripts/restore-user-data.js backup.json --dry-run
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🧹 Nettoyage automatique</h4>
              <p className="text-sm text-gray-600 mb-3">
                Les anciennes sauvegardes sont automatiquement supprimées pour économiser l'espace.
              </p>
              <div className="bg-white p-3 rounded border text-xs font-mono text-gray-700">
                # Nettoyer manuellement:<br/>
                node scripts/backup-user-data.js _ cleanup
              </div>
            </div>
          </div>
        </div>

        {/* Commandes utiles */}
        <div className="mt-8 bg-gray-900 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🛠️ Commandes utiles</h3>
          <div className="space-y-3 text-sm font-mono">
            <div>
              <span className="text-green-400"># Créer une sauvegarde</span>
              <br/>
              <span className="text-gray-300">node scripts/backup-user-data.js &lt;user-id&gt;</span>
            </div>
            <div>
              <span className="text-green-400"># Lister les sauvegardes</span>
              <br/>
              <span className="text-gray-300">node scripts/backup-user-data.js _ list</span>
            </div>
            <div>
              <span className="text-green-400"># Simuler une restauration</span>
              <br/>
              <span className="text-gray-300">node scripts/restore-user-data.js backup.json --dry-run</span>
            </div>
            <div>
              <span className="text-green-400"># Restaurer pour un autre utilisateur</span>
              <br/>
              <span className="text-gray-300">node scripts/restore-user-data.js backup.json --user-id=new-user-id</span>
            </div>
            <div>
              <span className="text-green-400"># Écraser les données existantes</span>
              <br/>
              <span className="text-gray-300">node scripts/restore-user-data.js backup.json --overwrite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Sauvegardes - Patrimoine Manager',
  description: 'Gérez vos sauvegardes de données patrimoniales'
}; 