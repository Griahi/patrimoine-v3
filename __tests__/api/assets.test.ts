import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockAsset, createMockEntity, createMockValuation } from '@/test-setup'

// Mock Next.js Request/Response
const createMockRequest = (method: string, body?: any, params?: any) => ({
  method,
  json: vi.fn().mockResolvedValue(body),
  url: 'http://localhost:3000/api/assets',
  nextUrl: {
    searchParams: new URLSearchParams()
  },
  params: params || {}
})

const createMockResponse = () => {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    headers: new Headers()
  }
  return response
}

// Mock Prisma Client
const mockPrisma = {
  asset: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  entity: {
    findMany: vi.fn()
  },
  assetType: {
    findMany: vi.fn()
  },
  ownership: {
    create: vi.fn(),
    findMany: vi.fn()
  },
  $transaction: vi.fn()
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

// Simulation d'un handler d'API
class AssetsAPIHandler {
  constructor(private prisma: any) {}

  async GET(request: any) {
    try {
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')
      
      if (!userId) {
        return { status: 400, json: { error: 'User ID required' } }
      }

      // Récupérer les entités de l'utilisateur
      const entities = await this.prisma.entity.findMany({
        where: { userId }
      })

      if (entities.length === 0) {
        return { status: 200, json: [] }
      }

      // Récupérer les actifs via les ownerships
      const assets = await this.prisma.asset.findMany({
        where: {
          id: {
            in: entities.map(e => e.id)
          }
        },
        include: {
          assetType: true,
          valuations: {
            orderBy: { valuationDate: 'desc' },
            take: 5
          },
          debts: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      return { status: 200, json: assets }
    } catch (error) {
      return { status: 500, json: { error: 'Internal server error' } }
    }
  }

  async POST(request: any) {
    try {
      const body = await request.json()
      
      // Validation basique
      if (!body.name || !body.assetTypeId || !body.owners) {
        return { status: 400, json: { error: 'Missing required fields' } }
      }

      // Vérifier que les propriétaires totalisent 100%
      const totalPercentage = body.owners.reduce((sum: number, owner: any) => sum + owner.percentage, 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return { status: 400, json: { error: 'Ownership percentages must total 100%' } }
      }

      // Transaction pour créer l'actif et les ownerships
      const result = await this.prisma.$transaction(async (tx: any) => {
        // Créer l'actif
        const asset = await tx.asset.create({
          data: {
            name: body.name,
            assetTypeId: body.assetTypeId,
            description: body.description,
            metadata: body.metadata || {}
          }
        })

        // Créer les ownerships
        const ownerships = await Promise.all(
          body.owners.map((owner: any) =>
            tx.ownership.create({
              data: {
                ownerEntityId: owner.entityId,
                ownedAssetId: asset.id,
                percentage: owner.percentage / 100
              }
            })
          )
        )

        // Créer la valorisation initiale si fournie
        if (body.initialValue) {
          await tx.valuation.create({
            data: {
              assetId: asset.id,
              value: body.initialValue,
              currency: body.currency || 'EUR',
              valuationDate: new Date(),
              source: 'MANUAL'
            }
          })
        }

        return { asset, ownerships }
      })

      return { status: 201, json: result.asset }
    } catch (error) {
      return { status: 500, json: { error: 'Internal server error' } }
    }
  }

  async PUT(request: any) {
    try {
      const body = await request.json()
      const { id } = request.params
      
      if (!id) {
        return { status: 400, json: { error: 'Asset ID required' } }
      }

      // Vérifier que l'actif existe
      const existingAsset = await this.prisma.asset.findUnique({
        where: { id }
      })

      if (!existingAsset) {
        return { status: 404, json: { error: 'Asset not found' } }
      }

      // Mettre à jour l'actif
      const updatedAsset = await this.prisma.asset.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          metadata: body.metadata
        },
        include: {
          assetType: true,
          valuations: {
            orderBy: { valuationDate: 'desc' },
            take: 1
          }
        }
      })

      return { status: 200, json: updatedAsset }
    } catch (error) {
      return { status: 500, json: { error: 'Internal server error' } }
    }
  }

  async DELETE(request: any) {
    try {
      const { id } = request.params
      
      if (!id) {
        return { status: 400, json: { error: 'Asset ID required' } }
      }

      // Vérifier que l'actif existe
      const existingAsset = await this.prisma.asset.findUnique({
        where: { id }
      })

      if (!existingAsset) {
        return { status: 404, json: { error: 'Asset not found' } }
      }

      // Supprimer l'actif (cascade sur les ownerships, valuations, etc.)
      await this.prisma.asset.delete({
        where: { id }
      })

      return { status: 200, json: { message: 'Asset deleted successfully' } }
    } catch (error) {
      return { status: 500, json: { error: 'Internal server error' } }
    }
  }
}

describe('Assets API', () => {
  let handler: AssetsAPIHandler

  beforeEach(() => {
    handler = new AssetsAPIHandler(mockPrisma)
    
    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/assets', () => {
    it('should return assets for valid user', async () => {
      const mockEntities = [createMockEntity({ id: 'entity-1', userId: 'user-1' })]
      const mockAssets = [
        createMockAsset({
          id: 'asset-1',
          assetType: { id: 'type-1', name: 'Real Estate', code: 'real_estate', color: '#000' },
          valuations: [createMockValuation()],
          debts: []
        })
      ]

      mockPrisma.entity.findMany.mockResolvedValue(mockEntities)
      mockPrisma.asset.findMany.mockResolvedValue(mockAssets)

      const request = createMockRequest('GET')
      request.url = 'http://localhost:3000/api/assets?userId=user-1'

      const response = await handler.GET(request)

      expect(response.status).toBe(200)
      expect(response.json).toEqual(mockAssets)
      expect(mockPrisma.entity.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      })
    })

    it('should return 400 if userId is missing', async () => {
      const request = createMockRequest('GET')
      request.url = 'http://localhost:3000/api/assets'

      const response = await handler.GET(request)

      expect(response.status).toBe(400)
      expect(response.json.error).toBe('User ID required')
    })

    it('should return empty array if user has no entities', async () => {
      mockPrisma.entity.findMany.mockResolvedValue([])

      const request = createMockRequest('GET')
      request.url = 'http://localhost:3000/api/assets?userId=user-1'

      const response = await handler.GET(request)

      expect(response.status).toBe(200)
      expect(response.json).toEqual([])
    })

    it('should handle database errors', async () => {
      mockPrisma.entity.findMany.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('GET')
      request.url = 'http://localhost:3000/api/assets?userId=user-1'

      const response = await handler.GET(request)

      expect(response.status).toBe(500)
      expect(response.json.error).toBe('Internal server error')
    })
  })

  describe('POST /api/assets', () => {
    const validAssetData = {
      name: 'Test Asset',
      assetTypeId: 'type-1',
      description: 'Test Description',
      metadata: { location: 'Paris' },
      owners: [
        { entityId: 'entity-1', percentage: 100 }
      ],
      initialValue: 100000,
      currency: 'EUR'
    }

    it('should create asset with valid data', async () => {
      const mockAsset = createMockAsset({ id: 'new-asset-1' })
      const mockOwnership = { id: 'ownership-1', ownerEntityId: 'entity-1', ownedAssetId: 'new-asset-1' }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          asset: { create: vi.fn().mockResolvedValue(mockAsset) },
          ownership: { create: vi.fn().mockResolvedValue(mockOwnership) },
          valuation: { create: vi.fn().mockResolvedValue({}) }
        }
        return callback(tx)
      })

      const request = createMockRequest('POST', validAssetData)

      const response = await handler.POST(request)

      expect(response.status).toBe(201)
      expect(response.json).toEqual(mockAsset)
    })

    it('should return 400 for missing required fields', async () => {
      const invalidData = { name: 'Test Asset' } // Missing assetTypeId and owners

      const request = createMockRequest('POST', invalidData)

      const response = await handler.POST(request)

      expect(response.status).toBe(400)
      expect(response.json.error).toBe('Missing required fields')
    })

    it('should return 400 for invalid ownership percentages', async () => {
      const invalidData = {
        ...validAssetData,
        owners: [
          { entityId: 'entity-1', percentage: 50 },
          { entityId: 'entity-2', percentage: 30 } // Total = 80%, not 100%
        ]
      }

      const request = createMockRequest('POST', invalidData)

      const response = await handler.POST(request)

      expect(response.status).toBe(400)
      expect(response.json.error).toBe('Ownership percentages must total 100%')
    })

    it('should handle transaction errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'))

      const request = createMockRequest('POST', validAssetData)

      const response = await handler.POST(request)

      expect(response.status).toBe(500)
      expect(response.json.error).toBe('Internal server error')
    })
  })

  describe('PUT /api/assets/:id', () => {
    const updateData = {
      name: 'Updated Asset',
      description: 'Updated Description',
      metadata: { location: 'Lyon' }
    }

    it('should update existing asset', async () => {
      const existingAsset = createMockAsset()
      const updatedAsset = { ...existingAsset, ...updateData }

      mockPrisma.asset.findUnique.mockResolvedValue(existingAsset)
      mockPrisma.asset.update.mockResolvedValue(updatedAsset)

      const request = createMockRequest('PUT', updateData, { id: 'asset-1' })

      const response = await handler.PUT(request)

      expect(response.status).toBe(200)
      expect(response.json).toEqual(updatedAsset)
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: updateData,
        include: {
          assetType: true,
          valuations: {
            orderBy: { valuationDate: 'desc' },
            take: 1
          }
        }
      })
    })

    it('should return 400 if asset ID is missing', async () => {
      const request = createMockRequest('PUT', updateData, {})

      const response = await handler.PUT(request)

      expect(response.status).toBe(400)
      expect(response.json.error).toBe('Asset ID required')
    })

    it('should return 404 if asset not found', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue(null)

      const request = createMockRequest('PUT', updateData, { id: 'nonexistent' })

      const response = await handler.PUT(request)

      expect(response.status).toBe(404)
      expect(response.json.error).toBe('Asset not found')
    })
  })

  describe('DELETE /api/assets/:id', () => {
    it('should delete existing asset', async () => {
      const existingAsset = createMockAsset()

      mockPrisma.asset.findUnique.mockResolvedValue(existingAsset)
      mockPrisma.asset.delete.mockResolvedValue(existingAsset)

      const request = createMockRequest('DELETE', null, { id: 'asset-1' })

      const response = await handler.DELETE(request)

      expect(response.status).toBe(200)
      expect(response.json.message).toBe('Asset deleted successfully')
      expect(mockPrisma.asset.delete).toHaveBeenCalledWith({
        where: { id: 'asset-1' }
      })
    })

    it('should return 400 if asset ID is missing', async () => {
      const request = createMockRequest('DELETE', null, {})

      const response = await handler.DELETE(request)

      expect(response.status).toBe(400)
      expect(response.json.error).toBe('Asset ID required')
    })

    it('should return 404 if asset not found', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue(null)

      const request = createMockRequest('DELETE', null, { id: 'nonexistent' })

      const response = await handler.DELETE(request)

      expect(response.status).toBe(404)
      expect(response.json.error).toBe('Asset not found')
    })
  })
}) 