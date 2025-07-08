#!/bin/bash

echo "🔧 Initialisation complète de la base de données..."

# Arrêter et supprimer les containers existants
echo "🛑 Arrêt des containers..."
docker-compose down -v

# Supprimer les volumes pour un fresh start
echo "🗑️ Nettoyage des volumes..."
docker volume prune -f

# Redémarrer les services
echo "🚀 Redémarrage des services..."
docker-compose up -d

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
sleep 10

# Vérifier la connexion
echo "🔍 Vérification de la connexion..."
docker exec patrimoine-postgres pg_isready -U patrimoine_user -d patrimoine

# Créer un utilisateur super user pour éviter les problèmes de permissions
echo "👤 Configuration des permissions utilisateur..."
docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'patrimoine_user') THEN
      CREATE USER patrimoine_user WITH PASSWORD 'patrimoine_password_2024';
    END IF;
    
    ALTER USER patrimoine_user CREATEDB;
    ALTER USER patrimoine_user SUPERUSER;
    GRANT ALL PRIVILEGES ON DATABASE patrimoine TO patrimoine_user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO patrimoine_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO patrimoine_user;
  END
  \$\$;
"

# Vérifier les permissions
echo "🔍 Vérification des permissions..."
docker exec patrimoine-postgres psql -U patrimoine_user -d patrimoine -c "\\du"

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Appliquer les migrations
echo "📋 Application des migrations..."
npx prisma migrate deploy

# Optionnel : seeder la base
echo "🌱 Seeding de la base (optionnel)..."
if [ -f "prisma/seed.ts" ]; then
  npx prisma db seed
fi

echo "✅ Initialisation terminée !"
echo ""
echo "🎉 Votre base de données est maintenant configurée correctement."
echo "📋 Redémarrez votre application Next.js pour tester." 