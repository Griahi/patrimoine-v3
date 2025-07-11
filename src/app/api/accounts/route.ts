import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeTransactions = searchParams.get('includeTransactions') === 'true'

    // Récupérer les comptes Bridge de l'utilisateur
    const bridgeAccounts = await prisma.bridgeAccount.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Mapper les données pour correspondre au format attendu par le frontend
    const accounts = bridgeAccounts.map(account => ({
      id: account.id,
      name: account.name,
      bank: account.bankName || 'Banque inconnue',
      type: account.type === 'checking' ? 'checking' : 'savings',
      balance: parseFloat(account.balance.toString()),
      currency: account.currency,
      iban: account.iban,
      lastSyncAt: account.lastSyncAt,
      isActive: account.isActive
    }))

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des comptes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bank, type, balance, currency, iban } = body

    // Valider les données
    if (!name || !bank || !type || balance === undefined) {
      return NextResponse.json(
        { error: 'Données requises manquantes' },
        { status: 400 }
      )
    }

    // Créer le compte
    const newAccount = await prisma.bridgeAccount.create({
      data: {
        userId: session.user.id,
        bridgeAccountId: `manual_${Date.now()}`, // ID unique pour les comptes manuels
        name,
        balance: parseFloat(balance.toString()),
        currency: currency || 'EUR',
        type: type,
        iban: iban || null,
        bankName: bank,
        isActive: true
      }
    })

    return NextResponse.json({ 
      account: {
        id: newAccount.id,
        name: newAccount.name,
        bank: newAccount.bankName,
        type: newAccount.type,
        balance: parseFloat(newAccount.balance.toString()),
        currency: newAccount.currency,
        iban: newAccount.iban,
        lastSyncAt: newAccount.lastSyncAt,
        isActive: newAccount.isActive
      }
    })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    )
  }
} 