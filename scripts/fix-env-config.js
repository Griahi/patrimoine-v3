#!/usr/bin/env node
// Script pour corriger la configuration des variables d'environnement

const fs = require('fs');
const path = require('path');

const envConfig = `# Configuration de base de données PostgreSQL
DATABASE_URL="postgresql://patrimoine_user:patrimoine_password_2024@localhost:5432/patrimoine?schema=public"

# Configuration NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Configuration OpenAI (optionnel)
OPENAI_API_KEY="your-openai-api-key-here"

# Configuration Redis (optionnel)
REDIS_URL="redis://localhost:6379"
`;

const envLocalConfig = `# Configuration locale pour le développement
DATABASE_URL="postgresql://patrimoine_user:patrimoine_password_2024@localhost:5432/patrimoine?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-2024"
`;

async function fixEnvConfig() {
  console.log('🔧 Correction de la configuration des variables d\'environnement...\n');

  try {
    // Créer le fichier .env
    const envPath = '.env';
    console.log('📝 Création du fichier .env...');
    fs.writeFileSync(envPath, envConfig);
    console.log('✅ Fichier .env créé avec succès');

    // Créer le fichier .env.local
    const envLocalPath = '.env.local';
    console.log('📝 Création du fichier .env.local...');
    fs.writeFileSync(envLocalPath, envLocalConfig);
    console.log('✅ Fichier .env.local créé avec succès');

    // Vérifier les permissions
    console.log('\n🔒 Configuration des permissions...');
    try {
      fs.chmodSync(envPath, 0o600);
      fs.chmodSync(envLocalPath, 0o600);
      console.log('✅ Permissions configurées (600)');
    } catch (chmodError) {
      console.warn('⚠️ Impossible de modifier les permissions:', chmodError.message);
    }

    console.log('\n🎉 Configuration terminée !');
    console.log('\n📋 Étapes suivantes:');
    console.log('1. Redémarrez votre application Next.js');
    console.log('2. Testez la création d\'entités et d\'actifs');
    console.log('3. Vérifiez que les données persistent après redémarrage');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

fixEnvConfig(); 