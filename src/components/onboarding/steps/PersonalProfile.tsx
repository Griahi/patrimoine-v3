"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { User, Mail, Phone, Heart, Target, CheckCircle, X } from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboarding-store'

const familyStatusOptions = [
  { value: 'single', label: 'Célibataire' },
  { value: 'married', label: 'Marié(e)' },
  { value: 'pacs', label: 'Pacsé(e)' },
  { value: 'divorced', label: 'Divorcé(e)' },
  { value: 'widowed', label: 'Veuf/Veuve' },
]

const objectiveOptions = [
  { value: 'retirement', label: 'Préparer ma retraite', icon: '🏖️' },
  { value: 'investment', label: 'Optimiser mes investissements', icon: '📈' },
  { value: 'tax_optimization', label: 'Optimiser ma fiscalité', icon: '💰' },
  { value: 'wealth_transmission', label: 'Transmission de patrimoine', icon: '👨‍👩‍👧‍👦' },
  { value: 'real_estate', label: 'Investissement immobilier', icon: '🏠' },
  { value: 'diversification', label: 'Diversifier mon patrimoine', icon: '🎯' },
  { value: 'risk_management', label: 'Gestion des risques', icon: '🛡️' },
  { value: 'children_education', label: 'Financer les études des enfants', icon: '🎓' },
]

export default function PersonalProfile() {
  const { data, updateStepField, setStepErrors, clearStepErrors } = useOnboardingStore()
  const [localData, setLocalData] = useState(data.profile)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Synchronise avec le store
  useEffect(() => {
    setLocalData(data.profile)
  }, [data.profile])

  // Validation en temps réel
  useEffect(() => {
    const newErrors: Record<string, string> = {}

    if (!localData.firstName?.trim()) {
      newErrors.firstName = 'Le prénom est requis'
    }

    if (!localData.lastName?.trim()) {
      newErrors.lastName = 'Le nom est requis'
    }

    if (!localData.email?.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localData.email)) {
      newErrors.email = 'Email invalide'
    }

    if (localData.phone && !/^(?:\+33|0)[1-9](?:[0-9]{8})$/.test(localData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone invalide'
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      setStepErrors('profile', Object.values(newErrors))
    } else {
      clearStepErrors('profile')
    }
  }, [localData, setStepErrors, clearStepErrors])

  const updateField = (field: string, value: any) => {
    const newData = { ...localData, [field]: value }
    setLocalData(newData)
    updateStepField('profile', field, value)
  }

  const toggleObjective = (objective: string) => {
    const current = localData.objectives || []
    const newObjectives = current.includes(objective)
      ? current.filter(o => o !== objective)
      : [...current, objective]
    
    updateField('objectives', newObjectives)
  }

  const isComplete = !Object.keys(errors).length && 
                    localData.firstName && 
                    localData.lastName && 
                    localData.email

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Votre profil</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Commençons par quelques informations de base pour personnaliser votre expérience 
          et mieux comprendre vos objectifs patrimoniaux.
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Informations personnelles</span>
            {isComplete && <CheckCircle className="w-5 h-5 text-green-500" />}
          </CardTitle>
          <CardDescription>
            Ces informations nous aideront à personnaliser votre expérience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={localData.firstName || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="Jean"
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={localData.lastName || ''}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Dupont"
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={localData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="jean.dupont@email.com"
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={localData.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="06 12 34 56 78"
                  className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="familyStatus">Situation familiale</Label>
            <Select
              value={localData.familyStatus || ''}
              onValueChange={(value) => updateField('familyStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre situation" />
              </SelectTrigger>
              <SelectContent>
                {familyStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Vos objectifs patrimoniaux</span>
          </CardTitle>
          <CardDescription>
            Sélectionnez vos principales préoccupations (plusieurs choix possibles)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {objectiveOptions.map((objective) => {
              const isSelected = (localData.objectives || []).includes(objective.value)
              
              return (
                <motion.div
                  key={objective.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    onClick={() => toggleObjective(objective.value)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{objective.icon}</span>
                        <span className={`font-medium ${
                          isSelected ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {objective.label}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Selected objectives summary */}
          {localData.objectives && localData.objectives.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  Objectifs sélectionnés ({localData.objectives.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {localData.objectives.map((objValue) => {
                  const obj = objectiveOptions.find(o => o.value === objValue)
                  return obj ? (
                    <Badge key={objValue} variant="secondary" className="bg-green-100 text-green-800">
                      {obj.icon} {obj.label}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isComplete ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="font-medium text-gray-700">
                {isComplete ? 'Profil complété' : 'Profil en cours de configuration'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Étape 1 sur 8</div>
              <div className="text-xs text-gray-500">Profil personnel</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 