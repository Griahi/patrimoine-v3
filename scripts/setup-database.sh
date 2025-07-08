#!/bin/bash

# Script de configuration de la base de données PostgreSQL
# Gère l'installation Docker ou native selon disponibilité

set -e

echo "🔧 Configuration de la base de données PostgreSQL..."
echo "=================================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
DB_NAME="patrimoine"
DB_USER="patrimoine_user"
DB_PASSWORD="patrimoine_password_2024"
DB_PORT="5432"

# Fonction pour vérifier si Docker est installé
check_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        return 0
    elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Fonction pour vérifier si PostgreSQL est installé
check_postgres() {
    command -v psql &> /dev/null
}

# Installation avec Docker
setup_with_docker() {
    echo -e "${BLUE}🐳 Configuration avec Docker...${NC}"
    
    if ! check_docker; then
        echo -e "${YELLOW}⚠️  Docker non détecté. Installation avec Homebrew...${NC}"
        
        read -p "Installer Docker Desktop ? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "📦 Installation de Docker Desktop..."
            brew install --cask docker
            echo -e "${GREEN}✅ Docker installé ! Lancez Docker Desktop puis relancez ce script.${NC}"
            exit 0
        else
            echo "Passage à l'installation native PostgreSQL..."
            setup_with_homebrew
            return
        fi
    fi
    
    # Démarrer les services Docker
    echo "🚀 Démarrage des services Docker..."
    
    # Utiliser la nouvelle syntaxe ou l'ancienne selon disponibilité
    if docker compose version &> /dev/null; then
        docker compose up -d postgres redis adminer
    else
        docker-compose up -d postgres redis adminer
    fi
    
    # Attendre que PostgreSQL soit prêt
    echo "⏳ Attente du démarrage de PostgreSQL..."
    sleep 10
    
    # Vérifier la connexion
    while ! docker exec patrimoine-postgres pg_isready -U $DB_USER -d $DB_NAME; do
        echo "En attente de PostgreSQL..."
        sleep 2
    done
    
    echo -e "${GREEN}✅ PostgreSQL et Redis démarrés avec Docker${NC}"
    echo -e "${BLUE}🌐 Interfaces disponibles:${NC}"
    echo "   • Adminer: http://localhost:8080"
    echo "   • pgAdmin: http://localhost:5050"
}

# Installation native avec Homebrew
setup_with_homebrew() {
    echo -e "${BLUE}🍺 Configuration avec Homebrew (installation native)...${NC}"
    
    if ! check_postgres; then
        echo "📦 Installation de PostgreSQL..."
        brew install postgresql@15
        brew install redis
    fi
    
    # Démarrer les services
    echo "🚀 Démarrage des services..."
    brew services start postgresql@15
    brew services start redis
    
    # Attendre un peu
    sleep 3
    
    # Créer l'utilisateur et la base de données
    echo "👤 Création de l'utilisateur et de la base de données..."
    
    # Créer l'utilisateur avec mot de passe
    psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "Utilisateur existe déjà"
    
    # Créer la base de données
    psql postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Base de données existe déjà"
    
    # Donner les privilèges
    psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    
    # Installer les extensions
    echo "🔧 Installation des extensions PostgreSQL..."
    psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
    psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS btree_gin;"
    psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
    psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
    
    echo -e "${GREEN}✅ PostgreSQL et Redis configurés nativement${NC}"
}

# Fonction pour tester la connexion
test_connection() {
    echo "🔍 Test de connexion à PostgreSQL..."
    
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME"
    
    if psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
        echo -e "${GREEN}✅ Connexion PostgreSQL réussie${NC}"
        return 0
    else
        echo -e "${RED}❌ Échec de connexion PostgreSQL${NC}"
        return 1
    fi
}

# Configuration du fichier .env
setup_env() {
    echo "📝 Configuration du fichier .env..."
    
    # Sauvegarder l'ancien .env s'il existe
    if [ -f .env ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo "💾 Ancien .env sauvegardé"
    fi
    
    # Créer le nouveau .env
    cat > .env << EOF
# Configuration Base de Données PostgreSQL - Générée automatiquement
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME"

# Configuration Redis
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Mode de développement
NODE_ENV="development"
LOG_LEVEL="info"

# Configuration générée le $(date)
EOF
    
    echo -e "${GREEN}✅ Fichier .env configuré${NC}"
}

# Script principal
main() {
    echo -e "${BLUE}🎯 Choix de la méthode d'installation:${NC}"
    echo "1. Docker (recommandé - infrastructure complète)"
    echo "2. Installation native avec Homebrew"
    echo "3. Détection automatique"
    echo
    
    read -p "Votre choix (1/2/3): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            setup_with_docker
            ;;
        2)
            setup_with_homebrew
            ;;
        3)
            if check_docker; then
                echo -e "${GREEN}Docker détecté${NC}"
                setup_with_docker
            else
                echo -e "${YELLOW}Docker non détecté, utilisation de Homebrew${NC}"
                setup_with_homebrew
            fi
            ;;
        *)
            echo "Choix invalide, détection automatique..."
            if check_docker; then
                setup_with_docker
            else
                setup_with_homebrew
            fi
            ;;
    esac
    
    # Configuration commune
    setup_env
    
    # Test de connexion
    if test_connection; then
        echo
        echo -e "${GREEN}🎉 Configuration terminée avec succès !${NC}"
        echo
        echo -e "${BLUE}📝 Prochaines étapes:${NC}"
        echo "   1. npm run db:generate  # Générer le client Prisma"
        echo "   2. npm run db:migrate   # Créer les tables"
        echo "   3. npm run db:migrate-from-sqlite  # Migrer les données SQLite (optionnel)"
        echo "   4. npm run dev          # Démarrer l'application"
    else
        echo -e "${RED}❌ Problème de configuration détecté${NC}"
        exit 1
    fi
}

# Vérification des prérequis
if ! command -v brew &> /dev/null; then
    echo -e "${RED}❌ Homebrew requis mais non installé${NC}"
    echo "Installez Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

# Exécution
main 