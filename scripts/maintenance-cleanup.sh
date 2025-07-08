#!/bin/bash

# ================================================================
# SCRIPT DE MAINTENANCE ET NETTOYAGE - PATRIMOINE MANAGER  
# ================================================================

PROJECT_ROOT="$(dirname "$0")/.."
AUDIT_DIR="$PROJECT_ROOT/audit"
ARCHIVE_DIR="$PROJECT_ROOT/audit/archive"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}🧹 MAINTENANCE ET NETTOYAGE - PATRIMOINE MANAGER${NC}"
echo "📅 Date: $(date)"
echo "📁 Projet: $PROJECT_ROOT"
echo "=" | tr ' ' '=' | head -c 60; echo

cd "$PROJECT_ROOT"

# ================================================================
# 1. NETTOYAGE DES FICHIERS TEMPORAIRES
# ================================================================

echo -e "\n${BLUE}🗑️  1. NETTOYAGE DES FICHIERS TEMPORAIRES${NC}"

# Créer le dossier d'archives
mkdir -p "$ARCHIVE_DIR"

# Supprimer les fichiers temporaires système
echo "   🔍 Recherche fichiers temporaires..."
TEMP_COUNT=0

# Fichiers backup
if find . -name "*.backup" -type f 2>/dev/null | grep -q .; then
    TEMP_COUNT=$((TEMP_COUNT + $(find . -name "*.backup" -type f | wc -l)))
    find . -name "*.backup" -type f -delete 2>/dev/null
    echo "   ✅ Fichiers .backup supprimés"
fi

# Fichiers temporaires
if find . -name "*.tmp" -o -name "*~" -o -name ".DS_Store" 2>/dev/null | grep -q .; then
    TEMP_COUNT=$((TEMP_COUNT + $(find . -name "*.tmp" -o -name "*~" -o -name ".DS_Store" | wc -l)))
    find . -name "*.tmp" -o -name "*~" -o -name ".DS_Store" -delete 2>/dev/null
    echo "   ✅ Fichiers temporaires système supprimés"
fi

# Logs de développement volumineux (>1MB)
if [ -f "$AUDIT_DIR/logs/todo-list.txt" ] && [ $(stat -f%z "$AUDIT_DIR/logs/todo-list.txt" 2>/dev/null || echo 0) -gt 1048576 ]; then
    mv "$AUDIT_DIR/logs/todo-list.txt" "$ARCHIVE_DIR/todo-list-archived-$TIMESTAMP.txt"
    echo "   ✅ Log volumineux archivé: todo-list.txt ($(du -h "$ARCHIVE_DIR/todo-list-archived-$TIMESTAMP.txt" | cut -f1))"
    TEMP_COUNT=$((TEMP_COUNT + 1))
fi

echo "   📊 Total fichiers nettoyés: $TEMP_COUNT"

# ================================================================
# 2. ORGANISATION DES FICHIERS D'AUDIT
# ================================================================

echo -e "\n${BLUE}📁 2. ORGANISATION DES FICHIERS D'AUDIT${NC}"

# Créer structure organisée
mkdir -p "$AUDIT_DIR/archive/reports"
mkdir -p "$AUDIT_DIR/archive/logs"
mkdir -p "$AUDIT_DIR/archive/data"

# Archiver les anciens rapports d'audit (plus de 7 jours)
if [ -d "$AUDIT_DIR" ]; then
    ARCHIVED_COUNT=0
    
    # Archiver les fichiers .txt anciens sauf les plus récents
    find "$AUDIT_DIR" -maxdepth 1 -name "*.txt" -mtime +7 -type f 2>/dev/null | while read file; do
        if [ -f "$file" ]; then
            mv "$file" "$AUDIT_DIR/archive/data/"
            ARCHIVED_COUNT=$((ARCHIVED_COUNT + 1))
        fi
    done
    
    # Archiver les anciens JSON d'audit
    find "$AUDIT_DIR" -maxdepth 1 -name "*.json" -mtime +7 -type f 2>/dev/null | while read file; do
        if [ -f "$file" ]; then
            mv "$file" "$AUDIT_DIR/archive/data/"
            ARCHIVED_COUNT=$((ARCHIVED_COUNT + 1))
        fi
    done
    
    echo "   ✅ Organisation terminée"
fi

# ================================================================
# 3. NETTOYAGE DES DÉPENDANCES NODE
# ================================================================

echo -e "\n${BLUE}📦 3. NETTOYAGE DES DÉPENDANCES${NC}"

# Cache npm
if command -v npm >/dev/null 2>&1; then
    CACHE_SIZE_BEFORE=$(du -sh ~/.npm 2>/dev/null | cut -f1 || echo "0")
    npm cache clean --force >/dev/null 2>&1
    CACHE_SIZE_AFTER=$(du -sh ~/.npm 2>/dev/null | cut -f1 || echo "0")
    echo "   ✅ Cache npm nettoyé (avant: $CACHE_SIZE_BEFORE, après: $CACHE_SIZE_AFTER)"
fi

# Modules inutilisés (optionnel)
if [ "$1" = "--deep" ]; then
    echo "   🔍 Analyse des dépendances inutilisées..."
    if command -v npx >/dev/null 2>&1; then
        npx depcheck --quiet 2>/dev/null | head -10
        echo "   💡 Utilisez 'npx depcheck' pour analyser les dépendances inutilisées"
    fi
