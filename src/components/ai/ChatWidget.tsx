"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Loader2, MessageSquare, X, 
  RefreshCw, Trash2, Copy, ChevronDown, ChevronUp,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import ChartRenderer from './ChartRenderer';
import { useAIChat } from '@/hooks/useAIChat';
import { toast } from 'sonner';

interface ChatWidgetProps {
  className?: string;
}

export default function ChatWidget({ className = '' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    error,
    suggestions,
    sendMessage,
    clearHistory,
    retryLastMessage,
    useSuggestion,
  } = useAIChat();

  // Auto-scroll vers le bas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus sur l'input quand le chat s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setShowSuggestions(false);
    
    await sendMessage(message);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    sendMessage(suggestion);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copié');
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Bouton flottant */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
              size="icon"
            >
              <MessageSquare className="h-8 w-8 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mb-4"
          >
            <Card className="w-96 h-[600px] flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              {/* Header */}
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bot className="w-5 h-5" />
                  Assistant Patrimonial
                  <Sparkles className="w-4 h-4" />
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-500' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      
                      {/* Message */}
                      <div className={`flex-1 max-w-[80%] ${
                        message.role === 'user' ? 'text-right' : ''
                      }`}>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user' 
                            ? 'bg-blue-500 text-white ml-8' 
                            : 'bg-gray-100 text-gray-800 mr-8'
                        }`}>
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                          
                          {/* Boutons d'action */}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${
                              message.role === 'user' 
                                ? 'text-blue-100' 
                                : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </span>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyMessage(message.content)}
                              className={`h-6 w-6 p-0 ${
                                message.role === 'user'
                                  ? 'text-blue-100 hover:bg-blue-600'
                                  : 'text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                                                 {/* Graphiques */}
                         {message.data && message.data.type && (
                           <div className="mt-2 mr-8">
                             <ChartRenderer data={message.data as any} />
                           </div>
                         )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Indicateur de chargement */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 mr-8">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600">
                          L'assistant réfléchit...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Erreur */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mr-8">
                      <div className="text-sm text-red-700 mb-2">
                        {error}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryLastMessage}
                        className="h-7 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Réessayer
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="text-xs text-gray-500 text-center">
                      Suggestions :
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez votre question..."
                    disabled={isLoading}
                    className="flex-1 bg-white"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 