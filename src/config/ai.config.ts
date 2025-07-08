// Configuration unifiée pour tous les services IA
export interface AIConfig {
  // Configuration OpenAI
  openai: {
    apiKey: string;
    organization?: string;
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    timeout: number;
    maxRetries: number;
    backoffFactor: number;
  };

  // Configuration des prédictions ML
  predictions: {
    defaultHorizon: number;
    maxHorizon: number;
    minDataPoints: number;
    confidenceLevel: number;
    monteCarloSamples: number;
    cacheTTL: number;
    updateInterval: number;
    volatilityWindow: number;
    trendWindow: number;
  };

  // Configuration des alertes
  alerts: {
    checkInterval: number;
    maxAlertsPerUser: number;
    maxAlertsPerDay: number;
    retentionDays: number;
    severityThresholds: {
      concentration: number;
      performance: number;
      fees: number;
      risk: number;
    };
    notificationChannels: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
  };

  // Configuration du cache
  cache: {
    provider: 'memory' | 'redis';
    ttl: {
      predictions: number;
      chat: number;
      optimizations: number;
      alerts: number;
      context: number;
    };
    maxSize: number;
    cleanup: {
      interval: number;
      threshold: number;
    };
    redis?: {
      host: string;
      port: number;
      password?: string;
      db: number;
    };
  };

  // Configuration du monitoring
  monitoring: {
    enabled: boolean;
    prometheus: {
      enabled: boolean;
      port: number;
      endpoint: string;
    };
    logging: {
      level: 'debug' | 'info' | 'warn' | 'error';
      format: 'json' | 'text';
      destinations: string[];
    };
    metrics: {
      responseTime: boolean;
      requestCount: boolean;
      errorRate: boolean;
      tokenUsage: boolean;
      userActivity: boolean;
    };
  };

  // Configuration des limites
  limits: {
    rateLimiting: {
      general: {
        windowMs: number;
        maxRequests: number;
      };
      chat: {
        windowMs: number;
        maxRequests: number;
      };
      predictions: {
        windowMs: number;
        maxRequests: number;
      };
      optimization: {
        windowMs: number;
        maxRequests: number;
      };
    };
    requests: {
      maxConcurrent: number;
      timeout: number;
      retryAttempts: number;
      retryDelay: number;
    };
    tokens: {
      maxPerRequest: number;
      maxPerUser: number;
      maxPerDay: number;
    };
  };

  // Configuration de la sécurité
  security: {
    encryption: {
      enabled: boolean;
      algorithm: string;
      keyLength: number;
    };
    sanitization: {
      enabled: boolean;
      strictMode: boolean;
      allowedTags: string[];
      blockedPatterns: string[];
    };
    audit: {
      enabled: boolean;
      logLevel: 'minimal' | 'detailed' | 'full';
      retentionDays: number;
    };
    cors: {
      enabled: boolean;
      origins: string[];
      methods: string[];
      headers: string[];
    };
  };

  // Configuration des jobs
  jobs: {
    scheduler: {
      enabled: boolean;
      timezone: string;
      maxConcurrent: number;
    };
    tasks: {
      alertGeneration: {
        enabled: boolean;
        schedule: string;
        timeout: number;
      };
      modelTraining: {
        enabled: boolean;
        schedule: string;
        timeout: number;
      };
      dataCleanup: {
        enabled: boolean;
        schedule: string;
        timeout: number;
      };
      metricCollection: {
        enabled: boolean;
        schedule: string;
        timeout: number;
      };
    };
  };

  // Configuration des environnements
  environments: {
    development: Partial<AIConfig>;
    staging: Partial<AIConfig>;
    production: Partial<AIConfig>;
  };
}

