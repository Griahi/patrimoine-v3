import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from '@/lib/auth'
import { connectBridge } from '@/lib/integrations/bridge'

// POST: Sync Bridge accounts
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const bridgeConnection = await connectBridge()
    
    if (!bridgeConnection.configured) {
      return NextResponse.json({ 
        success: false, 
        message: bridgeConnection.error || 'Service Bridge non disponible',
        accountsCreated: 0,
        accountsUpdated: 0
      }, { status: 200 })
    }

    const result = await bridgeConnection.bridge.syncAccounts(user.id)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation du compte:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur lors de la synchronisation',
      accountsCreated: 0,
      accountsUpdated: 0
    }, { status: 500 })
  }
}

// GET: Get sync status
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const bridgeConnection = await connectBridge()
    
    if (!bridgeConnection.configured) {
      return NextResponse.json({ 
        connected: false, 
        accounts: [],
        message: bridgeConnection.error || 'Service Bridge non disponible'
      }, { status: 200 })
    }

    // Vérifier si l'utilisateur a une connexion Bridge
    const connection = await prisma.bridgeConnection.findFirst({
      where: { userId: user.id }
    })

    if (!connection) {
      return NextResponse.json({ 
        connected: false, 
        accounts: [],
        message: 'Aucune connexion Bridge trouvée'
      }, { status: 200 })
    }

    // Récupérer les comptes depuis la base de données
    const accounts = await prisma.bridgeAccount.findMany({
      where: { userId: user.id }
    })

    return NextResponse.json({ 
      connected: true, 
      connection: {
        id: connection.id,
        bankName: 'Banque connectée',
        createdAt: connection.createdAt.toISOString(),
        lastSync: connection.updatedAt.toISOString()
      },
      accounts: accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        balance: acc.balance,
        currency: acc.currency,
        type: acc.type,
        iban: acc.iban,
        lastSyncAt: acc.lastSyncAt?.toISOString()
      }))
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du statut Bridge:', error)
    return NextResponse.json({ 
      connected: false, 
      accounts: [],
      message: 'Erreur lors de la récupération du statut' 
    }, { status: 500 })
  }
} 