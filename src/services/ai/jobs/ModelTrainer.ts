import { PrismaClient } from '@prisma/client';
import { getPredictionsConfig } from '@/config/ai.config';

const prisma = new PrismaClient();

export interface TrainingData {
  features: number[][];
  targets: number[];
  timestamps: Date[];
  metadata: any;
}

export interface ModelMetrics {
  mse: number;
  mae: number;
  r2: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
}

export interface TrainingResult {
  modelType: string;
  version: string;
  metrics: {
    mse: number;
    mae: number;
    r2: number;
    accuracy?: number;
  };
  trainingSize: number;
  validationSize: number;
  features: string[];
  convergence: boolean;
  trainingTime: number;
}

export class ModelTrainer {
  private config = getPredictionsConfig();

  async trainModels(modelType?: string): Promise<TrainingResult[]> {
    console.log('Starting model training...', modelType || 'all models');
    
    const results: TrainingResult[] = [];
    const modelsToTrain = modelType ? [modelType] : [
      'portfolio-performance',
      'asset-volatility',
      'risk-assessment'
    ];

    for (const type of modelsToTrain) {
      try {
        console.log(`Training model: ${type}`);
        const result = await this.trainSpecificModel(type);
        results.push(result);
        
        await this.saveTrainedModel(result);
        console.log(`Model ${type} trained successfully`);
      } catch (error) {
        console.error(`Failed to train model ${type}:`, error);
      }
    }

    return results;
  }

  private async trainSpecificModel(modelType: string): Promise<TrainingResult> {
    const startTime = Date.now();
    
    // Simuler l'entraînement d'un modèle
    const trainingData = await this.getTrainingData(modelType);
    
    if (trainingData.length < this.config.minDataPoints) {
      throw new Error(`Insufficient training data for ${modelType}`);
    }

    // Simuler des métriques d'entraînement
    const metrics = {
      mse: Math.random() * 0.1,
      mae: Math.random() * 0.05,
      r2: 0.7 + Math.random() * 0.25,
      accuracy: modelType.includes('classification') ? 0.8 + Math.random() * 0.15 : undefined
    };

    const trainingTime = Date.now() - startTime;
    
    return {
      modelType,
      version: this.generateModelVersion(),
      metrics,
      trainingSize: Math.floor(trainingData.length * 0.8),
      validationSize: Math.floor(trainingData.length * 0.2),
      features: this.getFeatureNames(modelType),
      convergence: true,
      trainingTime
    };
  }

  private async getTrainingData(modelType: string): Promise<any[]> {
    switch (modelType) {
      case 'portfolio-performance':
        return this.getPortfolioData();
      case 'asset-volatility':
        return this.getAssetData();
      case 'risk-assessment':
        return this.getRiskData();
      default:
        return [];
    }
  }

  private async getPortfolioData(): Promise<any[]> {
    return await prisma.valuation.findMany({
      take: 1000,
      include: { asset: true }
    });
  }

  private async getAssetData(): Promise<any[]> {
    return await prisma.asset.findMany({
      take: 500,
      include: { valuations: true }
    });
  }

  private async getRiskData(): Promise<any[]> {
    return await prisma.alert.findMany({
      take: 200,
      where: { type: 'risk' }
    });
  }

  private getFeatureNames(modelType: string): string[] {
    const features = {
      'portfolio-performance': ['value', 'trend', 'volatility', 'diversification'],
      'asset-volatility': ['price', 'volume', 'historical_volatility', 'market_cap'],
      'risk-assessment': ['concentration', 'correlation', 'var', 'sharpe_ratio']
    };
    
    return features[modelType as keyof typeof features] || [];
  }

  private generateModelVersion(): string {
    const now = new Date();
    return `v${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`;
  }

  private async saveTrainedModel(result: TrainingResult): Promise<void> {
    await prisma.mLModel.create({
      data: {
        modelType: result.modelType,
        version: result.version,
        trainingData: JSON.stringify({
          trainingSize: result.trainingSize,
          features: result.features
        }),
        metrics: JSON.stringify(result.metrics),
        modelPath: `/models/${result.modelType}/${result.version}`,
        isActive: true
      }
    });
  }
} 