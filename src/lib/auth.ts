import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { logger } from './logger'
import { NextResponse } from "next/server"

// 🛡️ VALIDATION RENFORCÉE DES VARIABLES D'ENVIRONNEMENT
function validateEnvironment() {
  const jwtSecret = process.env.JWT_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET
  const nodeEnv = process.env.NODE_ENV
  
  // Secrets faibles connus à rejeter
  const WEAK_SECRETS = [
    "fallback-secret-key-for-development",
    "your-secret-key-here",
    "dev-secret-key-2024",
    "change-me-in-production",
    "secret",
    "password",
    "123456"
  ]
  
  if (nodeEnv === 'production') {
    // 🚨 PRODUCTION: Validation stricte obligatoire
    if (!jwtSecret) {
      throw new Error('🚨 PRODUCTION CRITICAL: JWT_SECRET must be set in environment variables')
    }
    
    if (WEAK_SECRETS.includes(jwtSecret)) {
      throw new Error('🚨 PRODUCTION CRITICAL: JWT_SECRET cannot be a known weak secret')
    }
    
    if (jwtSecret.length < 32) {
      throw new Error('🚨 PRODUCTION CRITICAL: JWT_SECRET must be at least 32 characters long for security')
    }
    
    if (!nextAuthSecret) {
      throw new Error('🚨 PRODUCTION CRITICAL: NEXTAUTH_SECRET must be set in environment variables')
    }
    
    if (WEAK_SECRETS.includes(nextAuthSecret)) {
      throw new Error('🚨 PRODUCTION CRITICAL: NEXTAUTH_SECRET cannot be a known weak secret')
    }
    
    if (nextAuthSecret.length < 32) {
      throw new Error('🚨 PRODUCTION CRITICAL: NEXTAUTH_SECRET must be at least 32 characters long for security')
    }
    
    logger.info('✅ PRODUCTION: All authentication secrets validated successfully', undefined, 'AuthService')
    
  } else {
    // 🔧 DÉVELOPPEMENT: Validation avec avertissements
    if (!jwtSecret || WEAK_SECRETS.includes(jwtSecret)) {
      logger.error('⚠️ DEVELOPMENT SECURITY: Using weak or missing JWT_SECRET. Please set a strong secret in .env.local', undefined, 'AuthService')
      logger.info('💡 Generate a strong secret with: openssl rand -base64 32', undefined, 'AuthService')
    } else if (jwtSecret.length >= 32) {
      logger.info('✅ DEVELOPMENT: Strong JWT_SECRET detected', undefined, 'AuthService')
    }
    
    if (!nextAuthSecret || WEAK_SECRETS.includes(nextAuthSecret)) {
      logger.warn('⚠️ DEVELOPMENT: Weak or missing NEXTAUTH_SECRET detected', undefined, 'AuthService')
    } else if (nextAuthSecret && nextAuthSecret.length >= 32) {
      logger.info('✅ DEVELOPMENT: Strong NEXTAUTH_SECRET detected', undefined, 'AuthService')
    }
  }
}

// Valider l'environnement au démarrage
validateEnvironment()

// 🛡️ SECRET JWT SÉCURISÉ - Pas de fallback faible
if (!process.env.JWT_SECRET) {
  throw new Error('🚨 CRITICAL: JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32')
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
}

export interface Session {
  user: User
  expires: string
}

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthSession {
  user: AuthUser
  expires: Date
}

export async function createSession(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, image: true }
  })

  if (!user) {
    throw new Error("User not found")
  }

  const token = await new SignJWT({ 
    userId: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret)
  
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/"
  })
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    if (!token) return null
    
    const { payload } = await jwtVerify(token, secret)
    
    return {
      user: {
        id: payload.userId as string,
        email: payload.email as string,
        name: payload.name as string | null,
        image: payload.image as string | null,
      },
      expires: new Date((payload.exp as number) * 1000).toISOString()
    }
  } catch (error) {
    logger.warn('Error getting session:', error, 'AuthService')
    return null
  }
}

