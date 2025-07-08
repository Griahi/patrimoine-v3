/**
 * Système standardisé de gestion des erreurs
 * Améliore l'expérience utilisateur avec des messages contextuels et des suggestions de résolution
 */

export enum ErrorCode {
  // Erreurs d'authentification
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_SESSION_EXPIRED = 'AUTH_002', 
  AUTH_UNAUTHORIZED = 'AUTH_003',
  AUTH_FORBIDDEN = 'AUTH_004',

  // Erreurs de validation
  VALIDATION_REQUIRED_FIELD = 'VAL_001',
  VALIDATION_INVALID_FORMAT = 'VAL_002',
  VALIDATION_OUT_OF_RANGE = 'VAL_003',
  VALIDATION_DUPLICATE = 'VAL_004',

  // Erreurs de base de données
  DB_CONNECTION_FAILED = 'DB_001',
  DB_RECORD_NOT_FOUND = 'DB_002',
  DB_CONSTRAINT_VIOLATION = 'DB_003',
  DB_OPERATION_FAILED = 'DB_004',

  // Erreurs métier
  BUSINESS_INVALID_OWNERSHIP = 'BIZ_001',
  BUSINESS_INSUFFICIENT_PERMISSIONS = 'BIZ_002',
  BUSINESS_OPERATION_NOT_ALLOWED = 'BIZ_003',
  BUSINESS_RESOURCE_LOCKED = 'BIZ_004',

  // Erreurs système
  SYSTEM_INTERNAL_ERROR = 'SYS_001',
  SYSTEM_SERVICE_UNAVAILABLE = 'SYS_002',
  SYSTEM_TIMEOUT = 'SYS_003',
  SYSTEM_RATE_LIMITED = 'SYS_004',

  // Erreurs d'intégration
  INTEGRATION_API_ERROR = 'INT_001',
  INTEGRATION_AUTH_FAILED = 'INT_002',
  INTEGRATION_QUOTA_EXCEEDED = 'INT_003',
  INTEGRATION_DATA_SYNC_FAILED = 'INT_004'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError {
  code: ErrorCode
  message: string
  userMessage: string
  severity: ErrorSeverity
  suggestions?: string[]
  details?: Record<string, unknown>
  timestamp: string
  requestId?: string
}

export interface ErrorContext {
  operation?: string
  entityType?: string
  entityId?: string
  userId?: string
  requestId?: string
  metadata?: Record<string, unknown>
}

class ErrorHandlerService {
  private static readonly ERROR_MESSAGES: Record<ErrorCode, {
    message: string
    userMessage: string
    severity: ErrorSeverity
    suggestions: string[]
  }> = {
    // Authentification
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
      message: 'Invalid username or password',
      userMessage: 'Identifiants incorrects. Vérifiez votre email et mot de passe.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: [
        'Vérifiez que votre email est correct',
        'Assurez-vous que Caps Lock est désactivé',
        'Utilisez "Mot de passe oublié" si nécessaire'
      ]
    },

    [ErrorCode.AUTH_SESSION_EXPIRED]: {
      message: 'Session has expired',
      userMessage: 'Votre session a expiré. Veuillez vous reconnecter.',
      severity: ErrorSeverity.LOW,
      suggestions: [
        'Reconnectez-vous à votre compte',
        'Activez "Se souvenir de moi" pour les sessions longues'
      ]
    },

