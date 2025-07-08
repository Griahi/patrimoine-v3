import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { analyzeQuery } from './nlp-service';
import { generateResponse } from './openai-service';
import { TaxAnalysisService } from '../tax/TaxAnalysisService';
import { TaxOptimizationEngine } from '../tax/TaxOptimizationEngine';

export interface AIServiceConfig {
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  cache: {
    ttl: {
      predictions: number;
      chat: number;
      optimizations: number;
    };
  };
  monitoring: {
    enabled: boolean;
    prometheusPort?: number;
  };
  limits: {
    requestsPerHour: number;
    maxTokensPerRequest: number;
    maxConcurrentRequests: number;
  };
}

export interface AIServiceStatus {
  isOnline: boolean;
  lastHealthCheck: Date;
  uptime: number;
  errorRate: number;
  avgResponseTime: number;
  requestCount: number;
  tokenUsage: {
    total: number;
    hourly: number;
    daily: number;
  };
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failures: number;
  lastFailure?: Date;
  nextAttempt?: Date;
}

export class AIServiceManager {
  private static instance: AIServiceManager;
  private prisma: PrismaClient;
  private openai: OpenAI;
  private config: AIServiceConfig;
  private services: Map<string, AIServiceStatus>;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private requestQueue: Map<string, number>;
  private startTime: Date;
  
