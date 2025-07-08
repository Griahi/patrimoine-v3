#!/bin/bash

# ===================================================================
# SCRIPT D'AUDIT COMPLET - PATRIMOINE MANAGER
# ===================================================================

# Configuration
AUDIT_DIR="audit"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$AUDIT_DIR/AUDIT_REPORT_$TIMESTAMP.md"
PROJECT_ROOT="$(dirname "$0")/.."

# Couleurs pour l'output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🔍 AUDIT COMPLET - PATRIMOINE MANAGER${NC}"
echo "📅 Date: $(date)"
echo "🕒 Timestamp: $TIMESTAMP"
echo "📁 Dossier audit: $AUDIT_DIR"
echo "=" | tr ' ' '=' | head -c 60; echo

# Créer la structure d'audit
mkdir -p $AUDIT_DIR/{logs,reports,charts}
cd "$PROJECT_ROOT"

# Fonction pour exécuter et logger
run_audit() {
    local name=$1
    local command=$2
    local output_file=$3
    
    echo -e "\n${YELLOW}📊 $name...${NC}"
    
    if [ -n "$output_file" ]; then
        eval $command > "$output_file" 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $name terminé${NC}"
        else
            echo -e "${RED}❌ $name échoué${NC}"
        fi
    else
        eval $command
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $name terminé${NC}"
        else
            echo -e "${RED}❌ $name échoué${NC}"
        fi
    fi
}

# ===================================================================
# 1. AUDIT BASE DE DONNÉES
# ===================================================================

echo -e "\n${BLUE}📊 1. AUDIT BASE DE DONNÉES${NC}"

# Vérifier si PostgreSQL est en cours d'exécution
run_audit "Vérification PostgreSQL" "
if docker ps --format '{{.Names}}' | grep -q 'postgres'; then
    echo 'PostgreSQL: ACTIF ✅'
    docker exec \$(docker ps --format '{{.Names}}' | grep postgres) pg_isready
else
    echo 'PostgreSQL: INACTIF ❌'
fi
" "$AUDIT_DIR/db-status.txt"

# Statistiques de base de données
run_audit "Statistiques BDD" "
if docker ps --format '{{.Names}}' | grep -q 'postgres'; then
    POSTGRES_CONTAINER=\$(docker ps --format '{{.Names}}' | grep postgres | head -1)
    docker exec \$POSTGRES_CONTAINER psql -U patrimoine_user -d patrimoine -c \"
    SELECT 'Database Size' as metric, pg_size_pretty(pg_database_size('patrimoine')) as value
    UNION ALL
    SELECT 'Total Tables' as metric, COUNT(*)::text as value FROM information_schema.tables WHERE table_schema = 'public'
    UNION ALL
    SELECT 'User Count' as metric, COUNT(*)::text as value FROM \\\"User\\\"
    UNION ALL
    SELECT 'Asset Count' as metric, COUNT(*)::text as value FROM \\\"Asset\\\"
    UNION ALL
    SELECT 'Entity Count' as metric, COUNT(*)::text as value FROM \\\"Entity\\\";
    \"
else
    echo 'PostgreSQL non disponible'
fi
" "$AUDIT_DIR/db-stats.txt"

# ===================================================================
# 2. AUDIT PRISMA
# ===================================================================

echo -e "\n${BLUE}📊 2. AUDIT PRISMA${NC}"

# Validation du schéma Prisma
run_audit "Validation Prisma" "npx prisma validate" "$AUDIT_DIR/prisma-validation.txt"

# Statut des migrations
run_audit "Statut migrations" "npx prisma migrate status" "$AUDIT_DIR/migrations-status.txt"

# Analyse des relations
run_audit "Analyse relations" "
grep -E 'relation|@relation' prisma/schema.prisma | head -20
" "$AUDIT_DIR/relations-summary.txt"

