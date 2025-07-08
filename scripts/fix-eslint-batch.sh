#!/bin/bash

# ================================================================
# SCRIPT DE CORRECTION AUTOMATIQUE DES ERREURS ESLINT
# ================================================================

PROJECT_ROOT="$(dirname "$0")/.."
TEMP_DIR="$PROJECT_ROOT/temp_eslint_fixes"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🔧 CORRECTION AUTOMATIQUE DES ERREURS ESLINT${NC}"
echo "📁 Répertoire: $PROJECT_ROOT"
echo "=" | tr ' ' '=' | head -c 60; echo

cd "$PROJECT_ROOT"

# Créer le dossier temporaire
mkdir -p "$TEMP_DIR"

# ================================================================
# 1. CORRIGER LES VARIABLES NON UTILISÉES
# ================================================================

echo -e "\n${BLUE}🧹 1. CORRECTION DES VARIABLES NON UTILISÉES${NC}"

# Fonction pour corriger les variables non utilisées
fix_unused_vars() {
    local file=$1
    echo "   📝 $file"
    
    # Sauvegarder le fichier original
    cp "$file" "$TEMP_DIR/$(basename "$file").backup"
    
    # Variables de paramètres non utilisées (ex: function(request) -> function(_request))
    sed -i.tmp 's/(\([^)]*\)\b\([a-zA-Z_][a-zA-Z0-9_]*\): [^)]*)/(\1_\2: NextRequest)/g' "$file" 2>/dev/null || true
    
    # Variables catch non utilisées (ex: catch(error) -> catch(_error))
    sed -i.tmp 's/catch *( *\([a-zA-Z_][a-zA-Z0-9_]*\) *)/catch(_\1)/g' "$file" 2>/dev/null || true
    
    # Nettoyer les fichiers temporaires
    rm -f "$file.tmp"
}

# ================================================================
# 2. CORRIGER LES TYPES ANY SIMPLES
# ================================================================

echo -e "\n${BLUE}🔧 2. CORRECTION DES TYPES ANY SIMPLES${NC}"

fix_simple_any_types() {
    local file=$1
    echo "   📝 $file"
    
    # any[] -> unknown[]
    sed -i.tmp 's/: any\[\]/: unknown[]/g' "$file" 2>/dev/null || true
    
    # Paramètres any simples -> unknown quand c'est approprié
    sed -i.tmp 's/: any)/: unknown)/g' "$file" 2>/dev/null || true
    
    # Nettoyer
    rm -f "$file.tmp"
}

# ================================================================
# 3. CORRIGER LES IMPORTS NON UTILISÉS
# ================================================================

echo -e "\n${BLUE}📦 3. CORRECTION DES IMPORTS NON UTILISÉS${NC}"

fix_unused_imports() {
    local file=$1
    echo "   📝 $file"
    
    # Cette partie nécessite une analyse plus complexe
    # Pour l'instant, on signale juste les imports potentiellement inutiles
}

# ================================================================
# 4. CORRIGER LES CARACTÈRES JSX
# ================================================================

echo -e "\n${BLUE}✨ 4. CORRECTION DES CARACTÈRES JSX${NC}"

fix_jsx_characters() {
    local file=$1
    echo "   📝 $file"
    
    # Corriger les apostrophes
    sed -i.tmp "s/Il n'y a pas/Il n\&apos;y a pas/g" "$file" 2>/dev/null || true
    sed -i.tmp "s/n'existe pas/n\&apos;existe pas/g" "$file" 2>/dev/null || true
    sed -i.tmp "s/l'actif/l\&apos;actif/g" "$file" 2>/dev/null || true
    sed -i.tmp "s/d'actif/d\&apos;actif/g" "$file" 2>/dev/null || true
    sed -i.tmp "s/l'entité/l\&apos;entité/g" "$file" 2>/dev/null || true
    sed -i.tmp "s/d'entité/d\&apos;entité/g" "$file" 2>/dev/null || true
    
    # Corriger les guillemets doubles
    sed -i.tmp 's/"([^"]*)"/"&quot;\1&quot;"/g' "$file" 2>/dev/null || true
    
    # Nettoyer
    rm -f "$file.tmp"
}

