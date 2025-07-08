import { PrismaClient } from '@prisma/client';
import { getMonitoringConfig } from '@/config/ai.config';
import AIServiceManager from '../AIServiceManager';

const prisma = new PrismaClient();

export interface MetricsSnapshot {
  timestamp: Date;
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
      errorRate: number;
      requestCount: number;
      tokenUsage?: number;
    };
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  business: {
    activeUsers: number;
    totalPortfolioValue: number;
    alertsGenerated: number;
    predictionsComputed: number;
  };
}

export interface MetricsReport {
  period: string;
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    uptime: number;
    errorRate: number;
  };
  trends: {
    userGrowth: number;
    portfolioGrowth: number;
    aiUsage: number;
  };
  performance: {
    slowestServices: Array<{ name: string; avgTime: number }>;
    mostUsedFeatures: Array<{ feature: string; usage: number }>;
    errorSources: Array<{ source: string; count: number }>;
  };
}

export class MetricsCollector {
  private config = getMonitoringConfig();
  private aiManager = AIServiceManager.getInstance();

  async collectAllMetrics(): Promise<MetricsSnapshot> {
    console.log('Collecting AI metrics...');
    const timestamp = new Date();

    try {
      const [serviceMetrics, systemMetrics, businessMetrics] = await Promise.all([
        this.collectServiceMetrics(),
        this.collectSystemMetrics(),
        this.collectBusinessMetrics(),
      ]);

      const snapshot: MetricsSnapshot = {
        timestamp,
        services: serviceMetrics,
        system: systemMetrics,
        business: businessMetrics,
      };

      // Sauvegarder les métriques
      await this.saveMetricsSnapshot(snapshot);

      console.log('Metrics collection completed');
      return snapshot;
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      throw error;
    }
  }

  private async collectServiceMetrics(): Promise<MetricsSnapshot['services']> {
    const serviceStatus = await this.aiManager.getAllServiceStatus();
    const metrics: MetricsSnapshot['services'] = {};

    for (const [serviceName, status] of serviceStatus) {
      metrics[serviceName] = {
        status: status.isOnline ? 'healthy' : 'down',
        responseTime: status.avgResponseTime,
        errorRate: status.errorRate,
        requestCount: status.requestCount,
        tokenUsage: status.tokenUsage?.hourly,
      };

      // Déterminer l'état de santé
      if (status.isOnline) {
        if (status.errorRate > 0.1 || status.avgResponseTime > 5000) {
          metrics[serviceName].status = 'degraded';
        }
      }
    }

    return metrics;
  }

