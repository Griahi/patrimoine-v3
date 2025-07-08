import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-utils'
import { getAssetsByUserId, addAssetToFile, getEntitiesByUserId } from '@/lib/json-storage'

interface OwnershipData {
  entityId: string;
  percentage: number;
}

// Import Prisma avec try/catch pour éviter les erreurs de compilation
let prisma: typeof import('@/lib/prisma').prisma | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma: importedPrisma } = require('@/lib/prisma');
  prisma = importedPrisma;
} catch {
  console.warn('⚠️ Prisma import failed, using file storage only');
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('📋 GET /api/assets - userId:', userId)

    // Essayer d'abord Prisma, sinon utiliser les fichiers JSON
    let assets;
    try {
      if (!prisma) throw new Error('Prisma not available');
      assets = await prisma.asset.findMany({
        where: {
          ownerships: {
            some: {
              ownerEntity: {
                userId: userId
              }
            }
          }
        },
        include: {
          assetType: true,
          ownerships: {
            include: {
              ownerEntity: true
            }
          },
          valuations: {
            orderBy: {
              valuationDate: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.warn('⚠️ Prisma failed, using file storage:', error instanceof Error ? error.message : 'Unknown error');
      assets = await getAssetsByUserId(userId);
    }

    console.log('✅ Returning', assets.length, 'assets')
    return NextResponse.json(assets)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des actifs:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json()
    console.log('📝 Body reçu:', body)
    
    const { name, description, assetTypeId, metadata, ownerships = [], owners = [], initialValue = 0, valuationDate } = body

    if (!name || !assetTypeId) {
      return NextResponse.json({ error: "Nom et type d'actif requis" }, { status: 400 })
    }

    console.log('➕ POST /api/assets - Creating asset:', { name, assetTypeId, userId, initialValue, ownershipsLength: ownerships.length, ownersLength: owners.length })

    // Essayer d'abord Prisma, sinon utiliser le système de fichiers
    let newAsset;
    try {
      if (!prisma) throw new Error('Prisma not available');
      
      // Validation des ownerships
      if (ownerships.length > 0) {
        const totalPercentage = ownerships.reduce((sum: number, o: OwnershipData) => sum + (o.percentage || 0), 0)
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new Error('La somme des pourcentages de détention doit être égale à 100%')
        }
      }

      const assetData = {
        name,
        description: description || null,
        assetTypeId,
        metadata: metadata && Object.keys(metadata).length > 0 ? metadata : null
      }

      newAsset = await prisma.asset.create({
        data: assetData,
        include: {
          assetType: true,
          ownerships: {
            include: {
              ownerEntity: true
            }
          },
          valuations: {
            orderBy: {
              valuationDate: 'desc'
            },
            take: 1
          }
        }
      });
    } catch (error) {
      console.warn('⚠️ Prisma failed, using file storage:', error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback: créer un actif et l'ajouter au fichier JSON
      // Créer un type d'actif par défaut
      const assetType = {
        id: assetTypeId,
        name: 'Type d\'actif',
        category: 'OTHER',
        color: '#6B7280'
      };

      // Utiliser owners (du formulaire) ou ownerships (API directe)
      const ownershipData = owners.length > 0 ? owners : ownerships;
      
      // Récupérer les entités depuis le fichier JSON
      const fileEntities = await getEntitiesByUserId(userId);
      
      // Créer les ownerships avec les entités correspondantes
      const createdOwnerships = ownershipData.map((ownership: OwnershipData) => {
        const ownerEntity = fileEntities.find(entity => entity.id === ownership.entityId);
        return {
          id: `ownership-${Date.now()}-${Math.random()}`,
          ownerEntityId: ownership.entityId,
          percentage: ownership.percentage,
          ownerEntity: ownerEntity || {
            id: ownership.entityId,
            name: 'Entité inconnue',
            userId: userId
          }
        };
      });

      newAsset = {
        id: `asset-${Date.now()}`,
        name,
        description: description || null,
        assetTypeId,
        metadata: metadata && Object.keys(metadata).length > 0 ? metadata : null,
        externalId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        assetType: assetType,
        ownerships: createdOwnerships,
        valuations: [
          {
            id: `valuation-${Date.now()}`,
            value: initialValue || 0,
            currency: 'EUR',
            valuationDate: valuationDate ? new Date(valuationDate) : new Date(),
            source: 'MANUAL',
            notes: 'Valeur initiale'
          }
        ]
      };

      // Ajouter au fichier JSON persistant
      await addAssetToFile(newAsset);
    }

    console.log('✅ Created asset:', newAsset.id)
    return NextResponse.json(newAsset)
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'actif:', error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 