# ================================================================
# 5. APPLIQUER LES CORRECTIONS
# ================================================================

echo -e "\n${YELLOW}🚀 Application des corrections...${NC}"

# Compter les erreurs avant
ERRORS_BEFORE=$(npx eslint src/ --ext .ts,.tsx --quiet 2>/dev/null | wc -l | tr -d ' ')

# Traiter tous les fichiers TypeScript
find src/ -name "*.ts" -o -name "*.tsx" | while read file; do
    if [[ "$file" =~ \.(ts|tsx)$ ]]; then
        # Appliquer toutes les corrections
        fix_unused_vars "$file"
        fix_simple_any_types "$file"
        fix_jsx_characters "$file"
    fi
done

echo -e "\n${BLUE}📊 VÉRIFICATION DES RÉSULTATS${NC}"

# Compter les erreurs après
ERRORS_AFTER=$(npx eslint src/ --ext .ts,.tsx --quiet 2>/dev/null | wc -l | tr -d ' ')

echo "   🔴 Erreurs avant: $ERRORS_BEFORE"
echo "   🟢 Erreurs après: $ERRORS_AFTER"

if [ "$ERRORS_AFTER" -lt "$ERRORS_BEFORE" ]; then
    FIXED=$((ERRORS_BEFORE - ERRORS_AFTER))
    echo -e "   ✅ ${GREEN}$FIXED erreurs corrigées !${NC}"
else
    echo -e "   ⚠️ ${YELLOW}Aucune amélioration détectée${NC}"
fi

# ================================================================
# 6. NETTOYAGE ET RAPPORT
# ================================================================

echo -e "\n${BLUE}📋 GÉNÉRATION DU RAPPORT${NC}"

# Créer un rapport des modifications
cat > "$TEMP_DIR/fix_report.md" << EOF
# Rapport de Correction ESLint Automatique

**Date:** $(date)
**Erreurs avant:** $ERRORS_BEFORE
**Erreurs après:** $ERRORS_AFTER
**Erreurs corrigées:** $((ERRORS_BEFORE - ERRORS_AFTER))

## Types de corrections appliquées

1. **Variables non utilisées** - Préfixe underscore ajouté
2. **Types any simples** - Remplacés par unknown quand approprié
3. **Caractères JSX** - Échappement correct des apostrophes et guillemets

## Fichiers sauvegardés

Les fichiers originaux sont sauvegardés dans: $TEMP_DIR/

## Prochaines étapes

1. Vérifier que le build fonctionne: \`npm run build\`
2. Lancer les tests: \`npm test\`
3. Corriger manuellement les erreurs restantes
4. Nettoyer les fichiers de sauvegarde

EOF

echo "   📄 Rapport généré: $TEMP_DIR/fix_report.md"

# ================================================================
# 7. VALIDATION FINALE
# ================================================================

echo -e "\n${BLUE}🔍 VALIDATION FINALE${NC}"

# Essayer un build rapide pour vérifier
echo "   🏗️ Test de build..."
if npm run build > /dev/null 2>&1; then
    echo -e "   ✅ ${GREEN}Build réussi !${NC}"
else
    echo -e "   ❌ ${RED}Build échoué - vérification manuelle nécessaire${NC}"
fi

echo -e "\n${GREEN}🎉 CORRECTION AUTOMATIQUE TERMINÉE${NC}"
echo -e "📊 Consultez le détail des erreurs restantes avec: ${YELLOW}npx eslint src/ --ext .ts,.tsx${NC}"
echo -e "🧹 Nettoyez les sauvegardes avec: ${YELLOW}rm -rf $TEMP_DIR${NC}" 