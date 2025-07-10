import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Vérifier la session JWT
    const session = await getSessionFromRequest(request)
    
    if (session) {
      console.log('✅ Session valide pour:', session.user.email)
      
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

    // Aucune session valide trouvée
    console.log('❌ Aucune session valide trouvée')
    
    return NextResponse.json({
      hasSession: false,
      sessionData: null
    })

  } catch (error) {
    console.error('❌ Erreur lors de la vérification de session:', error)
    
    return NextResponse.json({
      hasSession: false,
      sessionData: null
    })
  }
} 