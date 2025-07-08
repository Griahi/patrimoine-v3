import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  services: {
    database: ServiceHealth
    memory: ServiceHealth
    disk: ServiceHealth
  }
  metrics: {
    memoryUsage: number
    responseTime: number
    activeConnections: number
  }
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  message?: string
  details?: Record<string, unknown>
}

// Health check pour la base de données
async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now()
  
  try {
    // Test simple de connexion
    await prisma.$queryRaw`SELECT 1 as health_check`
    
    // Test des tables principales
    const [userCount, entityCount, assetCount] = await Promise.all([
      prisma.user.count(),
      prisma.entity.count(), 
      prisma.asset.count()
    ])
    
    const responseTime = Date.now() - startTime
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      message: 'Database connection successful',
      details: {
        tables: { users: userCount, entities: entityCount, assets: assetCount },
        connectionPool: 'active'
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Database connection failed',
      details: { error: 'Unable to connect to database' }
    }
  }
}

// Health check pour la mémoire
function checkMemory(): ServiceHealth {
  const memUsage = process.memoryUsage()
  const memUsedMB = Math.round(memUsage.rss / 1024 / 1024)
  const memUsedPercent = (memUsage.rss / (memUsage.rss + memUsage.heapTotal)) * 100
  
  let status: ServiceHealth['status'] = 'healthy'
  if (memUsedMB > 1000) status = 'degraded'  // Plus de 1GB
  if (memUsedMB > 2000) status = 'unhealthy' // Plus de 2GB
  
  return {
    status,
    message: `Memory usage: ${memUsedMB}MB`,
    details: {
      rss: memUsedMB,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      usagePercent: Math.round(memUsedPercent)
    }
  }
}

// Health check pour l'espace disque (simplifié)
function checkDisk(): ServiceHealth {
  // Note: Dans un environnement réel, utiliseriez fs.statSync pour vérifier l'espace disque
  // Ici on simule une vérification basique
  
  return {
    status: 'healthy',
    message: 'Disk space sufficient',
    details: {
      available: 'N/A (simulated)',
      used: 'N/A (simulated)',
      note: 'Use fs.statSync in production for real disk monitoring'
    }
  }
}

// Calculer l'uptime du processus
function getUptime(): number {
  return Math.floor(process.uptime())
}

// Obtenir la version depuis package.json
function getVersion(): string {
  try {
    // En production, vous pourriez lire depuis process.env.npm_package_version
    return process.env.npm_package_version || '1.0.0'
  } catch {
    return '1.0.0'
  }
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Exécuter tous les checks en parallèle
    const [database, memory, disk] = await Promise.all([
      checkDatabase(),
      checkMemory(),
      checkDisk()
    ])
    
    const responseTime = Date.now() - startTime
    const memoryUsage = process.memoryUsage().rss / 1024 / 1024 // MB
    
    // Déterminer le statut global
    const services = { database, memory, disk }
    const serviceStatuses = Object.values(services).map(s => s.status)
    
    let globalStatus: HealthStatus['status'] = 'healthy'
    if (serviceStatuses.includes('unhealthy')) {
      globalStatus = 'unhealthy'
    } else if (serviceStatuses.includes('degraded')) {
      globalStatus = 'degraded'
    }
    
    const healthData: HealthStatus = {
      status: globalStatus,
      timestamp: new Date().toISOString(),
      version: getVersion(),
      uptime: getUptime(),
      services,
      metrics: {
        memoryUsage: Math.round(memoryUsage),
        responseTime,
        activeConnections: 1 // Simplifié - en production, trackez les vraies connexions
      }
    }
    
    // Status HTTP basé sur la santé
    const httpStatus = globalStatus === 'healthy' ? 200 : 
                      globalStatus === 'degraded' ? 200 : 503
    
    return NextResponse.json(healthData, { status: httpStatus })
    
  } catch (error) {
    // En cas d'erreur critique
    const errorResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: getVersion(),
      uptime: getUptime(),
      services: {
        database: { status: 'unhealthy', message: 'Check failed' },
        memory: { status: 'unhealthy', message: 'Check failed' },
        disk: { status: 'unhealthy', message: 'Check failed' }
      },
      metrics: {
        memoryUsage: 0,
        responseTime: Date.now() - startTime,
        activeConnections: 0
      }
    }
    
    return NextResponse.json({
      ...errorResponse,
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 503 })
  }
}

// Endpoint pour un check simple (sans détails)
export async function HEAD() {
  try {
    // Check rapide de la base de données
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
} 