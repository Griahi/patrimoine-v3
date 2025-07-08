import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import AIServiceManager from '../services/ai/AIServiceManager';

const prisma = new PrismaClient();

// Extension des types Express pour inclure le contexte IA
declare global {
  namespace Express {
    interface Request {
      aiContext?: AIContext;
      aiUserId?: string;
      aiMetrics?: AIRequestMetrics;
    }
  }
}

export interface AIContext {
  userId: string;
  patrimonyData: {
    entities: any[];
    assets: any[];
    totalValue: number;
    performance: {
      monthly: number;
      yearly: number;
    };
  };
  userProfile: {
    preferences: any;
    behaviorData: any;
    riskProfile: string;
  };
  sessionData: {
    sessionId: string;
    startTime: Date;
    interactions: number;
  };
}

export interface AIRequestMetrics {
  startTime: number;
  endpoint: string;
  method: string;
  userAgent: string;
  ip: string;
}

// Configuration du rate limiting pour les services IA
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100, // 100 requêtes par heure par IP
  message: {
    error: 'Too many AI requests from this IP, please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limiting par utilisateur
  keyGenerator: (req: Request) => {
    return req.headers.authorization || req.ip;
  },
  // Limites différentes selon les endpoints
  skip: (req: Request) => {
    // Endpoints moins critiques
    const lightEndpoints = ['/api/ai/status', '/api/ai/health'];
    return lightEndpoints.some(endpoint => req.path.startsWith(endpoint));
  }
});

// Rate limiting spécifique pour les services coûteux
export const heavyAIRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 requêtes par heure pour les services coûteux
  message: {
    error: 'Too many expensive AI requests, please try again later.',
    retryAfter: 3600
  },
  keyGenerator: (req: Request) => {
    return req.headers.authorization || req.ip;
  }
});

// Middleware de sécurité pour les services IA
export const aiSecurityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.openai.com"],
      },
    },
  }),
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  })
];

// Middleware d'authentification pour les services IA
export const aiAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Vérifier le token (adaptation selon votre système d'auth)
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true }
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.aiUserId = session.user.id;
    next();
  } catch (error) {
    console.error('AI Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware pour enrichir le contexte IA
export const aiContextMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.aiUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.aiUserId;
    
    // Récupérer le contexte patrimonial
    const patrimonyData = await getPatrimonyContext(userId);
    
    // Récupérer le profil utilisateur
    const userProfile = await getUserProfile(userId);
    
    // Créer ou récupérer la session
    const sessionData = await getOrCreateSession(userId, req);
    
    // Enrichir la requête avec le contexte
    req.aiContext = {
      userId,
      patrimonyData,
      userProfile,
      sessionData
    };

    next();
  } catch (error) {
    console.error('AI Context middleware error:', error);
    res.status(500).json({ error: 'Failed to load AI context' });
  }
};

// Middleware pour les métriques de requête
export const aiMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.aiMetrics = {
    startTime: Date.now(),
    endpoint: req.path,
    method: req.method,
    userAgent: req.get('User-Agent') || '',
    ip: req.ip
  };

  // Intercepter la fin de la requête pour enregistrer les métriques
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - req.aiMetrics!.startTime;
    
    // Enregistrer les métriques de manière asynchrone
    recordRequestMetrics(req, res, responseTime).catch(console.error);
    
    return originalSend.call(this, data);
  };

  next();
};

// Middleware de validation des requêtes IA
export const aiValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { body, path } = req;
  
  // Validation basique selon l'endpoint
  if (path.includes('/chat')) {
    if (!body.message || typeof body.message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    
    if (body.message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }
  }

  if (path.includes('/predictions')) {
    if (body.horizon && (body.horizon < 1 || body.horizon > 3650)) {
      return res.status(400).json({ error: 'Horizon must be between 1 and 3650 days' });
    }
  }

  // Validation de sécurité - détection de contenus malveillants
  if (body.message && containsMaliciousContent(body.message)) {
    return res.status(400).json({ error: 'Request contains prohibited content' });
  }

  next();
};

// Middleware de logging pour les services IA
export const aiLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const logData = {
    timestamp: new Date().toISOString(),
    userId: req.aiUserId,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    sessionId: req.aiContext?.sessionData?.sessionId
  };

  console.log('AI Request:', JSON.stringify(logData, null, 2));
  next();
};

// Middleware d'erreur pour les services IA
export const aiErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('AI Service Error:', {
    error: err.message,
    stack: err.stack,
    userId: req.aiUserId,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  // Gestion des erreurs spécifiques aux services IA
  if (err.message.includes('OpenAI API')) {
    return res.status(503).json({
      error: 'AI service temporarily unavailable',
      retryAfter: 30
    });
  }

  if (err.message.includes('Rate limit')) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: 3600
    });
  }

  if (err.message.includes('Token limit')) {
    return res.status(400).json({
      error: 'Request too complex, please simplify'
    });
  }

  // Erreur générique
  res.status(500).json({
    error: 'Internal server error',
    requestId: generateRequestId()
  });
};