// Configuration par défaut
const defaultConfig: AIConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    organization: process.env.OPENAI_ORGANIZATION || undefined,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
    topP: parseFloat(process.env.AI_TOP_P || '0.9'),
    frequencyPenalty: parseFloat(process.env.AI_FREQUENCY_PENALTY || '0.0'),
    presencePenalty: parseFloat(process.env.AI_PRESENCE_PENALTY || '0.0'),
    timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
    backoffFactor: parseFloat(process.env.AI_BACKOFF_FACTOR || '2.0'),
  },

  predictions: {
    defaultHorizon: parseInt(process.env.PREDICTIONS_DEFAULT_HORIZON || '365'),
    maxHorizon: parseInt(process.env.PREDICTIONS_MAX_HORIZON || '3650'),
    minDataPoints: parseInt(process.env.PREDICTIONS_MIN_DATA_POINTS || '30'),
    confidenceLevel: parseFloat(process.env.PREDICTIONS_CONFIDENCE_LEVEL || '0.95'),
    monteCarloSamples: parseInt(process.env.PREDICTIONS_MONTE_CARLO_SAMPLES || '1000'),
    cacheTTL: parseInt(process.env.PREDICTIONS_CACHE_TTL || '3600'),
    updateInterval: parseInt(process.env.PREDICTIONS_UPDATE_INTERVAL || '3600'),
    volatilityWindow: parseInt(process.env.PREDICTIONS_VOLATILITY_WINDOW || '30'),
    trendWindow: parseInt(process.env.PREDICTIONS_TREND_WINDOW || '90'),
  },

  alerts: {
    checkInterval: parseInt(process.env.ALERTS_CHECK_INTERVAL || '3600000'),
    maxAlertsPerUser: parseInt(process.env.ALERTS_MAX_PER_USER || '50'),
    maxAlertsPerDay: parseInt(process.env.ALERTS_MAX_PER_DAY || '10'),
    retentionDays: parseInt(process.env.ALERTS_RETENTION_DAYS || '30'),
    severityThresholds: {
      concentration: parseFloat(process.env.ALERTS_CONCENTRATION_THRESHOLD || '0.4'),
      performance: parseFloat(process.env.ALERTS_PERFORMANCE_THRESHOLD || '0.15'),
      fees: parseFloat(process.env.ALERTS_FEES_THRESHOLD || '50'),
      risk: parseFloat(process.env.ALERTS_RISK_THRESHOLD || '0.2'),
    },
    notificationChannels: {
      email: process.env.ALERTS_EMAIL_ENABLED === 'true',
      push: process.env.ALERTS_PUSH_ENABLED === 'true',
      sms: process.env.ALERTS_SMS_ENABLED === 'true',
      inApp: process.env.ALERTS_IN_APP_ENABLED !== 'false',
    },
  },

  cache: {
    provider: (process.env.CACHE_PROVIDER as 'memory' | 'redis') || 'memory',
    ttl: {
      predictions: parseInt(process.env.CACHE_TTL_PREDICTIONS || '3600'),
      chat: parseInt(process.env.CACHE_TTL_CHAT || '1800'),
      optimizations: parseInt(process.env.CACHE_TTL_OPTIMIZATIONS || '7200'),
      alerts: parseInt(process.env.CACHE_TTL_ALERTS || '900'),
      context: parseInt(process.env.CACHE_TTL_CONTEXT || '300'),
    },
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
    cleanup: {
      interval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '3600000'),
      threshold: parseFloat(process.env.CACHE_CLEANUP_THRESHOLD || '0.8'),
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
    },
  },

  monitoring: {
    enabled: process.env.AI_MONITORING_ENABLED === 'true',
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
      endpoint: process.env.PROMETHEUS_ENDPOINT || '/metrics',
    },
    logging: {
      level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
      format: (process.env.LOG_FORMAT as 'json' | 'text') || 'json',
      destinations: process.env.LOG_DESTINATIONS?.split(',') || ['console'],
    },
    metrics: {
      responseTime: process.env.METRICS_RESPONSE_TIME !== 'false',
      requestCount: process.env.METRICS_REQUEST_COUNT !== 'false',
      errorRate: process.env.METRICS_ERROR_RATE !== 'false',
      tokenUsage: process.env.METRICS_TOKEN_USAGE !== 'false',
      userActivity: process.env.METRICS_USER_ACTIVITY !== 'false',
    },
  },

  limits: {
    rateLimiting: {
      general: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '3600000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
      },
      chat: {
        windowMs: parseInt(process.env.RATE_LIMIT_CHAT_WINDOW || '3600000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_CHAT_REQUESTS || '50'),
      },
      predictions: {
        windowMs: parseInt(process.env.RATE_LIMIT_PREDICTIONS_WINDOW || '3600000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_PREDICTIONS_REQUESTS || '20'),
      },
      optimization: {
        windowMs: parseInt(process.env.RATE_LIMIT_OPTIMIZATION_WINDOW || '3600000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_OPTIMIZATION_REQUESTS || '10'),
      },
    },
    requests: {
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
      timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.REQUEST_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.REQUEST_RETRY_DELAY || '1000'),
    },
    tokens: {
      maxPerRequest: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '2000'),
      maxPerUser: parseInt(process.env.MAX_TOKENS_PER_USER || '10000'),
      maxPerDay: parseInt(process.env.MAX_TOKENS_PER_DAY || '50000'),
    },
  },

  security: {
    encryption: {
      enabled: process.env.ENCRYPTION_ENABLED === 'true',
      algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      keyLength: parseInt(process.env.ENCRYPTION_KEY_LENGTH || '32'),
    },
    sanitization: {
      enabled: process.env.SANITIZATION_ENABLED !== 'false',
      strictMode: process.env.SANITIZATION_STRICT_MODE === 'true',
      allowedTags: process.env.SANITIZATION_ALLOWED_TAGS?.split(',') || [],
      blockedPatterns: process.env.SANITIZATION_BLOCKED_PATTERNS?.split(',') || [
        'script', 'eval', 'exec', 'system', 'shell', 'cmd',
      ],
    },
    audit: {
      enabled: process.env.AUDIT_ENABLED === 'true',
      logLevel: (process.env.AUDIT_LOG_LEVEL as 'minimal' | 'detailed' | 'full') || 'detailed',
      retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '90'),
    },
    cors: {
      enabled: process.env.CORS_ENABLED !== 'false',
      origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE'],
      headers: process.env.CORS_HEADERS?.split(',') || ['Content-Type', 'Authorization'],
    },
  },

  jobs: {
    scheduler: {
      enabled: process.env.JOBS_SCHEDULER_ENABLED === 'true',
      timezone: process.env.JOBS_TIMEZONE || 'Europe/Paris',
      maxConcurrent: parseInt(process.env.JOBS_MAX_CONCURRENT || '3'),
    },
    tasks: {
      alertGeneration: {
        enabled: process.env.JOBS_ALERT_GENERATION_ENABLED === 'true',
        schedule: process.env.JOBS_ALERT_GENERATION_SCHEDULE || '0 */1 * * *', // Chaque heure
        timeout: parseInt(process.env.JOBS_ALERT_GENERATION_TIMEOUT || '300000'),
      },
      modelTraining: {
        enabled: process.env.JOBS_MODEL_TRAINING_ENABLED === 'true',
        schedule: process.env.JOBS_MODEL_TRAINING_SCHEDULE || '0 2 * * *', // 2h du matin
        timeout: parseInt(process.env.JOBS_MODEL_TRAINING_TIMEOUT || '1800000'),
      },
      dataCleanup: {
        enabled: process.env.JOBS_DATA_CLEANUP_ENABLED === 'true',
        schedule: process.env.JOBS_DATA_CLEANUP_SCHEDULE || '0 3 * * 0', // Dimanche 3h
        timeout: parseInt(process.env.JOBS_DATA_CLEANUP_TIMEOUT || '600000'),
      },
      metricCollection: {
        enabled: process.env.JOBS_METRIC_COLLECTION_ENABLED === 'true',
        schedule: process.env.JOBS_METRIC_COLLECTION_SCHEDULE || '*/5 * * * *', // Toutes les 5 minutes
        timeout: parseInt(process.env.JOBS_METRIC_COLLECTION_TIMEOUT || '60000'),
      },
    },
  },

  environments: {
    development: {
      monitoring: {
        enabled: false,
        logging: {
          level: 'debug',
          format: 'text',
        },
      },
      limits: {
        rateLimiting: {
          general: {
            maxRequests: 1000,
          },
          chat: {
            maxRequests: 100,
          },
        },
      },
      security: {
        cors: {
          origins: ['http://localhost:3000', 'http://localhost:3001'],
        },
      },
      jobs: {
        scheduler: {
          enabled: false,
        },
      },
    },
    staging: {
      monitoring: {
        enabled: true,
        logging: {
          level: 'info',
          format: 'json',
        },
      },
      limits: {
        rateLimiting: {
          general: {
            maxRequests: 500,
          },
          chat: {
            maxRequests: 75,
          },
        },
      },
      jobs: {
        scheduler: {
          enabled: true,
        },
        tasks: {
          alertGeneration: {
            schedule: '0 */2 * * *', // Toutes les 2 heures
          },
        },
      },
    },
    production: {
      monitoring: {
        enabled: true,
        prometheus: {
          enabled: true,
        },
        logging: {
          level: 'warn',
          format: 'json',
        },
      },
      limits: {
        rateLimiting: {
          general: {
            maxRequests: 100,
          },
          chat: {
            maxRequests: 50,
          },
          predictions: {
            maxRequests: 10,
          },
          optimization: {
            maxRequests: 5,
          },
        },
      },
      security: {
        encryption: {
          enabled: true,
        },
        sanitization: {
          strictMode: true,
        },
        audit: {
          enabled: true,
          logLevel: 'full',
        },
      },
      jobs: {
        scheduler: {
          enabled: true,
        },
      },
    },
  },
};

