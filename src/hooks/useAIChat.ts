"use client"

import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/ai';
import { toast } from 'sonner';

interface UseChatOptions {
  onError?: (error: Error) => void;
  maxMessages?: number;
  persistHistory?: boolean;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export function useAIChat(options: UseChatOptions = {}) {
  const { onError, maxMessages = 50, persistHistory = true } = options;

  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Charger l'historique depuis localStorage au démarrage
  useEffect(() => {
    if (persistHistory) {
      // Nettoyer l'historique pour éviter les clés dupliquées
      localStorage.removeItem('ai-chat-history');
      
      const savedMessages = localStorage.getItem('ai-chat-history');
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          // Reconstituer les dates et vérifier l'unicité des IDs
          const messagesWithDates = parsedMessages
            .map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }))
            .filter((msg: any, index: number, array: any[]) => 
              array.findIndex(m => m.id === msg.id) === index // Garder seulement la première occurrence de chaque ID
            );
          setState(prev => ({ ...prev, messages: messagesWithDates }));
        } catch (error) {
          console.error('Erreur lors du chargement de l\'historique:', error);
        }
      }
    }
  }, [persistHistory]);

  // Sauvegarder l'historique dans localStorage
  const saveHistory = useCallback((messages: Message[]) => {
    if (persistHistory) {
      try {
        localStorage.setItem('ai-chat-history', JSON.stringify(messages));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'historique:', error);
      }
    }
  }, [persistHistory]);

  // Ajouter un message à l'historique
  const addMessage = useCallback((message: Message) => {
    setState(prev => {
      const newMessages = [...prev.messages, message];
      
      // Limiter le nombre de messages
      if (newMessages.length > maxMessages) {
        newMessages.splice(0, newMessages.length - maxMessages);
      }
      
      // Sauvegarder
      saveHistory(newMessages);
      
      return {
        ...prev,
        messages: newMessages,
      };
    });
  }, [maxMessages, saveHistory]);

  // Envoyer un message
  const sendMessage = useCallback(async (content: string, entityIds?: string[]) => {
    if (!content.trim()) return;

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);

    // Marquer comme chargement
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          context: entityIds ? { entityIds } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Vous devez être connecté pour utiliser l\'assistant IA. Veuillez vous connecter et réessayer.');
        }
        throw new Error(errorData.error || 'Erreur lors de la communication avec l\'IA');
      }

      const data = await response.json();

      // Ajouter la réponse de l'assistant
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        data: data.data,
      };

      addMessage(assistantMessage);

      // Mettre à jour les suggestions
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }

    } catch (error) {
      console.error('Erreur chat:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite';
      
      setState(prev => ({ ...prev, error: errorMessage }));
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
      
      toast.error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage, onError]);

  // Supprimer un message
  const deleteMessage = useCallback((messageId: string) => {
    setState(prev => {
      const newMessages = prev.messages.filter(msg => msg.id !== messageId);
      saveHistory(newMessages);
      return { ...prev, messages: newMessages };
    });
  }, [saveHistory]);

  // Vider l'historique
  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
    setSuggestions([]);
    if (persistHistory) {
      localStorage.removeItem('ai-chat-history');
    }
  }, [persistHistory]);

  // Réessayer le dernier message
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = state.messages
      .filter(msg => msg.role === 'user')
      .pop();
    
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  }, [state.messages, sendMessage]);

  // Fonction pour utiliser une suggestion
  const useSuggestion = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  // Initialiser avec un message de bienvenue (une seule fois)
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized && state.messages.length === 0) {
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`, // ID unique
        role: 'assistant',
        content: 'Bonjour ! Je suis votre assistant patrimonial IA. Posez-moi vos questions sur votre patrimoine, vos performances, vos investissements ou vos stratégies d\'optimisation. 💰',
        timestamp: new Date(),
      };
      
      addMessage(welcomeMessage);
      setIsInitialized(true);
      
      // Suggestions initiales
      setSuggestions([
        'Quelle est ma performance globale ce mois-ci ?',
        'Montre-moi ma répartition d\'actifs',
        'Combien je paie de frais bancaires ?',
        'Est-ce que je suis bien diversifié ?',
      ]);
    } else if (state.messages.length > 0 && !isInitialized) {
      // Si on charge des messages depuis le localStorage, marquer comme initialisé
      setIsInitialized(true);
    }
  }, [state.messages.length, addMessage, isInitialized]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    suggestions,
    sendMessage,
    deleteMessage,
    clearHistory,
    retryLastMessage,
    useSuggestion,
  };
} 