#!/usr/bin/env node

/**
 * Script de migration SQLite vers PostgreSQL
 * 
 * Ce script migre toutes les données de la base SQLite existante vers PostgreSQL
 * en préservant les relations et les IDs.
 */

const { PrismaClient: SQLiteClient } = require('@prisma/client');
const { PrismaClient: PostgreSQLClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Configuration
const SQLITE_DATABASE_URL = 'file:./prisma/dev.db';
const POSTGRESQL_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://patrimoine_user:patrimoine_password_2024@localhost:5432/patrimoine';

console.log('🔄 Début de la migration SQLite vers PostgreSQL...\n');

async function migrateSQLiteToPostgreSQL() {
  let sqliteClient;
  let postgresqlClient;
  
  try {
    // Vérifier que la base SQLite existe
    const sqlitePath = path.join(process.cwd(), 'prisma/dev.db');
    if (!fs.existsSync(sqlitePath)) {
      console.log('⚠️  Base de données SQLite non trouvée à:', sqlitePath);
      console.log('🎯 Aucune migration nécessaire - base SQLite vide');
      return;
    }

    // Connexion aux bases de données
    console.log('📂 Connexion à SQLite...');
    sqliteClient = new SQLiteClient({
      datasources: {
        db: {
          url: SQLITE_DATABASE_URL
        }
      }
    });

    console.log('🐘 Connexion à PostgreSQL...');
    postgresqlClient = new PostgreSQLClient({
      datasources: {
        db: {
          url: POSTGRESQL_DATABASE_URL
        }
      }
    });

    // Test des connexions
    await sqliteClient.$connect();
    await postgresqlClient.$connect();
    console.log('✅ Connexions établies\n');

    // Ordre de migration (respecter les dépendances)
    const migrationOrder = [
      // Données utilisateur de base
      { name: 'users', table: 'user' },
      { name: 'accounts', table: 'account' },
      { name: 'sessions', table: 'session' },
      { name: 'verification_tokens', table: 'verificationToken' },
      
      // Types et catégories
      { name: 'asset_types', table: 'assetType' },
      { name: 'asset_type_categories', table: 'assetTypeCategory' },
      
      // Entités et actifs
      { name: 'entities', table: 'entity' },
      { name: 'assets', table: 'asset' },
      { name: 'ownerships', table: 'ownership' },
      { name: 'valuations', table: 'valuation' },
      
      // Dettes et financements
      { name: 'debts', table: 'debt' },
      { name: 'debt_payments', table: 'debtPayment' },
      
      // Intégrations API
      { name: 'bridge_connections', table: 'bridgeConnection' },
      { name: 'bridge_accounts', table: 'bridgeAccount' },
      
      // Alertes
      { name: 'alerts', table: 'alert' },
      { name: 'alert_preferences', table: 'alertPreferences' },
      { name: 'alert_actions', table: 'alertAction' },
      
      // Fiscalité
      { name: 'tax_profiles', table: 'taxProfile' },
      { name: 'tax_optimizations', table: 'taxOptimization' },
      { name: 'tax_simulations', table: 'taxSimulation' },
      { name: 'tax_calculations', table: 'taxCalculation' },
      
      // Dashboard
      { name: 'user_behaviors', table: 'userBehavior' },
      { name: 'dashboard_layouts', table: 'dashboardLayout' },
      { name: 'dashboard_suggestions', table: 'dashboardSuggestion' },
      { name: 'widget_interactions', table: 'widgetInteraction' },
      { name: 'dashboard_analytics', table: 'dashboardAnalytics' }
    ];

    let totalRecords = 0;
    const migrationStats = {};

    // Migration table par table
    for (const { name, table } of migrationOrder) {
      try {
        console.log(`📋 Migration de la table: ${name}`);
        
        // Lire les données de SQLite
        const records = await sqliteClient[table].findMany();
        
        if (records.length === 0) {
          console.log(`   ⏭️  Table ${name} vide - ignorée`);
          migrationStats[name] = 0;
          continue;
        }

        // Traitement spécialisé par type de données
        const processedRecords = processRecordsForPostgreSQL(records, name);
        
        // Insérer dans PostgreSQL avec gestion des conflits
        let insertedCount = 0;
        for (const record of processedRecords) {
          try {
            await postgresqlClient[table].create({
              data: record
            });
            insertedCount++;
          } catch (error) {
            if (error.code === 'P2002') {
              // Conflit d'unicité - enregistrement déjà existant
              console.log(`   ⚠️  Enregistrement déjà existant ignoré dans ${name}`);
            } else {
              console.error(`   ❌ Erreur insertion ${name}:`, error.message);
            }
          }
        }

        console.log(`   ✅ ${insertedCount}/${records.length} enregistrements migrés`);
        migrationStats[name] = insertedCount;
        totalRecords += insertedCount;

      } catch (error) {
        console.error(`❌ Erreur migration table ${name}:`, error.message);
        migrationStats[name] = 'ERREUR';
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log('═══════════════════════════════════════');
    for (const [table, count] of Object.entries(migrationStats)) {
      console.log(`   ${table.padEnd(25)} : ${count} enregistrements`);
    }
    console.log('═══════════════════════════════════════');
    console.log(`🎉 Total: ${totalRecords} enregistrements migrés avec succès`);
    
    // Sauvegarde de l'ancienne base
    const backupPath = path.join(process.cwd(), 'prisma/dev.db.backup');
    fs.copyFileSync(sqlitePath, backupPath);
    console.log(`💾 Sauvegarde SQLite créée: ${backupPath}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    // Fermeture des connexions
    if (sqliteClient) await sqliteClient.$disconnect();
    if (postgresqlClient) await postgresqlClient.$disconnect();
  }
}

/**
 * Traite les enregistrements pour adaptation PostgreSQL
 */
function processRecordsForPostgreSQL(records, tableName) {
  return records.map(record => {
    const processed = { ...record };

    // Conversion des types Float vers Decimal (string pour Prisma)
    const decimalFields = {
      'ownerships': ['percentage'],
      'valuations': ['value'],
      'bridge_accounts': ['balance'],
      'debts': ['initialAmount', 'currentAmount', 'interestRate', 'monthlyPayment'],
      'debt_payments': ['totalAmount', 'principalAmount', 'interestAmount', 'remainingBalance'],
      'alert_preferences': ['threshold'],
      'tax_profiles': ['tmi', 'nbParts', 'income'],
      'tax_optimizations': ['estimatedSavings', 'actualSavings'],
      'tax_calculations': ['IR', 'IFI', 'plusValues', 'prelevementsSociaux', 'taxeFonciere', 'total'],
      'user_behaviors': ['averageSessionTime'],
      'dashboard_suggestions': ['confidence'],
      'dashboard_analytics': ['averageSessionTime']
    };

    if (decimalFields[tableName]) {
      for (const field of decimalFields[tableName]) {
        if (processed[field] !== null && processed[field] !== undefined) {
          processed[field] = processed[field].toString();
        }
      }
    }

    // Conversion des dates pour les champs timestamptz
    const timestampFields = [
      'createdAt', 'updatedAt', 'expiresAt', 'lastSyncAt', 
      'valuationDate', 'startDate', 'endDate', 'paymentDate', 
      'actualPaymentDate', 'readAt', 'snoozedUntil', 'dismissedAt',
      'proposedAt', 'startedAt', 'completedAt', 'lastActiveDate', 'timestamp'
    ];

    for (const field of timestampFields) {
      if (processed[field] && typeof processed[field] === 'string') {
        processed[field] = new Date(processed[field]);
      }
    }

    // Traitement spécialisé par table
    switch (tableName) {
      case 'dashboard_analytics':
        if (processed.date && typeof processed.date === 'string') {
          processed.date = new Date(processed.date);
        }
        break;
      
      case 'valuations':
        // S'assurer que valuationDate est bien une date
        if (processed.valuationDate && typeof processed.valuationDate === 'string') {
          processed.valuationDate = new Date(processed.valuationDate);
        }
        break;
    }

    return processed;
  });
}

// Exécution du script
if (require.main === module) {
  migrateSQLiteToPostgreSQL()
    .then(() => {
      console.log('\n🎊 Migration terminée avec succès !');
      console.log('📝 Prochaines étapes:');
      console.log('   1. Vérifiez les données dans PostgreSQL via Adminer (http://localhost:8080)');
      console.log('   2. Testez l\'application avec la nouvelle base');
      console.log('   3. Supprimez l\'ancienne base SQLite si tout fonctionne');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { migrateSQLiteToPostgreSQL }; 