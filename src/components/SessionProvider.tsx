"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { Session } from '@/lib/auth'

interface SessionContextType {
  data: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  update: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
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
          console.log('✅ SessionProvider: Valid session found')
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
    if (!hasInitialized) {
      fetchSession()
    }
  }, [fetchSession, hasInitialized])

  // Écouter les changements d'authentification
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('🔄 SessionProvider: Auth changed, refetching session')
      setHasInitialized(false) // Force refetch
    }

    // Écouter les événements personnalisés de changement d'authentification
    window.addEventListener('auth-changed', handleAuthChange)
    
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange)
    }
  }, [])

  const value: SessionContextType = {
    data: session,
    status,
    update: fetchSession
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
} 