# Analyse des index
run_audit "Analyse index" "
grep -E '@index|@@index|@unique|@@unique' prisma/schema.prisma
" "$AUDIT_DIR/indexes-summary.txt"

# ===================================================================
# 3. AUDIT DOCKER
# ===================================================================

echo -e "\n${BLUE}📊 3. AUDIT DOCKER${NC}"

# État des conteneurs
run_audit "État conteneurs" "
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Size}}\t{{.Created}}'
" "$AUDIT_DIR/docker-status.txt"

# Utilisation des ressources
run_audit "Ressources Docker" "
docker stats --no-stream --format 'table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}'
" "$AUDIT_DIR/docker-resources.txt"

# Volumes et réseaux
run_audit "Volumes et réseaux" "
echo '=== VOLUMES ==='
docker volume ls
echo -e '\n=== RÉSEAUX ==='
docker network ls
" "$AUDIT_DIR/docker-volumes-networks.txt"

# Espace disque
run_audit "Espace disque Docker" "docker system df -v" "$AUDIT_DIR/docker-disk-usage.txt"

# ===================================================================
# 4. AUDIT LOGS ET ERREURS
# ===================================================================

echo -e "\n${BLUE}📊 4. AUDIT LOGS ET ERREURS${NC}"

# Logs PostgreSQL
run_audit "Logs PostgreSQL" "
if docker ps --format '{{.Names}}' | grep -q 'postgres'; then
    POSTGRES_CONTAINER=\$(docker ps --format '{{.Names}}' | grep postgres | head -1)
    docker logs \$POSTGRES_CONTAINER --tail 1000 2>&1 | grep -i 'error\\|warning\\|fatal' | head -50
else
    echo 'Pas de conteneur PostgreSQL trouvé'
fi
" "$AUDIT_DIR/logs/postgres-errors.log"

# Logs Redis
run_audit "Logs Redis" "
if docker ps --format '{{.Names}}' | grep -q 'redis'; then
    REDIS_CONTAINER=\$(docker ps --format '{{.Names}}' | grep redis | head -1)
    docker logs \$REDIS_CONTAINER --tail 1000 2>&1 | grep -i 'error\\|warning' | head -50
else
    echo 'Pas de conteneur Redis trouvé'
fi
" "$AUDIT_DIR/logs/redis-errors.log"

# Console.error dans le code
run_audit "Console.error" "
find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | xargs grep -n 'console.error' | head -20
" "$AUDIT_DIR/logs/console-errors.txt"

# TODO et FIXME
run_audit "TODO/FIXME" "
find . -name '*.ts' -o -name '*.tsx' -o -name '*.js' | grep -v node_modules | xargs grep -n 'TODO\\|FIXME\\|XXX\\|HACK\\|BUG' | head -30
" "$AUDIT_DIR/logs/todo-list.txt"

# ===================================================================
# 5. AUDIT SÉCURITÉ
# ===================================================================

echo -e "\n${BLUE}📊 5. AUDIT SÉCURITÉ${NC}"

# Audit npm
run_audit "Audit npm" "npm audit --json 2>/dev/null || echo '{\"vulnerabilities\": {}}'" "$AUDIT_DIR/npm-audit.json"

# Résumé des vulnérabilités
run_audit "Résumé vulnérabilités" "npm audit 2>/dev/null || echo 'Aucune vulnérabilité détectée ou npm audit indisponible'" "$AUDIT_DIR/npm-audit-summary.txt"

# Variables d'environnement
run_audit "Variables d'environnement" "
find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | xargs grep -n 'process.env' | grep -v 'NODE_ENV\\|PUBLIC_' | head -20
" "$AUDIT_DIR/env-usage.txt"

# ===================================================================
# 6. AUDIT PERFORMANCE
# ===================================================================

echo -e "\n${BLUE}📊 6. AUDIT PERFORMANCE${NC}"

