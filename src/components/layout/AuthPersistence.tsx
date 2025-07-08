'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Composant pour persister les URLs tentées et gérer les redirections après connexion
 * Solution temporaire pour corriger les problèmes de redirection
 */
export function AuthPersistence() {
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    // Ne pas traiter les pages d'authentification
    if (pathname === '/login' || pathname === '/signup') {
      return
    }
    
    // Sauvegarder la dernière route tentée si c'est une route protégée
    const protectedRoutes = [
      '/predictions', 
      '/dashboard/predictions', 
      '/reports', 
      '/tax', 
      '/loans', 
      '/integrations',
      '/entities',
      '/assets',
      '/settings',
      '/onboarding'
    ]
    
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      console.log('🔄 AuthPersistence: Saving attempted route:', pathname)
      sessionStorage.setItem('lastAttemptedRoute', pathname)
    }
    
    // Si on est sur dashboard, nettoyer la route tentée mais ne plus rediriger automatiquement
    if (pathname === '/dashboard') {
      const intended = sessionStorage.getItem('lastAttemptedRoute')
      if (intended && intended !== '/dashboard' && intended !== pathname) {
        console.log('🔄 AuthPersistence: Clearing intended route, staying on dashboard:', intended)
        
        // Nettoyer la route tentée pour éviter les redirections futures
        sessionStorage.removeItem('lastAttemptedRoute')
      }
    }
  }, [pathname, router])
  
  return null
}

/**
 * Hook pour gérer la persistance des URLs manuellement
 */
export function useAuthPersistence() {
  const router = useRouter()
  
  const saveAttemptedRoute = (route: string) => {
    console.log('🔄 useAuthPersistence: Manually saving route:', route)
    sessionStorage.setItem('lastAttemptedRoute', route)
  }
  
  const redirectToIntendedRoute = () => {
    const intended = sessionStorage.getItem('lastAttemptedRoute')
    if (intended && intended !== '/dashboard') {
      console.log('🔄 useAuthPersistence: Redirecting to intended route:', intended)
      sessionStorage.removeItem('lastAttemptedRoute')
      router.push(intended)
      return true
    }
    return false
  }
  
  const clearAttemptedRoute = () => {
    console.log('🔄 useAuthPersistence: Clearing attempted route')
    sessionStorage.removeItem('lastAttemptedRoute')
  }
  
  return {
    saveAttemptedRoute,
    redirectToIntendedRoute,
    clearAttemptedRoute
  }
} 