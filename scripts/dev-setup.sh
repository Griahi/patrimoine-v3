#!/bin/bash

# ================================================================
# SCRIPT DE SETUP DÉVELOPPEUR AUTOMATISÉ
# ================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 SETUP DÉVELOPPEUR AUTOMATISÉ - PATRIMOINE MANAGER${NC}"
echo "📅 $(date)"
echo "=" | tr ' ' '=' | head -c 60; echo

# ================================================================
# 1. VÉRIFICATIONS PRÉALABLES
# ================================================================

echo -e "\n${BLUE}🔍 1. VÉRIFICATIONS SYSTÈME${NC}"

# Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js $NODE_VERSION"
else
    echo "   ❌ Node.js non installé"
    exit 1
fi

# PostgreSQL
if command -v psql >/dev/null 2>&1; then
    echo "   ✅ PostgreSQL installé"
else
    echo "   ⚠️ PostgreSQL non détecté"
fi

# ================================================================
# 2. INSTALLATION DES DÉPENDANCES
# ================================================================

echo -e "\n${BLUE}📦 2. INSTALLATION${NC}"

if [ ! -d "node_modules" ]; then
    echo "   📥 Installation des dépendances..."
    npm install --silent
    echo "   ✅ Dépendances installées"
else
    echo "   ✅ Dépendances déjà installées"
fi

# ================================================================
# 3. CONFIGURATION AUTOMATIQUE
# ================================================================

echo -e "\n${BLUE}⚙️ 3. CONFIGURATION${NC}"

# .env.local
if [ ! -f ".env.local" ]; then
    echo "   📝 Création de .env.local..."
    cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://dev:password@localhost:5432/patrimoine"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"

# Development
NODE_ENV="development"
DEBUG="true"
EOF
    echo "   ✅ .env.local créé"
else
    echo "   ✅ .env.local existe déjà"
fi

# ================================================================
# 4. BASE DE DONNÉES
# ================================================================

echo -e "\n${BLUE}🗄️ 4. BASE DE DONNÉES${NC}"

# Génération du client Prisma
echo "   🔧 Génération du client Prisma..."
npm run db:generate --silent 2>/dev/null || echo "   ⚠️ Erreur génération Prisma (normal si pas de DB)"

# Migration (optionnel)
if [ "$1" = "--full" ]; then
    echo "   📊 Migration de la base de données..."
    npm run db:migrate --silent 2>/dev/null || echo "   ⚠️ Migration échouée (vérifiez PostgreSQL)"
    
    echo "   🌱 Seeding de la base..."
    npm run db:seed --silent 2>/dev/null || echo "   ⚠️ Seed échoué"
fi

# ================================================================
# 5. VÉRIFICATIONS QUALITÉ
# ================================================================

echo -e "\n${BLUE}🧪 5. QUALITÉ DU CODE${NC}"

# ESLint check rapide
echo "   🔍 Vérification ESLint..."
ESLINT_ERRORS=$(npm run lint --silent 2>&1 | grep -c "error" || echo "0")
if [ "$ESLINT_ERRORS" -gt 0 ]; then
    echo "   ⚠️ $ESLINT_ERRORS erreurs ESLint détectées"
    echo "   💡 Utilisez: npm run lint:fix"
else
    echo "   ✅ Code conforme ESLint"
fi

# Tests (si disponibles)
if npm test --silent >/dev/null 2>&1; then
    echo "   ✅ Tests passent"
else
    echo "   ⚠️ Tests non disponibles ou échouent"
fi

# ================================================================
# 6. OUTILS DE DÉVELOPPEMENT
# ================================================================

echo -e "\n${BLUE}🛠️ 6. OUTILS DÉVELOPPEUR${NC}"

# Rendre les scripts exécutables
chmod +x scripts/*.sh 2>/dev/null
echo "   ✅ Scripts de maintenance configurés"

# Health check
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "   ✅ Application déjà en cours d'exécution"
else
    echo "   💡 Démarrez avec: npm run dev"
fi

# ================================================================
# 7. RÉSUMÉ ET PROCHAINES ÉTAPES
# ================================================================

echo -e "\n${GREEN}🎉 SETUP TERMINÉ${NC}"

echo -e "\n${YELLOW}📋 COMMANDES UTILES${NC}"
echo "   npm run dev                    # Démarrer en développement"
echo "   npm run build                  # Build de production"
echo "   npm run lint:fix               # Corriger ESLint"
echo "   ./scripts/maintenance-cleanup.sh  # Maintenance"
echo "   ./scripts/run-audit.sh         # Audit complet"

echo -e "\n${YELLOW}🔗 URLS UTILES${NC}"
echo "   Application: http://localhost:3000"
echo "   Health Check: http://localhost:3000/api/health"
echo "   API: http://localhost:3000/api/*"

echo -e "\n${YELLOW}📚 RESSOURCES${NC}"
echo "   README: ./README.md"
echo "   Architecture: ./audit/*.md"
echo "   Scripts: ./scripts/"

echo -e "\n${GREEN}✨ Prêt à développer !${NC}" 