#!/bin/bash

# ================================================================
# SCRIPT DE NETTOYAGE AUTOMATIQUE - PATRIMOINE MANAGER
# ================================================================

PROJECT_ROOT="$(dirname "$0")/.."
DOCS_DIR="$PROJECT_ROOT/docs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}🧹 NETTOYAGE AUTOMATIQUE - PATRIMOINE MANAGER${NC}"
echo "📅 Date: $(date)"
echo "📁 Projet: $PROJECT_ROOT"
echo "=" | tr ' ' '=' | head -c 60; echo

cd "$PROJECT_ROOT"

# ================================================================
# FONCTIONS UTILITAIRES
# ================================================================

log_action() {
    local action="$1"
    local result="$2"
    if [ "$result" = "OK" ]; then
        echo -e "   ${GREEN}✅ $action${NC}"
    else
        echo -e "   ${RED}❌ $action${NC}"
    fi
}

count_files() {
    local pattern="$1"
    find . -name "$pattern" -type f 2>/dev/null | wc -l
}

# ================================================================
# 1. VÉRIFICATION DE LA STRUCTURE
# ================================================================

echo -e "\n${BLUE}🔍 1. VÉRIFICATION DE LA STRUCTURE${NC}"

# Vérifier si la structure docs existe
if [ ! -d "$DOCS_DIR" ]; then
    echo "   📁 Création de la structure docs..."
    mkdir -p "$DOCS_DIR"/{audit,setup,fixes,maintenance,archived}
    log_action "Structure docs créée" "OK"
else
    log_action "Structure docs existante" "OK"
fi

# Vérifier l'index documentation
if [ ! -f "$DOCS_DIR/README.md" ]; then
    echo "   📄 Index documentation manquant, création..."
    log_action "Index documentation créé" "OK"
else
    log_action "Index documentation existant" "OK"
fi

# ================================================================
# 2. NETTOYAGE DES FICHIERS TEMPORAIRES
# ================================================================

echo -e "\n${BLUE}🗑️  2. NETTOYAGE DES FICHIERS TEMPORAIRES${NC}"

TEMP_CLEANED=0

# Supprimer les fichiers de cache TypeScript
if [ -f "tsconfig.tsbuildinfo" ]; then
    rm -f "tsconfig.tsbuildinfo"
    TEMP_CLEANED=$((TEMP_CLEANED + 1))
fi

# Supprimer les logs de développement
if [ -f "dev.log" ]; then
    rm -f "dev.log"
    TEMP_CLEANED=$((TEMP_CLEANED + 1))
fi

# Supprimer les fichiers cookies temporaires
if [ -f "cookies.txt" ]; then
    rm -f "cookies.txt"
    TEMP_CLEANED=$((TEMP_CLEANED + 1))
fi

# Supprimer les fichiers build temporaires
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null
find . -name "*.log" -type f -not -path "./node_modules/*" -not -path "./audit/*" -delete 2>/dev/null

# Supprimer les fichiers DS_Store sur macOS
find . -name ".DS_Store" -type f -delete 2>/dev/null

log_action "Fichiers temporaires supprimés: $TEMP_CLEANED" "OK"

# ================================================================
# 3. ORGANISATION DES FICHIERS DOCUMENTATION
# ================================================================

echo -e "\n${BLUE}📚 3. ORGANISATION DES FICHIERS DOCUMENTATION${NC}"

DOCS_MOVED=0

# Fonction pour déplacer les fichiers de documentation
move_doc_file() {
    local file="$1"
    local target_dir="$2"
    
    if [ -f "$file" ]; then
        mkdir -p "$DOCS_DIR/$target_dir"
        mv "$file" "$DOCS_DIR/$target_dir/"
        DOCS_MOVED=$((DOCS_MOVED + 1))
        return 0
    fi
    return 1
}

# Déplacer les fichiers d'audit
move_doc_file "AUDIT_*.md" "audit"
move_doc_file "AUTHENTICATION_*.md" "audit"
move_doc_file "RAPPORT_AUDIT_*.md" "audit"

# Déplacer les fichiers de setup
move_doc_file "ENVIRONMENT_*.md" "setup"
move_doc_file "MIGRATION_*.md" "setup"
move_doc_file "SETUP_*.md" "setup"

# Déplacer les fichiers de fixes
move_doc_file "CORRECTION_*.md" "fixes"
move_doc_file "FIX_*.md" "fixes"
move_doc_file "PROBLEMES_*.md" "fixes"

# Déplacer les autres fichiers documentation
for file in *.md; do
    if [ -f "$file" ] && [ "$file" != "README.md" ]; then
        case "$file" in
            *AUDIT*|*AUTHENTICATION*|*RAPPORT*)
                move_doc_file "$file" "audit"
                ;;
            *ENVIRONMENT*|*MIGRATION*|*SETUP*)
                move_doc_file "$file" "setup"
                ;;
            *CORRECTION*|*FIX*|*PROBLEMES*)
                move_doc_file "$file" "fixes"
                ;;
            *)
                # Fichiers documentation générale
                if grep -q "^#" "$file" 2>/dev/null; then
                    move_doc_file "$file" "maintenance"
                fi
                ;;
        esac
    fi
done

log_action "Fichiers documentation déplacés: $DOCS_MOVED" "OK"

# ================================================================
# 4. VÉRIFICATION DES FICHIERS CRITIQUES
# ================================================================

echo -e "\n${BLUE}🔍 4. VÉRIFICATION DES FICHIERS CRITIQUES${NC}"

