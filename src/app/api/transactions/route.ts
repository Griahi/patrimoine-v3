import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Modèle de transaction pour stocker les données en base
interface TransactionData {
  id: string
  accountId: string
  date: Date
  description: string
  amount: number
  category: string
  type: 'credit' | 'debit'
  balance: number
  merchant?: string
  isProcessed: boolean
  createdAt: Date
  updatedAt: Date
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Vérifier que l'utilisateur possède le compte si un accountId est fourni
    if (accountId) {
      const account = await prisma.bridgeAccount.findFirst({
        where: {
          id: accountId,
          userId: session.user.id
        }
      })

      if (!account) {
        return NextResponse.json(
          { error: 'Compte non trouvé' },
          { status: 404 }
        )
      }
    }

    // Pour l'instant, utiliser des données simulées
    // En production, ces données seraient stockées dans une table transactions
    const mockTransactions = [
      {
        id: '1',
        accountId: accountId || '1',
        date: new Date('2024-01-15'),
        description: 'APPLE.COM/BILL CARTE 497400000000937T RIB 22,99EUR',
        amount: -22.99,
        category: 'Achats',
        type: 'debit' as const,
        balance: 3455.39,
        isProcessed: true,
        merchant: 'Apple',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        accountId: accountId || '1',
        date: new Date('2024-01-14'),
        description: 'SPB',
        amount: -49.99,
        category: 'Achats',
        type: 'debit' as const,
        balance: 3478.38,
        isProcessed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        accountId: accountId || '1',
        date: new Date('2024-01-13'),
        description: 'INST RECU',
        amount: 650.00,
        category: 'Virement',
        type: 'credit' as const,
        balance: 3528.37,
        isProcessed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        accountId: accountId || '1',
        date: new Date('2024-01-12'),
        description: 'APPLE.COM/BILL CARTE 497400000000937T RIB 16,99EUR',
        amount: -16.99,
        category: 'Achats',
        type: 'debit' as const,
        balance: 2878.37,
        isProcessed: true,
        merchant: 'Apple',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        accountId: accountId || '1',
        date: new Date('2024-01-11'),
        description: 'APPLE.COM/BILL CARTE 497400000000937T RIB 9,99EUR',
        amount: -9.99,
        category: 'Achats',
        type: 'debit' as const,
        balance: 2895.36,
        isProcessed: true,
        merchant: 'Apple',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '6',
        accountId: accountId || '1',
        date: new Date('2024-01-10'),
        description: 'SPB',
        amount: -452.97,
        category: 'Achats',
        type: 'debit' as const,
        balance: 2905.35,
        isProcessed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '7',
        accountId: accountId || '1',
        date: new Date('2024-01-09'),
        description: 'VIR PERMANENT ENTRETIEN MENSUEL JARDIN',
        amount: -4329.0,
        category: 'Services',
        type: 'debit' as const,
        balance: 3358.32,
        isProcessed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '8',
        accountId: accountId || '1',
        date: new Date('2024-01-08'),
        description: 'INST EMIS',
        amount: -4180.0,
        category: 'Virement',
        type: 'debit' as const,
        balance: 7687.32,
        isProcessed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '9',
        accountId: accountId || '1',
        date: new Date('2024-01-07'),
        description: 'INST EMIS',
        amount: -69.0,
        category: 'Virement',
        type: 'debit' as const,
        balance: 11867.32,
        isProcessed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Filtrer les transactions
    let filteredTransactions = mockTransactions

    if (category && category !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.category === category)
    }

    if (search) {
      filteredTransactions = filteredTransactions.filter(t =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Pagination
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit)

    return NextResponse.json({
      transactions: paginatedTransactions,
      total: filteredTransactions.length,
      hasMore: offset + limit < filteredTransactions.length
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des transactions' },
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
    const { accountId, date, description, amount, category, type, balance, merchant } = body

    // Valider les données
    if (!accountId || !date || !description || amount === undefined || !category || !type) {
      return NextResponse.json(
        { error: 'Données requises manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur possède le compte
    const account = await prisma.bridgeAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Créer la transaction (simulation - en production, utiliser une vraie table)
    const newTransaction = {
      id: Date.now().toString(),
      accountId,
      date: new Date(date),
      description,
      amount: parseFloat(amount.toString()),
      category,
      type: type as 'credit' | 'debit',
      balance: balance || 0,
      merchant: merchant || null,
      isProcessed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return NextResponse.json({ transaction: newTransaction })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la transaction' },
      { status: 500 }
    )
  }
} 