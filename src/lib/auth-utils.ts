import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Récupère l'ID utilisateur depuis une requête Next.js
 * Version avec validation de l'existence de l'utilisateur en base
 * 
 * @param request - La requête Next.js
 * @returns L'ID utilisateur ou null si non authentifié
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    console.log('🔍 getUserIdFromRequest called')
    
    // Check for fallback session first
    const fallbackSession = request.cookies.get('auth-session')?.value
    console.log('🔑 Fallback session cookie:', fallbackSession)
    
    if (fallbackSession) {
      try {
        const sessionData = JSON.parse(fallbackSession)
        console.log('📋 Parsed session data:', sessionData)
        
        // Check if session hasn't expired
        const expiresAt = new Date(sessionData.expires)
        const now = new Date()
        console.log('⏰ Expiry check:', { expiresAt, now, expired: expiresAt <= now })
        
        if (expiresAt > now) {
          const userId = sessionData.userId;
          console.log('✅ Session valid, userId:', userId)
          
          // Validate that the user exists in the database
          try {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true }
            })
            
            if (user) {
              console.log('✅ User exists in database, userId:', userId)
              return userId;
            } else {
              console.log('❌ User not found in database, clearing session')
              // Clear invalid session cookie
              // Note: We can't directly clear the cookie from here, but we return null
              // The frontend should handle this case
              return null;
            }
          } catch (dbError) {
            console.warn('❌ Database error validating user:', dbError)
            // If database is unavailable, we can still use the session
            console.log('🚀 Using fallback session without DB verification due to DB error')
            return userId;
          }
        } else {
          console.log('⚠️ Session de fallback expirée')
        }
      } catch (parseError) {
        console.warn('❌ Failed to parse fallback session:', parseError)
      }
    }

    // If no fallback session, try regular session
    console.log('🔄 Trying regular session...')
    try {
      const session = await auth();
      console.log('🔑 Regular session result:', session)
      
      if (session?.user?.id) {
        console.log('✅ Regular session valid:', session.user.id)
        
        // Validate that the user exists in the database
        try {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true }
          })
          
          if (user) {
            console.log('✅ User exists in database, userId:', session.user.id)
            return session.user.id;
          } else {
            console.log('❌ User not found in database for regular session')
            return null;
          }
        } catch (dbError) {
          console.warn('❌ Database error validating user:', dbError)
          // If database is unavailable, we can still use the session
          console.log('🚀 Using regular session without DB verification due to DB error')
          return session.user.id;
        }
      }
    } catch (authError) {
      console.warn('❌ Auth error:', authError)
    }

    // No valid session found
    console.log('❌ No valid session found')
    return null;

  } catch (error) {
    console.error('❌ Error in getUserIdFromRequest:', error)
    return null;
  }
}

/**
 * Middleware helper pour vérifier l'authentification
 * Retourne une réponse d'erreur si l'utilisateur n'est pas authentifié
 * 
 * @param request - La requête Next.js
 * @returns Object avec userId ou errorResponse
 */
export async function requireAuth(request: NextRequest): Promise<{
  userId?: string;
  errorResponse?: Response;
}> {
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
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
  
  return { userId };
} 