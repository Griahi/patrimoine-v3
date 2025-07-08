# Filtrage Multi-Sélection par Entités - Tableau de Bord

## Vue d'ensemble

Le tableau de bord dispose maintenant d'un système de filtrage avancé avec **sélection multiple** permettant de visualiser le patrimoine de plusieurs entités simultanément (par exemple Max et Gilles ensemble).

## 🆕 Nouvelles Fonctionnalités

### 1. **Sélection Multiple par Checkboxes**
- **Interface intuitive** : Cases à cocher pour chaque entité
- **Sélection flexible** : Combiner plusieurs entités selon vos besoins
- **Feedback visuel** : Entités sélectionnées mises en évidence

### 2. **Contrôles de Sélection**
- **Tout sélectionner** : Bouton pour sélectionner toutes les entités d'un coup
- **Tout désélectionner** : Bouton pour revenir à la vue globale
- **Sélection intelligente** : Clic sur la carte d'entité pour toggle la sélection

### 3. **Affichage Adaptatif**
Le système s'adapte intelligemment selon le nombre d'entités sélectionnées :
- **0 sélectionnée** : "Toutes les entités" (vue globale)
- **1 sélectionnée** : Nom de l'entité (ex: "Max Riahi")
- **2-3 sélectionnées** : Noms séparés par virgules (ex: "Max, Gilles")
- **Plus de 3** : Format condensé (ex: "Max, Gilles + 2 autres")

## 🎯 Cas d'Usage

### **Analyse Comparative**
```
✅ Sélectionner Max et Gilles
→ Voir leur patrimoine combiné
→ Comparer leurs répartitions d'actifs
```

### **Analyse Familiale**
```
✅ Sélectionner tous les membres de la famille
→ Vue d'ensemble du patrimoine familial
→ Répartition par personne dans le top 5
```

### **Analyse Société + Dirigeants**
```
✅ Sélectionner SARL + Max + Gilles
→ Patrimoine professionnel et personnel
→ Analyse consolidée
```

## 🔧 Architecture Technique

### API Endpoint Modifié
```
GET /api/dashboard?entityIds=id1,id2,id3
```

### Logique de Filtrage
```typescript
// Filtrage multiple avec Prisma
const entityFilter = entityIds && entityIds.length > 0 
  ? { id: { in: entityIds } } 
  : {}
```

### Interface État-Centrique
```typescript
const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([])

// Toggle sélection
const toggleEntitySelection = (entityId: string) => {
  setSelectedEntityIds(prev => 
    prev.includes(entityId)
      ? prev.filter(id => id !== entityId)
      : [...prev, entityId]
  )
}
```

## 🎨 Interface Utilisateur

### **Carte de Filtrage**
- **Titre** : "Filtrer par Entités" (pluriel)
- **Description** : Guide d'utilisation avec exemple
- **Résumé de sélection** : Nombre d'entités sélectionnées
- **Boutons d'action** : Tout sélectionner / Tout désélectionner

### **Cartes d'Entités**
- **Layout responsive** : 1-3 colonnes selon l'écran
- **Checkbox visuel** : Cases avec état sélectionné/non-sélectionné
- **Icônes distinctives** : 👤 personnes / 🏢 sociétés
- **Informations** : Nom + type (physique/morale)
- **Interaction** : Clic sur toute la carte pour sélectionner

### **États Visuels**
- **Non sélectionnée** : Bordure neutre, fond transparent
- **Sélectionnée** : Bordure colorée, fond teinté, checkbox cochée
- **Hover** : Effet de survol pour améliorer l'UX

## 📊 Adaptation des Métriques

### **Patrimoine Total**
- Somme des actifs des entités sélectionnées uniquement
- Performance calculée sur le sous-ensemble

### **Nombre d'Entités**
- Affiche le nombre d'entités sélectionnées
- Libellé adaptatif selon le contexte

### **Graphiques**
- **Répartition** : Basée sur les entités filtrées
- **Évolution** : Historique des entités sélectionnées
- **Descriptions** : Mentionnent les entités concernées

### **Top 5 Actifs**
- Filtré sur les entités sélectionnées
- Nom du propriétaire masqué si plusieurs entités sélectionnées
- Affiché si vue globale (0 sélection)

## 🚀 Utilisation

### **Sélection Simple**
1. Cliquer sur une entité (ex: Max)
2. Voir son patrimoine spécifique
3. Comparer avec la vue globale

### **Sélection Multiple**
1. Cliquer sur Max ✅
2. Cliquer sur Gilles ✅
3. Voir leur patrimoine combiné
4. Analyser les données consolidées

### **Gestion Rapide**
- **Tout sélectionner** : Vue complète consolidée
- **Tout désélectionner** : Retour à la vue globale
- **Ajout/Retrait** : Clic pour modifier la sélection

## 💡 Avantages

### **Flexibilité**
- **Analyses sur mesure** : Combiner les entités selon les besoins
- **Comparaisons** : Patrimoine de plusieurs personnes ensemble
- **Scénarios** : Famille, société, associés, etc.

### **Performance**
- **Requêtes optimisées** : Filtrage au niveau base de données
- **Calculs ciblés** : Uniquement les données nécessaires
- **Interface réactive** : Mise à jour en temps réel

### **Expérience Utilisateur**
- **Intuitive** : Interface familière avec checkboxes
- **Visuelle** : Feedback immédiat sur les sélections
- **Flexible** : Adaptation selon le nombre d'entités

## 🔄 Migration depuis le Filtre Simple

### **Changements Utilisateur**
- **Sélecteur unique** → **Checkboxes multiples**
- **"Toutes les entités"** → **Aucune sélection**
- **Une entité** → **Sélection multiple possible**

### **Compatibilité**
- **Comportement préservé** : 0 sélection = toutes les entités
- **Fonctionnalités étendues** : Sélection multiple en plus
- **Performance maintenue** : Même niveau d'optimisation

---

**Cette évolution majeure permet une analyse patrimoniale beaucoup plus flexible et précise, répondant aux besoins réels de gestion multi-entités !** 🎉 