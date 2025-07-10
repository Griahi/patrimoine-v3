#!/usr/bin/env node

console.log('🧪 Test du système de rapports avancés...\n')

// Test 1: Vérifier que le serveur fonctionne
console.log('1. Test de connectivité du serveur...')
try {
  const http = require('http')
  
  const testServer = () => {
    return new Promise((resolve, reject) => {
      const req = http.request('http://localhost:3001/reports/advanced', (res) => {
        resolve(res.statusCode)
      })
      req.on('error', reject)
      req.end()
    })
  }
  
  testServer().then(statusCode => {
    console.log(`   ✅ Serveur accessible (Status: ${statusCode})`)
  }).catch(err => {
    console.log(`   ❌ Erreur serveur: ${err.message}`)
  })
  
} catch (error) {
  console.log(`   ❌ Erreur: ${error.message}`)
}

// Test 2: Vérifier les fichiers nécessaires
console.log('\n2. Vérification des fichiers...')
const fs = require('fs')
const path = require('path')

const requiredFiles = [
  'src/app/reports/advanced/page.tsx',
  'src/components/reports/ReportFilters.tsx',
  'src/components/reports/ReportRenderer.tsx',
  'src/hooks/useEntityFilter.ts'
]

requiredFiles.forEach(file => {
  try {
    const fullPath = path.join(__dirname, '..', file)
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${file}`)
    } else {
      console.log(`   ❌ ${file} (manquant)`)
    }
  } catch (error) {
    console.log(`   ❌ ${file} (erreur: ${error.message})`)
  }
})

// Test 3: Vérifier la structure des imports
console.log('\n3. Vérification des imports...')
try {
  const advancedPagePath = path.join(__dirname, '..', 'src/app/reports/advanced/page.tsx')
  const content = fs.readFileSync(advancedPagePath, 'utf8')
  
  const requiredImports = [
    'useReportsEntityFilter',
    'ReportFilters',
    'ReportRenderer'
  ]
  
  requiredImports.forEach(importName => {
    if (content.includes(importName)) {
      console.log(`   ✅ Import ${importName}`)
    } else {
      console.log(`   ❌ Import ${importName} manquant`)
    }
  })
  
} catch (error) {
  console.log(`   ❌ Erreur lecture fichier: ${error.message}`)
}

// Test 4: Vérifier les hooks
console.log('\n4. Vérification des hooks...')
try {
  const hookPath = path.join(__dirname, '..', 'src/hooks/useEntityFilter.ts')
  const content = fs.readFileSync(hookPath, 'utf8')
  
  const requiredHooks = [
    'useReportsEntityFilter',
    'useDashboardEntityFilter',
    'useEntityFilter'
  ]
  
  requiredHooks.forEach(hookName => {
    if (content.includes(`export.*${hookName}`)) {
      console.log(`   ✅ Hook ${hookName}`)
    } else {
      console.log(`   ❌ Hook ${hookName} manquant`)
    }
  })
  
} catch (error) {
  console.log(`   ❌ Erreur lecture hooks: ${error.message}`)
}

// Test 5: Test de l'API entities
console.log('\n5. Test API entities...')
setTimeout(() => {
  try {
    const http = require('http')
    
    const testApi = () => {
      return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:3001/api/entities', (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => {
            try {
              const entities = JSON.parse(data)
              resolve({ statusCode: res.statusCode, entities })
            } catch (e) {
              reject(e)
            }
          })
        })
        req.on('error', reject)
        req.end()
      })
    }
    
    testApi().then(result => {
      console.log(`   ✅ API entities accessible (Status: ${result.statusCode})`)
      console.log(`   ✅ Nombre d'entités: ${result.entities.length}`)
      if (result.entities.length > 0) {
        console.log(`   ✅ Exemple d'entité: ${result.entities[0].name}`)
      }
    }).catch(err => {
      console.log(`   ❌ Erreur API: ${err.message}`)
    })
    
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`)
  }
}, 1000)

console.log('\n✅ Tests terminés!')
console.log('\n📋 Instructions pour tester manuellement:')
console.log('1. Connectez-vous avec test@example.com / password123')
console.log('2. Allez sur /reports puis cliquez sur "Rapports Avancés"')
console.log('3. Vérifiez que le filtre d\'entités fonctionne sans boucle infinie')
console.log('4. Testez la sélection/désélection d\'entités')
console.log('5. Vérifiez la persistance des filtres') 