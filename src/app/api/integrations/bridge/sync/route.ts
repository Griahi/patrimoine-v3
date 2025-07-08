import { NextRequest, NextResponse } from "next/server"
import { BridgeService } from "@/lib/integrations/bridge"
import { prisma } from "@/lib/prisma"
import { getUserIdFromRequest } from '@/lib/auth-utils'

const bridgeService = new BridgeService()

// POST: Sync Bridge accounts
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const syncResult = await bridgeService.syncAccounts(userId)

    return NextResponse.json(syncResult)

  } catch (error) {
    console.error('Bridge sync error:', error)
    return NextResponse.json({ 
      error: "Erreur lors de la synchronisation" 
    }, { status: 500 })
  }
}

// GET: Get sync status
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    // Get Bridge connection status
    const bridgeConnection = await prisma.bridgeConnection.findFirst({
      where: { userId, isActive: true }
    })

    if (!bridgeConnection) {
      return NextResponse.json({
        connected: false,
        message: "Aucune connexion Bridge active"
      })
    }

    // Get Bridge accounts
    const bridgeAccounts = await prisma.bridgeAccount.findMany({
      where: { userId, isActive: true },
      orderBy: { lastSyncAt: 'desc' }
    })

    return NextResponse.json({
      connected: true,
      connection: {
        id: bridgeConnection.id,
        bankName: bridgeConnection.bankName,
        createdAt: bridgeConnection.createdAt,
        lastSync: bridgeAccounts[0]?.lastSyncAt
      },
      accounts: bridgeAccounts.map(account => ({
        id: account.id,
        name: account.name,
        balance: account.balance,
        currency: account.currency,
        type: account.type,
        iban: account.iban,
        lastSyncAt: account.lastSyncAt
      }))
    })

  } catch (error) {
    console.error('Bridge status error:', error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération du statut" 
    }, { status: 500 })
  }
} 