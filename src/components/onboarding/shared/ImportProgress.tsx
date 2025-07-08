"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CheckCircle, Loader2, Upload, Database, Users, CreditCard, TrendingUp, Home, FileText } from 'lucide-react'

interface ImportProgressProps {
  progress: number
  currentStep?: string
  details?: {
    entities?: number
    bankAccounts?: number
    stockPortfolio?: number
    realEstate?: number
    ownership?: number
    total?: number
  }
}

const importSteps = [
  { key: 'entities', label: 'Entités', icon: Users },
  { key: 'bankAccounts', label: 'Comptes bancaires', icon: CreditCard },
  { key: 'stockPortfolio', label: 'Portefeuille boursier', icon: TrendingUp },
  { key: 'realEstate', label: 'Biens immobiliers', icon: Home },
  { key: 'ownership', label: 'Relations de détention', icon: FileText },
]

export function ImportProgress({ progress, currentStep = '', details }: ImportProgressProps) {
  const getStepStatus = (stepKey: string) => {
    if (currentStep === stepKey) return 'current'
    if (details && details[stepKey as keyof typeof details] !== undefined) return 'completed'
    return 'pending'
  }

  const getStepIcon = (stepKey: string, IconComponent: React.ComponentType<any>) => {
    const status = getStepStatus(stepKey)
    
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (status === 'current') {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    } else {
      return <IconComponent className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Import en cours...</h2>
        <p className="text-gray-600">
          Vos données sont en cours d'importation dans votre espace patrimonial
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progression générale</span>
            <span className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Steps Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Détail de l'import</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {importSteps.map((step, index) => {
              const status = getStepStatus(step.key)
              const count = details?.[step.key as keyof typeof details] || 0
              
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-300 ${
                    status === 'current' 
                      ? 'bg-blue-50 border-blue-200 shadow-md' 
                      : status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStepIcon(step.key, step.icon)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        status === 'current' ? 'text-blue-800' :
                        status === 'completed' ? 'text-green-800' :
                        'text-gray-600'
                      }`}>
                        {step.label}
                      </h4>
                      
                      {status === 'completed' && (
                        <span className="text-sm font-medium text-green-600">
                          {count} élément{count > 1 ? 's' : ''} importé{count > 1 ? 's' : ''}
                        </span>
                      )}
                      
                      {status === 'current' && (
                        <span className="text-sm font-medium text-blue-600">
                          En cours...
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {details && details.total && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{details.entities || 0}</div>
                <div className="text-sm text-gray-600">Entités</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{details.bankAccounts || 0}</div>
                <div className="text-sm text-gray-600">Comptes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{details.stockPortfolio || 0}</div>
                <div className="text-sm text-gray-600">Titres</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{details.realEstate || 0}</div>
                <div className="text-sm text-gray-600">Biens</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{details.ownership || 0}</div>
                <div className="text-sm text-gray-600">Relations</div>
              </div>
              <div className="border-l border-gray-300 pl-4">
                <div className="text-2xl font-bold text-gray-800">{details.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Animation */}
      <div className="flex justify-center">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    </div>
  )
} 