    [ErrorCode.AUTH_UNAUTHORIZED]: {
      message: 'Access denied - authentication required',
      userMessage: 'Accès refusé. Vous devez être connecté pour accéder à cette page.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: [
        'Connectez-vous à votre compte',
        'Vérifiez vos permissions d\'accès'
      ]
    },

    // Validation
    [ErrorCode.VALIDATION_REQUIRED_FIELD]: {
      message: 'Required field is missing',
      userMessage: 'Certains champs obligatoires ne sont pas renseignés.',
      severity: ErrorSeverity.LOW,
      suggestions: [
        'Vérifiez tous les champs marqués d\'un astérisque (*)',
        'Assurez-vous que tous les champs requis sont complétés'
      ]
    },

    [ErrorCode.VALIDATION_INVALID_FORMAT]: {
      message: 'Field format is invalid',
      userMessage: 'Le format des données saisies n\'est pas valide.',
      severity: ErrorSeverity.LOW,
      suggestions: [
        'Vérifiez le format attendu (email, téléphone, etc.)',
        'Consultez les exemples fournis',
        'Supprimez les caractères spéciaux si nécessaire'
      ]
    },

    [ErrorCode.VALIDATION_OUT_OF_RANGE]: {
      message: 'Value is out of valid range',
      userMessage: 'La valeur saisie est en dehors de la plage autorisée.',
      severity: ErrorSeverity.LOW,
      suggestions: [
        'Vérifiez les valeurs minimum et maximum autorisées',
        'Utilisez des nombres positifs pour les montants'
      ]
    },

    // Base de données
    [ErrorCode.DB_CONNECTION_FAILED]: {
      message: 'Database connection failed',
      userMessage: 'Problème de connexion à la base de données. Veuillez réessayer.',
      severity: ErrorSeverity.HIGH,
      suggestions: [
        'Actualisez la page dans quelques instants',
        'Vérifiez votre connexion internet',
        'Contactez le support si le problème persiste'
      ]
    },

    [ErrorCode.DB_RECORD_NOT_FOUND]: {
      message: 'Requested record not found',
      userMessage: 'L\'élément demandé n\'a pas été trouvé ou n\'existe plus.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: [
        'Vérifiez que l\'élément n\'a pas été supprimé',
        'Actualisez la liste depuis le menu principal',
        'Utilisez la recherche pour localiser l\'élément'
      ]
    },

    // Erreurs métier
    [ErrorCode.BUSINESS_INVALID_OWNERSHIP]: {
      message: 'Invalid ownership structure',
      userMessage: 'La structure de détention n\'est pas valide.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: [
        'Vérifiez que la somme des pourcentages égale 100%',
        'Assurez-vous qu\'au moins une entité détient l\'actif',
        'Consultez le guide sur les structures de détention'
      ]
    },

    [ErrorCode.BUSINESS_INSUFFICIENT_PERMISSIONS]: {
      message: 'Insufficient permissions for this operation',
      userMessage: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: [
        'Contactez l\'administrateur pour obtenir les permissions',
        'Vérifiez votre rôle dans le système',
        'Consultez la documentation des permissions'
      ]
    },

    // Système
    [ErrorCode.SYSTEM_INTERNAL_ERROR]: {
      message: 'Internal server error',
      userMessage: 'Une erreur technique s\'est produite. Nos équipes en ont été informées.',
      severity: ErrorSeverity.HIGH,
      suggestions: [
        'Réessayez l\'opération dans quelques minutes',
        'Sauvegardez votre travail et actualisez la page',
        'Contactez le support avec le code d\'erreur si nécessaire'
      ]
    },

    [ErrorCode.SYSTEM_SERVICE_UNAVAILABLE]: {
      message: 'Service temporarily unavailable',
      userMessage: 'Le service est temporairement indisponible pour maintenance.',
      severity: ErrorSeverity.HIGH,
      suggestions: [
        'Réessayez dans quelques minutes',
        'Consultez la page de statut du service',
        'Abonnez-vous aux notifications de maintenance'
      ]
    },

    // Intégrations
    [ErrorCode.INTEGRATION_API_ERROR]: {
      message: 'External API error',
      userMessage: 'Erreur de connexion avec un service externe.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: [
        'Vérifiez votre connexion internet',
        'Réessayez l\'opération dans quelques minutes',
        'Vérifiez la configuration des intégrations'
      ]
    },

    [ErrorCode.AUTH_FORBIDDEN]: {
      message: 'Access forbidden',
      userMessage: 'Accès interdit à cette ressource.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: ['Contactez votre administrateur']
    },

    [ErrorCode.VALIDATION_DUPLICATE]: {
      message: 'Duplicate entry detected',
      userMessage: 'Cet élément existe déjà.',
      severity: ErrorSeverity.LOW,
      suggestions: ['Utilisez un nom différent', 'Vérifiez les éléments existants']
    },

    [ErrorCode.DB_CONSTRAINT_VIOLATION]: {
      message: 'Database constraint violation',
      userMessage: 'Violation des contraintes de données.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: ['Vérifiez les données saisies', 'Respectez les contraintes définies']
    },

    [ErrorCode.DB_OPERATION_FAILED]: {
      message: 'Database operation failed',
      userMessage: 'Erreur lors de l\'opération en base.',
      severity: ErrorSeverity.HIGH,
      suggestions: ['Réessayez l\'opération', 'Contactez le support']
    },

    [ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED]: {
      message: 'Operation not allowed',
      userMessage: 'Cette opération n\'est pas autorisée.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: ['Vérifiez les permissions', 'Consultez la documentation']
    },

    [ErrorCode.BUSINESS_RESOURCE_LOCKED]: {
      message: 'Resource is locked',
      userMessage: 'Cette ressource est verrouillée.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: ['Attendez que l\'opération se termine', 'Contactez l\'utilisateur qui modifie']
    },

    [ErrorCode.SYSTEM_TIMEOUT]: {
      message: 'Operation timeout',
      userMessage: 'L\'opération a pris trop de temps.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: ['Réessayez avec moins de données', 'Vérifiez votre connexion']
    },

    [ErrorCode.SYSTEM_RATE_LIMITED]: {
      message: 'Rate limit exceeded',
      userMessage: 'Trop de requêtes. Veuillez patienter.',
      severity: ErrorSeverity.LOW,
      suggestions: ['Attendez quelques secondes', 'Réduisez la fréquence des opérations']
    },

    [ErrorCode.INTEGRATION_AUTH_FAILED]: {
      message: 'Integration authentication failed',
      userMessage: 'Échec d\'authentification avec le service externe.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: ['Vérifiez vos identifiants', 'Renouvelez l\'autorisation']
    },

    [ErrorCode.INTEGRATION_QUOTA_EXCEEDED]: {
      message: 'Integration quota exceeded',
      userMessage: 'Quota d\'utilisation dépassé pour ce service.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: ['Attendez le renouvellement du quota', 'Contactez votre administrateur']
    },

    [ErrorCode.INTEGRATION_DATA_SYNC_FAILED]: {
      message: 'Data synchronization failed',
      userMessage: 'Échec de synchronisation des données.',
      severity: ErrorSeverity.MEDIUM,
      suggestions: ['Réessayez la synchronisation', 'Vérifiez la connectivité']
    }
  }

  static createError(
    code: ErrorCode,
    context?: ErrorContext,
    customMessage?: string
  ): AppError {
    const errorDef = this.ERROR_MESSAGES[code]
    
    return {
      code,
      message: customMessage || errorDef.message,
      userMessage: errorDef.userMessage,
      severity: errorDef.severity,
      suggestions: errorDef.suggestions,
      details: context?.metadata,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId || this.generateRequestId()
    }
  }

  static formatErrorForAPI(error: AppError): {
    error: {
      code: string
      message: string
      details?: Record<string, unknown>
      requestId: string
      timestamp: string
    }
    userMessage: string
    suggestions?: string[]
  } {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: error.requestId || 'unknown',
        timestamp: error.timestamp
      },
      userMessage: error.userMessage,
      suggestions: error.suggestions
    }
  }

  static formatErrorForUI(error: AppError): {
    title: string
    message: string
    severity: ErrorSeverity
    suggestions: string[]
    actionable: boolean
  } {
    return {
      title: this.getSeverityIcon(error.severity) + ' ' + this.getSeverityTitle(error.severity),
      message: error.userMessage,
      severity: error.severity,
      suggestions: error.suggestions || [],
      actionable: error.severity !== ErrorSeverity.CRITICAL
    }
  }

  private static getSeverityIcon(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW: return 'ℹ️'
      case ErrorSeverity.MEDIUM: return '⚠️'
      case ErrorSeverity.HIGH: return '❌'
      case ErrorSeverity.CRITICAL: return '🚨'
    }
  }

  private static getSeverityTitle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW: return 'Information'
      case ErrorSeverity.MEDIUM: return 'Attention'
      case ErrorSeverity.HIGH: return 'Erreur'
      case ErrorSeverity.CRITICAL: return 'Erreur Critique'
    }
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Utilitaires pour l'usage courant
export const createAppError = ErrorHandlerService.createError
export const formatErrorForAPI = ErrorHandlerService.formatErrorForAPI
export const formatErrorForUI = ErrorHandlerService.formatErrorForUI

// Helper pour les erreurs de validation Zod
export function handleZodError(error: unknown): AppError {
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> }
    const firstIssue = zodError.issues[0]
    
    return createAppError(
      ErrorCode.VALIDATION_INVALID_FORMAT,
      {
        metadata: {
          field: firstIssue?.path.join('.'),
          validationError: firstIssue?.message
        }
      },
      `Validation error: ${firstIssue?.message}`
    )
  }
  
  return createAppError(ErrorCode.VALIDATION_INVALID_FORMAT)
}

// Helper pour les erreurs Prisma
export function handlePrismaError(error: unknown): AppError {
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string }
    
    switch (prismaError.code) {
      case 'P2002':
        return createAppError(ErrorCode.VALIDATION_DUPLICATE)
      case 'P2025':
        return createAppError(ErrorCode.DB_RECORD_NOT_FOUND)
      case 'P2003':
        return createAppError(ErrorCode.DB_CONSTRAINT_VIOLATION)
      default:
        return createAppError(ErrorCode.DB_OPERATION_FAILED, {
          metadata: { prismaCode: prismaError.code }
        })
    }
  }
  
  return createAppError(ErrorCode.DB_OPERATION_FAILED)
} 