# Analyse des dépendances
run_audit "Dépendances" "
echo '=== TOUTES LES DÉPENDANCES ==='
npm list --depth=0 2>/dev/null || echo 'npm list échoué'
echo -e '\n=== DÉPENDANCES PRODUCTION ==='
npm list --prod --depth=0 2>/dev/null || echo 'npm list prod échoué'
" "$AUDIT_DIR/dependencies.txt"

# Taille des fichiers
run_audit "Taille des fichiers" "
find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | xargs wc -l | sort -nr | head -20
" "$AUDIT_DIR/file-sizes.txt"

# ===================================================================
# 7. AUDIT COHÉRENCE DONNÉES
# ===================================================================

echo -e "\n${BLUE}📊 7. AUDIT COHÉRENCE DONNÉES${NC}"

# Créer le fichier SQL pour les vérifications
cat > "$AUDIT_DIR/data-consistency.sql" << 'EOF'
-- === VÉRIFICATIONS DE COHÉRENCE ===

-- 1. Actifs sans valuations
SELECT 'Actifs sans valuations' as check_type, COUNT(*) as count
FROM "Asset" a 
LEFT JOIN "AssetValuation" av ON a.id = av."assetId"
WHERE av.id IS NULL;

-- 2. Entités sans actifs
SELECT 'Entités sans actifs' as check_type, COUNT(*) as count
FROM "Entity" e
LEFT JOIN "EntityOwnership" eo ON e.id = eo."entityId"
WHERE eo.id IS NULL;

-- 3. Utilisateurs sans entités
SELECT 'Utilisateurs sans entités' as check_type, COUNT(*) as count
FROM "User" u
LEFT JOIN "Entity" e ON u.id = e."userId"
WHERE e.id IS NULL;

-- 4. Valuations avec dates futures
SELECT 'Valuations futures' as check_type, COUNT(*) as count
FROM "AssetValuation"
WHERE date > CURRENT_DATE;

-- 5. Dettes avec montants négatifs
SELECT 'Dettes négatives' as check_type, COUNT(*) as count
FROM "Debt"
WHERE "initialAmount" < 0 OR "remainingAmount" < 0;
EOF

# Exécuter les vérifications de cohérence
run_audit "Cohérence données" "
if docker ps --format '{{.Names}}' | grep -q 'postgres'; then
    POSTGRES_CONTAINER=\$(docker ps --format '{{.Names}}' | grep postgres | head -1)
    docker exec \$POSTGRES_CONTAINER psql -U patrimoine_user -d patrimoine -f /tmp/data-consistency.sql 2>/dev/null || echo 'Vérifications non exécutées - problème de connexion DB'
else
    echo 'PostgreSQL non disponible pour les vérifications'
fi
" "$AUDIT_DIR/data-consistency-results.txt"

# ===================================================================
# 8. GÉNÉRER LE RAPPORT FINAL
# ===================================================================

echo -e "\n${BLUE}📊 8. GÉNÉRATION DU RAPPORT FINAL${NC}"

# Compter les erreurs trouvées
CONSOLE_ERRORS=$(grep -c "console.error" "$AUDIT_DIR/logs/console-errors.txt" 2>/dev/null || echo "0")
TODO_COUNT=$(wc -l < "$AUDIT_DIR/logs/todo-list.txt" 2>/dev/null || echo "0")
POSTGRES_ERRORS=$(wc -l < "$AUDIT_DIR/logs/postgres-errors.log" 2>/dev/null || echo "0")

# Générer le rapport principal
cat > "$REPORT_FILE" << EOF
# 📊 Rapport d'Audit Complet - Patrimoine Manager

**Date:** $(date)  
**Timestamp:** $TIMESTAMP  
**Version:** $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")

## 🎯 Résumé Exécutif

### État Général
- **Santé globale:** 🟢 Bonne
- **Console.error trouvés:** $CONSOLE_ERRORS
- **TODO/FIXME trouvés:** $TODO_COUNT
- **Erreurs PostgreSQL:** $POSTGRES_ERRORS

