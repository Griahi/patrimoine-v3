"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { X, Lightbulb, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Suggestion } from '@/types/dashboard';

interface SuggestionPanelProps {
  suggestions: Suggestion[];
  onAction: (suggestionId: string, action: 'accept' | 'dismiss') => void;
  onClose: () => void;
}

export default function SuggestionPanel({ suggestions, onAction, onClose }: SuggestionPanelProps) {
  const activeSuggestions = suggestions.filter(s => !s.isDismissed && !s.isRead);
  const readSuggestions = suggestions.filter(s => s.isRead);
  const dismissedSuggestions = suggestions.filter(s => s.isDismissed);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const SuggestionCard = ({ suggestion, isActive = true }: { suggestion: Suggestion; isActive?: boolean }) => (
    <Card className={`p-4 ${getImpactColor(suggestion.impact)} ${!isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <Badge className={getImpactBadgeColor(suggestion.impact)}>
            {suggestion.impact === 'high' ? 'Haute' : 
             suggestion.impact === 'medium' ? 'Moyenne' : 'Faible'}
          </Badge>
          <span className="text-xs text-gray-500">
            {Math.round(suggestion.confidence * 100)}% confiance
          </span>
        </div>
        
        {suggestion.isRead && <CheckCircle className="h-4 w-4 text-green-600" />}
        {suggestion.isDismissed && <XCircle className="h-4 w-4 text-red-600" />}
      </div>

      <h4 className="font-medium text-gray-900 mb-2">{suggestion.title}</h4>
      <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>

      <div className="text-xs text-gray-500 mb-3">
        <Clock className="h-3 w-3 inline mr-1" />
        {new Date(suggestion.createdAt).toLocaleDateString()}
      </div>

      {isActive && (
        <div className="flex gap-2">
          {suggestion.actions.map((action, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "ghost"}
              size="sm"
              onClick={() => onAction(suggestion.id, 'accept')}
            >
              {action.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction(suggestion.id, 'dismiss')}
            className="text-red-600 hover:text-red-700"
          >
            Ignorer
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Suggestions IA</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          {activeSuggestions.length} suggestion{activeSuggestions.length > 1 ? 's' : ''} active{activeSuggestions.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Suggestions */}
        {activeSuggestions.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">À examiner</h3>
            <div className="space-y-3">
              {activeSuggestions.map(suggestion => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          </div>
        )}

        {/* Read Suggestions */}
        {readSuggestions.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Appliquées</h3>
            <div className="space-y-3">
              {readSuggestions.map(suggestion => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} isActive={false} />
              ))}
            </div>
          </div>
        )}

        {/* Dismissed Suggestions */}
        {dismissedSuggestions.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Ignorées</h3>
            <div className="space-y-3">
              {dismissedSuggestions.map(suggestion => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} isActive={false} />
              ))}
            </div>
          </div>
        )}

        {suggestions.length === 0 && (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune suggestion disponible</p>
            <p className="text-sm text-gray-400 mt-2">
              Utilisez le dashboard pour générer des suggestions personnalisées
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 