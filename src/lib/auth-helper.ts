import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthSession {
  user: AuthUser
  expires: Date
  source: 'regular' | 'fallback'
}

/**
 * Get user from request (for middleware usage)
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  // Check fallback session first
  const fallbackSession = request.cookies.get('auth-session')?.value
  
  if (fallbackSession) {
    try {
      const sessionData = JSON.parse(fallbackSession)
      const expiresAt = new Date(sessionData.expires)
      if (expiresAt > new Date()) {
        return {
          id: sessionData.userId,
          email: sessionData.email,
          name: sessionData.name
        }
      }
    } catch (error) {
      console.warn('🔒 Invalid fallback session in request:', error)
    }
  }
  
  // Check regular session
  const session = await auth()
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || undefined
    }
  }
  
  return null
}

/**
 * Get session from server components
 */
export async function getServerSession(): Promise<AuthSession | null> {
  // Check fallback session first
  const cookieStore = await cookies()
  const fallbackSession = cookieStore.get('auth-session')?.value
  
  if (fallbackSession) {
    try {
      const sessionData = JSON.parse(fallbackSession)
      const expiresAt = new Date(sessionData.expires)
      if (expiresAt > new Date()) {
        return {
          user: {
            id: sessionData.userId,
            email: sessionData.email,
            name: sessionData.name
          },
          expires: expiresAt,
          source: 'fallback'
        }
      }
    } catch (error) {
      console.warn('🔒 Invalid fallback session in server:', error)
    }
  }
  
  // Check regular session
  const session = await auth()
  if (session?.user?.id) {
    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || undefined
      },
      expires: session.expires ? new Date(session.expires) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      source: 'regular'
    }
  }
  
  return null
}

/**
 * Get user ID from various contexts
 */
export async function getUserId(): Promise<string | null> {
  const session = await getServerSession()
  return session?.user.id || null
}

/**
 * Require authentication - redirect if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await getServerSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session.user
}

/**
 * Validate session and return user info
 */
export function validateSession(sessionCookie: string): AuthUser | null {
  try {
    const sessionData = JSON.parse(sessionCookie)
    const expiresAt = new Date(sessionData.expires)
    
    if (expiresAt <= new Date()) {
      return null
    }
    
    return {
      id: sessionData.userId,
      email: sessionData.email,
      name: sessionData.name
    }
  } catch (error) {
    console.warn('🔒 Invalid session format:', error)
    return null
  }
}

/**
 * Create fallback session cookie data
 */
export function createSessionCookie(user: AuthUser, expiresAt: Date): string {
  return JSON.stringify({
    userId: user.id,
    email: user.email,
    name: user.name,
    expires: expiresAt.toISOString()
  })
}

/**
 * Debug session information
 */
export async function debugSession(): Promise<object> {
  const session = await getServerSession()
  const cookieStore = await cookies()
  const fallbackCookie = cookieStore.get('auth-session')?.value
  
  return {
    hasSession: !!session,
    sessionSource: session?.source || 'none',
    sessionUserId: session?.user.id || null,
    sessionEmail: session?.user.email || null,
    sessionExpires: session?.expires || null,
    hasFallbackCookie: !!fallbackCookie,
    fallbackCookieValid: fallbackCookie ? !!validateSession(fallbackCookie) : false
  }
} 