import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export async function POST(_request: NextRequest) {
  try {
    console.log('🚪 Tentative de déconnexion')

    // Détruire la session JWT
    await destroySession()
    console.log('✅ Session détruite')

    const response = NextResponse.json({ 
      success: true, 
      message: 'Déconnexion réussie' 
    })

    // Supprimer le cookie de session JWT
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    console.log('✅ Déconnexion complète effectuée')
    return response

  } catch (error) {
    console.error('🚨 Erreur lors de la déconnexion:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
} 