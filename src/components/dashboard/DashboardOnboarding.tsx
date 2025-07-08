"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  BarChart3, 
  Lightbulb, 
  Settings, 
  Sparkles,
  ChevronRight,
  X,
  Eye,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface DashboardOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Bienvenue dans votre Dashboard Adaptatif IA',
    description: 'Votre dashboard s\'adapte automatiquement à votre façon de travailler grâce à l\'intelligence artificielle.',
    icon: Brain,
    features: [
      'Analyse de votre comportement',
      'Optimisation automatique du layout',
      'Suggestions personnalisées'
    ]
  },
  {
    id: 'tracking',
    title: 'Intelligence Comportementale',
    description: 'L\'IA observe comment vous utilisez les widgets pour optimiser votre expérience.',
    icon: Eye,
    features: [
      'Suivi des interactions en temps réel',
      'Analyse des patterns d\'usage',
      'Respect total de votre vie privée'
    ]
  },
  {
    id: 'suggestions',
    title: 'Suggestions Intelligentes',
    description: 'Recevez des recommandations contextuelles pour améliorer votre productivité.',
    icon: Lightbulb,
    features: [
      'Réorganisation automatique',
      'Widgets recommandés',
      'Optimisations de performance'
    ]
  },
  {
    id: 'customization',
    title: 'Personnalisation Avancée',
    description: 'Modifiez votre dashboard à volonté avec le drag & drop et la sauvegarde automatique.',
    icon: Settings,
    features: [
      'Drag & drop des widgets',
      'Layouts multiples',
      'Synchronisation cloud'
    ]
  }
];

export default function DashboardOnboarding({ onComplete, onSkip }: DashboardOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    // Simulate initialization
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const currentStepData = onboardingSteps[currentStep];

  if (isCompleting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <Card className="p-8 max-w-md mx-4 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4"
          >
            <Sparkles className="h-12 w-12 text-blue-600" />
          </motion.div>
          <h3 className="text-lg font-semibold mb-2">Initialisation de l'IA...</h3>
          <p className="text-gray-600">Configuration de votre dashboard adaptatif</p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <currentStepData.icon className="h-6 w-6" />
            </div>
            <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-0">
              Étape {currentStep + 1} sur {onboardingSteps.length}
            </Badge>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
          <p className="text-blue-100">{currentStepData.description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            {currentStepData.features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Progression</span>
              <span className="text-sm font-medium">
                {Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-gray-500"
            >
              Passer l'introduction
            </Button>
            
            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {currentStep < onboardingSteps.length - 1 ? 'Suivant' : 'Commencer'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Demo Visualization */}
        {currentStep === 0 && (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div
                    key={i}
                    className="bg-white rounded border h-16 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    <BarChart3 className="h-6 w-6 text-gray-400" />
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">
                Votre dashboard s'adapte en temps réel
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
} 