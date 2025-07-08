#!/usr/bin/env node

/**
 * Script de test pour valider les redirections d'authentification
 * Usage: node scripts/test-redirections.js
 */

const BASE_URL = 'http://localhost:3000'

const protectedRoutes = [
  '/predictions',
  '/reports', 
  '/tax',
  '/dashboard/predictions',
  '/loans',
  '/integrations',
  '/entities',
  '/assets',
  '/settings'
]

async function clearSessionCookies() {
  try {
    console.log('🧹 Clearing session cookies...')
    const response = await fetch(`${BASE_URL}/api/auth/signout`, {
      method: 'POST',
      headers: {
        'Cookie': '', 
        'User-Agent': 'RedirectionTest/1.0'
      }
    })
    return response.ok
  } catch (error) {
    console.warn('Could not clear session cookies:', error.message)
    return false
  }
}

async function testRedirection(route) {
  try {
    console.log(`\n🔍 Testing route: ${route}`)
    
    const response = await fetch(`${BASE_URL}${route}`, {
      method: 'GET',
      redirect: 'manual', // Ne pas suivre automatiquement les redirections
      headers: {
        'Cookie': '', // Pas de cookies pour simuler un état non-authentifié
        'User-Agent': 'RedirectionTest/1.0',
        'Cache-Control': 'no-cache'
      }
    })
    
    console.log(`   Status: ${response.status}`)
    
    if (response.status === 302 || response.status === 307) {
      const location = response.headers.get('location')
      console.log(`✅ Redirected to: ${location}`)
      
      // Vérifier si la redirection contient le callbackUrl
      if (location && location.includes('callbackUrl')) {
        const url = new URL(location, BASE_URL)
        const callbackUrl = url.searchParams.get('callbackUrl')
        
        if (callbackUrl === route) {
          console.log(`✅ CallbackUrl correctly preserved: ${callbackUrl}`)
          return { success: true, route, redirectTo: location, callbackUrl }
        } else {
          console.log(`❌ CallbackUrl mismatch. Expected: ${route}, Got: ${callbackUrl}`)
          return { success: false, route, redirectTo: location, callbackUrl, error: 'CallbackUrl mismatch' }
        }
      } else {
        console.log(`❌ No callbackUrl in redirect: ${location}`)
        return { success: false, route, redirectTo: location, error: 'No callbackUrl' }
      }
    } else if (response.status === 200) {
      console.log(`❌ Route accessible without auth (should redirect)`)
      return { success: false, route, status: response.status, error: 'No auth required' }
    } else {
      console.log(`❌ Unexpected status: ${response.status}`)
      return { success: false, route, status: response.status, error: 'Unexpected status' }
    }
  } catch (error) {
    console.log(`❌ Error testing ${route}:`, error.message)
    return { success: false, route, error: error.message }
  }
}

async function testWithAuthentication(route) {
  try {
    console.log(`\n🔐 Testing authenticated access to: ${route}`)
    
    // Simuler une session de test valide
    const testSession = JSON.stringify({
      userId: 'user-demo-1',
      email: 'test@example.com',
      name: 'Test User',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    
    const response = await fetch(`${BASE_URL}${route}`, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Cookie': `auth-session=${encodeURIComponent(testSession)}`,
        'User-Agent': 'RedirectionTest/1.0',
        'Cache-Control': 'no-cache'
      }
    })
    
    console.log(`   Status: ${response.status}`)
    
    if (response.status === 200) {
      console.log(`✅ Authenticated access successful`)
      return { success: true, route, status: response.status }
    } else if (response.status === 302 || response.status === 307) {
      const location = response.headers.get('location')
      if (location && location.includes('/login')) {
        console.log(`❌ Authenticated user redirected to login: ${location}`)
        return { success: false, route, status: response.status, error: 'Auth user redirected to login' }
      } else {
        console.log(`🔄 Authenticated user redirected (maybe valid): ${location}`)
        return { success: true, route, status: response.status, redirectTo: location }
      }
    } else {
      console.log(`❌ Authenticated access failed`)
      return { success: false, route, status: response.status, error: 'Auth access failed' }
    }
  } catch (error) {
    console.log(`❌ Error testing authenticated ${route}:`, error.message)
    return { success: false, route, error: error.message }
  }
}

