# 🔐 Variables d'Environnement - Guide Sécurisé

## Variables Requises

### **Base de Données**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/patrimoine_db"
```

### **Authentification JWT** (CRITIQUE)
```bash
# Secret JWT minimum 32 caractères
# Générer: openssl rand -base64 32
JWT_SECRET="your-super-secure-jwt-secret-key-minimum-32-characters"
```

### **NextAuth.js Secret** (CRITIQUE)
```bash
# Secret NextAuth minimum 32 caractères  
# Générer: openssl rand -base64 32
NEXTAUTH_SECRET="your-super-secure-nextauth-secret-minimum-32-characters"
```

### **URL Application**
```bash
NEXTAUTH_URL="http://localhost:3000"  # Development
NEXTAUTH_URL="https://votre-domaine.com"  # Production
```

### **Environnement**
```bash
NODE_ENV="development"  # ou "production"
```

## Variables Optionnelles

### **Redis (pour les sessions)**
```bash
REDIS_URL="redis://localhost:6379"
```

### **APIs Externes**
```bash
OPENAI_API_KEY="your-openai-api-key"
BRIDGE_CLIENT_ID="your-bridge-client-id"
BRIDGE_CLIENT_SECRET="your-bridge-client-secret"
```

## ⚠️ SÉCURITÉ - Points Critiques

### **Secrets Forts Requis**
- **JWT_SECRET** : Minimum 32 caractères aléatoires
- **NEXTAUTH_SECRET** : Minimum 32 caractères aléatoires
- **Jamais** les mêmes valeurs en dev et prod

### **Génération de Secrets Sécurisés**
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online (attention aux fuites)
# https://generate-secret.vercel.app/32
```

### **Variables Interdites en Production**
```bash
# ❌ NE JAMAIS UTILISER EN PRODUCTION
QUICK_ACCESS="true"
```

## 📁 Fichier .env.local

Créez un fichier `.env.local` avec vos valeurs :

```bash
# Copier ce template et remplacer par vos valeurs
DATABASE_URL="postgresql://user:password@localhost:5432/patrimoine_db"
JWT_SECRET="[GÉNÉRER UN SECRET FORT]"
NEXTAUTH_SECRET="[GÉNÉRER UN SECRET FORT]"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🚀 Déploiement Production

### **Variables Obligatoires en Production**
- ✅ `JWT_SECRET` (secret fort)
- ✅ `NEXTAUTH_SECRET` (secret fort)
- ✅ `DATABASE_URL` (base de données production)
- ✅ `NEXTAUTH_URL` (URL de production)
- ✅ `NODE_ENV="production"`

### **Vérifications Automatiques**
L'application vérifie automatiquement :
- Présence des secrets requis
- Longueur minimum des secrets
- Mode de développement vs production 