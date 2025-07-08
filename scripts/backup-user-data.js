const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

class UserDataBackup {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  formatDate(date) {
    return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  async backupUserData(userId) {
    try {
      console.log(`🔄 Démarrage de la sauvegarde pour l'utilisateur ${userId}...`);
      
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error(`Utilisateur ${userId} introuvable`);
      }

      console.log(`📋 Sauvegarde des données pour: ${user.name || user.email}`);

      // Collecte de toutes les données utilisateur
      const userData = {
        metadata: {
          exportDate: new Date().toISOString(),
          userId: userId,
          userName: user.name,
          userEmail: user.email,
          version: '1.0.0'
        },
        
        // Données utilisateur de base
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },

        // Entités
        entities: await prisma.entity.findMany({
          where: { userId },
          include: {
            ownedAssets: {
              include: {
                ownedAsset: {
                  include: {
                    assetType: true,
                    valuations: {
                      orderBy: { valuationDate: 'desc' }
                    },
                    debts: {
                      include: {
                        payments: true
                      }
                    }
                  }
                }
              }
            }
          }
        }),

        // Types d'actifs (référence)
        assetTypes: await prisma.assetType.findMany(),

        // Actifs avec leurs valorisations et dettes
        assets: await prisma.asset.findMany({
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
            ownerships: {
              include: {
                ownerEntity: true
              }
            },
            valuations: {
              orderBy: { valuationDate: 'desc' }
            },
            debts: {
              include: {
                payments: true
              }
            }
          }
        }),

        // Alertes
        alerts: await prisma.alert.findMany({
          where: { userId },
          include: {
            alertActions: true
          }
        }),

        // Préférences d'alertes
        alertPreferences: await prisma.alertPreferences.findMany({
          where: { userId }
        }),

        // Profil fiscal
        taxProfile: await prisma.taxProfile.findUnique({
          where: { userId }
        }),

        // Optimisations fiscales
        taxOptimizations: await prisma.taxOptimization.findMany({
          where: { userId }
        }),

        // Simulations fiscales
        taxSimulations: await prisma.taxSimulation.findMany({
          where: { userId }
        }),

        // Calculs fiscaux
        taxCalculations: await prisma.taxCalculation.findMany({
          where: { userId }
        }),

        // Comportement utilisateur et dashboard
        userBehavior: await prisma.userBehavior.findUnique({
          where: { userId }
        }),

        // Layouts de dashboard
        dashboardLayouts: await prisma.dashboardLayout.findMany({
          where: { userId }
        }),

        // Suggestions de dashboard
        dashboardSuggestions: await prisma.dashboardSuggestion.findMany({
          where: { userId }
        }),

        // Interactions avec les widgets
        widgetInteractions: await prisma.widgetInteraction.findMany({
          where: { userId }
        }),

        // Connexions Bridge API
        bridgeConnections: await prisma.bridgeConnection.findMany({
          where: { userId }
        }),

        // Comptes Bridge
        bridgeAccounts: await prisma.bridgeAccount.findMany({
          where: { userId }
        })
      };

      // Générer le nom du fichier de sauvegarde
      const timestamp = this.formatDate(new Date());
      const filename = `backup_${userId}_${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);

      // Sauvegarder les données
      fs.writeFileSync(filepath, JSON.stringify(userData, null, 2));

      // Statistiques de sauvegarde
      const stats = {
        file: filepath,
        size: fs.statSync(filepath).size,
        entities: userData.entities.length,
        assets: userData.assets.length,
        valuations: userData.assets.reduce((acc, asset) => acc + asset.valuations.length, 0),
        debts: userData.assets.reduce((acc, asset) => acc + asset.debts.length, 0),
        alerts: userData.alerts.length,
        taxOptimizations: userData.taxOptimizations.length,
        dashboardLayouts: userData.dashboardLayouts.length
      };

      console.log('\n✅ Sauvegarde terminée avec succès!');
      console.log(`📁 Fichier: ${filename}`);
      console.log(`📊 Taille: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`🏢 Entités: ${stats.entities}`);
      console.log(`💰 Actifs: ${stats.assets}`);
      console.log(`📈 Valorisations: ${stats.valuations}`);
      console.log(`💳 Dettes: ${stats.debts}`);
      console.log(`🔔 Alertes: ${stats.alerts}`);
      console.log(`📊 Optimisations fiscales: ${stats.taxOptimizations}`);
      console.log(`🎛️ Layouts dashboard: ${stats.dashboardLayouts}`);

      return stats;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .map(file => {
          const filepath = path.join(this.backupDir, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            path: filepath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      return backups;
    } catch (error) {
      console.error('❌ Erreur lors de la liste des sauvegardes:', error);
      return [];
    }
  }

  async deleteBackup(filename) {
    try {
      const filepath = path.join(this.backupDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`✅ Sauvegarde supprimée: ${filename}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      return false;
    }
  }

  async cleanupOldBackups(keepCount = 10) {
    try {
      const backups = await this.listBackups();
      const toDelete = backups.slice(keepCount);
      
      for (const backup of toDelete) {
        await this.deleteBackup(backup.filename);
      }
      
      console.log(`🧹 Nettoyage terminé: ${toDelete.length} anciennes sauvegardes supprimées`);
      return toDelete.length;
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      return 0;
    }
  }
}

// Fonction principale pour CLI
async function main() {
  const backup = new UserDataBackup();
  
  const userId = process.argv[2];
  const action = process.argv[3] || 'backup';

  if (!userId && action === 'backup') {
    console.error('❌ Usage: node backup-user-data.js <userId> [action]');
    console.error('   Actions: backup, list, cleanup');
    process.exit(1);
  }

  try {
    switch (action) {
      case 'backup':
        await backup.backupUserData(userId);
        break;
      
      case 'list':
        const backups = await backup.listBackups();
        console.log(`📋 ${backups.length} sauvegardes trouvées:`);
        backups.forEach(b => {
          console.log(`  ${b.filename} - ${(b.size / 1024 / 1024).toFixed(2)} MB - ${b.createdAt.toLocaleDateString()}`);
        });
        break;
      
      case 'cleanup':
        const deleted = await backup.cleanupOldBackups(5);
        console.log(`🧹 ${deleted} sauvegardes supprimées`);
        break;
      
      default:
        console.error('❌ Action non reconnue:', action);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exporter pour utilisation dans d'autres modules
module.exports = { UserDataBackup };

// Exécuter si appelé directement
if (require.main === module) {
  main();
} 