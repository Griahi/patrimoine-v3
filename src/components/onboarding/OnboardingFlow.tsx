"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Wand2, ArrowRight, FileSpreadsheet, Users, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import ExcelImporter from './ExcelImporter'
import OnboardingWizard from './OnboardingWizard'

interface OnboardingFlowProps {
  onComplete?: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [mode, setMode] = useState<'choice' | 'excel' | 'wizard'>('choice')

  const handleBack = () => {
    setMode('choice')
  }

  const handleComplete = () => {
    onComplete?.()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute top-40 left-40 w-60 h-60 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <AnimatePresence mode="wait">
          {mode === 'choice' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl mx-auto mt-12"
            >
              {/* Header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                    Bienvenue dans votre espace patrimonial
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    Configurons ensemble votre patrimoine en quelques minutes. 
                    Choisissez la méthode qui vous convient le mieux.
                  </p>
                </motion.div>
              </div>

              {/* Choice Cards */}
              <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Excel Import Card */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <Card 
                    className="group relative p-8 cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:scale-105"
                    onClick={() => setMode('excel')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl text-white group-hover:scale-110 transition-transform duration-300">
                          <FileSpreadsheet className="w-8 h-8" />
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-2 transition-all duration-300" />
                      </div>
                      
                      <h2 className="text-3xl font-bold mb-4 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                        Import Excel
                      </h2>
                      <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                        Importez rapidement toutes vos données depuis un fichier Excel structuré. 
                        Idéal si vous avez déjà organisé vos informations.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="font-medium">Import en masse ultra-rapide</span>
                        </div>
                        <div className="flex items-center space-x-3 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="font-medium">Template Excel fourni</span>
                        </div>
                        <div className="flex items-center space-x-3 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="font-medium">Validation automatique des données</span>
                        </div>
                        <div className="flex items-center space-x-3 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="font-medium">Parfait pour les patrimoines complexes</span>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Temps estimé</span>
                          <span className="font-semibold text-green-600">5-10 minutes</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Wizard Card */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <Card 
                    className="group relative p-8 cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:scale-105"
                    onClick={() => setMode('wizard')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl text-white group-hover:scale-110 transition-transform duration-300">
                          <Users className="w-8 h-8" />
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-2 transition-all duration-300" />
                      </div>
                      
                      <h2 className="text-3xl font-bold mb-4 text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                        Assistant Guidé
                      </h2>
                      <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                        Laissez-vous accompagner étape par étape dans la création de votre patrimoine. 
                        Interface intuitive et conseils personnalisés.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-purple-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          <span className="font-medium">Interface intuitive et guidée</span>
                        </div>
                        <div className="flex items-center space-x-3 text-purple-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          <span className="font-medium">Connexions bancaires automatiques</span>
                        </div>
                        <div className="flex items-center space-x-3 text-purple-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          <span className="font-medium">Recommandations personnalisées</span>
                        </div>
                        <div className="flex items-center space-x-3 text-purple-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          <span className="font-medium">Parfait pour débuter</span>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Temps estimé</span>
                          <span className="font-semibold text-purple-600">10-15 minutes</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Additional Info */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-center mt-16"
              >
                <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-gray-600 font-medium">
                    Toutes vos données sont chiffrées et sécurisées
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {mode === 'excel' && (
            <motion.div
              key="excel"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <ExcelImporter onBack={handleBack} onComplete={handleComplete} />
            </motion.div>
          )}

          {mode === 'wizard' && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <OnboardingWizard onBack={handleBack} onComplete={handleComplete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 