// Middleware de health check pour les services IA
export const aiHealthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aiManager = AIServiceManager.getInstance();
    const healthStatus = await aiManager.healthCheck();
    
    const servicesDown = Array.from(healthStatus.entries())
      .filter(([, status]) => !status.isOnline)
      .map(([name]) => name);

    if (servicesDown.length > 0) {
      console.warn('AI Services degraded:', servicesDown);
      
      // Ajouter un header pour indiquer la dégradation
      res.setHeader('X-AI-Services-Status', 'degraded');
      res.setHeader('X-AI-Services-Down', servicesDown.join(','));
    }

    next();
  } catch (error) {
    console.error('AI Health check failed:', error);
    res.setHeader('X-AI-Services-Status', 'unhealthy');
    next();
  }
};

// Fonctions utilitaires
async function getPatrimonyContext(userId: string) {
  const entities = await prisma.entity.findMany({
    where: { userId },
    include: {
      ownerships: {
        include: {
          ownedAsset: {
            include: {
              assetType: true,
              valuations: {
                orderBy: { valuationDate: 'desc' },
                take: 1
              }
            }
          }
        }
      }
    }
  });

  const assets = entities.flatMap(entity => 
    entity.ownerships.map(ownership => ownership.ownedAsset)
  );

  const totalValue = assets.reduce((sum, asset) => {
    const lastValuation = asset?.valuations[0];
    return sum + (lastValuation?.value || 0);
  }, 0);

  // Calculer les performances (simulation)
  const performance = {
    monthly: Math.random() * 0.1 - 0.05, // -5% à +5%
    yearly: Math.random() * 0.2 - 0.1    // -10% à +10%
  };

  return {
    entities,
    assets,
    totalValue,
    performance
  };
}

async function getUserProfile(userId: string) {
  const userBehavior = await prisma.userBehavior.findFirst({
    where: { userId }
  });

  const preferences = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true }
  });

  return {
    preferences,
    behaviorData: userBehavior,
    riskProfile: 'moderate' // À calculer selon les données
  };
}

async function getOrCreateSession(userId: string, req: Request) {
  const sessionId = req.headers['x-session-id'] as string || generateSessionId();
  
  // Chercher une session existante
  let session = await prisma.session.findFirst({
    where: { 
      userId,
      sessionToken: sessionId
    }
  });

  if (!session) {
    // Créer une nouvelle session
    session = await prisma.session.create({
      data: {
        userId,
        sessionToken: sessionId,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      }
    });
  }

  return {
    sessionId,
    startTime: session.expires,
    interactions: 0
  };
}

async function recordRequestMetrics(req: Request, res: Response, responseTime: number) {
  if (!req.aiUserId || !req.aiMetrics) return;

  try {
    await prisma.aIInteraction.create({
      data: {
        userId: req.aiUserId,
        serviceType: req.path,
        request: JSON.stringify({
          method: req.method,
          path: req.path,
          userAgent: req.aiMetrics.userAgent
        }),
        response: JSON.stringify({
          statusCode: res.statusCode,
          responseTime
        }),
        responseTimeMs: responseTime,
        tokensUsed: 0 // À remplir selon le service
      }
    });
  } catch (error) {
    console.error('Failed to record metrics:', error);
  }
}

function containsMaliciousContent(message: string): boolean {
  const maliciousPatterns = [
    /\b(script|javascript|eval|exec|system|shell)\b/i,
    /[<>]/,
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/i,
    /\b(admin|administrator|root|sudo)\b/i
  ];

  return maliciousPatterns.some(pattern => pattern.test(message));
}

function generateRequestId(): string {
  return `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware composite pour les routes IA
export const aiMiddlewareStack = [
  ...aiSecurityMiddleware,
  aiRateLimiter,
  aiAuthMiddleware,
  aiContextMiddleware,
  aiMetricsMiddleware,
  aiValidationMiddleware,
  aiLoggingMiddleware,
  aiHealthMiddleware
];

// Middleware spécifique pour les services coûteux
export const heavyAIMiddlewareStack = [
  ...aiSecurityMiddleware,
  heavyAIRateLimiter,
  aiAuthMiddleware,
  aiContextMiddleware,
  aiMetricsMiddleware,
  aiValidationMiddleware,
  aiLoggingMiddleware,
  aiHealthMiddleware
];

export {
  aiErrorMiddleware
}; 