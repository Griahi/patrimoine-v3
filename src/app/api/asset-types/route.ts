import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-utils'

// Import Prisma avec try/catch pour éviter les erreurs de compilation
let prisma: typeof import('@/lib/prisma').prisma | null = null
try {
  const { prisma: importedPrisma } = require('@/lib/prisma')
  prisma = importedPrisma
} catch (_error) {
  console.warn('⚠️ Prisma import failed, using default asset types')
}

// Types d'actifs par défaut en cas d'indisponibilité de la base de données
const defaultAssetTypes = [
  {
    id: 'real_estate',
    name: 'Immobilier résidentiel',
    code: 'real_estate',
    category: 'REAL_ESTATE',
    description: 'Biens immobiliers résidentiels',
    color: '#3B82F6',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'stocks',
    name: 'Actions cotées',
    code: 'stocks',
    category: 'FINANCIAL',
    description: 'Actions sur marché boursier',
    color: '#10B981',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bank_account',
    name: 'Compte bancaire',
    code: 'bank_account',
    category: 'FINANCIAL',
    description: 'Comptes bancaires',
    color: '#6B7280',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'crypto',
    name: 'Cryptomonnaies',
    code: 'crypto',
    category: 'FINANCIAL',
    description: 'Crypto-monnaies',
    color: '#F59E0B',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'life_insurance',
    name: 'Assurance vie',
    code: 'life_insurance',
    category: 'FINANCIAL',
    description: 'Contrats d\'assurance vie',
    color: '#EF4444',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'other',
    name: 'Autre',
    code: 'other',
    category: 'OTHER',
    description: 'Autres actifs',
    color: '#8B5CF6',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('📋 GET /api/asset-types - userId:', userId)

    // Essayer d'abord Prisma, sinon utiliser les types par défaut
    let assetTypes
    try {
      if (!prisma) throw new Error('Prisma not available')
      assetTypes = await prisma.assetType.findMany({
        orderBy: {
          name: 'asc'
        }
      })
    } catch (error) {
      console.warn('⚠️ Prisma failed, using default asset types:', error instanceof Error ? error.message : 'Unknown error')
      assetTypes = defaultAssetTypes
    }

    console.log('✅ Returning', assetTypes.length, 'asset types')
    return NextResponse.json(assetTypes)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des types d\'actifs:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 