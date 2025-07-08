"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Suggestion } from '@/types/dashboard';

interface SuggestionBannerProps {
  suggestions: Suggestion[];
  onAction: (suggestionId: string, action: 'accept' | 'dismiss') => void;
}

export default function SuggestionBanner({ suggestions, onAction }: SuggestionBannerProps) {
  const topSuggestion = suggestions[0];
  
  if (!topSuggestion) return null;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Suggestion IA</span>
                <Badge 
                  variant="secondary" 
                  className={`text-white ${getImpactColor(topSuggestion.impact)}`}
                >
                  {topSuggestion.impact === 'high' ? 'Haute' : 
                   topSuggestion.impact === 'medium' ? 'Moyenne' : 'Faible'} priorité
                </Badge>
              </div>
              
              <div className="text-blue-800">
                <h3 className="font-medium">{topSuggestion.title}</h3>
                <p className="text-sm text-blue-700">{topSuggestion.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {topSuggestion.actions.map((action, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onAction(topSuggestion.id, 'accept')}
                  className={index === 0 ? "bg-blue-600 hover:bg-blue-700" : "text-blue-700 hover:text-blue-900"}
                >
                  {action.label}
                  {index === 0 && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction(topSuggestion.id, 'dismiss')}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {suggestions.length > 1 && (
            <div className="mt-2 text-xs text-blue-600">
              +{suggestions.length - 1} autre{suggestions.length > 2 ? 's' : ''} suggestion{suggestions.length > 2 ? 's' : ''}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 