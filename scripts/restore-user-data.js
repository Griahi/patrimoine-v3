const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

class UserDataRestore {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
  }

  async restoreUserData(backupFile, options = {}) {
    try {
      const {
        dryRun = false,
        skipExisting = true,
        skipTables = [],
        newUserId = null
      } = options;

      console.log(`🔄 Démarrage de la restauration depuis: ${backupFile}`);
      console.log(`📋 Mode: ${dryRun ? 'Simulation' : 'Restauration réelle'}`);

      // Vérifier que le fichier existe
      const backupPath = path.isAbsolute(backupFile) 
        ? backupFile 
        : path.join(this.backupDir, backupFile);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Fichier de sauvegarde introuvable: ${backupPath}`);
      }

      // Charger les données de sauvegarde
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      console.log(`📊 Données chargées depuis: ${backupData.metadata.exportDate}`);
      console.log(`👤 Utilisateur: ${backupData.metadata.userName} (${backupData.metadata.userEmail})`);

      // Déterminer l'ID utilisateur cible
      const targetUserId = newUserId || backupData.metadata.userId;
      
      if (newUserId) {
        console.log(`🔄 Restauration pour un nouvel utilisateur: ${newUserId}`);
      } else {
        console.log(`♻️ Restauration pour le même utilisateur: ${targetUserId}`);
      }

      // Vérifier si l'utilisateur cible existe
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });

      if (!targetUser) {
        throw new Error(`Utilisateur cible introuvable: ${targetUserId}`);
      }

      // Statistiques de restauration
      const stats = {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: 0,
        details: {}
      };

      // Fonction pour traiter une table
      const processTable = async (tableName, data, processor) => {
        if (skipTables.includes(tableName)) {
          console.log(`⏭️ Table ${tableName} ignorée`);
          return;
        }

        if (!data || (Array.isArray(data) && data.length === 0)) {
          console.log(`📋 Table ${tableName}: aucune donnée`);
          return;
        }

        console.log(`🔄 Traitement de la table ${tableName}...`);
        
        const tableStats = { processed: 0, created: 0, skipped: 0, errors: 0 };
        
        if (Array.isArray(data)) {
          for (const item of data) {
            try {
              const result = await processor(item, targetUserId, dryRun);
              tableStats.processed++;
              if (result === 'created') tableStats.created++;
              else if (result === 'skipped') tableStats.skipped++;
            } catch (error) {
              tableStats.errors++;
              console.error(`❌ Erreur sur ${tableName}:`, error.message);
            }
          }
        } else {
          // Données uniques (comme taxProfile)
          try {
            const result = await processor(data, targetUserId, dryRun);
            tableStats.processed++;
            if (result === 'created') tableStats.created++;
            else if (result === 'skipped') tableStats.skipped++;
          } catch (error) {
            tableStats.errors++;
            console.error(`❌ Erreur sur ${tableName}:`, error.message);
          }
        }

        console.log(`✅ Table ${tableName}: ${tableStats.created} créé(s), ${tableStats.skipped} ignoré(s), ${tableStats.errors} erreur(s)`);
        
        stats.processed += tableStats.processed;
        stats.created += tableStats.created;
        stats.skipped += tableStats.skipped;
        stats.errors += tableStats.errors;
        stats.details[tableName] = tableStats;
      };

      // Restaurer les entités
      await processTable('entities', backupData.entities, async (entity, userId, dryRun) => {
        if (skipExisting) {
          const existing = await prisma.entity.findFirst({
            where: { userId, name: entity.name }
          });
          if (existing) return 'skipped';
        }

        if (!dryRun) {
          await prisma.entity.create({
            data: {
              userId,
              type: entity.type,
              name: entity.name,
              taxId: entity.taxId,
              address: entity.address,
              metadata: entity.metadata,
              notes: entity.notes
            }
          });
        }
        return 'created';
      });

      // Restaurer les types d'actifs (référence)
      await processTable('assetTypes', backupData.assetTypes, async (assetType, userId, dryRun) => {
        if (skipExisting) {
          const existing = await prisma.assetType.findUnique({
            where: { name: assetType.name }
          });
          if (existing) return 'skipped';
        }

        if (!dryRun) {
          await prisma.assetType.create({
            data: {
              name: assetType.name,
              code: assetType.code,
              category: assetType.category,
              description: assetType.description,
              icon: assetType.icon,
              color: assetType.color,
              fields: assetType.fields
            }
          });
        }
        return 'created';
      });

      // Restaurer les actifs avec leurs relations
      await processTable('assets', backupData.assets, async (asset, userId, dryRun) => {
        if (skipExisting) {
          const existing = await prisma.asset.findFirst({
            where: { name: asset.name }
          });
          if (existing) return 'skipped';
        }

        if (!dryRun) {
          // Créer l'actif
          const createdAsset = await prisma.asset.create({
            data: {
              name: asset.name,
              description: asset.description,
              metadata: asset.metadata,
              externalId: asset.externalId,
              assetType: {
                connect: { name: asset.assetType.name }
              }
            }
          });

          // Restaurer les propriétés
          for (const ownership of asset.ownerships) {
            const ownerEntity = await prisma.entity.findFirst({
              where: { 
                userId,
                name: ownership.ownerEntity.name 
              }
            });

            if (ownerEntity) {
              await prisma.ownership.create({
                data: {
                  ownerEntityId: ownerEntity.id,
                  ownedAssetId: createdAsset.id,
                  percentage: ownership.percentage,
                  startDate: ownership.startDate,
                  endDate: ownership.endDate
                }
              });
            }
          }

          // Restaurer les valorisations
          for (const valuation of asset.valuations) {
            await prisma.valuation.create({
              data: {
                assetId: createdAsset.id,
                value: valuation.value,
                currency: valuation.currency,
                valuationDate: valuation.valuationDate,
                source: valuation.source,
                notes: valuation.notes,
                metadata: valuation.metadata
              }
            });
          }

          // Restaurer les dettes
          for (const debt of asset.debts) {
            const createdDebt = await prisma.debt.create({
              data: {
                assetId: createdAsset.id,
                name: debt.name,
                debtType: debt.debtType,
                initialAmount: debt.initialAmount,
                currentAmount: debt.currentAmount,
                interestRate: debt.interestRate,
                duration: debt.duration,
                amortizationType: debt.amortizationType,
                startDate: debt.startDate,
                endDate: debt.endDate,
                monthlyPayment: debt.monthlyPayment,
                currency: debt.currency,
                lender: debt.lender,
                notes: debt.notes
              }
            });

            // Restaurer les paiements de dette
            for (const payment of debt.payments) {
              await prisma.debtPayment.create({
                data: {
                  debtId: createdDebt.id,
                  paymentNumber: payment.paymentNumber,
                  paymentDate: payment.paymentDate,
                  totalAmount: payment.totalAmount,
                  principalAmount: payment.principalAmount,
                  interestAmount: payment.interestAmount,
                  remainingBalance: payment.remainingBalance,
                  isPaid: payment.isPaid,
                  actualPaymentDate: payment.actualPaymentDate
                }
              });
            }
          }
        }
        return 'created';
      });

      // Restaurer les alertes
      await processTable('alerts', backupData.alerts, async (alert, userId, dryRun) => {
        if (!dryRun) {
          const createdAlert = await prisma.alert.create({
            data: {
              userId,
              type: alert.type,
              severity: alert.severity,
              title: alert.title,
              message: alert.message,
              data: alert.data,
              status: alert.status,
              actions: alert.actions,
              readAt: alert.readAt,
              snoozedUntil: alert.snoozedUntil,
              dismissedAt: alert.dismissedAt
            }
          });

          // Restaurer les actions d'alerte
          for (const action of alert.alertActions) {
            await prisma.alertAction.create({
              data: {
                alertId: createdAlert.id,
                action: action.action,
                timestamp: action.timestamp,
                metadata: action.metadata
              }
            });
          }
        }
        return 'created';
      });

      // Restaurer les préférences d'alertes
      await processTable('alertPreferences', backupData.alertPreferences, async (pref, userId, dryRun) => {
        if (skipExisting) {
          const existing = await prisma.alertPreferences.findUnique({
            where: { userId_alertType: { userId, alertType: pref.alertType } }
          });
          if (existing) return 'skipped';
        }

        if (!dryRun) {
          await prisma.alertPreferences.create({
            data: {
              userId,
              alertType: pref.alertType,
              enabled: pref.enabled,
              threshold: pref.threshold,
              frequency: pref.frequency,
              emailEnabled: pref.emailEnabled,
              pushEnabled: pref.pushEnabled
            }
          });
        }
        return 'created';
      });

      // Restaurer le profil fiscal
      if (backupData.taxProfile) {
        await processTable('taxProfile', backupData.taxProfile, async (profile, userId, dryRun) => {
          if (skipExisting) {
            const existing = await prisma.taxProfile.findUnique({
              where: { userId }
            });
            if (existing) return 'skipped';
          }

          if (!dryRun) {
            await prisma.taxProfile.create({
              data: {
                userId,
                tmi: profile.tmi,
                foyer: profile.foyer,
                nbParts: profile.nbParts,
                income: profile.income,
                riskTolerance: profile.riskTolerance,
                optimizationGoals: profile.optimizationGoals
              }
            });
          }
          return 'created';
        });
      }

      // Restaurer les autres tables...
      const otherTables = [
        'taxOptimizations',
        'taxSimulations', 
        'taxCalculations',
        'dashboardLayouts',
        'dashboardSuggestions',
        'widgetInteractions',
        'bridgeConnections',
        'bridgeAccounts'
      ];

      for (const tableName of otherTables) {
        if (backupData[tableName]) {
          await processTable(tableName, backupData[tableName], async (item, userId, dryRun) => {
            if (!dryRun) {
              const data = { ...item, userId };
              delete data.id;
              delete data.createdAt;
              delete data.updatedAt;
              
              await prisma[tableName.slice(0, -1) === 'e' ? tableName.slice(0, -1) : tableName.slice(0, -1)].create({
                data
              });
            }
            return 'created';
          });
        }
      }

      console.log('\n📊 Résumé de la restauration:');
      console.log(`✅ Total traité: ${stats.processed}`);
      console.log(`✅ Total créé: ${stats.created}`);
      console.log(`⏭️ Total ignoré: ${stats.skipped}`);
      console.log(`❌ Total erreurs: ${stats.errors}`);

      if (dryRun) {
        console.log('\n🔍 Mode simulation - Aucune donnée n\'a été modifiée');
      } else {
        console.log('\n✅ Restauration terminée avec succès!');
      }

      return stats;
    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .map(file => {
          const filepath = path.join(this.backupDir, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            path: filepath,
            size: stats.size,
            createdAt: stats.birthtime
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('❌ Erreur lors de la liste des sauvegardes:', error);
      return [];
    }
  }
}

// Fonction principale pour CLI
async function main() {
  const restore = new UserDataRestore();
  
  const backupFile = process.argv[2];
  const action = process.argv[3] || 'restore';
  const dryRun = process.argv.includes('--dry-run');
  const skipExisting = !process.argv.includes('--overwrite');
  const newUserId = process.argv.find(arg => arg.startsWith('--user-id='))?.split('=')[1];

  if (!backupFile && action === 'restore') {
    console.error('❌ Usage: node restore-user-data.js <backup-file> [options]');
    console.error('   Options:');
    console.error('     --dry-run           Simulation sans modification');
    console.error('     --overwrite         Écraser les données existantes');
    console.error('     --user-id=<id>      Restaurer pour un autre utilisateur');
    console.error('   Actions:');
    console.error('     restore (défaut)    Restaurer les données');
    console.error('     list                Lister les sauvegardes');
    process.exit(1);
  }

  try {
    switch (action) {
      case 'restore':
        const options = {
          dryRun,
          skipExisting,
          newUserId
        };
        await restore.restoreUserData(backupFile, options);
        break;
      
      case 'list':
        const backups = await restore.listBackups();
        console.log(`📋 ${backups.length} sauvegardes trouvées:`);
        backups.forEach(b => {
          console.log(`  ${b.filename} - ${(b.size / 1024 / 1024).toFixed(2)} MB - ${b.createdAt.toLocaleDateString()}`);
        });
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
module.exports = { UserDataRestore };

// Exécuter si appelé directement
if (require.main === module) {
  main();
} 