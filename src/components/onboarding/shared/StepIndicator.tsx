"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle } from 'lucide-react'

interface Step {
  id: string
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  completedSteps?: Set<number> | number[]
}

export default function StepIndicator({ steps, currentStep, completedSteps = new Set() }: StepIndicatorProps) {
  // Ensure completedSteps is always a Set
  const completedStepsSet = completedSteps instanceof Set 
    ? completedSteps 
    : new Set(Array.isArray(completedSteps) ? completedSteps : [])

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedStepsSet.has(index)
          const isCurrent = index === currentStep
          const isClickable = index <= currentStep || isCompleted

          return (
            <div key={step.id} className="flex-1 flex items-center">
              {/* Step Circle */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted 
                      ? '#10B981' 
                      : isCurrent 
                      ? '#3B82F6' 
                      : '#E5E7EB'
                  }}
                  transition={{ duration: 0.3 }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                    ${isCurrent ? 'ring-4 ring-blue-200' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <span className={`text-sm font-medium ${
                      isCurrent ? 'text-white' : isClickable ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                </motion.div>

                {/* Step Label */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    isCurrent 
                      ? 'text-blue-600' 
                      : isCompleted 
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 relative">
                  <div className="absolute inset-0 bg-gray-200 rounded-full" />
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: isCompleted || index < currentStep ? '100%' : '0%' 
                    }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 