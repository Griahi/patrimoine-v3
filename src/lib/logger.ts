// Types pour les niveaux de log
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Interface pour les métadonnées de log
interface LogMetadata {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
  userId?: string;
  sessionId?: string;
}

// Configuration du logger
interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
  includeStackTrace: boolean;
  maxLogSize: number;
  sanitizeData: boolean;
}

// Service de logging sécurisé centralisé
class SecureLogger {
  private static instance: SecureLogger;
  private config: LoggerConfig;
  private logHistory: LogMetadata[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;
  
  private constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      includeTimestamp: true,
      includeStackTrace: false,
      maxLogSize: 1000,
      sanitizeData: true
    };
  }
  
  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }
  
  // Méthode pour sanitiser les données sensibles
  private sanitizeData(data: any): any {
    if (!this.config.sanitizeData || !data) return data;
    
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      Object.keys(sanitized).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      });
      
      return sanitized;
    }
    
    return data;
  }
  
  // Méthode pour déterminer si on doit logger selon le niveau
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.config.level];
  }
  
  // Méthode pour créer les métadonnées de log
  private createLogMetadata(level: LogLevel, message: string, data?: any, component?: string): LogMetadata {
    return {
      timestamp: new Date(),
      level,
      message,
      data: this.sanitizeData(data),
      component,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
  }
  
  // Méthode pour obtenir l'ID utilisateur actuel (à implémenter selon votre système d'auth)
  private getCurrentUserId(): string | undefined {
    // Implémentation sécurisée - ne pas exposer d'informations sensibles
    try {
      // Exemple : récupérer depuis le sessionStorage ou un contexte
      return typeof window !== 'undefined' ? sessionStorage.getItem('userId') || undefined : undefined;
    } catch {
      return undefined;
    }
  }
  
  // Méthode pour obtenir l'ID de session
  private getSessionId(): string | undefined {
    try {
      return typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') || undefined : undefined;
    } catch {
      return undefined;
    }
  }
  
  // Méthode pour formater le message de log
  private formatLogMessage(metadata: LogMetadata): string {
    const { timestamp, level, message, component } = metadata;
    
    let formattedMessage = `[${level.toUpperCase()}]`;
    
    if (this.config.includeTimestamp) {
      formattedMessage += ` [${timestamp.toISOString()}]`;
    }
    
    if (component) {
      formattedMessage += ` [${component}]`;
    }
    
    formattedMessage += ` ${message}`;
    
    return formattedMessage;
  }
  
  // Méthode pour ajouter au historique
  private addToHistory(metadata: LogMetadata): void {
    this.logHistory.push(metadata);
    
    // Limiter la taille de l'historique
    if (this.logHistory.length > this.MAX_HISTORY_SIZE) {
      this.logHistory = this.logHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }
  
  // Méthodes de logging principales
  debug(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const metadata = this.createLogMetadata('debug', message, data, component);
    this.addToHistory(metadata);
    
    console.log(this.formatLogMessage(metadata), metadata.data);
  }
  
  info(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('info')) return;
    
    const metadata = this.createLogMetadata('info', message, data, component);
    this.addToHistory(metadata);
    
    console.info(this.formatLogMessage(metadata), metadata.data);
  }
  
  warn(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('warn')) return;
    
    const metadata = this.createLogMetadata('warn', message, data, component);
    this.addToHistory(metadata);
    
    console.warn(this.formatLogMessage(metadata), metadata.data);
  }
  
  error(message: string, error?: any, component?: string): void {
    if (!this.shouldLog('error')) return;
    
    const metadata = this.createLogMetadata('error', message, error, component);
    this.addToHistory(metadata);
    
    console.error(this.formatLogMessage(metadata), metadata.data);
    
    // En production, on pourrait envoyer à un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(metadata);
    }
  }
  
  // Méthode pour envoyer à un service de monitoring (à implémenter)
  private sendToMonitoring(metadata: LogMetadata): void {
    // Implémentation future pour envoyer les erreurs à un service comme Sentry
    // Ne pas exposer d'informations sensibles
  }
  
  // Méthodes utilitaires
  getLogHistory(): LogMetadata[] {
    return [...this.logHistory];
  }
  
  clearHistory(): void {
    this.logHistory = [];
  }
  
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  // Méthodes pour des cas d'usage spécifiques
  logAPICall(method: string, url: string, status: number, duration: number, component?: string): void {
    this.info(`API ${method} ${url} - ${status} (${duration}ms)`, {
      method,
      url: this.sanitizeUrl(url),
      status,
      duration
    }, component);
  }
  
  logUserAction(action: string, data?: any, component?: string): void {
    this.info(`Action utilisateur: ${action}`, this.sanitizeData(data), component);
  }
  
  logPerformance(operation: string, duration: number, component?: string): void {
    this.debug(`Performance: ${operation} took ${duration}ms`, { operation, duration }, component);
  }
  
  // Méthode pour sanitiser les URLs (enlever les tokens, etc.)
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      // Enlever les paramètres sensibles
      urlObj.searchParams.delete('token');
      urlObj.searchParams.delete('auth');
      urlObj.searchParams.delete('key');
      return urlObj.toString();
    } catch {
      return url;
    }
  }
}

// Instance singleton exportée
export const logger = SecureLogger.getInstance();

// Types exportés
export type { LogLevel, LogMetadata };

// Hook pour React (optionnel)
export function useLogger(component: string) {
  return {
    debug: (message: string, data?: any) => logger.debug(message, data, component),
    info: (message: string, data?: any) => logger.info(message, data, component),
    warn: (message: string, data?: any) => logger.warn(message, data, component),
    error: (message: string, error?: any) => logger.error(message, error, component),
    logUserAction: (action: string, data?: any) => logger.logUserAction(action, data, component),
    logPerformance: (operation: string, duration: number) => logger.logPerformance(operation, duration, component)
  };
} 