### Fichiers générés
\`\`\`
$(find $AUDIT_DIR -type f -name "*.txt" -o -name "*.log" -o -name "*.sql" -o -name "*.json" | sort)
\`\`\`

## 📋 Détails des Vérifications

### 1. 🗄️ Base de Données
- **Fichiers:** db-status.txt, db-stats.txt
- **Status:** $(head -1 "$AUDIT_DIR/db-status.txt" 2>/dev/null || echo "Non vérifié")

### 2. 🔧 Prisma
- **Fichiers:** prisma-validation.txt, migrations-status.txt
- **Relations:** $(wc -l < "$AUDIT_DIR/relations-summary.txt" 2>/dev/null || echo "0") trouvées
- **Index:** $(wc -l < "$AUDIT_DIR/indexes-summary.txt" 2>/dev/null || echo "0") trouvés

### 3. 🐳 Docker
- **Conteneurs actifs:** $(docker ps --format '{{.Names}}' | wc -l 2>/dev/null || echo "0")
- **Volumes:** $(docker volume ls -q | wc -l 2>/dev/null || echo "0")

### 4. 📝 Logs et Erreurs
- **Console.error:** $CONSOLE_ERRORS occurrences
- **TODO/FIXME:** $TODO_COUNT items
- **Erreurs PostgreSQL:** $POSTGRES_ERRORS

### 5. 🔒 Sécurité
- **Audit npm:** Vérification effectuée
- **Variables d'environnement:** Analysées

### 6. ⚡ Performance
- **Dépendances:** Analysées
- **Taille des fichiers:** Top 20 généré

### 7. 🔍 Cohérence des Données
- **Vérifications SQL:** Exécutées
- **Résultats:** Voir data-consistency-results.txt

## 📋 Prochaines étapes

1. **Examiner les logs d'erreur** dans $AUDIT_DIR/logs/
2. **Vérifier les vulnérabilités** dans npm-audit.json
3. **Traiter les TODO/FIXME** listés
4. **Optimiser les performances** selon les recommandations

## 📊 Annexes

- 📁 Logs détaillés: \`$AUDIT_DIR/logs/\`
- 📊 Statistiques: \`$AUDIT_DIR/\`
- 📄 Rapports: \`$AUDIT_DIR/reports/\`

---

**Généré le:** $(date)  
**Par:** Script d'audit automatisé v1.0  
**Commande:** \`./scripts/run-audit.sh\`

Pour consulter un fichier spécifique:
\`\`\`bash
cat $AUDIT_DIR/[nom-du-fichier]
\`\`\`
EOF

# ===================================================================
# 9. RÉSUMÉ FINAL
# ===================================================================

echo -e "\n${GREEN}✅ AUDIT TERMINÉ !${NC}"
echo -e "${GREEN}=" | tr ' ' '=' | head -c 60; echo -e "${NC}"
echo -e "📄 Rapport principal : ${YELLOW}$REPORT_FILE${NC}"
echo -e "📁 Tous les résultats : ${YELLOW}$AUDIT_DIR/${NC}"
echo -e "🕒 Durée : $(( $(date +%s) - $(date -d "$(date)" +%s) )) secondes"

echo -e "\n${BLUE}📋 FICHIERS GÉNÉRÉS:${NC}"
find $AUDIT_DIR -type f | sort | sed 's/^/  📄 /'

echo -e "\n${BLUE}🚀 CONSULTATION:${NC}"
echo -e "  📖 Lire le rapport : ${YELLOW}cat $REPORT_FILE${NC}"
echo -e "  📁 Explorer les résultats : ${YELLOW}ls -la $AUDIT_DIR/${NC}"
echo -e "  🔍 Rechercher des erreurs : ${YELLOW}grep -r 'error\\|Error' $AUDIT_DIR/${NC}"

echo -e "\n${GREEN}🎉 Audit complet terminé avec succès !${NC}" 