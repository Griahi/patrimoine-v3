# 🏛️ Patrimoine Manager

Une application moderne de gestion de patrimoine privé développée avec Next.js, TypeScript et PostgreSQL. Cette solution permet de centraliser, analyser et optimiser le patrimoine de personnes physiques et morales.

## 🚀 Fonctionnalités

### ✅ Phase 1 - MVP (Implémenté)

- **🏠 Gestion d'Entités** : Création et gestion de personnes physiques et morales
- **💼 Gestion d'Actifs** : Ajout et suivi d'actifs multiples (immobilier, actions, comptes, etc.)
- **📊 Dashboard Interactif** : Vue d'ensemble avec graphiques et métriques clés
- **🔗 Relations de Détention** : Liens entre entités et actifs avec pourcentages
- **💰 Valorisation** : Historique des valorisations manuelles
- **📈 Rapports & Analytics** : Analyses détaillées avec graphiques
- **🔐 Authentification Sécurisée** : Système complet d'authentification
- **📱 Interface Moderne** : Design responsive avec Tailwind CSS

### 🔄 Prochaines Phases

- **Phase 2** : Connexions APIs bancaires et boursières
- **Phase 3** : Intelligence artificielle et recommandations

## 🛠️ Stack Technique

- **Frontend** : Next.js 15, React 19, TypeScript
- **UI** : Tailwind CSS, Radix UI, Lucide Icons
- **Backend** : API Routes Next.js
- **Base de données** : PostgreSQL avec Prisma ORM
- **Authentification** : NextAuth.js
- **Charts** : Recharts
- **Validation** : Zod + React Hook Form

## 📋 Prérequis

- Node.js 18+ 
- PostgreSQL 15+
- npm ou yarn

## 🚀 Installation

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd gestion-patrimoine
```

### 2. Installer les dépendances
   ```bash
   npm install
   ```

### 3. Configuration de l'environnement

Créez un fichier `.env.local` à la racine :

   ```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/patrimoine"

# NextAuth
   NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: OAuth providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

### 4. Configuration de la base de données

   ```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# Peupler avec les données initiales
npm run db:seed
```

### 5. Démarrer l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 📊 Structure du Projet

```
├── docs/                   # Documentation projet (guides, designs, etc.)
├── src/                    # Code source de l'application
│   ├── app/               # App Router (Next.js 15)
│   │   ├── api/           # API Routes
│   │   │   ├── entities/  # CRUD entités
│   │   │   ├── assets/    # CRUD actifs
│   │   │   └── asset-types/ # Types d'actifs
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── entities/      # Gestion des entités
│   │   ├── assets/        # Gestion des actifs
│   │   ├── reports/       # Rapports et analytics
│   │   └── settings/      # Paramètres utilisateur
│   ├── components/        # Composants réutilisables
│   │   ├── ui/           # Composants UI de base
│   │   └── ...
│   ├── lib/              # Utilitaires et configurations
│   │   ├── auth.ts       # Configuration NextAuth
│   │   ├── prisma.ts     # Client Prisma
│   │   └── utils.ts      # Utilitaires
│   └── generated/        # Code généré (Prisma)
├── audit/                # Fichiers d'audit et de maintenance
├── scripts/              # Scripts de développement et déploiement
└── prisma/               # Schéma et migrations de base de données
```

## 📚 Documentation

La documentation complète du projet est organisée dans le répertoire `docs/` :

- **Setup & Configuration** : Guides d'installation et configuration
- **Features & Components** : Documentation des fonctionnalités
- **Testing & Troubleshooting** : Guides de tests et résolution de problèmes
- **API & Integrations** : Documentation des intégrations
- **Audit & Reports** : Rapports d'audit et analyses

Consultez `docs/README.md` pour un index complet de la documentation.

## 🗄️ Modèle de Données

### Entités Principales

- **Users** : Utilisateurs de l'application
- **Entities** : Personnes physiques/morales
- **Assets** : Actifs patrimoniaux
- **AssetTypes** : Types d'actifs (immobilier, actions, etc.)
- **Ownerships** : Relations de détention
- **Valuations** : Historique des valorisations

### Relations

- Un utilisateur peut gérer plusieurs entités
- Une entité peut détenir plusieurs actifs
- Un actif peut avoir plusieurs valorisations dans le temps
- Les relations de détention incluent les pourcentages

## 🎨 Interface Utilisateur

### Pages Principales

1. **Dashboard** (`/dashboard`)
   - Vue d'ensemble du patrimoine
   - Graphiques de répartition
   - Métriques clés

2. **Entités** (`/entities`)
   - Liste des entités
   - Création/modification d'entités
   - Statistiques par entité

3. **Actifs** (`/assets`)
   - Inventaire des actifs
   - Ajout de nouveaux actifs
   - Répartition par type

4. **Rapports** (`/reports`)
   - Analyses détaillées
   - Graphiques avancés
   - Export de données

5. **Paramètres** (`/settings`)
   - Configuration utilisateur
   - Préférences de sécurité

## 🔐 Sécurité

- Authentification JWT avec NextAuth.js
- Protection des routes API
- Validation des données avec Zod
- Isolation des données par utilisateur
- Chiffrement des mots de passe avec bcrypt

## 📦 Scripts Disponibles

