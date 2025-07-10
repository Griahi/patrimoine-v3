# Filtrage par Types d'Actifs - Page des Actifs

## Vue d'ensemble

La page des actifs dispose maintenant d'un **système de filtrage interactif** permettant de filtrer les actifs par type (Actions, Immobilier, etc.) en cliquant directement sur les cartes de répartition.

## 🎯 Fonctionnalités

### 1. **Cartes Cliquables**
- **Répartition par Type d'Actif** : Chaque carte est maintenant cliquable
- **Filtrage instantané** : Clic sur une carte → affichage des actifs de ce type uniquement
- **Toggle** : Re-cliquer sur la même carte désélectionne le filtre

### 2. **Indicateurs Visuels**
- **Carte sélectionnée** : Bordure bleue + fond teinté + texte coloré
- **Carte non sélectionnée** : Apparence normale avec effet hover
- **Cartes vides** : Grises et non cliquables (0 actif)

### 3. **Interface Adaptative**

#### **Bandeau de Filtre Actif**
Quand un filtre est appliqué :
- 🔍 Bandeau d'information avec le type sélectionné
- 📋 Bouton "Tous les actifs" pour reset le filtre

#### **Statistiques Dynamiques**
- **Valeur Totale** → "Valeur Filtrée" (du type sélectionné)
- **Total Actifs** → "Actifs Filtrés" (nombre du type sélectionné)
- **Descriptions** : Mentionnent le type filtré

#### **Liste des Actifs**
- **Titre adaptatif** : "Tous les Actifs" → "Actifs Immobilier"
- **Description** : Nombre d'actifs filtrés
- **Contenu** : Seuls les actifs du type sélectionné

## 🎨 Cas d'Usage Typiques

### **Analyse par Type**
```
✅ Cliquer sur "Actions" 
→ Voir uniquement les actions
→ Valeur totale des actions
→ Performance des actions
```

### **Gestion Spécialisée**
```
✅ Cliquer sur "Immobilier"
→ Focus sur le patrimoine immobilier
→ Gestion des biens immobiliers
→ Suivi des valorisations immobilières
```

### **Navigation Fluide**
```
✅ Actions → Immobilier → Tous les actifs
→ Basculement rapide entre les vues
→ Analyse comparative par segments
```

## 🔧 Implémentation Technique

### **État de Filtrage**
```typescript
const [selectedAssetTypeId, setSelectedAssetTypeId] = useState<string | null>(null)

// Actifs filtrés
const filteredAssets = selectedAssetTypeId 
  ? assets.filter(asset => asset.assetType.id === selectedAssetTypeId)
  : assets
```

### **Gestion des Clics**
```typescript
const handleAssetTypeFilter = (assetTypeId: string) => {
  setSelectedAssetTypeId(assetTypeId === selectedAssetTypeId ? null : assetTypeId)
}
```

### **Calculs Dynamiques**
- **Statistiques** : Basées sur `filteredAssets` au lieu de `assets`
- **Pourcentages** : Toujours calculés sur la base totale (non filtrée)
- **Interface** : Titres et descriptions adaptés selon le filtre

## 🎯 Interface Utilisateur

### **Répartition par Type d'Actif**
- **Description mise à jour** : "Cliquez sur un type pour filtrer"
- **Cartes interactives** : Curseur pointer + effets hover
- **Feedback visuel** : Sélection claire avec couleurs

### **États des Cartes**
- **Normal** : Bordure grise, hover léger
- **Sélectionné** : Bordure bleue, fond teinté, texte bleu
- **Vide** : Opacité réduite, cursor not-allowed
- **Hover** : Bordure bleue légère, ombre portée

### **Messages Contextuels**
- **En-tête** : "Gérez votre portefeuille d'actifs • Filtrés par Actions"
- **Aucun actif** : Message adapté selon le filtre
- **Boutons** : "Ajouter un actif Actions" si filtré

## 🚀 Utilisation

### **Filtrer par Type**
1. Aller sur `/assets`
2. Regarder la section "Répartition par Type d'Actif"
3. Cliquer sur le type souhaité (ex: "Actions")
4. Observer : toute l'interface se met à jour

### **Revenir à la Vue Complète**
- **Option 1** : Cliquer sur le bouton "Tous les actifs" (bandeau du haut)
- **Option 2** : Re-cliquer sur la carte sélectionnée
- **Option 3** : Cliquer sur "Voir tous les actifs" (si aucun actif du type)

### **Navigation Multi-Types**
```
Actions → Immobilier → Cryptomonnaies → Tous
↑___________________________________|
Cycle de navigation fluide
```

## 💡 Avantages

### **Expérience Utilisateur**
- **Intuitive** : Clic direct sur les éléments visuels
- **Rapide** : Filtrage instantané sans rechargement
- **Claire** : Feedback visuel immédiat

### **Gestion Patrimoniale**
- **Analyse ciblée** : Focus sur un segment d'actifs
- **Comparaison** : Basculement rapide entre les types
- **Optimisation** : Gestion spécialisée par type d'actif

### **Performance**
- **Filtrage client** : Pas de requête serveur supplémentaire
- **Réactivité** : Mise à jour instantanée de l'interface
- **Optimisation** : Calculs uniquement sur les données filtrées

---

**Ce système transforme une page statique en interface interactive, permettant une navigation intuitive et une analyse patrimoniale plus efficace !** 🎉 