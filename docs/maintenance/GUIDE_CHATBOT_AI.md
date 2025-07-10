# 🤖 Guide du Chatbot AI - Assistant Patrimonial

## 🎯 **Localisation et Activation**

### **Position du Chatbot**
- **Localisation** : Coin inférieur droit de l'écran
- **Bouton flottant** : Icône de message avec dégradé bleu/violet
- **Toujours visible** : Disponible sur toutes les pages de l'application

### **Activation**
1. **Cliquez** sur l'icône de chat flottante
2. **Ouverture animée** : Fenêtre de chat se déploie avec animation
3. **Message de bienvenue** : L'assistant vous accueille automatiquement

## 🎨 **Interface et Fonctionnalités**

### **Fenêtre de Chat**
- **Dimensions** : 384px × 600px (responsive)
- **Style** : Carte moderne avec ombres et transparence
- **Header** : Titre "Assistant Patrimonial" avec icônes d'actions
- **Footer** : Zone de saisie avec bouton d'envoi

### **Contrôles du Header**
- **🔽/🔼** : Afficher/masquer les suggestions
- **🗑️** : Vider l'historique des messages
- **✖️** : Fermer la fenêtre de chat

### **Zone de Messages**
- **Messages utilisateur** : Bulles bleues alignées à droite
- **Messages assistant** : Bulles grises alignées à gauche
- **Avatars** : Icônes utilisateur (👤) et robot (🤖)
- **Horodatage** : Heure d'envoi de chaque message
- **Bouton copier** : Pour copier le contenu des messages

## 💬 **Utilisation du Chat**

### **Saisie de Messages**
1. **Tapez votre question** dans la zone de saisie
2. **Appuyez sur Entrée** ou cliquez sur le bouton d'envoi
3. **Attendez la réponse** : Indicateur de chargement animé
4. **Lisez la réponse** : Message de l'assistant avec informations détaillées

### **Exemples de Questions**
```
💼 Patrimoine :
- "Quelle est ma performance globale ce mois-ci ?"
- "Montre-moi ma répartition d'actifs"
- "Quel est le total de mon patrimoine ?"

💰 Finances :
- "Combien je paie de frais bancaires ?"
- "Quels sont mes revenus locatifs ?"
- "Analyse mes dépenses récentes"

📊 Analyses :
- "Est-ce que je suis bien diversifié ?"
- "Quelles sont mes meilleures performances ?"
- "Recommande-moi des optimisations"

🔍 Recherche :
- "Trouve mes actions technologiques"
- "Quels sont mes investissements risqués ?"
- "Montre-moi mes biens immobiliers"
```

## 🎯 **Suggestions Contextuelles**

### **Suggestions Automatiques**
- **Suggestions initiales** : 4 questions prédéfinies au démarrage
- **Suggestions dynamiques** : Basées sur vos données et historique
- **Clic pour utiliser** : Cliquez sur une suggestion pour l'envoyer

### **Types de Suggestions**
- **Questions courantes** : Performance, répartition, frais
- **Analyses personnalisées** : Basées sur votre profil
- **Actions recommandées** : Optimisations suggérées
- **Informations contextuelles** : Données pertinentes à afficher

## 💾 **Historique et Persistance**

### **Sauvegarde Automatique**
- **localStorage** : Historique sauvegardé localement
- **Persistance** : Messages conservés entre les sessions
- **Limite** : Maximum 50 messages stockés
- **Nettoyage** : Ancien historique automatiquement supprimé

### **Gestion de l'Historique**
- **Bouton vider** : Supprime tous les messages
- **Suppression individuelle** : Pas encore implémentée
- **Rechargement** : Messages restaurés au redémarrage

## 📊 **Réponses Enrichies**

### **Types de Réponses**
- **Texte simple** : Réponses directes et informatives
- **Graphiques** : Visualisations de données patrimoniales
- **Tableaux** : Données structurées
- **Liens** : Redirections vers pages pertinentes

### **Données Intégrées**
- **API Dashboard** : Accès aux données de performance
- **API Entities** : Informations sur les entités
- **API Assets** : Détails des actifs
- **API Debts** : Informations sur les dettes

## ⚙️ **Fonctionnalités Techniques**

### **Authentification**
- **Connexion requise** : Nécessite d'être connecté
- **Erreur 401** : Message d'erreur si non authentifié
- **Session** : Utilise la session utilisateur active

### **Gestion d'Erreurs**
- **Retry** : Bouton réessayer en cas d'erreur
- **Toast** : Notifications d'erreur
- **Fallback** : Messages d'erreur informatifs

### **Performance**
- **Timeout** : Requêtes limitées dans le temps
- **Chargement** : Indicateurs visuels pendant le traitement
- **Optimisation** : Requêtes asynchrones non bloquantes

## 🎨 **Personnalisation**

### **Thème et Style**
- **Dégradé** : Bleu vers violet pour l'identité
- **Transparence** : Arrière-plan semi-transparent
- **Animations** : Transitions fluides avec Framer Motion
- **Responsive** : Interface adaptée aux écrans mobiles

### **Accessibilité**
- **Contraste** : Couleurs avec bon contraste
- **Navigation** : Accessible au clavier
- **ARIA** : Labels pour les lecteurs d'écran
- **Focus** : Indicateurs de focus visibles

## 🔧 **Maintenance et Développement**

### **Fichiers Principaux**
- `src/components/ai/ChatWidget.tsx` - Interface principal
- `src/hooks/useAIChat.ts` - Logique de chat
- `src/app/api/ai/chat/route.ts` - API backend
- `src/types/ai.ts` - Types TypeScript

### **Tests**
- `scripts/test-chatbot.js` - Script de test automatique
- Tests d'intégration disponibles
- Vérification des dépendances

### **Dépendances**
- `framer-motion` - Animations
- `lucide-react` - Icônes
- `sonner` - Notifications toast
- `react` - Framework principal

## 🚀 **Améliorations Futures**

### **Fonctionnalités Prévues**
- **Commandes vocales** : Reconnaissance vocale
- **Réponses audio** : Synthèse vocale
- **Fichiers joints** : Upload de documents
- **Historique exportable** : Sauvegarde des conversations

### **Intégrations**
- **Calendrier** : Rappels et événements
- **Notifications** : Alertes proactives
- **Rapports** : Génération automatique
- **Optimisations** : Suggestions IA avancées

---

## 📞 **Support et Questions**

Pour toute question ou problème avec le chatbot :
1. **Vérifiez** que vous êtes connecté
2. **Testez** avec les exemples fournis
3. **Consultez** la console pour les erreurs
4. **Redémarrez** l'application si nécessaire

**Le chatbot est maintenant opérationnel et prêt à vous assister dans la gestion de votre patrimoine !** 🎉 