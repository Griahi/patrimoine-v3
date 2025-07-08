import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '@/hooks/useAuth';

// Types pour les hooks IA
export interface AIResponse<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  clear: () => void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  suggestions?: string[];
}

export interface PredictionResult {
  predictions: {
    [key: string]: {
      value: number;
      confidence: { lower: number; upper: number };
    };
  };
  factors: any;
  lastUpdated: string;
}

export interface AlertData {
  id: string;
  type: 'risk' | 'opportunity' | 'action_required' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    params?: any;
  }>;
  createdAt: Date;
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  category: string;
  description: string;
  estimatedSavings: number;
  roi: number;
  complexity: 'low' | 'medium' | 'high';
  timeline: string;
  requirements: string[];
  implementation: {
    steps: string[];
    documents: string[];
    deadlines: string[];
  };
  risks: string[];
  eligibility: {
    isEligible: boolean;
    reasons: string[];
  };
}

// Hook pour la gestion de l'état IA commun
export function useAIState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const execute = useCallback(async (request: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    // Annuler la requête précédente si elle existe
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    
    try {
      const result = await request();
      setData(result);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setError(null);
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  const retry = useCallback(() => {
    if (data) {
      execute(async () => data);
    }
  }, [data, execute]);

  return {
    data,
    loading,
    error,
    execute,
    clear,
    retry
  };
}

// Hook pour l'API IA avec authentification
export function useAIAPI() {
  const { data: session } = useSession();
  
  const makeRequest = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    const token = (session as any).accessToken;
    
    const response = await fetch(`/api/ai${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }, [session]);

  return { makeRequest };
}

// Hook pour le chat IA
export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { makeRequest } = useAIAPI();
  const aiState = useAIState<ChatMessage>();

  // Initialiser avec un message de bienvenue
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Bonjour ! Je suis votre assistant patrimonial IA. Comment puis-je vous aider aujourd\'hui ?',
          timestamp: new Date(),
          suggestions: [
            'Quelle est ma performance ce mois-ci ?',
            'Montre-moi ma répartition d\'actifs',
            'Ai-je des alertes importantes ?',
            'Comment optimiser ma fiscalité ?'
          ]
        }
      ]);
    }
  }, [messages.length]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Ajouter le message utilisateur
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await makeRequest<ChatMessage>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        data: response.data,
        suggestions: response.suggestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Désolé, j\'ai rencontré un problème technique. Veuillez réessayer.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [makeRequest]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat,
    loading: aiState.loading,
    error: aiState.error,
  };
}

// Hook pour les prédictions IA
export function useAIPredictions() {
  const { makeRequest } = useAIAPI();
  const aiState = useAIState<PredictionResult>();

  const generatePredictions = useCallback(async (params: {
    type: 'portfolio' | 'asset' | 'monteCarlo';
    horizon?: number;
    assetId?: string;
  }) => {
    await aiState.execute(async () => {
      return await makeRequest<PredictionResult>('/predictions', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    });
  }, [makeRequest, aiState]);

  return {
    ...aiState,
    generatePredictions,
  };
}

// Hook pour les alertes IA
export function useAIAlerts() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { makeRequest } = useAIAPI();
  const aiState = useAIState<AlertData[]>();

  const fetchAlerts = useCallback(async () => {
    await aiState.execute(async () => {
      const alertsData = await makeRequest<AlertData[]>('/alerts');
      setAlerts(alertsData);
      setUnreadCount(alertsData.filter(alert => !alert.data?.isRead).length);
      return alertsData;
    });
  }, [makeRequest, aiState]);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await makeRequest(`/alerts/${alertId}/read`, { method: 'POST' });
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, data: { ...alert.data, isRead: true } }
          : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  }, [makeRequest]);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      await makeRequest(`/alerts/${alertId}/dismiss`, { method: 'POST' });
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  }, [makeRequest]);

  const snoozeAlert = useCallback(async (alertId: string, duration: number) => {
    try {
      await makeRequest(`/alerts/${alertId}/snooze`, {
        method: 'POST',
        body: JSON.stringify({ duration }),
      });
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to snooze alert:', error);
    }
  }, [makeRequest]);

  // Récupérer les alertes au montage
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    unreadCount,
    loading: aiState.loading,
    error: aiState.error,
    fetchAlerts,
    markAsRead,
    dismissAlert,
    snoozeAlert,
    retry: aiState.retry,
  };
}

// Hook pour l'optimisation fiscale IA
export function useAIOptimizations() {
  const { makeRequest } = useAIAPI();
  const aiState = useAIState<{
    analysis: any;
    strategies: OptimizationStrategy[];
    timestamp: Date;
  }>();

  const optimizeTax = useCallback(async () => {
    await aiState.execute(async () => {
      return await makeRequest('/optimize/tax', { method: 'POST' });
    });
  }, [makeRequest, aiState]);

  const simulateStrategy = useCallback(async (strategyId: string, params: any) => {
    try {
      return await makeRequest(`/optimize/simulate/${strategyId}`, {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch (error) {
      console.error('Failed to simulate strategy:', error);
      throw error;
    }
  }, [makeRequest]);

  return {
    ...aiState,
    optimizeTax,
    simulateStrategy,
  };
}

// Hook pour le dashboard adaptatif
export function useAIDashboard() {
  const [layout, setLayout] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [behaviorData, setBehaviorData] = useState<any>(null);
  const { makeRequest } = useAIAPI();

  const trackInteraction = useCallback(async (interaction: {
    widgetId: string;
    action: string;
    duration?: number;
    metadata?: any;
  }) => {
    try {
      await makeRequest('/dashboard/track', {
        method: 'POST',
        body: JSON.stringify(interaction),
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }, [makeRequest]);

  const getOptimizedLayout = useCallback(async () => {
    try {
      const response = await makeRequest('/dashboard/layout');
      setLayout(response.layout);
      setSuggestions(response.suggestions);
      setBehaviorData(response.behaviorData);
    } catch (error) {
      console.error('Failed to get optimized layout:', error);
    }
  }, [makeRequest]);

  const applySuggestion = useCallback(async (suggestionId: string) => {
    try {
      await makeRequest(`/dashboard/suggestions/${suggestionId}/apply`, {
        method: 'POST',
      });
      // Recharger le layout après application
      await getOptimizedLayout();
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  }, [makeRequest, getOptimizedLayout]);

  const saveLayout = useCallback(async (newLayout: any[]) => {
    try {
      await makeRequest('/dashboard/layout', {
        method: 'POST',
        body: JSON.stringify({ layout: newLayout }),
      });
      setLayout(newLayout);
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  }, [makeRequest]);

  // Charger le layout initial
  useEffect(() => {
    getOptimizedLayout();
  }, [getOptimizedLayout]);

  return {
    layout,
    suggestions,
    behaviorData,
    trackInteraction,
    getOptimizedLayout,
    applySuggestion,
    saveLayout,
  };
}

// Hook pour les métriques des services IA
export function useAIMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const { makeRequest } = useAIAPI();

  const fetchMetrics = useCallback(async () => {
    try {
      const metricsData = await makeRequest('/metrics');
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to fetch AI metrics:', error);
    }
  }, [makeRequest]);

  useEffect(() => {
    fetchMetrics();
    // Actualiser les métriques toutes les 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    metrics,
    fetchMetrics,
  };
}

// Hook pour le health check des services IA
export function useAIHealth() {
  const [health, setHealth] = useState<any>(null);
  const [isHealthy, setIsHealthy] = useState(true);
  const { makeRequest } = useAIAPI();

  const checkHealth = useCallback(async () => {
    try {
      const healthData = await makeRequest('/health');
      setHealth(healthData);
      setIsHealthy(healthData.overall === 'healthy');
    } catch (error) {
      console.error('Failed to check AI health:', error);
      setIsHealthy(false);
    }
  }, [makeRequest]);

  useEffect(() => {
    checkHealth();
    // Vérifier la santé toutes les 2 minutes
    const interval = setInterval(checkHealth, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    health,
    isHealthy,
    checkHealth,
  };
}

// Hook composite pour tous les services IA
export function useAIServices() {
  const chat = useAIChat();
  const predictions = useAIPredictions();
  const alerts = useAIAlerts();
  const optimizations = useAIOptimizations();
  const dashboard = useAIDashboard();
  const metrics = useAIMetrics();
  const health = useAIHealth();

  return {
    chat,
    predictions,
    alerts,
    optimizations,
    dashboard,
    metrics,
    health,
  };
}

export default useAIServices; 