// Fonction pour merger les configurations
function mergeConfig(base: any, override: any): any {
  if (typeof base !== 'object' || base === null) {
    return override;
  }

  const result = { ...base };
  
  for (const key in override) {
    if (override.hasOwnProperty(key)) {
      if (typeof override[key] === 'object' && override[key] !== null) {
        result[key] = mergeConfig(result[key], override[key]);
      } else {
        result[key] = override[key];
      }
    }
  }

  return result;
}

// Fonction pour obtenir la configuration selon l'environnement
function getEnvironmentConfig(): AIConfig {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = defaultConfig.environments[env as keyof typeof defaultConfig.environments];
  
  if (!envConfig) {
    console.warn(`No configuration found for environment: ${env}, using default`);
    return defaultConfig;
  }

  return mergeConfig(defaultConfig, envConfig);
}

// Fonction pour valider la configuration
function validateConfig(config: AIConfig): string[] {
  const errors: string[] = [];

  if (!config.openai.apiKey) {
    errors.push('OpenAI API key is required');
  }

  if (config.predictions.defaultHorizon < 1 || config.predictions.defaultHorizon > config.predictions.maxHorizon) {
    errors.push('Invalid prediction horizon configuration');
  }

  if (config.alerts.checkInterval < 60000) {
    errors.push('Alert check interval must be at least 1 minute');
  }

  if (config.limits.rateLimiting.general.maxRequests < 1) {
    errors.push('Rate limiting must allow at least 1 request');
  }

  if (config.cache.provider === 'redis' && !config.cache.redis?.host) {
    errors.push('Redis host is required when using Redis cache');
  }

  return errors;
}

// Export de la configuration finale
export const aiConfig = getEnvironmentConfig();

// Validation au démarrage
const validationErrors = validateConfig(aiConfig);
if (validationErrors.length > 0) {
  console.error('AI Configuration validation errors:', validationErrors);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Utilitaires pour accéder à la configuration
export const getAIConfig = () => aiConfig;
export const getOpenAIConfig = () => aiConfig.openai;
export const getPredictionsConfig = () => aiConfig.predictions;
export const getAlertsConfig = () => aiConfig.alerts;
export const getCacheConfig = () => aiConfig.cache;
export const getMonitoringConfig = () => aiConfig.monitoring;
export const getLimitsConfig = () => aiConfig.limits;
export const getSecurityConfig = () => aiConfig.security;
export const getJobsConfig = () => aiConfig.jobs;

// Configuration par défaut d'export
export default aiConfig; 