export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null
  
  // Parse cookies manually
  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=")
    if (key && value) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, string>)
  
  const token = cookies.session
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, secret)
    
    return {
      user: {
        id: payload.userId as string,
        email: payload.email as string,
        name: payload.name as string | null,
        image: payload.image as string | null,
      },
      expires: new Date((payload.exp as number) * 1000).toISOString()
    }
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("session")
  } catch (error) {
    logger.warn('Error destroying session:', error, 'AuthService')
  }
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  try {
    logger.info('Authenticate called', { email: email?.substring(0, 3) + '***' }, 'AuthService')
    const { email: validEmail, password: validPassword } = loginSchema.parse({ email, password })

    const user = await prisma.user.findUnique({
      where: { email: validEmail },
    })

    logger.info('User lookup result', { found: !!user }, 'AuthService')

    if (!user || !user.password) {
      logger.warn('Authentication failed: No user or no password', undefined, 'AuthService')
      return null
    }

    const isPasswordValid = await bcrypt.compare(validPassword, user.password)
    logger.info('Password validation result', { valid: isPasswordValid }, 'AuthService')

    if (!isPasswordValid) {
      logger.warn('Authentication failed: Invalid password', undefined, 'AuthService')
      return null
    }

    logger.info('Authentication successful', { userId: user.id }, 'AuthService')
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    }
  } catch (error) {
    logger.error('Authentication error', error, 'AuthService')
    return null
  }
}

/**
 * Get user from request (for middleware usage)
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const session = await getSessionFromRequest(request)
    if (session?.user?.id) {
      // Validate that the user exists in the database
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, email: true, name: true }
        })
        
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined
          }
        } else {
          logger.warn('User not found in database', { userId: session.user.id }, 'AuthService')
          return null
        }
      } catch (dbError) {
        logger.warn('Database error validating user:', dbError, 'AuthService')
        // If database is unavailable, we can still use the session
        return {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.name || undefined
        }
      }
    }
    return null
  } catch (error) {
    logger.error('Error in getUserFromRequest:', error, 'AuthService')
    return null
  }
}

/**
 * Get session from server components
 */
export async function getServerSession(): Promise<AuthSession | null> {
  const session = await getSession()
  if (session?.user?.id) {
    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || undefined
      },
      expires: new Date(session.expires)
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
 * Require authentication - throw if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await getServerSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session.user
}

/**
 * Middleware helper pour vérifier l'authentification depuis une requête
 */
export async function requireAuthFromRequest(request: NextRequest): Promise<{
  userId?: string;
  errorResponse?: Response;
}> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return {
      errorResponse: new Response(
        JSON.stringify({ error: 'Non autorisé' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }
  
  return { userId: user.id };
}

/**
 * 🛡️ AUTHENTIFICATION UNIFIÉE POUR LES ROUTES API
 * Remplace les systèmes de fallback multiples par une seule source de vérité
 */
export async function requireApiAuth(request: NextRequest): Promise<{
  userId: string;
  user: AuthUser;
} | {
  errorResponse: NextResponse;
}> {
  try {
    // Utiliser SEULEMENT le système JWT unifié
    const session = await getSessionFromRequest(request)
    
    if (!session?.user?.id) {
      logger.warn('API: Unauthorized access attempt', { 
        url: request.url,
        userAgent: request.headers.get('user-agent') 
      }, 'AuthService')
      
      return {
        errorResponse: NextResponse.json(
          { 
            error: 'Authentication required. Please log in to access this resource.',
            code: 'AUTH_REQUIRED'
          }, 
          { status: 401 }
        )
      }
    }

    // Valider que l'utilisateur existe toujours en base
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true, isActive: true }
      })
      
      if (!dbUser || !dbUser.isActive) {
        logger.warn('API: User not found or inactive', { userId: session.user.id }, 'AuthService')
        return {
          errorResponse: NextResponse.json(
            { 
              error: 'User account not found or inactive',
              code: 'USER_NOT_FOUND'
            }, 
            { status: 401 }
          )
        }
      }

      logger.info('API: Successful authentication', { 
        userId: dbUser.id, 
        email: dbUser.email 
      }, 'AuthService')

      return {
        userId: dbUser.id,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || undefined
        }
      }
      
    } catch (dbError) {
      logger.warn('API: Database validation failed, using session data', dbError, 'AuthService')
      
      // En cas d'erreur DB, on peut utiliser les données de session
      return {
        userId: session.user.id,
        user: {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.name || undefined
        }
      }
    }
    
  } catch (error) {
    logger.error('API: Authentication error', error, 'AuthService')
    return {
      errorResponse: NextResponse.json(
        { 
          error: 'Internal authentication error',
          code: 'AUTH_ERROR'
        }, 
        { status: 500 }
      )
    }
  }
}

// Alias pour compatibilité avec l'API existante
export const auth = getSession

// Fonctions de remplacement pour NextAuth compatibilité
export async function getServerSessionCompat(request?: Request): Promise<Session | null> {
  if (request) {
    return getSessionFromRequest(request)
  }
  return getSession()
}

export async function getToken(req: { headers: { get: (name: string) => string | null } }): Promise<{ sub?: string } | null> {
  const session = await getSessionFromRequest(req as Request)
  if (session) {
    return { sub: session.user.id }
  }
  return null
}