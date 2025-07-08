import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // VÉRIFIER LE COOKIE DE SESSION DE SECOURS D'ABORD
    const fallbackSession = request.cookies.get('auth-session')?.value
    
    if (fallbackSession) {
      try {
        const sessionData = JSON.parse(fallbackSession)
        
        // Vérifier si la session n'a pas expiré
        const expiresAt = new Date(sessionData.expires)
        if (expiresAt > new Date()) {
          console.log('✅ Session de secours valide pour:', sessionData.email)
          
          return NextResponse.json({
            hasSession: true,
            sessionData: {
              userId: sessionData.userId,
              email: sessionData.email,
              name: sessionData.name,
              expires: sessionData.expires
            }
          })
        } else {
          console.log('⚠️ Session de secours expirée')
        }
      } catch (parseError) {
        console.log('⚠️ Erreur de parsing de la session de secours:', parseError)
      }
    }

    // FALLBACK VERS LE SYSTÈME NORMAL
    try {
      const { getSession } = await import('@/lib/auth')
      const session = await getSession()
      
      if (session) {
        console.log('✅ Session normale valide pour:', session.user.email)
        
        return NextResponse.json({
          hasSession: true,
          sessionData: {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name,
            expires: session.expires
          }
        })
      }
    } catch (dbError) {
      console.log('⚠️ Base de données indisponible pour vérification de session')
    }

    // AUCUNE SESSION VALIDE TROUVÉE
    console.log('❌ Aucune session valide trouvée')
    
    return NextResponse.json({
      hasSession: false,
      sessionData: null
    })

  } catch (error) {
    console.error('🚨 Erreur lors de la vérification de session:', error)
    
    return NextResponse.json({
      hasSession: false,
      sessionData: null,
      error: 'Erreur de vérification de session'
    }, { status: 500 })
  }
} 