"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { 
  Home, Building, Plus, Edit2, Trash2, Save, X, 
  MapPin, Euro, AlertCircle, CheckCircle, 
  Calculator, PiggyBank, Calendar
} from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboarding-store'

interface RealEstateFormData {
  address: string
  type: 'apartment' | 'house' | 'land' | 'commercial'
  surface?: number
  rooms?: number
  estimatedValue: number
  remainingDebt?: number
  monthlyRent?: number
  entityId?: string
}

const propertyTypes = [
  { value: 'apartment', label: 'Appartement', icon: Building },
  { value: 'house', label: 'Maison', icon: Home },
  { value: 'land', label: 'Terrain', icon: MapPin },
  { value: 'commercial', label: 'Local commercial', icon: Building },
]

export default function RealEstateStep() {
  const { data, addToStepArray, removeFromStepArray, updateArrayItem } = useOnboardingStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<RealEstateFormData>({
    address: '',
    type: 'apartment',
    surface: 0,
    rooms: 0,
    estimatedValue: 0,
    remainingDebt: 0,
    monthlyRent: 0,
    entityId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const realEstate = data.realEstate || []
  const entities = data.entities || []

  const resetForm = () => {
    setFormData({
      address: '',
      type: 'apartment',
      surface: 0,
      rooms: 0,
      estimatedValue: 0,
      remainingDebt: 0,
      monthlyRent: 0,
      entityId: '',
    })
    setErrors({})
    setEditingId(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise'
    }

    if (formData.estimatedValue <= 0) {
      newErrors.estimatedValue = 'La valeur estimée doit être positive'
    }

    if (formData.remainingDebt && formData.remainingDebt < 0) {
      newErrors.remainingDebt = 'La dette ne peut pas être négative'
    }

    if (formData.monthlyRent && formData.monthlyRent < 0) {
      newErrors.monthlyRent = 'Le loyer ne peut pas être négatif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (editingId) {
      updateArrayItem('realEstate', editingId, { ...formData })
    } else {
      addToStepArray('realEstate', { ...formData })
    }

    resetForm()
    setShowForm(false)
  }

  const handleEdit = (property: any) => {
    setFormData({
      address: property.address,
      type: property.type,
      surface: property.surface || 0,
      rooms: property.rooms || 0,
      estimatedValue: property.estimatedValue,
      remainingDebt: property.remainingDebt || 0,
      monthlyRent: property.monthlyRent || 0,
      entityId: property.entityId || '',
    })
    setEditingId(property.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    removeFromStepArray('realEstate', id)
  }

  const handleCancel = () => {
    resetForm()
    setShowForm(false)
  }

  const updateFormField = (field: keyof RealEstateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getPropertyTypeIcon = (type: string) => {
    const propertyType = propertyTypes.find(t => t.value === type)
    return propertyType ? propertyType.icon : Home
  }

  const getTotalValue = () => {
    return realEstate.reduce((total, property) => total + property.estimatedValue, 0)
  }

  const getTotalDebt = () => {
    return realEstate.reduce((total, property) => total + (property.remainingDebt || 0), 0)
  }

  const getTotalRent = () => {
    return realEstate.reduce((total, property) => total + (property.monthlyRent || 0), 0)
  }

  const getNetValue = () => {
    return getTotalValue() - getTotalDebt()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Home className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Vos Biens Immobiliers</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Ajoutez vos biens immobiliers pour calculer votre patrimoine net et optimiser votre fiscalité.
        </p>
      </div>

      {/* Summary Cards */}
      {realEstate.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Valeur totale</div>
                  <div className="text-lg font-semibold">{formatCurrency(getTotalValue())}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Dettes</div>
                  <div className="text-lg font-semibold text-red-600">{formatCurrency(getTotalDebt())}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <PiggyBank className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Valeur nette</div>
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(getNetValue())}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Euro className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Loyers/mois</div>
                  <div className="text-lg font-semibold text-blue-600">{formatCurrency(getTotalRent())}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5" />
              <span>Biens immobiliers ({realEstate.length})</span>
              {realEstate.length > 0 && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2"
              disabled={showForm}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un bien</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {realEstate.length === 0 && !showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Home className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucun bien immobilier ajouté
                </h3>
                <p className="text-gray-600 mb-4">
                  Ajoutez vos biens pour calculer votre patrimoine immobilier
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter votre premier bien</span>
                </Button>
              </motion.div>
            )}

            {realEstate.map((property) => {
              const IconComponent = getPropertyTypeIcon(property.type)
              const netValue = property.estimatedValue - (property.remainingDebt || 0)
              const rentYield = property.monthlyRent ? (property.monthlyRent * 12 / property.estimatedValue) * 100 : 0
              
              return (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 mb-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-white rounded-lg">
                        <IconComponent className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-800">{property.address}</h4>
                          <Badge variant="secondary">
                            {propertyTypes.find(t => t.value === property.type)?.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          {property.surface && (
                            <div>
                              <span className="font-medium">Surface:</span> {property.surface} m²
                            </div>
                          )}
                          {property.rooms && (
                            <div>
                              <span className="font-medium">Pièces:</span> {property.rooms}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Valeur:</span>
                            <span className="text-green-600 font-semibold ml-1">
                              {formatCurrency(property.estimatedValue)}
                            </span>
                          </div>
                          {property.remainingDebt && property.remainingDebt > 0 && (
                            <div>
                              <span className="font-medium">Dette:</span>
                              <span className="text-red-600 font-semibold ml-1">
                                {formatCurrency(property.remainingDebt)}
                              </span>
                            </div>
                          )}
                          {property.monthlyRent && property.monthlyRent > 0 && (
                            <div>
                              <span className="font-medium">Loyer:</span>
                              <span className="text-blue-600 font-semibold ml-1">
                                {formatCurrency(property.monthlyRent)}/mois
                              </span>
                            </div>
                          )}
                          {rentYield > 0 && (
                            <div>
                              <span className="font-medium">Rendement:</span>
                              <span className="text-purple-600 font-semibold ml-1">
                                {rentYield.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">Valeur nette:</span>
                            <span className="text-lg font-semibold text-green-600">
                              {formatCurrency(netValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(property)}
                        className="flex items-center space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(property.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>{editingId ? 'Modifier le bien' : 'Ajouter un bien immobilier'}</span>
                </CardTitle>
                <CardDescription>
                  Renseignez les informations de votre bien immobilier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Address */}
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Adresse *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => updateFormField('address', e.target.value)}
                        placeholder="123 rue de la Paix, 75001 Paris"
                        className={errors.address ? 'border-red-500' : ''}
                      />
                      {errors.address && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Type */}
                    <div>
                      <Label htmlFor="type">Type de bien *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => updateFormField('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <type.icon className="w-4 h-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Surface */}
                    <div>
                      <Label htmlFor="surface">Surface (m²)</Label>
                      <Input
                        id="surface"
                        type="number"
                        value={formData.surface}
                        onChange={(e) => updateFormField('surface', parseFloat(e.target.value) || 0)}
                        placeholder="75"
                      />
                    </div>

                    {/* Rooms */}
                    {formData.type !== 'land' && (
                      <div>
                        <Label htmlFor="rooms">Nombre de pièces</Label>
                        <Input
                          id="rooms"
                          type="number"
                          value={formData.rooms}
                          onChange={(e) => updateFormField('rooms', parseInt(e.target.value) || 0)}
                          placeholder="3"
                        />
                      </div>
                    )}

                    {/* Estimated Value */}
                    <div>
                      <Label htmlFor="estimatedValue">Valeur estimée *</Label>
                      <Input
                        id="estimatedValue"
                        type="number"
                        value={formData.estimatedValue}
                        onChange={(e) => updateFormField('estimatedValue', parseFloat(e.target.value) || 0)}
                        placeholder="250000"
                        className={errors.estimatedValue ? 'border-red-500' : ''}
                      />
                      {errors.estimatedValue && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.estimatedValue}</span>
                        </div>
                      )}
                    </div>

                    {/* Remaining Debt */}
                    <div>
                      <Label htmlFor="remainingDebt">Capital restant dû</Label>
                      <Input
                        id="remainingDebt"
                        type="number"
                        value={formData.remainingDebt}
                        onChange={(e) => updateFormField('remainingDebt', parseFloat(e.target.value) || 0)}
                        placeholder="150000"
                        className={errors.remainingDebt ? 'border-red-500' : ''}
                      />
                      {errors.remainingDebt && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.remainingDebt}</span>
                        </div>
                      )}
                    </div>

                    {/* Monthly Rent */}
                    <div>
                      <Label htmlFor="monthlyRent">Loyer mensuel (si location)</Label>
                      <Input
                        id="monthlyRent"
                        type="number"
                        value={formData.monthlyRent}
                        onChange={(e) => updateFormField('monthlyRent', parseFloat(e.target.value) || 0)}
                        placeholder="1200"
                        className={errors.monthlyRent ? 'border-red-500' : ''}
                      />
                      {errors.monthlyRent && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.monthlyRent}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Entity Assignment */}
                  {entities.length > 0 && (
                    <div>
                      <Label htmlFor="entityId">Propriétaire (optionnel)</Label>
                      <Select
                        value={formData.entityId}
                        onValueChange={(value) => updateFormField('entityId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le propriétaire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucun propriétaire spécifique</SelectItem>
                          {entities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              {entity.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Annuler</span>
                    </Button>
                    <Button
                      type="submit"
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingId ? 'Modifier' : 'Ajouter'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
