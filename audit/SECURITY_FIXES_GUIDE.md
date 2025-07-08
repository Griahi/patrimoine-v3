# 🔒 Guide de Correction des Vulnérabilités de Sécurité

**Date :** $(date)  
**Audit :** 20250707_111939  
**Statut :** 🔴 **PRIORITÉ HAUTE**

## 🎯 Vulnérabilités Identifiées

### 1. 🔥 **XLSX - Prototype Pollution + ReDoS** (HAUTE PRIORITÉ)
- **Version actuelle :** 0.18.5
- **Version requise :** ≥0.20.2
- **Sévérité :** HIGH (7.8/10 + 7.5/10 CVSS)
- **Impact :** Prototype Pollution + Denial of Service
- **CVE :** GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9

### 2. 🔥 **jsPDF - ReDoS** (HAUTE PRIORITÉ)
- **Version actuelle :** 2.5.2
- **Version requise :** ≥3.0.1
- **Sévérité :** HIGH (ReDoS)
- **Impact :** Denial of Service via regex
- **CVE :** GHSA-w532-jxjh-hjhj

### 3. 🟡 **Vitest/esbuild** (MODÉRÉE - Dev uniquement)
- **Version actuelle :** 1.0.4
- **Version requise :** ≥3.2.4
- **Sévérité :** MODERATE (5.3/10 CVSS)
- **Impact :** Dev server exposure
- **CVE :** GHSA-67mh-4wv8-2f99

## 🚀 Plan de Correction

### Étape 1 : Mise à jour des dépendances critiques

```bash
# 1. Mettre à jour XLSX (critique)
npm update xlsx@latest

# 2. Mettre à jour jsPDF (critique) 
npm update jspdf@latest

# 3. Mettre à jour Vitest (dev - avec breaking changes)
npm update vitest@latest @vitest/ui@latest @vitest/coverage-v8@latest
```

### Étape 2 : Vérification des breaking changes

**⚠️ jsPDF 2.5.2 → 3.0.1 : BREAKING CHANGES**
- Vérifier les imports et l'API
- Tester les fonctions d'export PDF
- Fichiers concernés : `src/lib/reportExports.ts`

**⚠️ Vitest 1.0.4 → 3.2.4 : BREAKING CHANGES**
- Vérifier la configuration `vitest.config.ts`
- Tester les tests existants
- Mettre à jour les scripts de test

### Étape 3 : Tests de régression

```bash
# Après mise à jour
npm test              # Vérifier les tests
npm run build         # Vérifier le build
npm audit             # Vérifier les vulnérabilités
```

## 🔧 Corrections Automatiques

### Option 1 : Mise à jour prudente (recommandée)
```bash
# Mettre à jour une par une avec tests
npm update xlsx@latest
npm test && npm run build

npm update jspdf@latest  
npm test && npm run build

npm update vitest@latest @vitest/ui@latest @vitest/coverage-v8@latest
npm test
```

### Option 2 : Correction forcée (rapide mais risquée)
```bash
# ⚠️ Attention : peut casser l'application
npm audit fix --force
```

## 📋 Checklist de Vérification

- [ ] **XLSX mis à jour** (0.18.5 → 0.20.2+)
- [ ] **jsPDF mis à jour** (2.5.2 → 3.0.1+)  
- [ ] **Vitest mis à jour** (1.0.4 → 3.2.4+)
- [ ] **Tests passent** après chaque mise à jour
- [ ] **Build fonctionne** après chaque mise à jour
- [ ] **Exports PDF fonctionnent** (jsPDF)
- [ ] **Tests unitaires fonctionnent** (Vitest)
- [ ] **npm audit** ne montre plus de vulnérabilités critiques

## 🔥 Corrections Spécifiques

### Correction XLSX (Prototype Pollution)
```bash
# Vérifier la version actuelle
npm list xlsx

# Mettre à jour vers la version sécurisée
npm install xlsx@latest

# Vérifier la nouvelle version
npm list xlsx
```

### Correction jsPDF (ReDoS)
```bash
# Vérifier la version actuelle  
npm list jspdf

# Mettre à jour vers la version sécurisée
npm install jspdf@latest

# Tester les exports PDF
npm test -- --grep "pdf"
```

### Correction Vitest (Dev Security)
```bash
# Mettre à jour tout l'écosystème Vitest
npm install --save-dev vitest@latest @vitest/ui@latest @vitest/coverage-v8@latest

# Vérifier la configuration
npm test
```

## 🎯 Résultat Attendu

Après correction :
- **0 vulnérabilités HIGH** 
- **0 vulnérabilités MODERATE** (hors dépendances optionnelles)
- **npm audit** propre
- **Tests passent** à 100%
- **Build fonctionne** sans erreur

## 📞 Support

En cas de problème :
1. Restaurer `package.json` depuis git
2. Relancer `npm install`
3. Analyser les logs d'erreur
4. Corriger les breaking changes un par un

---

**⚠️ IMPORTANT :** Toujours tester après chaque mise à jour majeure ! 