# Liste des fichiers critiques qui doivent rester en racine
CRITICAL_FILES=(
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "next.config.ts"
    "middleware.ts"
    "docker-compose.yml"
    "Makefile"
    "README.md"
    ".gitignore"
    "eslint.config.mjs"
    "tailwind.config.js"
    "postcss.config.mjs"
    "vitest.config.ts"
)

CRITICAL_OK=0
CRITICAL_MISSING=0

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        CRITICAL_OK=$((CRITICAL_OK + 1))
    else
        CRITICAL_MISSING=$((CRITICAL_MISSING + 1))
        echo -e "   ${YELLOW}⚠️  Fichier critique manquant: $file${NC}"
    fi
done

log_action "Fichiers critiques présents: $CRITICAL_OK/$((CRITICAL_OK + CRITICAL_MISSING))" "OK"

# ================================================================
# 5. NETTOYAGE DES DOSSIERS
# ================================================================

echo -e "\n${BLUE}📁 5. NETTOYAGE DES DOSSIERS${NC}"

# Nettoyer les dossiers de build
if [ -d ".next" ]; then
    echo "   🗑️  Nettoyage cache Next.js..."
    rm -rf .next
    log_action "Cache Next.js nettoyé" "OK"
fi

# Nettoyer les dossiers de cache npm
if [ -d "node_modules/.cache" ]; then
    echo "   🗑️  Nettoyage cache npm..."
    rm -rf node_modules/.cache
    log_action "Cache npm nettoyé" "OK"
fi

# Nettoyer les uploads temporaires (garder la structure)
if [ -d "uploads" ]; then
    find uploads -name "*.tmp" -type f -delete 2>/dev/null
    log_action "Fichiers temporaires uploads nettoyés" "OK"
fi

# ================================================================
# 6. MISE À JOUR DE L'INDEX DOCUMENTATION
# ================================================================

echo -e "\n${BLUE}📄 6. MISE À JOUR DE L'INDEX DOCUMENTATION${NC}"

# Générer automatiquement l'index documentation
if [ -d "$DOCS_DIR" ]; then
    echo "   📝 Génération index documentation..."
    
    # Créer un index basique s'il n'existe pas
    if [ ! -f "$DOCS_DIR/README.md" ]; then
        cat > "$DOCS_DIR/README.md" << 'EOF'
# 📚 Documentation - Patrimoine Manager

## 🗂️ Organisation

### 📊 Audits et Sécurité
- Documentation des audits et rapports de sécurité

### ⚙️ Installation et Configuration  
- Guides d'installation et configuration

### 🛠️ Corrections et Fixes
- Historique des corrections et résolutions

### 🔧 Maintenance
- Scripts et guides de maintenance

### 📦 Archivés
- Anciennes versions et fichiers obsolètes

---

*Généré automatiquement par le script de nettoyage*
EOF
    fi
    
    log_action "Index documentation mis à jour" "OK"
fi

# ================================================================
# 7. STATISTIQUES FINALES
# ================================================================

echo -e "\n${BLUE}📊 7. STATISTIQUES FINALES${NC}"

# Compter les fichiers par catégorie
ROOT_FILES=$(ls -1 | grep -E '\.(json|js|ts|mjs|md|yml|yaml)$' | wc -l)
DOCS_FILES=$(find docs -name "*.md" -type f 2>/dev/null | wc -l)
TEMP_FILES=$(find . -name "*.tmp" -o -name "*.log" -o -name "*.tsbuildinfo" -o -name ".DS_Store" | grep -v node_modules | wc -l)

echo "   📄 Fichiers racine: $ROOT_FILES"
echo "   📚 Fichiers documentation: $DOCS_FILES"
echo "   🗑️  Fichiers temporaires restants: $TEMP_FILES"

# ================================================================
# 8. VALIDATION FINALE
# ================================================================

echo -e "\n${BLUE}✅ 8. VALIDATION FINALE${NC}"

# Vérifier que l'application fonctionne toujours
if [ -f "package.json" ]; then
    echo "   🔍 Vérification package.json..."
    if npm list > /dev/null 2>&1; then
        log_action "Package.json valide" "OK"
    else
        log_action "Package.json problématique" "WARN"
    fi
fi

# Vérifier TypeScript
if [ -f "tsconfig.json" ]; then
    echo "   🔍 Vérification TypeScript..."
    if npx tsc --noEmit > /dev/null 2>&1; then
        log_action "TypeScript valide" "OK"
    else
        log_action "Erreurs TypeScript détectées" "WARN"
    fi
fi

# ================================================================
# RAPPORT FINAL
# ================================================================

echo -e "\n${GREEN}🎉 NETTOYAGE TERMINÉ !${NC}"
echo -e "${GREEN}=" | tr ' ' '=' | head -c 60; echo -e "${NC}"
echo -e "📊 Résumé:"
echo -e "   🗑️  Fichiers temporaires supprimés: $TEMP_CLEANED"
echo -e "   📚 Fichiers documentation déplacés: $DOCS_MOVED"
echo -e "   ✅ Fichiers critiques présents: $CRITICAL_OK"
echo -e "   📁 Structure docs: ${GREEN}OK${NC}"

echo -e "\n${BLUE}📋 PROCHAINES ÉTAPES:${NC}"
echo -e "   1. Vérifier la documentation dans docs/"
echo -e "   2. Tester l'application: npm run dev"
echo -e "   3. Exécuter les tests: npm run test"
echo -e "   4. Valider le build: npm run build"

echo -e "\n${CYAN}🔄 Pour automatiser ce nettoyage, ajoutez à votre crontab:${NC}"
echo -e "   ${YELLOW}0 9 * * 1 cd $PROJECT_ROOT && ./scripts/project-cleanup.sh${NC}"

echo -e "\n${GREEN}✨ Projet nettoyé avec succès !${NC}" 