#!/usr/bin/env node

console.log('🤖 Test du Chatbot AI...\n')

// Test 1: Vérifier les fichiers nécessaires
console.log('1. Vérification des fichiers du chatbot...')
const fs = require('fs')
const path = require('path')

const requiredFiles = [
  'src/components/ai/ChatWidget.tsx',
  'src/hooks/useAIChat.ts',
  'src/app/api/ai/chat/route.ts',
  'src/types/ai.ts'
]

let allFilesOk = true
requiredFiles.forEach(file => {
  try {
    const fullPath = path.join(__dirname, '..', file)
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${file}`)
    } else {
      console.log(`   ❌ ${file} (manquant)`)
      allFilesOk = false
    }
  } catch (error) {
    console.log(`   ❌ ${file} (erreur: ${error.message})`)
    allFilesOk = false
  }
})

// Test 2: Vérifier l'intégration dans le layout
console.log('\n2. Vérification de l\'intégration dans le layout...')
try {
  const layoutPath = path.join(__dirname, '..', 'src/app/layout.tsx')
  const content = fs.readFileSync(layoutPath, 'utf8')
  
  if (content.includes('import ChatWidget')) {
    console.log('   ✅ ChatWidget importé')
  } else {
    console.log('   ❌ ChatWidget non importé')
  }
  
  if (content.includes('<ChatWidget')) {
    console.log('   ✅ ChatWidget ajouté au JSX')
  } else {
    console.log('   ❌ ChatWidget non ajouté au JSX')
  }
  
} catch (error) {
  console.log(`   ❌ Erreur lecture layout: ${error.message}`)
}

// Test 3: Vérifier les types AI
console.log('\n3. Vérification des types AI...')
try {
  const typesPath = path.join(__dirname, '..', 'src/types/ai.ts')
  if (fs.existsSync(typesPath)) {
    const content = fs.readFileSync(typesPath, 'utf8')
    
    if (content.includes('interface Message')) {
      console.log('   ✅ Type Message défini')
    } else {
      console.log('   ⚠️  Type Message non trouvé')
    }
  } else {
    console.log('   ❌ Fichier types/ai.ts manquant')
  }
  
} catch (error) {
  console.log(`   ❌ Erreur types: ${error.message}`)
}

// Test 4: Test de l'API (si le serveur fonctionne)
console.log('\n4. Test de l\'API AI...')
setTimeout(() => {
  try {
    const http = require('http')
    
    const testApi = () => {
      return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          message: 'Test message',
          context: {}
        })
        
        const options = {
          hostname: 'localhost',
          port: 3001,
          path: '/api/ai/chat',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }
        
        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, data })
          })
        })
        
        req.on('error', reject)
        req.write(postData)
        req.end()
      })
    }
    
    testApi().then(result => {
      console.log(`   ✅ API AI accessible (Status: ${result.statusCode})`)
      if (result.statusCode === 401) {
        console.log('   ℹ️  Authentification requise (normal)')
      }
    }).catch(err => {
      console.log(`   ❌ Erreur API: ${err.message}`)
    })
    
  } catch (error) {
    console.log(`   ❌ Erreur test API: ${error.message}`)
  }
}, 1000)

// Test 5: Vérifier les dépendances
console.log('\n5. Vérification des dépendances...')
try {
  const packagePath = path.join(__dirname, '..', 'package.json')
  const packageContent = fs.readFileSync(packagePath, 'utf8')
  const packageJson = JSON.parse(packageContent)
  
  const requiredDeps = [
    'framer-motion',
    'lucide-react',
    'sonner'
  ]
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`   ✅ ${dep}`)
    } else {
      console.log(`   ❌ ${dep} (manquant)`)
    }
  })
  
} catch (error) {
  console.log(`   ❌ Erreur package.json: ${error.message}`)
}

console.log('\n✅ Tests terminés!')
console.log('\n📋 Instructions pour tester le chatbot:')
console.log('1. Connectez-vous à l\'application')
console.log('2. Cherchez l\'icône de chat en bas à droite')
console.log('3. Cliquez pour ouvrir le chatbot')
console.log('4. Testez avec des messages comme:')
console.log('   - "Quelle est ma performance globale ?"')
console.log('   - "Montre-moi ma répartition d\'actifs"')
console.log('   - "Combien je paie de frais bancaires ?"')

console.log('\n🎨 Fonctionnalités du chatbot:')
console.log('- 💬 Interface conversationnelle')
console.log('- 🎯 Suggestions contextuelles')
console.log('- 💾 Historique persistant')
console.log('- 📊 Réponses avec graphiques')
console.log('- 🔄 Fonction réessayer')
console.log('- 📋 Copier les messages')
console.log('- 🗑️  Nettoyer l\'historique') 