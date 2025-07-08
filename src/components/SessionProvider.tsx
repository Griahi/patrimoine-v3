"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Session } from '@/lib/auth'

interface SessionContextType {
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  refetch: () => Promise<void>
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  status: 'loading',
  refetch: async () => {}
})

interface SessionProviderProps {
  children: React.ReactNode
  session?: any
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [isFetching, setIsFetching] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  const fetchSession = useCallback(async () => {
    if (isFetching) {
      console.log('⏭️ SessionProvider: Already fetching, skipping')
      return // Éviter les appels multiples
    }
    
    try {
      console.log('🔐 SessionProvider: Fetching session...')
      setIsFetching(true)
      setStatus('loading')
      
      const response = await fetch('/api/session-check', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.hasSession && data.sessionData) {
          console.log('✅ SessionProvider: Valid session found via API')
          setSession({
            user: {
              id: data.sessionData.userId,
              email: data.sessionData.email,
              name: data.sessionData.name,
              image: null
            },
            expires: data.sessionData.expires
          })
          setStatus('authenticated')
          setHasInitialized(true)
          return
        }
      }
      
      // Si pas de session trouvée via l'API, regarder directement le cookie auth-session
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          if (key && value) acc[key] = value
          return acc
        }, {} as Record<string, string>)
        
        const authSession = cookies['auth-session']
        if (authSession) {
          try {
            const sessionData = JSON.parse(decodeURIComponent(authSession))
            const expiresAt = new Date(sessionData.expires)
            
            if (expiresAt > new Date()) {
              console.log('✅ SessionProvider: Valid session found via cookie')
              setSession({
                user: {
                  id: sessionData.userId,
                  email: sessionData.email,
                  name: sessionData.name,
                  image: null
                },
                expires: sessionData.expires
              })
              setStatus('authenticated')
              setHasInitialized(true)
              return
            } else {
              console.log('⚠️ SessionProvider: Session cookie expired')
            }
          } catch (e) {
            console.warn('Failed to parse auth-session cookie:', e)
          }
        }
      }
      
      // Aucune session valide trouvée
      console.log('🚫 SessionProvider: No valid session found')
      setSession(null)
      setStatus('unauthenticated')
      setHasInitialized(true)
      
    } catch (error) {
      console.error('❌ SessionProvider: Error fetching session:', error)
      setSession(null)
      setStatus('unauthenticated')
      setHasInitialized(true)
    } finally {
      setIsFetching(false)
    }
  }, [isFetching])

  useEffect(() => {
    // Ne fetch que si pas encore initialisé
    if (!hasInitialized && !isFetching) {
      console.log('🔄 SessionProvider: Initial session fetch')
      fetchSession()
    }
    
    // Écouter les changements d'authentification
    const handleAuthChange = () => {
      console.log('🔄 SessionProvider: Auth changed event received')
      // Reset initialization flag pour permettre un nouveau fetch
      setHasInitialized(false)
      setTimeout(() => {
        if (!isFetching) {
          fetchSession()
        }
      }, 100) // Petit délai pour éviter les races conditions
    }
    
    window.addEventListener('auth-changed', handleAuthChange)
    
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange)
    }
  }, [hasInitialized, isFetching, fetchSession])

  return (
    <SessionContext.Provider value={{ 
      session, 
      status, 
      refetch: () => {
        setHasInitialized(false)
        return fetchSession()
      }
    }}>
      {children}
    </SessionContext.Provider>
  )
}

// Add default export for better compatibility
export default SessionProvider

export function useSessionContext() {
  return useContext(SessionContext)
} 