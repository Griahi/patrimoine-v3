import cron from 'node-cron';
import Bull, { Job, Queue } from 'bull';
import { PrismaClient } from '@prisma/client';
import { getJobsConfig, getAIConfig } from '@/config/ai.config';
import AIServiceManager from '../AIServiceManager';
import { AlertsGenerator } from './AlertsGenerator';
import { ModelTrainer } from './ModelTrainer';
import { DataCleanup } from './DataCleanup';
import { MetricsCollector } from './MetricsCollector';

const prisma = new PrismaClient();

export interface JobResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface JobContext {
  jobId: string;
  jobType: string;
  userId?: string;
  metadata?: any;
  startTime: number;
}

export class AIJobScheduler {
  private static instance: AIJobScheduler;
  private queues: Map<string, Queue> = new Map();
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private running: boolean = false;
  private config = getJobsConfig();
  private aiManager = AIServiceManager.getInstance();

  private constructor() {
    this.initializeQueues();
  }

  public static getInstance(): AIJobScheduler {
    if (!AIJobScheduler.instance) {
      AIJobScheduler.instance = new AIJobScheduler();
    }
    return AIJobScheduler.instance;
  }

  private initializeQueues(): void {
    // Configuration Redis pour Bull
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_AI_JOBS_DB || '1'),
    };

    // Créer les queues pour chaque type de job
    const jobTypes = [
      'alert-generation',
      'model-training',
      'data-cleanup',
      'metric-collection',
      'user-analysis',
      'portfolio-analysis'
    ];

    for (const jobType of jobTypes) {
      const queue = new Bull(jobType, {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Gestion des événements de queue
      queue.on('completed', (job: Job, result: JobResult) => {
        console.log(`Job ${job.id} completed:`, result);
        this.recordJobResult(job, result);
      });

      queue.on('failed', (job: Job, err: Error) => {
        console.error(`Job ${job.id} failed:`, err);
        this.recordJobResult(job, {
          success: false,
          message: 'Job failed',
          error: err.message,
          duration: Date.now() - job.processedOn!,
          timestamp: new Date(),
        });
      });

      queue.on('stalled', (job: Job) => {
        console.warn(`Job ${job.id} stalled`);
      });

      this.queues.set(jobType, queue);
    }

    this.setupJobProcessors();
  }

  private setupJobProcessors(): void {
    // Processor pour la génération d'alertes
    this.queues.get('alert-generation')?.process(async (job: Job) => {
      return await this.processAlertGeneration(job);
    });

    // Processor pour l'entraînement de modèles
    this.queues.get('model-training')?.process(async (job: Job) => {
      return await this.processModelTraining(job);
    });

    // Processor pour le nettoyage de données
    this.queues.get('data-cleanup')?.process(async (job: Job) => {
      return await this.processDataCleanup(job);
    });

    // Processor pour la collecte de métriques
    this.queues.get('metric-collection')?.process(async (job: Job) => {
      return await this.processMetricCollection(job);
    });

    // Processor pour l'analyse utilisateur
    this.queues.get('user-analysis')?.process(async (job: Job) => {
      return await this.processUserAnalysis(job);
    });

    // Processor pour l'analyse de portfolio
    this.queues.get('portfolio-analysis')?.process(async (job: Job) => {
      return await this.processPortfolioAnalysis(job);
    });
  }

  public start(): void {
    if (this.running) {
      console.warn('AI Job Scheduler is already running');
      return;
    }

    if (!this.config.scheduler.enabled) {
      console.log('AI Job Scheduler is disabled');
      return;
    }

    this.running = true;
    this.scheduleRecurringJobs();
    console.log('AI Job Scheduler started');
  }

  public stop(): void {
    if (!this.running) {
      return;
    }

    // Arrêter les tâches programmées
    for (const [name, task] of this.scheduledJobs) {
      task.destroy();
      console.log(`Stopped scheduled job: ${name}`);
    }

    // Fermer les queues
    for (const [name, queue] of this.queues) {
      queue.close();
      console.log(`Closed queue: ${name}`);
    }

    this.running = false;
    console.log('AI Job Scheduler stopped');
  }

  private scheduleRecurringJobs(): void {
    const tasks = this.config.tasks;

    // Génération d'alertes
    if (tasks.alertGeneration.enabled) {
      const task = cron.schedule(
        tasks.alertGeneration.schedule,
        () => this.scheduleAlertGeneration(),
        {
          scheduled: false,
          timezone: this.config.scheduler.timezone,
        }
      );
      this.scheduledJobs.set('alert-generation', task);
      task.start();
    }

    // Entraînement de modèles
    if (tasks.modelTraining.enabled) {
      const task = cron.schedule(
        tasks.modelTraining.schedule,
        () => this.scheduleModelTraining(),
        {
          scheduled: false,
          timezone: this.config.scheduler.timezone,
        }
      );
      this.scheduledJobs.set('model-training', task);
      task.start();
    }

    // Nettoyage de données
    if (tasks.dataCleanup.enabled) {
      const task = cron.schedule(
        tasks.dataCleanup.schedule,
        () => this.scheduleDataCleanup(),
        {
          scheduled: false,
          timezone: this.config.scheduler.timezone,
        }
      );
      this.scheduledJobs.set('data-cleanup', task);
      task.start();
    }

    // Collecte de métriques
    if (tasks.metricCollection.enabled) {
      const task = cron.schedule(
        tasks.metricCollection.schedule,
        () => this.scheduleMetricCollection(),
        {
          scheduled: false,
          timezone: this.config.scheduler.timezone,
        }
      );
      this.scheduledJobs.set('metric-collection', task);
      task.start();
    }

    console.log(`Scheduled ${this.scheduledJobs.size} recurring jobs`);
  }

  // Méthodes de planification des jobs
  public async scheduleAlertGeneration(userId?: string): Promise<void> {
    const queue = this.queues.get('alert-generation');
    if (!queue) return;

    await queue.add('generate-alerts', {
      userId,
      timestamp: new Date(),
    }, {
      priority: userId ? 1 : 10, // Priorité plus haute pour les utilisateurs spécifiques
      delay: 0,
    });
  }

  public async scheduleModelTraining(modelType?: string): Promise<void> {
    const queue = this.queues.get('model-training');
    if (!queue) return;

    await queue.add('train-model', {
      modelType,
      timestamp: new Date(),
    }, {
      priority: 5,
      delay: 0,
    });
  }

  public async scheduleDataCleanup(): Promise<void> {
    const queue = this.queues.get('data-cleanup');
    if (!queue) return;

    await queue.add('cleanup-data', {
      timestamp: new Date(),
    }, {
      priority: 3,
      delay: 0,
    });
  }

  public async scheduleMetricCollection(): Promise<void> {
    const queue = this.queues.get('metric-collection');
    if (!queue) return;

    await queue.add('collect-metrics', {
      timestamp: new Date(),
    }, {
      priority: 2,
      delay: 0,
    });
  }

  public async scheduleUserAnalysis(userId: string): Promise<void> {
    const queue = this.queues.get('user-analysis');
    if (!queue) return;

    await queue.add('analyze-user', {
      userId,
      timestamp: new Date(),
    }, {
      priority: 1,
      delay: 0,
    });
  }

  public async schedulePortfolioAnalysis(userId: string, portfolioId?: string): Promise<void> {
    const queue = this.queues.get('portfolio-analysis');
    if (!queue) return;

    await queue.add('analyze-portfolio', {
      userId,
      portfolioId,
      timestamp: new Date(),
    }, {
      priority: 1,
      delay: 0,
    });
  }

  // Processeurs de jobs
  private async processAlertGeneration(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    const context: JobContext = {
      jobId: job.id.toString(),
      jobType: 'alert-generation',
      userId: job.data.userId,
      startTime,
    };

    try {
      const alertsGenerator = new AlertsGenerator();
      
      if (job.data.userId) {
        // Génération d'alertes pour un utilisateur spécifique
        await alertsGenerator.generateUserAlerts(job.data.userId);
      } else {
        // Génération d'alertes pour tous les utilisateurs
        await alertsGenerator.generateAllAlerts();
      }

      return {
        success: true,
        message: `Alerts generated successfully${job.data.userId ? ` for user ${job.data.userId}` : ' for all users'}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Alert generation failed',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async processModelTraining(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      const modelTrainer = new ModelTrainer();
      const result = await modelTrainer.trainModels(job.data.modelType);

      return {
        success: true,
        message: `Model training completed${job.data.modelType ? ` for ${job.data.modelType}` : ''}`,
        data: result,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Model training failed',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async processDataCleanup(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      const dataCleanup = new DataCleanup();
      const result = await dataCleanup.cleanupExpiredData();

      return {
        success: true,
        message: 'Data cleanup completed',
        data: result,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Data cleanup failed',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async processMetricCollection(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      const metricsCollector = new MetricsCollector();
      const result = await metricsCollector.collectAllMetrics();

      return {
        success: true,
        message: 'Metrics collection completed',
        data: result,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Metrics collection failed',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async processUserAnalysis(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      // Analyser le comportement utilisateur et mettre à jour les recommendations
      const userId = job.data.userId;
      
      // Récupérer les données comportementales
      const behaviorData = await prisma.userBehavior.findFirst({
        where: { userId },
      });

      // Analyser et générer des insights
      const insights = await this.aiManager.generateUserInsights(userId, behaviorData);

      // Mettre à jour les suggestions du dashboard
      await this.updateDashboardSuggestions(userId, insights);

      return {
        success: true,
        message: `User analysis completed for ${userId}`,
        data: insights,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'User analysis failed',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async processPortfolioAnalysis(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      const { userId, portfolioId } = job.data;
      
      // Analyser le portfolio et générer des recommandations
      const analysis = await this.aiManager.analyzePortfolio(userId, portfolioId);
      
      // Générer des alertes si nécessaire
      await this.scheduleAlertGeneration(userId);

      return {
        success: true,
        message: `Portfolio analysis completed for user ${userId}`,
        data: analysis,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Portfolio analysis failed',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  // Méthodes utilitaires
  private async recordJobResult(job: Job, result: JobResult): Promise<void> {
    try {
      await prisma.jobExecution.create({
        data: {
          jobId: job.id.toString(),
          jobType: job.name,
          status: result.success ? 'completed' : 'failed',
          result: JSON.stringify(result),
          duration: result.duration,
          createdAt: result.timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to record job result:', error);
    }
  }

  private async updateDashboardSuggestions(userId: string, insights: any): Promise<void> {
    // Générer des suggestions basées sur les insights
    const suggestions = this.generateSuggestionsFromInsights(insights);
    
    for (const suggestion of suggestions) {
      await prisma.dashboardSuggestion.create({
        data: {
          userId,
          type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          impact: suggestion.impact,
          confidence: suggestion.confidence,
          data: suggestion.data,
          actions: suggestion.actions,
        },
      });
    }
  }

  private generateSuggestionsFromInsights(insights: any): any[] {
    const suggestions = [];
    
    // Exemple de génération de suggestions
    if (insights.unusedWidgets?.length > 0) {
      suggestions.push({
        type: 'layout_optimization',
        title: 'Optimiser votre dashboard',
        description: `${insights.unusedWidgets.length} widgets ne sont jamais utilisés. Les masquer ?`,
        impact: 'medium',
        confidence: 0.8,
        data: { unusedWidgets: insights.unusedWidgets },
        actions: ['hide_widgets'],
      });
    }

    if (insights.frequentActions?.length > 0) {
      suggestions.push({
        type: 'quick_actions',
        title: 'Ajouter des raccourcis',
        description: 'Créer des raccourcis pour vos actions fréquentes',
        impact: 'high',
        confidence: 0.9,
        data: { actions: insights.frequentActions },
        actions: ['create_shortcuts'],
      });
    }

    return suggestions;
  }

  // Méthodes de monitoring
  public async getJobStats(): Promise<any> {
    const stats: any = {};
    
    for (const [name, queue] of this.queues) {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();
      
      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    }
    
    return stats;
  }

  public getScheduledJobs(): string[] {
    return Array.from(this.scheduledJobs.keys());
  }

  public isRunning(): boolean {
    return this.running;
  }
}

export default AIJobScheduler.getInstance(); 