import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Créer des types d'actifs par défaut
  console.log('📝 Creating default asset types...')
  
  const assetTypes = [
    {
      id: 'real_estate',
      name: 'Immobilier résidentiel',
      code: 'real_estate',
      category: 'Immobilier',
      description: 'Biens immobiliers résidentiels',
      icon: '🏠',
      color: '#3B82F6',
      fields: [
        { name: 'address', label: 'Adresse', type: 'text', required: true },
        { name: 'surface', label: 'Surface (m²)', type: 'number', required: false },
        { name: 'rooms', label: 'Nombre de pièces', type: 'number', required: false },
        { name: 'purchaseDate', label: 'Date d\'achat', type: 'date', required: false },
        { name: 'purchasePrice', label: 'Prix d\'achat', type: 'number', required: false }
      ]
    },
    {
      id: 'stocks',
      name: 'Actions cotées',
      code: 'stocks',
      category: 'Financier',
      description: 'Actions sur marché boursier',
      icon: '📈',
      color: '#10B981',
      fields: [
        { name: 'ticker', label: 'Code ticker', type: 'text', required: true },
        { name: 'quantity', label: 'Quantité', type: 'number', required: true },
        { name: 'purchasePrice', label: 'Prix d\'achat unitaire', type: 'number', required: false },
        { name: 'market', label: 'Marché', type: 'text', required: false }
      ]
    },
    {
      id: 'bank_account',
      name: 'Compte bancaire',
      code: 'bank_account',
      category: 'Liquidités',
      description: 'Comptes bancaires et livrets',
      icon: '🏦',
      color: '#6B7280',
      fields: [
        { name: 'accountNumber', label: 'Numéro de compte', type: 'text', required: false },
        { name: 'bankName', label: 'Nom de la banque', type: 'text', required: true },
        { name: 'accountType', label: 'Type de compte', type: 'select', options: ['Courant', 'Épargne', 'Livret A', 'PEL'], required: false }
      ]
    },
    {
      id: 'crypto',
      name: 'Cryptomonnaies',
      code: 'crypto',
      category: 'Numérique',
      description: 'Crypto-monnaies',
      icon: '₿',
      color: '#F59E0B',
      fields: [
        { name: 'symbol', label: 'Symbole', type: 'text', required: true },
        { name: 'quantity', label: 'Quantité', type: 'number', required: true },
        { name: 'wallet', label: 'Portefeuille', type: 'text', required: false }
      ]
    },
    {
      id: 'life_insurance',
      name: 'Assurance vie',
      code: 'life_insurance',
      category: 'Assurance',
      description: 'Contrats d\'assurance vie',
      icon: '🛡️',
      color: '#EF4444',
      fields: [
        { name: 'contractNumber', label: 'Numéro de contrat', type: 'text', required: false },
        { name: 'insurer', label: 'Assureur', type: 'text', required: true },
        { name: 'openingDate', label: 'Date d\'ouverture', type: 'date', required: false }
      ]
    },
    {
      id: 'other',
      name: 'Autre',
      code: 'other',
      category: 'Divers',
      description: 'Autres actifs',
      icon: '📋',
      color: '#8B5CF6',
      fields: [
        { name: 'description', label: 'Description', type: 'text', required: true }
      ]
    }
  ]

  for (const assetType of assetTypes) {
    await prisma.assetType.upsert({
      where: { code: assetType.code },
      update: assetType,
      create: assetType,
    })
  }

  console.log('✅ Asset types created')

  // Créer des utilisateurs de test en mode développement seulement
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Creating development test users...')

    const testUsers = [
      {
        id: 'user-demo-1',
        email: 'test@example.com',
        name: 'Utilisateur Test',
        password: 'password123',
        role: 'user'
      },
      {
        id: 'user-demo-2',
        email: 'demo@patrimoine.com',
        name: 'Démo Patrimoine',
        password: 'demo123',
        role: 'user'
      },
      {
        id: 'user-admin',
        email: 'admin@patrimoine.com',
        name: 'Admin Patrimoine',
        password: 'SecureAdminPassword2025!',
        role: 'admin'
      }
    ]

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          password: hashedPassword,
          role: userData.role
        },
        create: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role
        },
      })
      
      console.log(`✅ Created/updated user: ${userData.email}`)
    }

    console.log('✅ Development test users created')

    // Créer des entités de test pour démonstration du filtrage
    console.log('🏢 Creating test entities...')
    
    const testEntities = [
      {
        id: 'entity-test-1',
        userId: 'user-demo-1',
        type: 'PHYSICAL_PERSON',
        name: 'Max Riahi',
        taxId: '123456789',
        metadata: {
          birthDate: '1980-05-15',
          nationality: 'Française'
        },
        notes: 'Personne physique principale'
      },
      {
        id: 'entity-test-2',
        userId: 'user-demo-1',
        type: 'PHYSICAL_PERSON',
        name: 'Sophie Riahi',
        taxId: '987654321',
        metadata: {
          birthDate: '1985-03-22',
          nationality: 'Française'
        },
        notes: 'Conjoint'
      },
      {
        id: 'entity-test-3',
        userId: 'user-demo-1',
        type: 'LEGAL_ENTITY',
        name: 'SARL TechCorp',
        taxId: '12345678901234',
        metadata: {
          businessType: 'Technology',
          registrationDate: '2020-01-15',
          address: {
            street: '123 Rue de la Tech',
            city: 'Paris',
            postalCode: '75001',
            country: 'France'
          }
        },
        notes: 'Société de technologie'
      },
      {
        id: 'entity-test-4',
        userId: 'user-demo-1',
        type: 'PHYSICAL_PERSON',
        name: 'Gilles Riahi',
        taxId: '456789123',
        metadata: {
          birthDate: '1978-09-10',
          nationality: 'Française'
        },
        notes: 'Frère'
      },
      // Entités pour l'utilisateur démo
      {
        id: 'entity-demo-1',
        userId: 'user-demo-2',
        type: 'PHYSICAL_PERSON',
        name: 'Jean Dupont',
        taxId: '111222333',
        metadata: {
          birthDate: '1975-12-01',
          nationality: 'Française'
        },
        notes: 'Utilisateur démo'
      },
      {
        id: 'entity-demo-2',
        userId: 'user-demo-2',
        type: 'LEGAL_ENTITY',
        name: 'SAS Patrimoine Plus',
        taxId: '98765432101234',
        metadata: {
          businessType: 'Wealth Management',
          registrationDate: '2019-06-20'
        },
        notes: 'Société de gestion de patrimoine'
      }
    ]

    for (const entityData of testEntities) {
      await prisma.entity.upsert({
        where: { id: entityData.id },
        update: {
          type: entityData.type,
          name: entityData.name,
          taxId: entityData.taxId,
          metadata: entityData.metadata,
          notes: entityData.notes
        },
        create: entityData,
      })
      
      console.log(`✅ Created/updated entity: ${entityData.name} (${entityData.type})`)
    }

    console.log('✅ Test entities created')

    // Créer quelques actifs de test avec ownership
    console.log('💰 Creating test assets...')
    
    const testAssets = [
      {
        id: 'asset-test-1',
        name: 'Maison principale',
        assetTypeId: 'real_estate',
        description: 'Résidence principale à Paris',
        metadata: {
          address: '123 Rue de la Paix, 75001 Paris',
          surface: 120,
          rooms: 5,
          purchaseDate: '2015-06-01',
          purchasePrice: 850000
        }
      },
      {
        id: 'asset-test-2',
        name: 'Compte courant BNP',
        assetTypeId: 'bank_account',
        description: 'Compte courant principal',
        metadata: {
          bankName: 'BNP Paribas',
          accountType: 'Courant'
        }
      },
      {
        id: 'asset-test-3',
        name: 'Actions Apple',
        assetTypeId: 'stocks',
        description: 'Actions Apple Inc.',
        metadata: {
          ticker: 'AAPL',
          quantity: 50,
          market: 'NASDAQ'
        }
      },
      {
        id: 'asset-test-4',
        name: 'Appartement locatif',
        assetTypeId: 'real_estate',
        description: 'Investissement locatif',
        metadata: {
          address: '456 Avenue des Champs, 75008 Paris',
          surface: 75,
          rooms: 3,
          purchaseDate: '2020-02-15',
          purchasePrice: 650000
        }
      }
    ]

    for (const assetData of testAssets) {
      await prisma.asset.upsert({
        where: { id: assetData.id },
        update: {
          name: assetData.name,
          description: assetData.description,
          metadata: assetData.metadata
        },
        create: assetData,
      })
      
      console.log(`✅ Created/updated asset: ${assetData.name}`)
    }

    // Créer des relations d'ownership
    console.log('🤝 Creating ownership relationships...')
    
    const testOwnerships = [
      {
        id: 'ownership-1',
        ownerEntityId: 'entity-test-1', // Max Riahi
        ownedAssetId: 'asset-test-1',   // Maison principale
        percentage: 50.0
      },
      {
        id: 'ownership-2',
        ownerEntityId: 'entity-test-2', // Sophie Riahi
        ownedAssetId: 'asset-test-1',   // Maison principale
        percentage: 50.0
      },
      {
        id: 'ownership-3',
        ownerEntityId: 'entity-test-1', // Max Riahi
        ownedAssetId: 'asset-test-2',   // Compte courant BNP
        percentage: 100.0
      },
      {
        id: 'ownership-4',
        ownerEntityId: 'entity-test-3', // SARL TechCorp
        ownedAssetId: 'asset-test-3',   // Actions Apple
        percentage: 100.0
      },
      {
        id: 'ownership-5',
        ownerEntityId: 'entity-test-4', // Gilles Riahi
        ownedAssetId: 'asset-test-4',   // Appartement locatif
        percentage: 100.0
      }
    ]

    for (const ownershipData of testOwnerships) {
      await prisma.ownership.upsert({
        where: { id: ownershipData.id },
        update: {
          percentage: ownershipData.percentage
        },
        create: ownershipData,
      })
      
      console.log(`✅ Created/updated ownership: ${ownershipData.percentage}%`)
    }

    // Créer des évaluations pour les actifs
    console.log('📊 Creating asset valuations...')
    
    const testValuations = [
      {
        id: 'valuation-1',
        assetId: 'asset-test-1',
        value: 950000,
        currency: 'EUR',
        valuationDate: new Date('2024-01-01'),
        source: 'MANUAL',
        notes: 'Estimation immobilière'
      },
      {
        id: 'valuation-2',
        assetId: 'asset-test-2',
        value: 25000,
        currency: 'EUR',
        valuationDate: new Date('2024-01-01'),
        source: 'API_BANK',
        notes: 'Solde compte courant'
      },
      {
        id: 'valuation-3',
        assetId: 'asset-test-3',
        value: 9500,
        currency: 'EUR',
        valuationDate: new Date('2024-01-01'),
        source: 'API_STOCK',
        notes: 'Cours de clôture AAPL'
      },
      {
        id: 'valuation-4',
        assetId: 'asset-test-4',
        value: 720000,
        currency: 'EUR',
        valuationDate: new Date('2024-01-01'),
        source: 'MANUAL',
        notes: 'Estimation locative'
      }
    ]

    for (const valuationData of testValuations) {
      await prisma.valuation.upsert({
        where: { id: valuationData.id },
        update: {
          value: valuationData.value,
          currency: valuationData.currency,
          valuationDate: valuationData.valuationDate,
          source: valuationData.source,
          notes: valuationData.notes
        },
        create: valuationData,
      })
      
      console.log(`✅ Created/updated valuation: ${valuationData.value} ${valuationData.currency}`)
    }

    console.log('✅ Test data created successfully')
  } else {
    console.log('⚠️ Skipping test users creation (not in development mode)')
  }

  console.log('🌱 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 