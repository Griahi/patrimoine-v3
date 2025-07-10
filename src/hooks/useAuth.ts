'use client'

import { useSession as useSessionProvider } from '@/components/SessionProvider'
import { Session } from '@/lib/auth'

interface UseSessionReturn {
  data: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

export function useSession(): UseSessionReturn {
  const { data, status } = useSessionProvider()
  return { data, status }
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/signout', { 
      method: 'POST',
      credentials: 'include'
    })
    
    // Actualiser la session dans le contexte
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-changed'))
    }
    
    window.location.href = '/login'
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

export async function signIn(
  email: string, 
  password: string, 
  router?: any, 
  callbackUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔐 SignIn attempt for:', email);
    console.log('🔐 CallbackUrl provided:', callbackUrl);
    
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Important pour les cookies
    })

    const data = await response.json()
    console.log('🔐 SignIn response:', { success: response.ok, status: response.status });

    if (response.ok && data.success) {
      console.log('🔐 SignIn successful, processing redirect...');
      
      // Attendre un peu pour que les cookies soient définis
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Actualiser la session dans le contexte
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'))
      }
      
      // Déterminer l'URL de redirection
      let redirectUrl = callbackUrl || '/dashboard'
      
      // Nettoyer l'URL de redirection et valider qu'elle est sûre
      if (redirectUrl.startsWith('/')) {
        // URL relative valide
        console.log('🔐 Using relative redirect URL:', redirectUrl);
      } else {
        // URL absolue ou invalide, utiliser dashboard par défaut
        console.log('🔐 Invalid redirect URL, using dashboard:', redirectUrl);
        redirectUrl = '/dashboard'
      }
      
      // Vérifier si on est sur une route spécifique qui nécessite une redirection
      const protectedRoutes = ['/predictions', '/dashboard/predictions', '/reports', '/tax', '/loans', '/integrations']
      if (protectedRoutes.includes(redirectUrl)) {
        console.log('🔐 Redirecting to protected route:', redirectUrl);
      }
      
      // Effectuer la redirection
      if (router) {
        console.log('🔐 Using router.push to redirect to:', redirectUrl);
        router.push(redirectUrl)
        
        // Forcer un refresh pour s'assurer que la page se recharge correctement
        setTimeout(() => {
          router.refresh()
        }, 100)
      } else {
        console.log('🔐 Using window.location.href to redirect to:', redirectUrl);
        window.location.href = redirectUrl
      }
      
      return { success: true }
    } else {
      console.log('🔐 SignIn failed:', data.error);
      return { success: false, error: data.error || 'Authentication failed' }
    }
  } catch (error) {
    console.error('🔐 SignIn error:', error)
    return { success: false, error: 'Network error' }
  }
} 