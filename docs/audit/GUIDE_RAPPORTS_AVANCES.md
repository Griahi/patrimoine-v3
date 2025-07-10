# 📊 Guide d'Utilisation - Rapports Avancés

## 🚀 Accès aux Rapports Avancés

### **Navigation**
1. Allez sur `/reports` (page principale des rapports)
2. Cliquez sur le bouton **"Rapports Avancés"** dans le header
3. Ou accédez directement à `/reports/advanced`

### **Connexion Requise**
- Connectez-vous avec `test@example.com` / `password123`
- Les entités de test sont automatiquement disponibles

## 🎯 Fonctionnalités Principales

### **1. Filtrage par Entités**
- **Sélection multiple** : Choisissez une ou plusieurs entités
- **Recherche rapide** : Trouvez rapidement une entité par nom
- **Contrôles globaux** : "Tout sélectionner" / "Tout désélectionner"
- **Persistance** : Votre sélection est sauvegardée automatiquement

### **2. Types de Rapports Disponibles**
- **Bilan Patrimonial Complet** : Vue d'ensemble actif/passif détaillée
- **Rapport de Performance** : Analyse des rendements et performances
- **Analyse de Diversification** : Répartition et concentration des risques
- **Rapport Fiscal** : Optimisation et obligations fiscales
- **Analyse de Liquidité** : Disponibilité et échéances des actifs *(en développement)*
- **Tests de Résistance** : Simulations de scénarios de marché *(en développement)*
- **Projections Patrimoniales** : Évolution prévisionnelle à long terme *(en développement)*
- **Consolidation Multi-Entités** : Vue consolidée de toutes les entités *(en développement)*

### **3. Options de Filtrage**
- **Période** : Situation actuelle, YTD, 1M, 3M, 6M, 1Y, 3Y, 5Y, ou période personnalisée
- **Devises** : EUR, USD, GBP, CHF, JPY
- **Liquidité** : Tous, immédiate, court terme, moyen terme, long terme, illiquides
- **Optimisation fiscale** : Inclure/exclure les recommandations fiscales
- **Projections** : Inclure/exclure les projections futures

## 🎨 Interface Utilisateur

### **Indicateurs Visuels**
- **Badge de comptage** : Nombre d'entités sélectionnées
- **Statut des filtres** : Résumé des filtres actifs
- **Icônes distinctives** : 👤 Personnes physiques, 🏢 Personnes morales

### **Affichage Adaptatif**
- **0 entité sélectionnée** : "Toutes les entités"
- **1 entité sélectionnée** : Nom de l'entité
- **Plusieurs entités** : Nombre d'entités sélectionnées

## 📈 Cas d'Usage

### **Analyse Familiale**
```
✅ Sélectionner "Max Riahi" + "Sophie Riahi"
✅ Choisir "Bilan Patrimonial Complet"
→ Vue consolidée du patrimoine familial
```

### **Analyse Professionnelle**
```
✅ Sélectionner "SARL TechCorp" + "Max Riahi"
✅ Choisir "Rapport Fiscal"
→ Optimisation fiscale patrimoine pro/perso
```

### **Analyse de Performance**
```
✅ Sélectionner toutes les entités
✅ Choisir "Rapport de Performance"
✅ Période : 1 an
→ Analyse globale des performances
```

### **Analyse de Diversification**
```
✅ Sélectionner entités spécifiques
✅ Choisir "Analyse de Diversification"
→ Répartition des risques par entité
```

## 🔧 Fonctionnalités Techniques

### **Rechargement Automatique**
- Données mises à jour instantanément lors du changement de filtre
- Indicateurs de chargement pendant les requêtes
- Gestion des erreurs avec possibilité de retry

### **Persistance des Filtres**
- Sélection d'entités sauvegardée (localStorage)
- Restauration automatique au retour sur la page
- Clé séparée pour les rapports (`reports-entity-filter`)

### **Export et Impression**
- **Export PDF** : Rapport formaté pour impression
- **Export Excel** : Données structurées pour analyse
- **Export CSV** : Données tabulaires
- **Impression directe** : Optimisée pour l'impression

## 🎛️ Contrôles et Actions

### **Boutons Principaux**
- **Retour aux rapports** : Revenir à la page principale
- **Réinitialiser** : Effacer tous les filtres
- **Export** : Diverses options d'export (dans ReportRenderer)

### **Filtres Rapides**
- **Période courante** : Vue instantanée
- **Année en cours** : Depuis début d'année
- **Personnalisée** : Dates de début/fin manuelles

## 🎯 Entités de Test Disponibles

### **Personnes Physiques**
- 👤 **Max Riahi** : Patrimoine mixte (immobilier + bancaire)
- 👤 **Sophie Riahi** : Copropriété immobilière
- 👤 **Gilles Riahi** : Investissement locatif

### **Personnes Morales**
- 🏢 **SARL TechCorp** : Portefeuille d'actions

### **Exemples de Filtrage**
```
Max Riahi seul :
- Maison principale (50%)
- Compte courant BNP (100%)
- Total estimé : ~500K€

Sophie Riahi seule :
- Maison principale (50%)
- Total estimé : ~475K€

SARL TechCorp seule :
- Actions Apple (100%)
- Total estimé : ~9.5K€

Toutes entités :
- Patrimoine total : ~1.7M€
```

## 🔄 Workflow Recommandé

### **1. Exploration Initiale**
1. Accéder aux rapports avancés
2. Laisser "Toutes les entités" sélectionné
3. Choisir "Bilan Patrimonial Complet"
4. Examiner la vue d'ensemble

### **2. Analyse Ciblée**
1. Sélectionner entités spécifiques
2. Changer le type de rapport selon l'objectif
3. Ajuster la période si nécessaire
4. Analyser les résultats

### **3. Comparaison**
1. Générer un rapport pour une entité
2. Changer la sélection pour une autre entité
3. Comparer les métriques
4. Identifier les écarts et opportunités

### **4. Export des Résultats**
1. Configurer les filtres finaux
2. Choisir le format d'export approprié
3. Sauvegarder le rapport
4. Partager avec les parties prenantes

## 🛠️ Dépannage

### **Filtres non visibles ?**
- Vérifiez que vous êtes connecté
- Assurez-vous d'être sur `/reports/advanced`
- Vérifiez que les entités existent dans la base

### **Données non filtrées ?**
- Vérifiez la sélection d'entités
- Rechargez la page si nécessaire
- Consultez la console pour les erreurs

### **Export ne fonctionne pas ?**
- Vérifiez que les données sont chargées
- Assurez-vous d'avoir les permissions nécessaires
- Testez avec un rapport simple d'abord

## 📚 Ressources

- **Documentation technique** : `src/components/reports/`
- **Hooks personnalisés** : `src/hooks/useEntityFilter.ts`
- **Tests** : `scripts/test-entity-filter.js`
- **Guide principal** : `GUIDE_FILTRE_ENTITES.md`

---

## 🎉 Conclusion

Les rapports avancés avec filtrage par entités offrent une flexibilité maximale pour analyser votre patrimoine. Explorez les différentes combinaisons de filtres pour découvrir des insights précieux sur votre situation patrimoniale.

**🚀 Status : ✅ RAPPORTS AVANCÉS FONCTIONNELS**

Le système de rapports avancés avec filtrage par entités est maintenant disponible et pleinement opérationnel ! 