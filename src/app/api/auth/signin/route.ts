import { NextRequest, NextResponse } from 'next/server'
import { createSession, authenticate } from '@/lib/auth'

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

    // Authentification via la base de données uniquement
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

  } catch (error) {
    console.error('🚨 Erreur lors de la connexion:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 