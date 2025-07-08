#!/bin/bash

echo "🧪 Test dans le container PostgreSQL..."

# Compte les utilisateurs existants
echo "👥 Utilisateurs existants:"
docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "SELECT COUNT(*) FROM users;"

# Compte les entités existantes
echo "🏢 Entités existantes:"
docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "SELECT COUNT(*) FROM entities;"

# Compte les actifs existants
echo "💼 Actifs existants:"
docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "SELECT COUNT(*) FROM assets;"

# Affiche les 5 dernières entités
echo "📋 Dernières entités:"
docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "SELECT id, name, type, \"createdAt\" FROM entities ORDER BY \"createdAt\" DESC LIMIT 5;"

# Affiche les 5 derniers actifs
echo "📋 Derniers actifs:"
docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "SELECT id, name, \"createdAt\" FROM assets ORDER BY \"createdAt\" DESC LIMIT 5;"

# Teste la création d'une entité
echo "📝 Test création entité..."
ENTITY_ID="test-entity-$(date +%s)"
USER_ID=$(docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -t -c "SELECT id FROM users LIMIT 1;" | tr -d ' ')

if [ -n "$USER_ID" ]; then
    echo "✅ Utilisateur trouvé: $USER_ID"
    docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "INSERT INTO entities (id, \"userId\", type, name, \"createdAt\", \"updatedAt\") VALUES ('$ENTITY_ID', '$USER_ID', 'INDIVIDUAL', 'Test Entity $(date)', NOW(), NOW());"
    
    # Vérifie que l'entité a été créée
    echo "🔍 Vérification entité créée:"
    docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "SELECT * FROM entities WHERE id = '$ENTITY_ID';"
else
    echo "❌ Aucun utilisateur trouvé. Création d'un utilisateur test..."
    TEST_USER_ID="test-user-$(date +%s)"
    docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "INSERT INTO users (id, email, name, \"createdAt\", \"updatedAt\") VALUES ('$TEST_USER_ID', 'test@test.com', 'Test User', NOW(), NOW());"
    echo "✅ Utilisateur test créé: $TEST_USER_ID"
fi

echo "🎉 Test terminé!" 