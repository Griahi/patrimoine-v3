# Guide du Système de Sauvegarde - Patrimoine Manager

## Vue d'ensemble

Le système de sauvegarde vous permet de créer, gérer et restaurer vos données patrimoniales de manière sécurisée. Toutes vos données sont exportées au format JSON et peuvent être téléchargées pour un stockage hors ligne.

## Fonctionnalités

### 🔐 Sécurité
- Chaque utilisateur ne peut accéder qu'à ses propres sauvegardes
- Authentification requise pour toutes les opérations
- Validation des permissions côté serveur

### 📦 Données sauvegardées
- **Utilisateur** : Informations de profil
- **Entités** : Personnes physiques et morales
- **Actifs** : Tous types d'actifs patrimoniaux
- **Valorisations** : Historique des valorisations
- **Dettes** : Prêts et financements
- **Alertes** : Système d'alertes intelligent
- **Fiscalité** : Profils et optimisations fiscales
- **Dashboard** : Configurations et préférences
- **Intégrations** : Connexions API (Bridge, Yahoo Finance)

## Utilisation via Interface Web

### Accès
1. Rendez-vous sur `/backup` dans votre application
2. Authentifiez-vous si nécessaire

### Créer une sauvegarde
1. Cliquez sur "📦 Créer une Sauvegarde"
2. Attendez la fin du processus
3. Consultez les statistiques de sauvegarde
4. Votre fichier apparaît dans la liste

### Télécharger une sauvegarde
1. Trouvez la sauvegarde dans la liste
2. Cliquez sur "📥 Télécharger"
3. Le fichier JSON est téléchargé

### Supprimer une sauvegarde
1. Cliquez sur "🗑️ Supprimer" à côté du fichier
2. Confirmez la suppression

### Nettoyage automatique
- Cliquez sur "🧹 Nettoyer" pour supprimer les anciennes sauvegardes
- Les 10 plus récentes sont conservées

## Utilisation via CLI

### Créer une sauvegarde
```bash
# Sauvegarde pour un utilisateur spécifique
node scripts/backup-user-data.js <user-id>

# Exemple
node scripts/backup-user-data.js clx123abc456def
```

### Lister les sauvegardes
```bash
node scripts/backup-user-data.js _ list
```

### Nettoyage
```bash
node scripts/backup-user-data.js _ cleanup
```

## Restauration des données

### Simulation (recommandé)
```bash
# Simuler une restauration pour vérifier
node scripts/restore-user-data.js backup_user_2024-01-15T10-30-00.json --dry-run
```

### Restauration réelle
```bash
# Restaurer pour le même utilisateur
node scripts/restore-user-data.js backup_user_2024-01-15T10-30-00.json

# Restaurer pour un autre utilisateur
node scripts/restore-user-data.js backup_user_2024-01-15T10-30-00.json --user-id=new-user-id

# Écraser les données existantes
node scripts/restore-user-data.js backup_user_2024-01-15T10-30-00.json --overwrite
```

## Structure du fichier de sauvegarde

```json
{
  "metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "userId": "clx123abc456def",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "version": "1.0.0"
  },
  "user": { ... },
  "entities": [ ... ],
  "assetTypes": [ ... ],
  "assets": [ ... ],
  "alerts": [ ... ],
  "taxProfile": { ... },
  "dashboardLayouts": [ ... ],
  // ... autres données
}
```

## Cas d'usage typiques

### 1. Sauvegarde régulière
```bash
# Créer une sauvegarde hebdomadaire
node scripts/backup-user-data.js <user-id>
```

### 2. Migration vers un nouvel environnement
```bash
# 1. Créer la sauvegarde
node scripts/backup-user-data.js <old-user-id>

# 2. Simuler la restauration
node scripts/restore-user-data.js backup.json --user-id=<new-user-id> --dry-run

# 3. Restaurer réellement
node scripts/restore-user-data.js backup.json --user-id=<new-user-id>
```

### 3. Récupération après incident
```bash
# Restaurer la dernière sauvegarde
node scripts/restore-user-data.js backup_latest.json --overwrite
```

### 4. Duplication de données de test
```bash
# Créer un compte de test avec des données réelles
node scripts/restore-user-data.js backup_prod.json --user-id=test-user-id
```

## Maintenance et bonnes pratiques

### Fréquence des sauvegardes
- **Quotidienne** : Pour les utilisateurs actifs
- **Hebdomadaire** : Pour usage normal
- **Avant modifications importantes** : Toujours

### Stockage
- Téléchargez régulièrement vos sauvegardes
- Stockez-les dans un endroit sécurisé
- Vérifiez périodiquement leur intégrité

### Nettoyage
- Les anciennes sauvegardes sont automatiquement supprimées
- Vous pouvez ajuster le nombre de sauvegardes conservées dans le code

## API Endpoints

### POST /api/backup
- `action: "create"` - Créer une sauvegarde
- `action: "list"` - Lister les sauvegardes
- `action: "cleanup"` - Nettoyer les anciennes sauvegardes

### GET /api/backup
- `?action=list` - Lister les sauvegardes
- `?action=download&filename=...` - Télécharger une sauvegarde

### DELETE /api/backup
- `filename: "..."` - Supprimer une sauvegarde

## Sécurité et confidentialité

### Données sensibles
- Les mots de passe ne sont PAS sauvegardés
- Les tokens d'API sont inclus (attention au partage)
- Les données fiscales sont sauvegardées

### Bonnes pratiques
- Chiffrez vos sauvegardes si vous les stockez dans le cloud
- Ne partagez jamais vos fichiers de sauvegarde
- Utilisez des connexions sécurisées pour les téléchargements

## Dépannage

### Erreurs communes

**"Utilisateur introuvable"**
- Vérifiez l'ID utilisateur
- Assurez-vous que l'utilisateur existe

**"Fichier non trouvé"**
- Vérifiez le nom du fichier
- Assurez-vous que le fichier existe dans le dossier `backups/`

**"Erreur de permission"**
- Vérifiez les droits d'accès au dossier `backups/`
- Assurez-vous d'être connecté

### Logs
- Consultez les logs de l'application pour plus de détails
- Les scripts affichent des messages détaillés

## Support

Pour toute question ou problème :
1. Consultez les logs d'erreur
2. Vérifiez la documentation
3. Contactez l'équipe de support

---

*Ce guide est maintenu à jour avec les dernières versions du système de sauvegarde.* 