  private constructor() {
    this.prisma = new PrismaClient();
    this.services = new Map();
    this.circuitBreakers = new Map();
    this.requestQueue = new Map();
    this.startTime = new Date();
    this.config = this.loadConfig();
    this.openai = new OpenAI({
      apiKey: this.config.openai.apiKey,
    });
    
    this.initializeServices();
  }

  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  private loadConfig(): AIServiceConfig {
    return {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
      },
      cache: {
        ttl: {
          predictions: parseInt(process.env.CACHE_TTL_PREDICTIONS || '3600'),
          chat: parseInt(process.env.CACHE_TTL_CHAT || '1800'),
          optimizations: parseInt(process.env.CACHE_TTL_OPTIMIZATIONS || '7200'),
        },
      },
      monitoring: {
        enabled: process.env.AI_MONITORING_ENABLED === 'true',
        prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9090'),
      },
      limits: {
        requestsPerHour: parseInt(process.env.AI_REQUESTS_PER_HOUR || '1000'),
        maxTokensPerRequest: parseInt(process.env.AI_MAX_TOKENS_PER_REQUEST || '2000'),
        maxConcurrentRequests: parseInt(process.env.AI_MAX_CONCURRENT_REQUESTS || '10'),
      },
    };
  }

  private initializeServices(): void {
    // Initialiser les services avec leur état
    const serviceNames = [
      'nlp-service',
      'openai-service',
      'tax-analysis',
      'tax-optimization',
      'predictions',
      'alerts',
      'dashboard-adaptive'
    ];

    for (const serviceName of serviceNames) {
      this.services.set(serviceName, {
        isOnline: true,
        lastHealthCheck: new Date(),
        uptime: 0,
        errorRate: 0,
        avgResponseTime: 0,
        requestCount: 0,
        tokenUsage: {
          total: 0,
          hourly: 0,
          daily: 0,
        },
      });

      this.circuitBreakers.set(serviceName, {
        isOpen: false,
        failures: 0,
      });
    }
  }

  // Chat Service Integration
  public async processChat(params: {
    userId: string;
    message: string;
    context?: any;
  }): Promise<any> {
    const serviceName = 'chat-service';
    
    if (!this.isServiceAvailable(serviceName)) {
      throw new Error(`Service ${serviceName} is not available`);
    }

    const startTime = Date.now();
    
    try {
      // Rate limiting
      await this.checkRateLimit(params.userId);
      
      // Analyser l'intention
      const intent = await analyzeQuery(params.message);
      
      // Récupérer le contexte patrimonial
      const patrimonyContext = await this.getPatrimonyContext(params.userId);
      
      // Générer la réponse
      const response = await generateResponse({
        query: params.message,
        intent,
        context: patrimonyContext,
      });
      
      // Enregistrer l'interaction
      await this.recordInteraction(params.userId, {
        service: serviceName,
        request: params.message,
        response: response.text,
        tokenUsage: response.tokenUsage || 0,
        responseTime: Date.now() - startTime,
      });
      
      this.updateServiceMetrics(serviceName, Date.now() - startTime, true);
      
      return response;
    } catch (error) {
      this.updateServiceMetrics(serviceName, Date.now() - startTime, false);
      this.handleServiceError(serviceName, error);
      throw error;
    }
  }

  // Tax Optimization Service
  public async optimizeTax(userId: string): Promise<any> {
    const serviceName = 'tax-optimization';
    
    if (!this.isServiceAvailable(serviceName)) {
      throw new Error(`Service ${serviceName} is not available`);
    }

    const startTime = Date.now();
    
    try {
      const taxAnalysisService = new TaxAnalysisService();
      const taxOptimizationEngine = new TaxOptimizationEngine();
      
      // Analyser la situation fiscale
      const analysis = await taxAnalysisService.analyzeCurrentSituation(userId);
      
      // Générer les stratégies d'optimisation
      const strategies = await taxOptimizationEngine.generateOptimizationStrategies(analysis);
      
      this.updateServiceMetrics(serviceName, Date.now() - startTime, true);
      
      return {
        analysis,
        strategies,
        timestamp: new Date(),
      };
    } catch (error) {
      this.updateServiceMetrics(serviceName, Date.now() - startTime, false);
      this.handleServiceError(serviceName, error);
      throw error;
    }
  }

  // Predictions Service
  public async generatePredictions(params: {
    userId: string;
    type: 'portfolio' | 'asset' | 'monteCarlo';
    horizon?: number;
    assetId?: string;
  }): Promise<any> {
    const serviceName = 'predictions';
    
    if (!this.isServiceAvailable(serviceName)) {
      throw new Error(`Service ${serviceName} is not available`);
    }

    const startTime = Date.now();
    
    try {
      // Vérifier le cache
      const cacheKey = `predictions:${params.userId}:${params.type}:${params.assetId || 'all'}:${params.horizon || 365}`;
      const cached = await this.getCachedResult(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      // Générer les prédictions (implémentation ML à venir)
      const predictions = await this.generateMLPredictions(params);
      
      // Mettre en cache
      await this.setCachedResult(cacheKey, predictions, this.config.cache.ttl.predictions);
      
      this.updateServiceMetrics(serviceName, Date.now() - startTime, true);
      
      return predictions;
    } catch (error) {
      this.updateServiceMetrics(serviceName, Date.now() - startTime, false);
      this.handleServiceError(serviceName, error);
      throw error;
    }
  }

  // Alerts Service
  public async generateAlerts(userId: string): Promise<any> {
    const serviceName = 'alerts';
    
    if (!this.isServiceAvailable(serviceName)) {
      throw new Error(`Service ${serviceName} is not available`);
    }

    const startTime = Date.now();
    
    try {
      // Récupérer les données du portfolio
      const portfolio = await this.getPortfolioData(userId);
      
      // Générer les alertes
      const alerts = await this.analyzePortfolioForAlerts(portfolio);
      
      // Enregistrer les alertes en base
      await this.saveAlerts(userId, alerts);
      
      this.updateServiceMetrics(serviceName, Date.now() - startTime, true);
      
      return alerts;
    } catch (error) {
      this.updateServiceMetrics(serviceName, Date.now() - startTime, false);
      this.handleServiceError(serviceName, error);
      throw error;
    }
  }

  // Health Check and Monitoring
  public async healthCheck(): Promise<Map<string, AIServiceStatus>> {
    for (const [serviceName, status] of this.services) {
      try {
        // Effectuer un test basique du service
        await this.testService(serviceName);
        
        status.isOnline = true;
        status.lastHealthCheck = new Date();
        status.uptime = Date.now() - this.startTime.getTime();
        
        // Réinitialiser le circuit breaker si le service fonctionne
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        if (circuitBreaker && circuitBreaker.failures > 0) {
          circuitBreaker.failures = 0;
          circuitBreaker.isOpen = false;
        }
        
      } catch (error) {
        status.isOnline = false;
        status.lastHealthCheck = new Date();
        
        // Ouvrir le circuit breaker si trop d'échecs
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        if (circuitBreaker) {
          circuitBreaker.failures++;
          circuitBreaker.lastFailure = new Date();
          
          if (circuitBreaker.failures >= 5) {
            circuitBreaker.isOpen = true;
            circuitBreaker.nextAttempt = new Date(Date.now() + 60000); // 1 minute
          }
        }
      }
    }
    
    return this.services;
  }

  // Utility methods
  private isServiceAvailable(serviceName: string): boolean {
    const service = this.services.get(serviceName);
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (!service || !service.isOnline) {
      return false;
    }
    
    if (circuitBreaker && circuitBreaker.isOpen) {
      if (circuitBreaker.nextAttempt && new Date() < circuitBreaker.nextAttempt) {
        return false;
      }
      // Réinitialiser le circuit breaker pour un test
      circuitBreaker.isOpen = false;
    }
    
    return true;
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const key = `rate_limit:${userId}`;
    const current = this.requestQueue.get(key) || 0;
    
    if (current >= this.config.limits.requestsPerHour) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requestQueue.set(key, current + 1);
    
    // Réinitialiser le compteur toutes les heures
    setTimeout(() => {
      this.requestQueue.delete(key);
    }, 3600000);
  }

  private updateServiceMetrics(serviceName: string, responseTime: number, success: boolean): void {
    const service = this.services.get(serviceName);
    if (!service) return;
    
    service.requestCount++;
    service.avgResponseTime = (service.avgResponseTime * (service.requestCount - 1) + responseTime) / service.requestCount;
    
    if (!success) {
      service.errorRate = (service.errorRate * (service.requestCount - 1) + 1) / service.requestCount;
    }
  }

  private handleServiceError(serviceName: string, error: any): void {
    console.error(`Service ${serviceName} error:`, error);
    
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailure = new Date();
      
      if (circuitBreaker.failures >= 5) {
        circuitBreaker.isOpen = true;
        circuitBreaker.nextAttempt = new Date(Date.now() + 60000);
      }
    }
  }

  private async testService(serviceName: string): Promise<void> {
    switch (serviceName) {
      case 'openai-service':
        await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        });
        break;
      // Ajouter d'autres tests de service
    }
  }

  private async getPatrimonyContext(userId: string): Promise<any> {
    // Récupérer les données du patrimoine pour le contexte
    const entities = await this.prisma.entity.findMany({
      where: { userId },
    });
    
    const ownerships = await this.prisma.ownership.findMany({
      where: { ownerEntityId: { in: entities.map(e => e.id) } },
      include: {
        ownedAsset: {
          include: {
            assetType: true,
            valuations: { orderBy: { valuationDate: 'desc' }, take: 1 },
          },
        },
      },
    });
    
    return {
      entities,
      assets: ownerships.map(o => o.ownedAsset),
      totalValue: ownerships.reduce((sum, o) => {
        const lastValuation = o.ownedAsset?.valuations[0];
        return sum + (lastValuation?.value || 0);
      }, 0),
    };
  }

  private async getPortfolioData(userId: string): Promise<any> {
    return this.getPatrimonyContext(userId);
  }

  private async generateMLPredictions(params: any): Promise<any> {
    // Placeholder pour les prédictions ML
    return {
      predictions: {},
      confidence: 0.75,
      horizon: params.horizon || 365,
      timestamp: new Date(),
    };
  }

  private async analyzePortfolioForAlerts(portfolio: any): Promise<any[]> {
    // Placeholder pour l'analyse d'alertes
    return [];
  }

  private async saveAlerts(userId: string, alerts: any[]): Promise<void> {
    // Sauvegarder les alertes en base
    for (const alert of alerts) {
      await this.prisma.alert.create({
        data: {
          userId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          data: alert.data,
          status: 'new',
        },
      });
    }
  }

  private async recordInteraction(userId: string, interaction: any): Promise<void> {
    await this.prisma.aIInteraction.create({
      data: {
        userId,
        serviceType: interaction.service,
        request: interaction.request,
        response: interaction.response,
        tokensUsed: interaction.tokenUsage,
        responseTimeMs: interaction.responseTime,
      },
    });
  }

  private async getCachedResult(key: string): Promise<any> {
    // Implémentation du cache (Redis ou mémoire)
    return null;
  }

  private async setCachedResult(key: string, value: any, ttl: number): Promise<void> {
    // Implémentation du cache (Redis ou mémoire)
  }

  // Méthodes publiques pour les métriques
  public getServiceStatus(serviceName: string): AIServiceStatus | undefined {
    return this.services.get(serviceName);
  }

  public getAllServiceStatus(): Map<string, AIServiceStatus> {
    return this.services;
  }

  public getConfig(): AIServiceConfig {
    return this.config;
  }
}

export default AIServiceManager.getInstance(); 