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
  Car, Gem, Bitcoin, Briefcase, Plus, Edit2, Trash2, Save, X, 
  Palette, Watch, Wine, Music, AlertCircle, CheckCircle,
  DollarSign, Package
} from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboarding-store'

interface OtherAssetFormData {
  name: string
  type: string
  description?: string
  estimatedValue: number
  currency: string
  entityId?: string
}

const assetTypes = [
  { value: 'vehicle', label: 'Véhicule', icon: Car, examples: 'Voiture, moto, bateau...' },
  { value: 'crypto', label: 'Cryptomonnaies', icon: Bitcoin, examples: 'Bitcoin, Ethereum, NFT...' },
  { value: 'jewelry', label: 'Bijoux', icon: Gem, examples: 'Montre, bague, collier...' },
  { value: 'art', label: 'Œuvres d\'art', icon: Palette, examples: 'Peinture, sculpture...' },
  { value: 'collectibles', label: 'Objets de collection', icon: Package, examples: 'Timbres, cartes, pièces...' },
  { value: 'luxury', label: 'Articles de luxe', icon: Watch, examples: 'Montre, sac, maroquinerie...' },
  { value: 'wine', label: 'Vins et spiritueux', icon: Wine, examples: 'Cave à vin, whisky...' },
  { value: 'instruments', label: 'Instruments de musique', icon: Music, examples: 'Piano, guitare, violon...' },
  { value: 'business', label: 'Parts d\'entreprise', icon: Briefcase, examples: 'Actions non cotées...' },
  { value: 'other', label: 'Autre', icon: Package, examples: 'Autres actifs de valeur...' },
]

export default function OtherAssetsStep() {
  const { data, addToStepArray, removeFromStepArray, updateArrayItem } = useOnboardingStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<OtherAssetFormData>({
    name: '',
    type: 'vehicle',
    description: '',
    estimatedValue: 0,
    currency: 'EUR',
    entityId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const otherAssets = data.otherAssets || []
  const entities = data.entities || []

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'vehicle',
      description: '',
      estimatedValue: 0,
      currency: 'EUR',
      entityId: '',
    })
    setErrors({})
    setEditingId(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (formData.estimatedValue <= 0) {
      newErrors.estimatedValue = 'La valeur estimée doit être positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (editingId) {
      updateArrayItem('otherAssets', editingId, { ...formData })
    } else {
      addToStepArray('otherAssets', { ...formData })
    }

    resetForm()
    setShowForm(false)
  }

  const handleEdit = (asset: any) => {
    setFormData({
      name: asset.name,
      type: asset.type,
      description: asset.description || '',
      estimatedValue: asset.estimatedValue,
      currency: asset.currency,
      entityId: asset.entityId || '',
    })
    setEditingId(asset.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    removeFromStepArray('otherAssets', id)
  }

  const handleCancel = () => {
    resetForm()
    setShowForm(false)
  }

  const updateFormField = (field: keyof OtherAssetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getAssetTypeInfo = (type: string) => {
    return assetTypes.find(t => t.value === type) || assetTypes[assetTypes.length - 1]
  }

  const getTotalValue = () => {
    return otherAssets.reduce((total, asset) => {
      // Convert all to EUR for simplicity
      return total + asset.estimatedValue
    }, 0)
  }

  const getAssetsByType = () => {
    const grouped = otherAssets.reduce((acc, asset) => {
      const type = asset.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(asset)
      return acc
    }, {} as Record<string, any[]>)
    return grouped
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
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Package className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Autres Actifs</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Ajoutez vos autres actifs de valeur : véhicules, cryptomonnaies, objets d'art, bijoux...
        </p>
      </div>

      {/* Quick Add Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {assetTypes.slice(0, 5).map((type) => {
          const IconComponent = type.icon
          return (
            <Card 
              key={type.value}
              className="group cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-purple-500"
              onClick={() => {
                setFormData(prev => ({ ...prev, type: type.value }))
                setShowForm(true)
              }}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mb-2 group-hover:bg-purple-200 transition-colors">
                  <IconComponent className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-gray-800">{type.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      {otherAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Résumé des autres actifs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">Valeur totale estimée:</span>
              <span className="text-2xl font-bold text-purple-600">
                {formatCurrency(getTotalValue(), 'EUR')}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(getAssetsByType()).map(([type, assets]) => {
                const typeInfo = getAssetTypeInfo(type)
                const IconComponent = typeInfo.icon
                const totalValue = assets.reduce((sum, asset) => sum + asset.estimatedValue, 0)
                
                return (
                  <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                    <IconComponent className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs font-medium text-gray-600">{typeInfo.label}</div>
                    <div className="text-sm font-semibold">{assets.length}</div>
                    <div className="text-xs text-purple-600">{formatCurrency(totalValue, 'EUR')}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Autres actifs ({otherAssets.length})</span>
              {otherAssets.length > 0 && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2"
              disabled={showForm}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un actif</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {otherAssets.length === 0 && !showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucun autre actif ajouté
                </h3>
                <p className="text-gray-600 mb-4">
                  Ajoutez vos actifs de valeur pour compléter votre patrimoine
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {assetTypes.slice(0, 3).map((type) => {
                    const IconComponent = type.icon
                    return (
                      <Button 
                        key={type.value}
                        variant="outline"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, type: type.value }))
                          setShowForm(true)
                        }}
                        className="flex items-center space-x-2"
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{type.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {otherAssets.map((asset) => {
              const typeInfo = getAssetTypeInfo(asset.type)
              const IconComponent = typeInfo.icon
              
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 mb-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-white rounded-lg">
                        <IconComponent className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-800">{asset.name}</h4>
                          <Badge variant="secondary">{typeInfo.label}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          {asset.description && (
                            <div className="text-gray-500 italic">{asset.description}</div>
                          )}
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Valeur estimée:</span>
                            <span className="text-lg font-semibold text-purple-600">
                              {formatCurrency(asset.estimatedValue, asset.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(asset)}
                        className="flex items-center space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(asset.id)}
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
                  <span>{editingId ? 'Modifier l\'actif' : 'Ajouter un actif'}</span>
                </CardTitle>
                <CardDescription>
                  Renseignez les informations de votre actif
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type */}
                    <div>
                      <Label htmlFor="type">Type d'actif *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => updateFormField('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          {assetTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <type.icon className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-gray-500">{type.examples}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Name */}
                    <div>
                      <Label htmlFor="name">Nom de l'actif *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormField('name', e.target.value)}
                        placeholder="Ex: BMW X3, Rolex Submariner..."
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Estimated Value */}
                    <div>
                      <Label htmlFor="estimatedValue">Valeur estimée *</Label>
                      <Input
                        id="estimatedValue"
                        type="number"
                        step="0.01"
                        value={formData.estimatedValue}
                        onChange={(e) => updateFormField('estimatedValue', parseFloat(e.target.value) || 0)}
                        placeholder="25000"
                        className={errors.estimatedValue ? 'border-red-500' : ''}
                      />
                      {errors.estimatedValue && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.estimatedValue}</span>
                        </div>
                      )}
                    </div>

                    {/* Currency */}
                    <div>
                      <Label htmlFor="currency">Devise</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => updateFormField('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la devise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CHF">CHF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormField('description', e.target.value)}
                      placeholder="Détails supplémentaires, année, modèle, état..."
                    />
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
