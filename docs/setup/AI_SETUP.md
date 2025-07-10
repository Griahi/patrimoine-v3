# Configuration de l'Assistant IA

## Vue d'ensemble

L'assistant patrimonial IA utilise OpenAI GPT-4 pour analyser les questions des utilisateurs et fournir des réponses personnalisées basées sur leurs données patrimoniales.

## Configuration requise

### 1. Clé API OpenAI

Ajoutez votre clé API OpenAI dans votre fichier `.env.local` :

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Pour obtenir une clé API :
1. Créez un compte sur [OpenAI Platform](https://platform.openai.com)
2. Allez dans la section "API Keys"
3. Créez une nouvelle clé secrète
4. Copiez la clé dans votre fichier d'environnement

### 2. Installation des dépendances

Les dépendances OpenAI ont été ajoutées au package.json. Installez-les :

```bash
npm install
```

## Fonctionnalités

### Assistant Chat
- Widget flottant en bas à droite de l'écran
- Interface moderne style ChatGPT
- Animations fluides avec Framer Motion
- Support des graphiques intégrés
- Historique persisté dans localStorage

### Analyse NLP
- Détection d'intention automatique
- Extraction d'entités (actifs, banques, etc.)
- Analyse temporelle des requêtes
- Support du français naturel

### Réponses intelligentes
- Contexte enrichi avec les vraies données patrimoniales
- Calculs en temps réel des performances
- Suggestions contextuelles
- Graphiques interactifs avec Recharts

## Exemples de questions supportées

- "Quelle est ma performance globale ce mois-ci ?"
- "Montre-moi l'évolution de mon immobilier sur 5 ans"
- "Combien je paie de frais bancaires au total ?"
- "Est-ce que je suis bien diversifié ?"
- "Quel est mon actif le plus rentable ?"
- "Compare mes actions vs immobilier"
- "Comment optimiser ma fiscalité ?"

## Architecture technique

### Backend
- Route API : `/api/ai/chat`
- Service NLP pour l'analyse des requêtes
- Service OpenAI pour les réponses
- Intégration avec Prisma pour les données

### Frontend
- Composant `ChatWidget` réactif
- Hook `useAIChat` pour la gestion d'état
- Composant `ChartRenderer` pour les graphiques
- Types TypeScript complets

### Sécurité
- Authentification NextAuth.js requise
- Isolation des données par utilisateur
- Validation des inputs avec Zod
- Gestion d'erreurs robuste

## Coûts

L'utilisation d'OpenAI GPT-4 a un coût :
- ~$0.03 pour 1000 tokens d'entrée
- ~$0.06 pour 1000 tokens de sortie
- Une conversation moyenne = ~2000 tokens = ~$0.10

Optimisations implémentées :
- Limitation à 1000 tokens max par réponse
- Cache potentiel pour les requêtes similaires
- Prompt engineering optimisé

## Développement

### Tester l'assistant
1. Configurez votre clé OpenAI
2. Connectez-vous à l'application
3. Cliquez sur le bouton chat en bas à droite
4. Posez vos questions sur votre patrimoine

### Personnaliser les réponses
Modifiez le prompt système dans `src/services/ai/openai-service.ts` pour adapter le ton et le style des réponses.

### Ajouter de nouveaux types d'analyse
Étendez le service NLP dans `src/services/ai/nlp-service.ts` pour supporter de nouvelles intentions.

## Surveillance

Les interactions sont loggées pour améliorer le service :
- Type d'intention détecté
- Niveau de confiance
- Temps de réponse
- Erreurs éventuelles

## Support

En cas de problème :
1. Vérifiez que la clé OpenAI est valide
2. Consultez les logs du serveur
3. Testez avec des questions simples d'abord
4. Vérifiez que l'utilisateur a des données patrimoniales

L'assistant IA est maintenant prêt à enrichir l'expérience utilisateur de votre application de gestion de patrimoine ! 🤖💰 