-- Script d'initialisation PostgreSQL pour l'application de gestion de patrimoine
-- Ce script est exécuté automatiquement lors de la création de la base de données

-- Créer l'extension uuid-ossp pour la génération d'UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer l'extension pg_stat_statements pour les statistiques de performance
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Créer l'extension pg_trgm pour la recherche textuelle avancée
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Créer l'extension btree_gin pour l'indexation avancée
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Créer l'extension pgcrypto pour les fonctions cryptographiques
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Créer l'extension unaccent pour la recherche sans accents
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Informations de configuration
DO $$
BEGIN
    RAISE NOTICE 'Base de données patrimoine initialisée avec succès';
    RAISE NOTICE 'Extensions installées: uuid-ossp, pg_stat_statements, pg_trgm, btree_gin, pgcrypto, unaccent';
    RAISE NOTICE 'Utilisateur: patrimoine_user';
    RAISE NOTICE 'Base de données: patrimoine';
END
$$; 