fi

# ================================================================
# 4. OPTIMISATION DE L'ESPACE DISQUE
# ================================================================

echo -e "\n${BLUE}💾 4. ANALYSE DE L'ESPACE DISQUE${NC}"

# Taille du projet
PROJECT_SIZE=$(du -sh . 2>/dev/null | cut -f1)
NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "N/A")
AUDIT_SIZE=$(du -sh audit 2>/dev/null | cut -f1 || echo "N/A")

echo "   📊 Taille totale du projet: $PROJECT_SIZE"
echo "   📦 Taille node_modules: $NODE_MODULES_SIZE"
echo "   📋 Taille dossier audit: $AUDIT_SIZE"

# Gros fichiers (>10MB)
echo "   🔍 Gros fichiers détectés:"
find . -type f -size +10M 2>/dev/null | head -5 | while read file; do
    SIZE=$(du -sh "$file" 2>/dev/null | cut -f1)
    echo "     📄 $file ($SIZE)"
done

# ================================================================
# 5. VÉRIFICATION DE LA SANTÉ DU PROJET
# ================================================================

echo -e "\n${BLUE}🏥 5. VÉRIFICATION DE LA SANTÉ${NC}"

# Vérifier package.json
if [ -f "package.json" ]; then
    echo "   ✅ package.json présent"
    
    # Vérifier si les scripts existent
    if grep -q '"build"' package.json; then
        echo "   ✅ Script build configuré"
    else
        echo "   ⚠️ Script build manquant"
    fi
    
    if grep -q '"test"' package.json; then
        echo "   ✅ Script test configuré"
    else
        echo "   ⚠️ Script test manquant"
    fi
fi

# Vérifier les fichiers critiques
CRITICAL_FILES=(".env.local" "next.config.ts" "tsconfig.json" "prisma/schema.prisma")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file présent"
    else
        echo "   ⚠️ $file manquant"
    fi
done

# ================================================================
# 6. GÉNÉRATION DU RAPPORT DE MAINTENANCE
# ================================================================

echo -e "\n${BLUE}📄 6. RAPPORT DE MAINTENANCE${NC}"

REPORT_FILE="$AUDIT_DIR/maintenance-report-$TIMESTAMP.md"

cat > "$REPORT_FILE" << EOF
# Rapport de Maintenance

**Date :** $(date)
**Timestamp :** $TIMESTAMP
**Projet :** Patrimoine Manager

## 🧹 Nettoyage Effectué

### Fichiers Temporaires
- **Fichiers supprimés :** $TEMP_COUNT
- **Types :** .backup, .tmp, ~, .DS_Store
- **Logs archivés :** Archives créées si volumineux

### Organisation
- **Structure :** Dossiers archive créés
- **Fichiers archivés :** Anciens rapports déplacés
- **Statut :** ✅ Terminé

### Dépendances
- **Cache npm :** Nettoyé
- **Taille avant/après :** $CACHE_SIZE_BEFORE → $CACHE_SIZE_AFTER

## 📊 Métriques Projet

- **Taille totale :** $PROJECT_SIZE
- **Node modules :** $NODE_MODULES_SIZE
- **Dossier audit :** $AUDIT_SIZE

## 🏥 Santé du Projet

### Fichiers Critiques
$(for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "- ✅ $file"
    else
        echo "- ❌ $file (manquant)"
    fi
done)

### Scripts Package.json
$(if grep -q '"build"' package.json 2>/dev/null; then echo "- ✅ build"; else echo "- ❌ build"; fi)
$(if grep -q '"test"' package.json 2>/dev/null; then echo "- ✅ test"; else echo "- ❌ test"; fi)

## 💡 Recommandations

1. **Exécuter ce script hebdomadairement**
2. **Surveiller la taille du dossier audit**
3. **Vérifier régulièrement les dépendances**
4. **Archiver les anciens rapports**

## 🔄 Prochaine Maintenance

**Recommandée :** $(date -d '+1 week' '+%Y-%m-%d' 2>/dev/null || date -v+1w '+%Y-%m-%d' 2>/dev/null || echo "Dans 1 semaine")

EOF

echo "   📄 Rapport généré: $REPORT_FILE"

# ================================================================
# 7. RÉSUMÉ FINAL
# ================================================================

echo -e "\n${GREEN}🎉 MAINTENANCE TERMINÉE${NC}"
echo -e "📊 Fichiers traités: ${YELLOW}$TEMP_COUNT${NC}"
echo -e "📁 Taille projet: ${YELLOW}$PROJECT_SIZE${NC}"
echo -e "📄 Rapport: ${CYAN}$REPORT_FILE${NC}"

# Suggestions
echo -e "\n${YELLOW}💡 SUGGESTIONS${NC}"
echo "   🔄 Exécutez ce script avec --deep pour une analyse approfondie"
echo "   📅 Programmez l'exécution hebdomadaire avec cron"
echo "   📊 Consultez le rapport de maintenance généré"

# Commandes utiles
echo -e "\n${CYAN}🛠️  COMMANDES UTILES${NC}"
echo "   npm audit fix          # Corriger les vulnérabilités"
echo "   npm outdated          # Vérifier les dépendances obsolètes"
echo "   npx depcheck          # Analyser les dépendances inutilisées"
echo "   du -sh node_modules   # Taille des modules"

echo -e "\n${GREEN}✨ Maintenance terminée avec succès !${NC}" 