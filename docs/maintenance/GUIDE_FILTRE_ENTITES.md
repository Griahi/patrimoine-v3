# 🎯 Guide d'Utilisation - Filtre d'Entités

## 🚀 Démarrage Rapide

### 1. **Connexion**
```
Email: test@example.com
Mot de passe: password123
```

### 2. **Accès au Dashboard**
- Allez sur `/dashboard`
- Le filtre d'entités apparaît automatiquement sous le header
- Vous verrez une carte **"Filtrage par Entité"**

## 🎨 **Interface du Filtre**

### **Entités disponibles :**
- 👤 **Max Riahi** (Personne physique)
- 👤 **Sophie Riahi** (Personne physique)  
- 🏢 **SARL TechCorp** (Personne morale)
- 👤 **Gilles Riahi** (Personne physique)

### **Fonctionnalités :**
- ✅ **Sélection multiple** avec cases à cocher
- 🔍 **Recherche rapide** par nom d'entité
- 🌐 **"Tout sélectionner"** / **"Tout désélectionner"**
- 💾 **Persistance automatique** (se souvient de votre sélection)
- 📊 **Statistiques** : Compteurs personnes physiques/morales

## 📱 **Modes d'Affichage**

### **Résumé de sélection :**
- **0 sélectionnée** : "Toutes les entités" 🌍
- **1 sélectionnée** : "Max Riahi" 👤
- **2-3 sélectionnées** : "Max Riahi, Sophie Riahi" 👥
- **4+ sélectionnées** : "Max Riahi, Sophie Riahi + 2 autres" 👥

## 🎯 **Cas d'Usage**

### **Analyse Familiale** 👨‍👩‍👧‍👦
```
✅ Sélectionner "Max Riahi" + "Sophie Riahi"
→ Vue consolidée du patrimoine familial
```

### **Analyse Professionnelle** 💼
```
✅ Sélectionner "SARL TechCorp" + "Max Riahi"
→ Patrimoine professionnel + personnel
```

### **Analyse Individuelle** 👤
```
✅ Sélectionner "Max Riahi" uniquement
→ Patrimoine personnel de Max
```

## 🔄 **Fonctionnement**

### **Rechargement Automatique :**
- Dès que vous changez la sélection
- Les métriques se mettent à jour instantanément
- Les graphiques sont recalculés
- Les listes d'actifs sont filtrées

### **Persistance :**
- Votre sélection est sauvegardée automatiquement
- Au prochain chargement, vos filtres sont restaurés
- Fonctionne même après fermeture du navigateur

## 🛠️ **Actifs de Test Créés**

### **Répartition par Entité :**
- **Max Riahi** : 50% Maison principale + 100% Compte BNP
- **Sophie Riahi** : 50% Maison principale  
- **SARL TechCorp** : 100% Actions Apple
- **Gilles Riahi** : 100% Appartement locatif

### **Valeurs totales :**
- **Maison principale** : 950.000 € (partagée 50/50)
- **Compte BNP** : 25.000 € (Max)
- **Actions Apple** : 9.500 € (SARL TechCorp)
- **Appartement locatif** : 720.000 € (Gilles)

## 🎊 **Testez le Système !**

1. **Connexion** avec `test@example.com` / `password123`
2. **Allez au Dashboard** (`/dashboard`)
3. **Utilisez le filtre** pour voir les différentes vues
4. **Testez les sélections multiples**
5. **Vérifiez la persistance** (rechargez la page)

---

## 🆘 **Dépannage**

### **Le filtre n'apparaît pas ?**
- Vérifiez que vous êtes connecté avec `test@example.com`
- Assurez-vous d'être sur `/dashboard`
- Les entités doivent être créées (script seed exécuté)

### **Pas d'entités visibles ?**
- Reconnectez-vous avec le bon compte
- Vérifiez que le seed a été exécuté : `npm run db:seed`

### **Données non filtrées ?**
- Rechargez la page
- Vérifiez la console pour les erreurs
- Testez avec une sélection simple (1 entité)

---

**🎯 Status : ✅ SYSTEM FONCTIONNEL**

Le système de filtrage par entités multi-sélection est maintenant pleinement opérationnel dans votre application Patrimoine Manager ! 