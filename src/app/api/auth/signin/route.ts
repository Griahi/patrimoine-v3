import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'

// USERS DE SECOURS - SANS BASE DE DONNÉES
const FALLBACK_USERS = [
  {
    id: 'user-demo-1',
    email: 'test@example.com',
    password: 'password123',
    name: 'Utilisateur Test'
  },
  {
    id: 'user-demo-2', 
    email: 'demo@patrimoine.com',
    password: 'demo123',
    name: 'Démo Patrimoine'
  },
  {
    id: 'user-admin',
    email: 'admin@patrimoine.com', 
    password: 'admin123',
    name: 'Admin Patrimoine'
  }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('🔐 Tentative de connexion:', { email, timestamp: new Date().toISOString() })

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // CONNEXION AVEC UTILISATEURS DE SECOURS
    const fallbackUser = FALLBACK_USERS.find(user => 
      user.email.toLowerCase() === email.toLowerCase() && 
      user.password === password
    )

    if (fallbackUser) {
      console.log('✅ Connexion réussie avec utilisateur de secours:', fallbackUser.email)
      
      // Try to create or get the user in the database for proper foreign key relationships
      let dbUserId = fallbackUser.id
      try {
        const { prisma } = await import('@/lib/prisma')
        const dbUser = await prisma.user.upsert({
          where: { email: fallbackUser.email },
          update: {
            name: fallbackUser.name,
          },
          create: {
            id: fallbackUser.id, // Use the same ID as fallback
            email: fallbackUser.email,
            name: fallbackUser.name,
            password: null, // No password for fallback users
          }
        })
        dbUserId = dbUser.id
        console.log('✅ Fallback user synced to database:', dbUserId)
      } catch (dbError) {
        console.warn('⚠️ Could not sync fallback user to database:', dbError)
        // Continue with fallback authentication even if DB is not available
      }
      
      // Créer une session fictive
      const response = NextResponse.json({
        success: true,
        message: 'Connexion réussie (mode secours)',
        user: {
          id: dbUserId,
          email: fallbackUser.email,
          name: fallbackUser.name
        }
      })

      // Définir le cookie de session
      response.cookies.set('auth-session', JSON.stringify({
        userId: dbUserId,
        email: fallbackUser.email,
        name: fallbackUser.name,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      })

      return response
    }

    // Si pas d'utilisateur de secours trouvé, essayer la base de données
    try {
      const { authenticate } = await import('@/lib/auth')
      const user = await authenticate(email, password)

      if (!user) {
        console.log('❌ Échec d\'authentification')
        return NextResponse.json(
          { success: false, error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        )
      }

      console.log('✅ Authentification réussie:', user.email)
      await createSession(user.id)

      return NextResponse.json({
        success: true,
        message: 'Connexion réussie',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      })

    } catch (dbError) {
      console.log('⚠️ Base de données indisponible, utilisation des comptes de secours uniquement')
      console.log('📋 Comptes disponibles:')
      FALLBACK_USERS.forEach(user => {
        console.log(`   - ${user.email} : ${user.password}`)
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email ou mot de passe incorrect. Base de données indisponible.',
          debug: {
            message: 'Utilisez un des comptes de test prédéfinis',
            accounts: FALLBACK_USERS.map(u => ({ email: u.email, password: u.password }))
          }
        },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('🚨 Erreur lors de la connexion:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 