import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  try {
    console.log('🚪 Tentative de déconnexion')

    const response = NextResponse.json({ 
      success: true, 
      message: 'Déconnexion réussie' 
    })

    // SUPPRIMER LE COOKIE DE SESSION DE SECOURS
    response.cookies.set('auth-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immédiatement
      path: '/'
    })

    // ESSAYER DE SUPPRIMER LA SESSION NORMALE AUSSI
    try {
      const { destroySession } = await import('@/lib/auth')
      await destroySession()
      console.log('✅ Session normale détruite')
    } catch (_dbError) {
      console.log('⚠️ Impossible de détruire la session normale (base de données indisponible)')
    }

    // SUPPRIMER AUSSI LES COOKIES NEXT-AUTH PAR SÉCURITÉ
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