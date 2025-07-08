import { NextRequest, NextResponse } from "next/server"
import { getToken } from "@/lib/auth"
import { BridgeService } from "@/lib/integrations/bridge"
import { prisma } from "@/lib/prisma"

const bridgeService = new BridgeService()

// GET: Redirect to Bridge authorization
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = token.id as string
    const authUrl = bridgeService.generateAuthUrl(userId)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Bridge auth URL error:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST: Handle authorization callback
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { code, state } = body

    if (!code) {
      return NextResponse.json({ error: "Code d'autorisation manquant" }, { status: 400 })
    }

    const userId = token.id as string

    // Exchange authorization code for tokens
    const authResponse = await bridgeService.exchangeAuthCode(code)

    // Store tokens in database
    await prisma.bridgeConnection.create({
      data: {
        userId,
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiresAt: new Date(Date.now() + authResponse.expires_in * 1000),
        isActive: true
      }
    })

    // Trigger initial sync
    const syncResult = await bridgeService.syncAccounts(userId)

    return NextResponse.json({
      success: true,
      message: "Connexion Bridge établie avec succès",
      syncResult
    })

  } catch (error) {
    console.error('Bridge auth callback error:', error)
    return NextResponse.json({ 
      error: "Erreur lors de l'authentification Bridge" 
    }, { status: 500 })
  }
} 