async function testAllRoutes() {
  console.log('🎯 Testing Authentication Redirections')
  console.log('=====================================')
  
  // Nettoyer les sessions d'abord
  await clearSessionCookies()
  
  console.log('\n🔒 PHASE 1: Testing Unauthenticated Access (Should Redirect)')
  console.log('============================================================')
  
  const unauthResults = []
  
  for (const route of protectedRoutes) {
    const result = await testRedirection(route)
    unauthResults.push(result)
    
    // Attendre un peu entre les tests
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.log('\n🔓 PHASE 2: Testing Authenticated Access (Should Allow)')
  console.log('======================================================')
  
  const authResults = []
  
  for (const route of protectedRoutes) {
    const result = await testWithAuthentication(route)
    authResults.push(result)
    
    // Attendre un peu entre les tests
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.log('\n📊 SUMMARY')
  console.log('===========')
  
  const successfulRedirects = unauthResults.filter(r => r.success)
  const failedRedirects = unauthResults.filter(r => !r.success)
  
  const successfulAuth = authResults.filter(r => r.success)
  const failedAuth = authResults.filter(r => !r.success)
  
  console.log(`🔒 Unauthenticated redirections: ${successfulRedirects.length}/${unauthResults.length}`)
  console.log(`🔓 Authenticated access: ${successfulAuth.length}/${authResults.length}`)
  
  // Afficher les détails des succès
  if (successfulRedirects.length > 0) {
    console.log('\n✅ Successful redirect tests:')
    successfulRedirects.forEach(result => {
      console.log(`  - ${result.route}: ✅ ${result.callbackUrl}`)
    })
  }
  
  if (failedRedirects.length > 0) {
    console.log('\n❌ Failed redirect tests:')
    failedRedirects.forEach(result => {
      console.log(`  - ${result.route}: ${result.error}`)
    })
  }
  
  if (failedAuth.length > 0) {
    console.log('\n❌ Failed authentication tests:')
    failedAuth.forEach(result => {
      console.log(`  - ${result.route}: ${result.error}`)
    })
  }
  
  const totalScore = ((successfulRedirects.length + successfulAuth.length) / (unauthResults.length + authResults.length)) * 100
  
  if (successfulRedirects.length === unauthResults.length && successfulAuth.length === authResults.length) {
    console.log(`\n🎉 All tests passed! Authentication and redirections work correctly. (${totalScore.toFixed(1)}%)`)
  } else {
    console.log(`\n⚠️  Some tests failed. Overall score: ${totalScore.toFixed(1)}%`)
  }
  
  return {
    redirects: { success: successfulRedirects.length, total: unauthResults.length },
    auth: { success: successfulAuth.length, total: authResults.length },
    score: totalScore
  }
}

// Vérifier si le serveur est en cours d'exécution
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/session-check`, {
      headers: {
        'Cookie': '', // Pas de cookies
        'User-Agent': 'RedirectionTest/1.0'
      }
    })
    return response.ok
  } catch (error) {
    return false
  }
}

// Fonction principale
async function main() {
  console.log('🔍 Checking if server is running...')
  
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Server is not running at', BASE_URL)
    console.log('Please start the server with: npm run dev')
    process.exit(1)
  }
  
  console.log('✅ Server is running')
  
  const results = await testAllRoutes()
  
  // Code de sortie basé sur les résultats
  if (results.score >= 90) {
    console.log(`\n🏆 Excellent! Score: ${results.score.toFixed(1)}%`)
    process.exit(0)
  } else if (results.score >= 70) {
    console.log(`\n👍 Good! Score: ${results.score.toFixed(1)}%`)
    process.exit(0)
  } else {
    console.log(`\n⚠️  Needs improvement. Score: ${results.score.toFixed(1)}%`)
    process.exit(1)
  }
}

main().catch(console.error) 