import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data (optional - remove if you want to keep existing data)
  // await prisma.valuation.deleteMany({})
  // await prisma.ownership.deleteMany({})
  // await prisma.asset.deleteMany({})
  // await prisma.entity.deleteMany({})
  
  // Create asset types if they don't exist
  const assetTypes = [
    {
      name: 'Immobilier',
      code: 'real_estate',
      description: 'Biens immobiliers résidentiels et commerciaux',
      color: '#4F46E5'
    },
    {
      name: 'Actions et Parts Sociales',
      code: 'stocks',
      description: 'Actions cotées et non cotées, parts sociales',
      color: '#059669'
    },
    {
      name: 'Comptes Bancaires',
      code: 'bank_accounts',
      description: 'Comptes courants, livrets, comptes épargne',
      color: '#DC2626'
    },
    {
      name: 'Assurance Vie',
      code: 'life_insurance',
      description: 'Contrats d\'assurance vie et capitalisation',
      color: '#7C3AED'
    },
    {
      name: 'Obligations',
      code: 'bonds',
      description: 'Obligations d\'État et corporate',
      color: '#EA580C'
    },
    {
      name: 'Crypto-monnaies',
      code: 'crypto',
      description: 'Cryptomonnaies et tokens',
      color: '#0891B2'
    },
    {
      name: 'Métaux Précieux',
      code: 'precious_metals',
      description: 'Or, argent, platine et autres métaux précieux',
      color: '#CA8A04'
    },
    {
      name: 'Collections et Œuvres d\'Art',
      code: 'collectibles',
      description: 'Œuvres d\'art, antiquités, collections',
      color: '#DB2777'
    },
    {
      name: 'Véhicules',
      code: 'vehicles',
      description: 'Automobiles, motos, bateaux',
      color: '#65A30D'
    },
    {
      name: 'Prêt Inter-Entité',
      code: 'inter_entity_loan',
      description: 'Prêts et créances entre entités du patrimoine',
      color: '#F59E0B'
    },
    {
      name: 'Autres Investissements',
      code: 'other',
      description: 'Autres types d\'investissements',
      color: '#6B7280'
    }
  ]

  console.log('Creating asset types...')
  for (const assetType of assetTypes) {
    await prisma.assetType.upsert({
      where: { code: assetType.code },
      update: assetType,
      create: assetType
    })
  }

  // Create or get a test user
  const hashedPassword = await bcrypt.hash('password123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword
    }
  })

  console.log(`Creating sample data for user: ${user.email}`)

  // Create sample entities
  const entities = [
    {
      name: 'John Doe',
      type: 'PHYSICAL_PERSON' as const,
      userId: user.id,
      taxId: '1234567890123'
    },
    {
      name: 'Jane Doe',
      type: 'PHYSICAL_PERSON' as const,
      userId: user.id,
      taxId: '1234567890124'
    },
    {
      name: 'Société Familiale SAS',
      type: 'LEGAL_ENTITY' as const,
      userId: user.id,
      taxId: '12345678901'
    }
  ]

  const createdEntities = []
  for (const entity of entities) {
    // Check if entity already exists
    const existing = await prisma.entity.findFirst({
      where: {
        userId: entity.userId,
        name: entity.name
      }
    })
    
    let created
    if (existing) {
      created = existing
    } else {
      created = await prisma.entity.create({
        data: entity
      })
    }
    createdEntities.push(created)
  }

  // Get asset types for creating assets
  const immobilier = await prisma.assetType.findUnique({ where: { code: 'real_estate' } })
  const actions = await prisma.assetType.findUnique({ where: { code: 'stocks' } })
  const comptes = await prisma.assetType.findUnique({ where: { code: 'bank_accounts' } })
  const assuranceVie = await prisma.assetType.findUnique({ where: { code: 'life_insurance' } })

  if (!immobilier || !actions || !comptes || !assuranceVie) {
    throw new Error('Asset types not found')
  }

  // Create sample assets
  console.log('Creating sample assets...')
  
  // Asset 1: Appartement Paris
  const appartement = await prisma.asset.upsert({
    where: { id: 'appartement-paris-sample' },
    update: {},
    create: {
      id: 'appartement-paris-sample',
      name: 'Appartement Paris 15ème',
      description: 'T3 de 68m² avec balcon',
      assetTypeId: immobilier.id,
      metadata: {
        address: '123 Rue de la Convention, 75015 Paris',
        surface: '68m²',
        rooms: 3
      }
    }
  })

  // Asset 2: Actions LVMH
  const actionsLVMH = await prisma.asset.upsert({
    where: { id: 'actions-lvmh-sample' },
    update: {},
    create: {
      id: 'actions-lvmh-sample',
      name: 'Actions LVMH',
      description: '50 actions LVMH',
      assetTypeId: actions.id,
      metadata: {
        isin: 'FR0000121014',
        quantity: 50
      }
    }
  })

  // Asset 3: Compte épargne
  const compteEpargne = await prisma.asset.upsert({
    where: { id: 'compte-epargne-sample' },
    update: {},
    create: {
      id: 'compte-epargne-sample',
      name: 'Livret A BNP Paribas',
      description: 'Compte épargne réglementé',
      assetTypeId: comptes.id,
      metadata: {
        accountNumber: '****1234',
        bank: 'BNP Paribas'
      }
    }
  })

  // Asset 4: Assurance vie
  const assuranceVieSample = await prisma.asset.upsert({
    where: { id: 'assurance-vie-sample' },
    update: {},
    create: {
      id: 'assurance-vie-sample',
      name: 'Assurance Vie Axa',
      description: 'Contrat multisupport',
      assetTypeId: assuranceVie.id,
      metadata: {
        contractNumber: 'AV123456',
        insurer: 'Axa'
      }
    }
  })

  // Create ownerships
  console.log('Creating ownerships...')
  
  const ownerships = [
    {
      ownerEntityId: createdEntities[0].id,
      ownedAssetId: appartement.id,
      percentage: 1.0000,
      startDate: new Date('2023-01-15')
    },
    {
      ownerEntityId: createdEntities[1].id,
      ownedAssetId: actionsLVMH.id,
      percentage: 0.6000,
      startDate: new Date('2023-03-01')
    },
    {
      ownerEntityId: createdEntities[0].id,
      ownedAssetId: actionsLVMH.id,
      percentage: 0.4000,
      startDate: new Date('2023-03-01')
    },
    {
      ownerEntityId: createdEntities[2].id,
      ownedAssetId: compteEpargne.id,
      percentage: 1.0000,
      startDate: new Date('2023-02-01')
    },
    {
      ownerEntityId: createdEntities[0].id,
      ownedAssetId: assuranceVieSample.id,
      percentage: 1.0000,
      startDate: new Date('2022-12-01')
    }
  ]

  for (const ownership of ownerships) {
    const existing = await prisma.ownership.findFirst({
      where: {
        ownerEntityId: ownership.ownerEntityId,
        ownedAssetId: ownership.ownedAssetId
      }
    })
    
    if (!existing) {
      await prisma.ownership.create({
        data: ownership
      })
    }
  }

  // Create valuations with historical data
  console.log('Creating valuations...')
  
  // Appartement valuations (monthly for last 6 months)
  const appartementValues = [
    { date: new Date('2024-01-01'), value: 420000 },
    { date: new Date('2024-02-01'), value: 425000 },
    { date: new Date('2024-03-01'), value: 430000 },
    { date: new Date('2024-04-01'), value: 435000 },
    { date: new Date('2024-05-01'), value: 440000 },
    { date: new Date('2024-06-01'), value: 445000 },
  ]

  for (const val of appartementValues) {
    const existing = await prisma.valuation.findFirst({
      where: {
        assetId: appartement.id,
        valuationDate: val.date,
        source: 'MANUAL'
      }
    })
    
    if (!existing) {
      await prisma.valuation.create({
        data: {
          assetId: appartement.id,
          value: val.value,
          valuationDate: val.date,
          source: 'MANUAL'
        }
      })
    }
  }

  // LVMH actions valuations (50 actions * price per share)
  const lvmhValues = [
    { date: new Date('2024-01-01'), value: 50 * 750 }, // 37,500€
    { date: new Date('2024-02-01'), value: 50 * 765 }, // 38,250€
    { date: new Date('2024-03-01'), value: 50 * 780 }, // 39,000€
    { date: new Date('2024-04-01'), value: 50 * 770 }, // 38,500€
    { date: new Date('2024-05-01'), value: 50 * 785 }, // 39,250€
    { date: new Date('2024-06-01'), value: 50 * 800 }, // 40,000€
  ]

  for (const val of lvmhValues) {
    const existing = await prisma.valuation.findFirst({
      where: {
        assetId: actionsLVMH.id,
        valuationDate: val.date,
        source: 'MANUAL'
      }
    })
    
    if (!existing) {
      await prisma.valuation.create({
        data: {
          assetId: actionsLVMH.id,
          value: val.value,
          valuationDate: val.date,
          source: 'MANUAL'
        }
      })
    }
  }

  // Compte épargne valuations
  const compteValues = [
    { date: new Date('2024-01-01'), value: 25000 },
    { date: new Date('2024-02-01'), value: 25500 },
    { date: new Date('2024-03-01'), value: 26000 },
    { date: new Date('2024-04-01'), value: 26500 },
    { date: new Date('2024-05-01'), value: 27000 },
    { date: new Date('2024-06-01'), value: 27500 },
  ]

  for (const val of compteValues) {
    const existing = await prisma.valuation.findFirst({
      where: {
        assetId: compteEpargne.id,
        valuationDate: val.date,
        source: 'MANUAL'
      }
    })
    
    if (!existing) {
      await prisma.valuation.create({
        data: {
          assetId: compteEpargne.id,
          value: val.value,
          valuationDate: val.date,
          source: 'MANUAL'
        }
      })
    }
  }

  // Assurance vie valuations
  const assuranceValues = [
    { date: new Date('2024-01-01'), value: 85000 },
    { date: new Date('2024-02-01'), value: 86200 },
    { date: new Date('2024-03-01'), value: 87500 },
    { date: new Date('2024-04-01'), value: 86800 },
    { date: new Date('2024-05-01'), value: 88200 },
    { date: new Date('2024-06-01'), value: 89500 },
  ]

  for (const val of assuranceValues) {
    const existing = await prisma.valuation.findFirst({
      where: {
        assetId: assuranceVieSample.id,
        valuationDate: val.date,
        source: 'MANUAL'
      }
    })
    
    if (!existing) {
      await prisma.valuation.create({
        data: {
          assetId: assuranceVieSample.id,
          value: val.value,
          valuationDate: val.date,
          source: 'MANUAL'
        }
      })
    }
  }

  console.log('Sample data created successfully!')
  console.log('Dashboard should now show:')
  console.log('- Patrimoine Total: ~600,000€')
  console.log('- 3 Entités')
  console.log('- 4 Actifs')
  console.log('- Charts with real data')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 