```bash
# Développement
npm run dev                 # Démarrer en mode développement
npm run build              # Build de production
npm run start              # Démarrer en production
npm run lint               # Linter le code
npm test                   # Exécuter les tests

# Base de données
npm run db:generate        # Générer le client Prisma
npm run db:push           # Pousser le schema vers la DB
npm run db:migrate        # Appliquer les migrations
npm run db:seed           # Peupler la base de données

# Maintenance et audit
./scripts/run-audit.sh     # Audit complet du projet
./scripts/maintenance-cleanup.sh  # Nettoyage et maintenance
./scripts/fix-eslint-batch.sh     # Correction automatique ESLint
```

## 🧪 Tests et Qualité

### Exécution des tests
```bash
npm test                   # Tests unitaires
npm run test:watch        # Tests en mode watch
npm run test:coverage     # Coverage des tests
```

### Qualité du code
```bash
npm run lint              # ESLint
npm run lint:fix          # Correction automatique
npm audit                 # Vérification des vulnérabilités
npx depcheck             # Dépendances inutilisées
```

### Audit de sécurité
```bash
./scripts/run-audit.sh    # Audit complet (sécurité, performance, code)
```

## 🚀 Déploiement

### Variables d'environnement de production

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
```

### Déploiement sur Vercel

1. Connecter le projet à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement via Git

## 🛣️ Roadmap

### Phase 2 - Intégrations (3-4 mois)
- [ ] API Bridge/Budget Insight (banques)
- [ ] API Yahoo Finance/Alpha Vantage (bourse)
- [ ] Synchronisation automatique
- [ ] Système de permissions avancé

### Phase 3 - Intelligence (4 mois)
- [ ] Moteur d'alertes
- [ ] Suggestions IA (OpenAI)
- [ ] Scénarios de simulation
- [ ] Assistant conversationnel

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🔧 Troubleshooting

### Problèmes fréquents

#### Base de données
```bash
# Erreur de connexion PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE patrimoine;"
sudo -u postgres psql -c "CREATE USER dev WITH PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE patrimoine TO dev;"

# Reset complet de la base
npm run db:reset
npm run db:migrate
npm run db:seed
```

#### Build et déploiement
```bash
# Erreurs ESLint bloquantes
npm run lint:fix
./scripts/fix-eslint-batch.sh

# Problème de mémoire lors du build
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Cache Next.js corrompu
rm -rf .next
npm run build
```

#### Performance
```bash
# Analyse bundle size
npm install -g webpack-bundle-analyzer
npm run analyze

# Nettoyage et optimisation
./scripts/maintenance-cleanup.sh --deep
```

### Commandes de diagnostic
```bash
# Vérification de santé complète
./scripts/run-audit.sh

# État des services
npx prisma db seed
npm run db:status
docker ps  # Si utilisation Docker
```

## ❓ FAQ

### **Q: Comment ajouter un nouveau type d'actif ?**
R: Modifiez le seed dans `prisma/seed.ts` et exécutez `npm run db:seed`

### **Q: L'application est lente, que faire ?**
R: 
1. Exécutez `./scripts/maintenance-cleanup.sh`
2. Vérifiez les index de base de données
3. Analysez le bundle avec `npm run analyze`

### **Q: Comment sauvegarder les données ?**
R: 
```bash
pg_dump patrimoine > backup.sql
# Restauration : psql patrimoine < backup.sql
```

### **Q: Erreur "Module not found" après npm install ?**
R: 
```bash
rm -rf node_modules package-lock.json
npm install
npm run db:generate
```

### **Q: Comment configurer les intégrations bancaires ?**
R: Consultez `src/lib/integrations/` et configurez les API keys dans `.env.local`

### **Q: L'authentification ne fonctionne pas ?**
R: Vérifiez :
- `NEXTAUTH_SECRET` dans `.env.local`
- `NEXTAUTH_URL` correspond à votre domaine
- La base de données est accessible

## 📊 Monitoring et Métriques

### Health Check
L'application expose un endpoint de santé :
```bash
curl http://localhost:3000/api/health
```

### Métriques disponibles
- **Performance** : Bundle size, temps de chargement
- **Base de données** : Connexions, requêtes lentes
- **Sécurité** : Vulnérabilités npm, audit des dépendances
- **Qualité** : Coverage des tests, ESLint score

### Logs
```bash
# Logs de l'application
tail -f logs/app.log

# Logs de base de données
tail -f logs/db.log
```

## 🆘 Support

### Pour les développeurs

1. **Documentation technique** : Consultez les fichiers `audit/*.md`
2. **Architecture** : Voir `ARCHITECTURE.md` (à créer)
3. **API Documentation** : `http://localhost:3000/api/docs` (si configuré)

### Problèmes et bugs

1. **Issues GitHub** : Utilisez les templates fournis
2. **Logs d'erreur** : Incluez les logs complets
3. **Environnement** : Précisez OS, Node.js, navigateur

### Canaux de support

- 🐛 **Bugs** : GitHub Issues
- 💡 **Features** : GitHub Discussions  
- 📧 **Support** : support@patrimoine-manager.com
- 📚 **Documentation** : Wiki du projet

---

**Patrimoine Manager** - La solution moderne pour la gestion de patrimoine privé 🏛️