  private async collectSystemMetrics(): Promise<MetricsSnapshot['system']> {
    // Simulation des métriques système (en production, utiliser des vraies métriques)
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: 50 + Math.random() * 40,
      diskUsage: 20 + Math.random() * 30,
    };
  }

  private async collectBusinessMetrics(): Promise<MetricsSnapshot['business']> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [activeUsers, portfolioValue, alertsCount, predictionsCount] = await Promise.all([
      // Utilisateurs actifs dans les dernières 24h
      prisma.session.count({
        where: {
          expires: { gte: last24h }
        }
      }),

      // Valeur totale des portfolios
      this.calculateTotalPortfolioValue(),

      // Alertes générées dans les dernières 24h
      prisma.alert.count({
        where: {
          createdAt: { gte: last24h }
        }
      }),

      // Prédictions calculées dans les dernières 24h
      prisma.aIInteraction.count({
        where: {
          createdAt: { gte: last24h },
          serviceType: { contains: 'prediction' }
        }
      }),
    ]);

    return {
      activeUsers,
      totalPortfolioValue: portfolioValue,
      alertsGenerated: alertsCount,
      predictionsComputed: predictionsCount,
    };
  }

  private async calculateTotalPortfolioValue(): Promise<number> {
    // Calculer la valeur totale de tous les portfolios
    const latestValuations = await prisma.valuation.findMany({
      where: {
        valuationDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Dernière semaine
        }
      },
      orderBy: { valuationDate: 'desc' },
      include: {
        asset: {
          include: {
            ownerships: true
          }
        }
      }
    });

    let totalValue = 0;
    const processedAssets = new Set<string>();

    for (const valuation of latestValuations) {
      if (processedAssets.has(valuation.assetId)) continue;
      
      processedAssets.add(valuation.assetId);
      
      // Somme des pourcentages de propriété pour cet actif
      const totalOwnership = valuation.asset.ownerships.reduce(
        (sum, ownership) => sum + ownership.percentage, 0
      );
      
      totalValue += valuation.value * totalOwnership;
    }

    return totalValue;
  }

  private async saveMetricsSnapshot(snapshot: MetricsSnapshot): Promise<void> {
    // Sauvegarder en base (structure simplifiée)
    await prisma.metricsSnapshot.create({
      data: {
        timestamp: snapshot.timestamp,
        services: JSON.stringify(snapshot.services),
        system: JSON.stringify(snapshot.system),
        business: JSON.stringify(snapshot.business),
      }
    });
  }

  async generateMetricsReport(periodDays: number = 7): Promise<MetricsReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    console.log(`Generating metrics report for ${periodDays} days...`);

    const [summary, trends, performance] = await Promise.all([
      this.calculateSummaryMetrics(startDate, endDate),
      this.calculateTrends(startDate, endDate),
      this.analyzePerformance(startDate, endDate),
    ]);

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      summary,
      trends,
      performance,
    };
  }

  private async calculateSummaryMetrics(startDate: Date, endDate: Date) {
    const interactions = await prisma.aIInteraction.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const totalRequests = interactions.length;
    const averageResponseTime = totalRequests > 0 
      ? interactions.reduce((sum, i) => sum + (i.responseTimeMs || 0), 0) / totalRequests
      : 0;

    // Calculer l'uptime basé sur les snapshots
    const snapshots = await prisma.metricsSnapshot.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate }
      }
    });

    let totalUptime = 0;
    let uptimeCount = 0;

    for (const snapshot of snapshots) {
      const services = JSON.parse(snapshot.services);
      const healthyServices = Object.values(services).filter(
        (service: any) => service.status === 'healthy'
      ).length;
      const totalServices = Object.keys(services).length;
      
      if (totalServices > 0) {
        totalUptime += healthyServices / totalServices;
        uptimeCount++;
      }
    }

    const uptime = uptimeCount > 0 ? (totalUptime / uptimeCount) * 100 : 100;

    // Calculer le taux d'erreur
    const errorCount = interactions.filter(i => 
      i.response && JSON.parse(i.response).error
    ).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      uptime: Math.round(uptime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  private async calculateTrends(startDate: Date, endDate: Date) {
    const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);

    // Croissance des utilisateurs
    const firstHalfUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate, lt: midDate } }
    });
    const secondHalfUsers = await prisma.user.count({
      where: { createdAt: { gte: midDate, lte: endDate } }
    });
    const userGrowth = firstHalfUsers > 0 
      ? ((secondHalfUsers - firstHalfUsers) / firstHalfUsers) * 100 
      : 0;

    // Croissance du portefeuille (simulation)
    const portfolioGrowth = (Math.random() - 0.5) * 10; // -5% à +5%

    // Usage IA
    const firstHalfAI = await prisma.aIInteraction.count({
      where: { createdAt: { gte: startDate, lt: midDate } }
    });
    const secondHalfAI = await prisma.aIInteraction.count({
      where: { createdAt: { gte: midDate, lte: endDate } }
    });
    const aiUsage = firstHalfAI > 0 
      ? ((secondHalfAI - firstHalfAI) / firstHalfAI) * 100 
      : 0;

    return {
      userGrowth: Math.round(userGrowth * 100) / 100,
      portfolioGrowth: Math.round(portfolioGrowth * 100) / 100,
      aiUsage: Math.round(aiUsage * 100) / 100,
    };
  }

  private async analyzePerformance(startDate: Date, endDate: Date) {
    const interactions = await prisma.aIInteraction.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    // Services les plus lents
    const servicePerformance = new Map<string, { totalTime: number; count: number }>();
    
    for (const interaction of interactions) {
      const service = interaction.serviceType;
      const time = interaction.responseTimeMs || 0;
      
      if (!servicePerformance.has(service)) {
        servicePerformance.set(service, { totalTime: 0, count: 0 });
      }
      
      const current = servicePerformance.get(service)!;
      current.totalTime += time;
      current.count += 1;
    }

    const slowestServices = Array.from(servicePerformance.entries())
      .map(([name, data]) => ({
        name,
        avgTime: Math.round(data.totalTime / data.count)
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    // Fonctionnalités les plus utilisées
    const featureUsage = new Map<string, number>();
    
    for (const interaction of interactions) {
      const feature = this.extractFeatureName(interaction.serviceType);
      featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
    }

    const mostUsedFeatures = Array.from(featureUsage.entries())
      .map(([feature, usage]) => ({ feature, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    // Sources d'erreurs
    const errorSources = new Map<string, number>();
    
    for (const interaction of interactions) {
      try {
        const response = JSON.parse(interaction.response || '{}');
        if (response.error) {
          const source = interaction.serviceType;
          errorSources.set(source, (errorSources.get(source) || 0) + 1);
        }
      } catch {
        // Ignorer les erreurs de parsing
      }
    }

    const errorSourcesList = Array.from(errorSources.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      slowestServices,
      mostUsedFeatures,
      errorSources: errorSourcesList,
    };
  }

  private extractFeatureName(serviceType: string): string {
    // Extraire le nom de la fonctionnalité du type de service
    const featureMap: Record<string, string> = {
      '/api/ai/chat': 'Chat Assistant',
      '/api/ai/predictions': 'Prédictions',
      '/api/ai/alerts': 'Alertes',
      '/api/ai/optimize': 'Optimisation',
      '/api/dashboard': 'Dashboard',
    };

    for (const [key, value] of Object.entries(featureMap)) {
      if (serviceType.includes(key)) {
        return value;
      }
    }

    return 'Other';
  }

  // Méthodes utilitaires pour les alertes de monitoring
  async checkMetricsAlerts(): Promise<string[]> {
    const alerts: string[] = [];
    const recentSnapshots = await prisma.metricsSnapshot.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Dernière heure
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    if (recentSnapshots.length === 0) {
      alerts.push('No recent metrics data available');
      return alerts;
    }

    const latestSnapshot = recentSnapshots[0];
    const services = JSON.parse(latestSnapshot.services);
    const system = JSON.parse(latestSnapshot.system);
    const business = JSON.parse(latestSnapshot.business);

    // Vérifier l'état des services
    for (const [serviceName, serviceData] of Object.entries(services)) {
      const service = serviceData as any;
      
      if (service.status === 'down') {
        alerts.push(`Service ${serviceName} is DOWN`);
      } else if (service.status === 'degraded') {
        alerts.push(`Service ${serviceName} is DEGRADED`);
      }
      
      if (service.responseTime > 5000) {
        alerts.push(`Service ${serviceName} has high response time: ${service.responseTime}ms`);
      }
      
      if (service.errorRate > 0.1) {
        alerts.push(`Service ${serviceName} has high error rate: ${(service.errorRate * 100).toFixed(1)}%`);
      }
    }

    // Vérifier les métriques système
    if (system.cpuUsage > 80) {
      alerts.push(`High CPU usage: ${system.cpuUsage.toFixed(1)}%`);
    }
    
    if (system.memoryUsage > 85) {
      alerts.push(`High memory usage: ${system.memoryUsage.toFixed(1)}%`);
    }
    
    if (system.diskUsage > 90) {
      alerts.push(`High disk usage: ${system.diskUsage.toFixed(1)}%`);
    }

    // Vérifier les métriques business
    if (business.activeUsers === 0) {
      alerts.push('No active users in the last 24 hours');
    }

    return alerts;
  }

  async exportMetrics(format: 'json' | 'csv' = 'json', days: number = 30): Promise<string> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const snapshots = await prisma.metricsSnapshot.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (format === 'json') {
      return JSON.stringify(snapshots, null, 2);
    } else {
      // Format CSV
      const headers = ['timestamp', 'service_status', 'response_time', 'error_rate', 'active_users'];
      const rows = [headers.join(',')];

      for (const snapshot of snapshots) {
        const services = JSON.parse(snapshot.services);
        const business = JSON.parse(snapshot.business);
        
        // Moyenne des métriques de service
        const serviceValues = Object.values(services) as any[];
        const avgResponseTime = serviceValues.length > 0
          ? serviceValues.reduce((sum, s) => sum + s.responseTime, 0) / serviceValues.length
          : 0;
        const avgErrorRate = serviceValues.length > 0
          ? serviceValues.reduce((sum, s) => sum + s.errorRate, 0) / serviceValues.length
          : 0;

        const row = [
          snapshot.timestamp.toISOString(),
          serviceValues.filter(s => s.status === 'healthy').length / serviceValues.length,
          avgResponseTime.toFixed(0),
          (avgErrorRate * 100).toFixed(2),
          business.activeUsers
        ];

        rows.push(row.join(','));
      }

      return rows.join('\n');
    }
  }
} 