# 🔄 Guide de Migration - Système d'Authentification Unifié

## 📋 Résumé des Changements

### **✅ Supprimé (Problèmes de Sécurité)**
- ❌ Utilisateurs hardcodés (FALLBACK_USERS)
- ❌ Cookie "auth-session" (fallback)
- ❌ Pages /dev-access et /diagnostics
- ❌ Endpoints /api/auth/quick-access
- ❌ Fichiers auth-helper.ts et auth-utils.ts
- ❌ Routes de test (test-auth, debug-cookies, etc.)

### **✅ Nouveau Système Unifié**
- ✅ Système JWT unique dans auth.ts
- ✅ Cookie "session" seulement
- ✅ Validation des variables d'environnement
- ✅ Système de seeding sécurisé
- ✅ Middleware simplifié

---

## 🚀 Instructions de Migration

### **Étape 1 : Configurer les Variables d'Environnement**

1. **Générer des secrets forts :**
```bash
# Générer JWT_SECRET
openssl rand -base64 32

# Générer NEXTAUTH_SECRET  
openssl rand -base64 32
```

2. **Créer/Mettre à jour .env.local :**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/patrimoine_db"
JWT_SECRET="[VOTRE-SECRET-JWT-32-CARACTERES]"
NEXTAUTH_SECRET="[VOTRE-SECRET-NEXTAUTH-32-CARACTERES]"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### **Étape 2 : Mettre à Jour la Base de Données**

1. **Générer le client Prisma :**
```bash
npm run db:generate
```

2. **Lancer les migrations :**
```bash
npm run db:migrate
```

3. **Créer les utilisateurs de test (développement) :**
```bash
npm run db:seed
```

### **Étape 3 : Vérifier l'Installation**

1. **Démarrer l'application :**
```bash
npm run dev
```

2. **Tester la connexion avec les comptes créés :**
- Email: `test@example.com` / Password: `password123`
- Email: `demo@patrimoine.com` / Password: `demo123`
- Email: `admin@patrimoine.com` / Password: `SecureAdminPassword2025!`

### **Étape 4 : Nettoyer les Sessions Existantes**

Si vous aviez des sessions actives avec l'ancien système :

1. **Supprimer les cookies de navigateur :**
   - Ouvrir DevTools → Application → Cookies
   - Supprimer tous les cookies du domaine

2. **Redémarrer l'application :**
```bash
# Arrêter et redémarrer
npm run dev
```

---

## 🔒 Guide de Sécurité

### **Variables d'Environnement Critiques**

| Variable | Développement | Production | Obligatoire |
|----------|---------------|------------|-------------|
| JWT_SECRET | Recommandé | **OBLIGATOIRE** | ✅ |
| NEXTAUTH_SECRET | Optionnel | **OBLIGATOIRE** | ✅ |
| DATABASE_URL | Requis | **OBLIGATOIRE** | ✅ |
| NODE_ENV | "development" | "production" | ✅ |

### **Validation Automatique**
Le système vérifie automatiquement :
- ✅ Secrets forts en production (32+ caractères)
- ✅ Variables requises présentes
- ⚠️ Avertissements en développement

### **Erreurs Courantes**

#### **Erreur : "JWT_SECRET must be set"**
```bash
# Solution : Ajouter dans .env.local
JWT_SECRET="$(openssl rand -base64 32)"
```

#### **Erreur : "User not found"**
```bash
# Solution : Lancer le seeding
npm run db:seed
```

#### **Erreur : "Session expired"**
```bash
# Solution : Supprimer les cookies et se reconnecter
# Ou redémarrer l'application
```

---

## 🧪 Tests de Validation

### **Tests Automatiques**
```bash
# Lancer les tests d'authentification
npm test

# Test de sécurité (pas encore implémenté)
npm run test:security
```

### **Tests Manuels**

1. **Test de Connexion :**
   - ✅ Connexion avec email/password valides
   - ❌ Connexion avec credentials invalides
   - ✅ Redirection après connexion
   - ✅ Déconnexion complète

2. **Test de Sécurité :**
   - ❌ Accès aux anciennes routes de test (doivent retourner 404)
   - ❌ Tentative d'utilisation des anciens cookies
   - ✅ Protection des routes privées

3. **Test de Session :**
   - ✅ Session persiste après rechargement
   - ✅ Session expire après 24h
   - ✅ Middleware protège les routes

---

## 🔄 Rollback (Si Nécessaire)

Si vous rencontrez des problèmes critiques :

### **Rollback Git**
```bash
git log --oneline  # Trouver le commit avant les changements
git reset --hard [COMMIT-HASH]
```

### **Restaurer les Données**
```bash
# Si vous avez une sauvegarde
npm run db:reset
# Puis restaurer vos données
```

---

## 📞 Support

### **Problèmes Courants**
1. **Sessions perdues** → Supprimer cookies + redémarrer
2. **Erreurs de variables** → Vérifier .env.local
3. **Base de données** → Relancer migrations + seed

### **Logs de Debug**
Activez les logs détaillés :
```bash
DEBUG=auth* npm run dev
```

### **Contact Support**
- 📋 Issues GitHub avec label "authentication"
- 📄 Documentation : `AUTHENTICATION_AUDIT_RECOMMENDATIONS.md`
- 🔐 Sécurité : Suivre `ENVIRONMENT_VARIABLES.md`

---

## ✅ Checklist de Migration

### **Avant Migration**
- [ ] Sauvegarder la base de données
- [ ] Noter les utilisateurs actifs
- [ ] Vérifier les variables d'environnement

### **Pendant Migration**
- [ ] Générer secrets forts
- [ ] Configurer .env.local
- [ ] Lancer migrations DB
- [ ] Exécuter seeding
- [ ] Tester connexion

### **Après Migration**
- [ ] Vérifier aucune route de test accessible
- [ ] Confirmer sessions fonctionnelles
- [ ] Valider sécurité renforcée
- [ ] Former l'équipe sur nouveau système

---

**🎉 Migration Complète !** Votre système d'authentification est maintenant sécurisé et unifié. 