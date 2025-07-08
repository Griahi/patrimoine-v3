"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboarding-store'
import StepIndicator from './shared/StepIndicator'
import PersonalProfile from './steps/PersonalProfile'
import EntitiesStep from './steps/EntitiesStep'
import BankAccountsStep from './steps/BankAccountsStep'
import StockPortfolioStep from './steps/StockPortfolioStep'
import RealEstateStep from './steps/RealEstateStep'
import OtherAssetsStep from './steps/OtherAssetsStep'
import OwnershipStructureStep from './steps/OwnershipStructureStep'
import SummaryStep from './steps/SummaryStep'

// Placeholder components for future steps
const PlaceholderStep = ({ title, description }: { title: string; description: string }) => (
  <div className="text-center py-16">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
      <span className="text-2xl">🚧</span>
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
    <p className="text-gray-600 max-w-md mx-auto">{description}</p>
    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
      <p className="text-blue-700 text-sm">
        Cette étape sera implémentée dans la prochaine version. 
        Pour l'instant, vous pouvez passer à l'étape suivante.
      </p>
    </div>
  </div>
)

const steps = [
  { 
    id: 'profile', 
    label: 'Profil', 
    component: PersonalProfile 
  },
  { 
    id: 'entities', 
    label: 'Entités', 
    component: EntitiesStep 
  },
  { 
    id: 'banks', 
    label: 'Banques', 
    component: BankAccountsStep 
  },
  { 
    id: 'stocks', 
    label: 'Bourse', 
    component: StockPortfolioStep 
  },
  { 
    id: 'realestate', 
    label: 'Immobilier', 
    component: RealEstateStep 
  },
  { 
    id: 'other', 
    label: 'Autres actifs', 
    component: OtherAssetsStep 
  },
  { 
    id: 'ownership', 
    label: 'Détention', 
    component: OwnershipStructureStep 
  },
  { 
    id: 'summary', 
    label: 'Résumé', 
    component: SummaryStep 
  },
]

interface OnboardingWizardProps {
  onBack: () => void
  onComplete: () => void
}

export default function OnboardingWizard({ onBack, onComplete }: OnboardingWizardProps) {
  const { 
    currentStep, 
    nextStep, 
    prevStep, 
    canGoNext, 
    completedSteps,
    data 
  } = useOnboardingStore()

  const CurrentStepComponent = steps[currentStep].component
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      nextStep()
    }
  }

  const handlePrevious = () => {
    if (isFirstStep) {
      onBack()
    } else {
      prevStep()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Assistant de Configuration
        </h1>
        <p className="text-gray-600 text-lg">
          Configurons votre patrimoine étape par étape
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator 
        steps={steps} 
        currentStep={currentStep} 
        completedSteps={completedSteps}
      />

      {/* Current Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="min-h-[400px] mb-8"
      >
        <CurrentStepComponent />
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{isFirstStep ? 'Retour au choix' : 'Étape précédente'}</span>
        </Button>
        
        <div className="flex items-center space-x-4">
          {/* Progress indicator */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
            <span>Étape {currentStep + 1} sur {steps.length}</span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="flex items-center space-x-2"
          >
            <span>
              {isLastStep ? 'Terminer la configuration' : 'Étape suivante'}
            </span>
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
          <div className="font-mono">
            <div>Current Step: {currentStep} ({steps[currentStep].id})</div>
            <div>Can Go Next: {String(canGoNext())}</div>
            <div>Completed Steps: [{Array.from(completedSteps).join(', ')}]</div>
            <div>Profile Data: {JSON.stringify(data.profile, null, 2)}</div>
          </div>
        </div>
      )}
    </div>
  )
} 