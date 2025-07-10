import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('📋 GET /api/asset-types - Start')
    
    // Try to get asset types from database first
    let assetTypes;
    try {
      assetTypes = await prisma.assetType.findMany({
        orderBy: { name: 'asc' }
      })
      console.log('✅ Found asset types in database:', assetTypes.length)
      
      if (assetTypes.length > 0) {
        return NextResponse.json(assetTypes)
      }
    } catch (dbError) {
      console.warn('⚠️ Database not available, using fallback data:', dbError.message)
    }

    // Fallback to hardcoded data if database is empty or unavailable
    console.log('📋 Using fallback hardcoded asset types')
    const fallbackAssetTypes = [
      {
        id: 'crypto',
        name: 'Cryptomonnaie',
        code: 'crypto',
        category: 'CRYPTO',
        description: 'Investissement en cryptomonnaies',
        color: '#F59E0B',
        fields: [
          { name: 'ticker', type: 'string', required: true, label: 'Ticker' },
          { name: 'walletAddress', type: 'string', required: false, label: 'Adresse du portefeuille' },
          { name: 'platform', type: 'string', required: false, label: 'Plateforme' },
          { name: 'amount', type: 'number', required: true, label: 'Quantité' },
          { name: 'averagePrice', type: 'number', required: false, label: 'Prix moyen d\'achat' },
          { name: 'stakingRewards', type: 'number', required: false, label: 'Récompenses de staking' }
        ]
      },
      {
        id: 'stock',
        name: 'Action',
        code: 'stock',
        category: 'STOCK',
        description: 'Actions et titres boursiers',
        color: '#10B981',
        fields: [
          { name: 'ticker', type: 'string', required: true, label: 'Ticker' },
          { name: 'market', type: 'string', required: false, label: 'Marché' },
          { name: 'quantity', type: 'number', required: true, label: 'Quantité' },
          { name: 'averagePrice', type: 'number', required: false, label: 'Prix moyen d\'achat' },
          { name: 'dividendYield', type: 'number', required: false, label: 'Rendement dividende (%)' }
        ]
      },
      {
        id: 'bond',
        name: 'Obligation',
        code: 'bond',
        category: 'BOND',
        description: 'Obligations et titres de créance',
        color: '#3B82F6',
        fields: [
          { name: 'issuer', type: 'string', required: true, label: 'Émetteur' },
          { name: 'couponRate', type: 'number', required: true, label: 'Taux de coupon (%)' },
          { name: 'maturityDate', type: 'date', required: true, label: 'Date d\'échéance' },
          { name: 'nominalValue', type: 'number', required: true, label: 'Valeur nominale' },
          { name: 'rating', type: 'string', required: false, label: 'Notation' }
        ]
      },
      {
        id: 'real-estate',
        name: 'Immobilier',
        code: 'real_estate',
        category: 'REAL_ESTATE',
        description: 'Biens immobiliers résidentiels et commerciaux',
        color: '#8B5CF6',
        fields: [
          { name: 'type', type: 'select', required: true, label: 'Type', options: ['appartement', 'maison', 'terrain', 'commercial', 'parking'] },
          { name: 'address', type: 'string', required: true, label: 'Adresse' },
          { name: 'surface', type: 'number', required: false, label: 'Surface (m²)' },
          { name: 'rooms', type: 'number', required: false, label: 'Nombre de pièces' },
          { name: 'purchasePrice', type: 'number', required: false, label: 'Prix d\'achat' },
          { name: 'monthlyRent', type: 'number', required: false, label: 'Loyer mensuel' },
          { name: 'charges', type: 'number', required: false, label: 'Charges mensuelles' },
          { name: 'taxeFonciere', type: 'number', required: false, label: 'Taxe foncière annuelle' }
        ]
      },
      {
        id: 'business',
        name: 'Entreprise',
        code: 'business',
        category: 'BUSINESS',
        description: 'Parts d\'entreprise et participations',
        color: '#F59E0B',
        fields: [
          { name: 'companyName', type: 'string', required: true, label: 'Nom de l\'entreprise' },
          { name: 'sector', type: 'string', required: false, label: 'Secteur d\'activité' },
          { name: 'sharePercentage', type: 'number', required: true, label: 'Pourcentage détenu (%)' },
          { name: 'numberOfShares', type: 'number', required: false, label: 'Nombre d\'actions' },
          { name: 'pricePerShare', type: 'number', required: false, label: 'Prix par action' },
          { name: 'lastDividend', type: 'number', required: false, label: 'Dernier dividende' }
        ]
      },
      {
        id: 'bank-account',
        name: 'Compte bancaire',
        code: 'bank_account',
        category: 'BANK_ACCOUNT',
        description: 'Comptes courants, livrets et épargne',
        color: '#10B981',
        fields: [
          { name: 'bankName', type: 'string', required: true, label: 'Nom de la banque' },
          { name: 'accountType', type: 'select', required: true, label: 'Type de compte', options: ['courant', 'épargne', 'livret', 'terme'] },
          { name: 'iban', type: 'string', required: false, label: 'IBAN' },
          { name: 'interestRate', type: 'number', required: false, label: 'Taux d\'intérêt (%)' },
          { name: 'accountNumber', type: 'string', required: false, label: 'Numéro de compte' }
        ]
      },
      {
        id: 'life-insurance',
        name: 'Assurance vie',
        code: 'life_insurance',
        category: 'INSURANCE',
        description: 'Contrats d\'assurance vie et épargne',
        color: '#EF4444',
        fields: [
          { name: 'insurer', type: 'string', required: true, label: 'Assureur' },
          { name: 'contractNumber', type: 'string', required: false, label: 'Numéro de contrat' },
          { name: 'policyType', type: 'select', required: true, label: 'Type de contrat', options: ['fonds euros', 'unités de compte', 'multisupport'] },
          { name: 'guaranteedReturn', type: 'number', required: false, label: 'Rendement garanti (%)' },
          { name: 'managementFees', type: 'number', required: false, label: 'Frais de gestion (%)' },
          { name: 'beneficiary', type: 'string', required: false, label: 'Bénéficiaire' }
        ]
      },
      {
        id: 'retirement-plan',
        name: 'Plan de retraite',
        code: 'retirement_plan',
        category: 'RETIREMENT',
        description: 'Plans d\'épargne retraite',
        color: '#8B5CF6',
        fields: [
          { name: 'planType', type: 'select', required: true, label: 'Type de plan', options: ['PER individuel', 'PER collectif', 'PERP', 'Madelin', 'Article 83'] },
          { name: 'provider', type: 'string', required: true, label: 'Organisme' },
          { name: 'monthlyContribution', type: 'number', required: false, label: 'Versement mensuel' },
          { name: 'employerContribution', type: 'number', required: false, label: 'Contribution employeur' },
          { name: 'expectedReturn', type: 'number', required: false, label: 'Rendement espéré (%)' }
        ]
      },
      {
        id: 'precious-metals',
        name: 'Métaux précieux',
        code: 'precious_metals',
        category: 'PRECIOUS_METALS',
        description: 'Or, argent et métaux précieux',
        color: '#F59E0B',
        fields: [
          { name: 'metalType', type: 'select', required: true, label: 'Type de métal', options: ['or', 'argent', 'platine', 'palladium'] },
          { name: 'form', type: 'select', required: true, label: 'Forme', options: ['lingot', 'pièce', 'barre'] },
          { name: 'weight', type: 'number', required: true, label: 'Poids (grammes)' },
          { name: 'purity', type: 'number', required: false, label: 'Pureté (%)' },
          { name: 'purchasePrice', type: 'number', required: false, label: 'Prix d\'achat' },
          { name: 'storageLocation', type: 'string', required: false, label: 'Lieu de stockage' }
        ]
      },
      {
        id: 'art-collectibles',
        name: 'Art et objets de collection',
        code: 'art_collectibles',
        category: 'ART_COLLECTIBLES',
        description: 'Œuvres d\'art et objets de collection',
        color: '#EC4899',
        fields: [
          { name: 'itemType', type: 'select', required: true, label: 'Type d\'objet', options: ['peinture', 'sculpture', 'bijoux', 'antiquité', 'vin', 'monnaie', 'autre'] },
          { name: 'artist', type: 'string', required: false, label: 'Artiste/Créateur' },
          { name: 'year', type: 'number', required: false, label: 'Année' },
          { name: 'condition', type: 'select', required: false, label: 'État', options: ['excellent', 'bon', 'moyen', 'à restaurer'] },
          { name: 'purchasePrice', type: 'number', required: false, label: 'Prix d\'achat' },
          { name: 'appraisalValue', type: 'number', required: false, label: 'Valeur d\'expertise' },
          { name: 'appraisalDate', type: 'date', required: false, label: 'Date d\'expertise' }
        ]
      },
      {
        id: 'inter-entity-loan',
        name: 'Prêt inter-entités',
        code: 'inter_entity_loan',
        category: 'INTER_ENTITY_LOAN',
        description: 'Prêts entre entités du patrimoine',
        color: '#14B8A6',
        fields: [
          { name: 'lenderEntityId', type: 'entity-select', required: true, label: 'Entité prêteuse' },
          { name: 'interestRate', type: 'number', required: true, label: 'Taux d\'intérêt (%)' },
          { name: 'loanDuration', type: 'number', required: true, label: 'Durée (mois)' },
          { name: 'startDate', type: 'date', required: true, label: 'Date de début' },
          { name: 'guarantees', type: 'string', required: false, label: 'Garanties' }
        ]
      }
    ]

    // Si la base de données est vide, insérer les types par défaut
    try {
      console.log('💾 Inserting default asset types into database...')
      await prisma.assetType.createMany({
        data: fallbackAssetTypes.map(type => ({
          id: type.id,
          name: type.name,
          code: type.code,
          category: type.category,
          description: type.description,
          icon: null,
          color: type.color,
          fields: type.fields
        })),
        skipDuplicates: true
      })
      console.log('✅ Default asset types inserted successfully')
      
      // Return the newly inserted types
      const insertedTypes = await prisma.assetType.findMany({
        orderBy: { name: 'asc' }
      })
      return NextResponse.json(insertedTypes)
    } catch (insertError) {
      console.warn('⚠️ Could not insert default types, returning fallback data:', insertError.message)
      return NextResponse.json(fallbackAssetTypes)
    }

  } catch (error) {
    console.error('❌ Error in asset-types API:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { name, category, color, fields } = await request.json()

    if (!name || !category || !color || !fields || !Array.isArray(fields)) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    const newAssetType = {
      id: `custom-${Date.now()}`,
      name,
      category,
      color,
      fields,
      isCustom: true
    }

    return NextResponse.json(newAssetType)
  } catch (error) {
    console.error('Erreur lors de la création du type d\'actif:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
} 