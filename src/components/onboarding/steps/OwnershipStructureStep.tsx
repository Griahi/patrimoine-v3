"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { 
  Network, Users, Building, Plus, Edit2, Trash2, Save, X, 
  ArrowRight, Percent, AlertCircle, CheckCircle, 
  Home, TrendingUp, Package, CreditCard, User
} from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboarding-store'

interface OwnershipFormData {
  ownerEntityId: string
  ownedAssetId?: string
  ownedEntityId?: string
  percentage: number
}

export default function OwnershipStructureStep() {
  const { data, addToStepArray, removeFromStepArray, updateArrayItem } = useOnboardingStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<OwnershipFormData>({
    ownerEntityId: '',
    ownedAssetId: '',
    ownedEntityId: '',
    percentage: 100,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [autoAssignments, setAutoAssignments] = useState<any[]>([])

  const ownership = data.ownership || []
  const entities = data.entities || []
  const bankAccounts = data.bankAccounts || []
  const stockPortfolio = data.stockPortfolio || []
  const realEstate = data.realEstate || []
  const otherAssets = data.otherAssets || []

  // Combine all assets for selection
  const allAssets = [
    ...bankAccounts.map(acc => ({ 
      id: acc.id, 
      name: `${acc.bank} - ${acc.type}`, 
      type: 'bank', 
      category: 'Compte bancaire' 
    })),
    ...stockPortfolio.map(stock => ({ 
      id: stock.id, 
      name: `${stock.symbol} - ${stock.name}`, 
      type: 'stock', 
      category: 'Titre financier' 
    })),
    ...realEstate.map(property => ({ 
      id: property.id, 
      name: property.address, 
      type: 'realestate', 
      category: 'Bien immobilier' 
    })),
    ...otherAssets.map(asset => ({ 
      id: asset.id, 
      name: asset.name, 
      type: 'other', 
      category: 'Autre actif' 
    })),
  ]

  useEffect(() => {
    // Auto-assign unassigned assets to the first entity if only one entity exists
    if (entities.length === 1 && allAssets.length > 0) {
      const unassignedAssets = allAssets.filter(asset => 
        !ownership.some(o => o.ownedAssetId === asset.id)
      )
      
      if (unassignedAssets.length > 0) {
        const suggestions = unassignedAssets.map(asset => ({
          id: `auto-${asset.id}`,
          ownerEntityId: entities[0].id,
          ownedAssetId: asset.id,
          percentage: 100,
          isAutoSuggestion: true,
          asset: asset,
          entity: entities[0],
        }))
        setAutoAssignments(suggestions)
      }
    }
  }, [entities, allAssets, ownership])

  const resetForm = () => {
    setFormData({
      ownerEntityId: '',
      ownedAssetId: '',
      ownedEntityId: '',
      percentage: 100,
    })
    setErrors({})
    setEditingId(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.ownerEntityId) {
      newErrors.ownerEntityId = 'Le propriétaire est requis'
    }

    if (!formData.ownedAssetId && !formData.ownedEntityId) {
      newErrors.owned = 'Vous devez sélectionner un actif ou une entité'
    }

    if (formData.percentage <= 0 || formData.percentage > 100) {
      newErrors.percentage = 'Le pourcentage doit être entre 1 et 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (editingId) {
      updateArrayItem('ownership', editingId, { ...formData })
    } else {
      addToStepArray('ownership', { ...formData })
    }

    resetForm()
    setShowForm(false)
  }

  const handleEdit = (ownershipItem: any) => {
    setFormData({
      ownerEntityId: ownershipItem.ownerEntityId,
      ownedAssetId: ownershipItem.ownedAssetId || '',
      ownedEntityId: ownershipItem.ownedEntityId || '',
      percentage: ownershipItem.percentage,
    })
    setEditingId(ownershipItem.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    removeFromStepArray('ownership', id)
  }

  const handleCancel = () => {
    resetForm()
    setShowForm(false)
  }

  const updateFormField = (field: keyof OwnershipFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Clear the other ownership type when one is selected
    if (field === 'ownedAssetId' && value) {
      setFormData(prev => ({ ...prev, ownedEntityId: '' }))
    } else if (field === 'ownedEntityId' && value) {
      setFormData(prev => ({ ...prev, ownedAssetId: '' }))
    }
  }

  const applyAutoAssignment = (suggestion: any) => {
    addToStepArray('ownership', {
      ownerEntityId: suggestion.ownerEntityId,
      ownedAssetId: suggestion.ownedAssetId,
      percentage: suggestion.percentage,
    })
    
    // Remove from suggestions
    setAutoAssignments(prev => prev.filter(s => s.id !== suggestion.id))
  }

  const applyAllAutoAssignments = () => {
    autoAssignments.forEach(suggestion => {
      addToStepArray('ownership', {
        ownerEntityId: suggestion.ownerEntityId,
        ownedAssetId: suggestion.ownedAssetId,
        percentage: suggestion.percentage,
      })
    })
    setAutoAssignments([])
  }

  const dismissAutoAssignments = () => {
    setAutoAssignments([])
  }

  const getEntityName = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId)
    return entity ? entity.name : 'Entité inconnue'
  }

  const getAssetName = (assetId: string) => {
    const asset = allAssets.find(a => a.id === assetId)
    return asset ? asset.name : 'Actif inconnu'
  }

  const getAssetIcon = (assetId: string) => {
    const asset = allAssets.find(a => a.id === assetId)
    if (!asset) return Package
    
    switch (asset.type) {
      case 'bank': return CreditCard
      case 'stock': return TrendingUp
      case 'realestate': return Home
      default: return Package
    }
  }

  const getOwnershipSummary = () => {
    const summary = {
      totalRelations: ownership.length,
      entitiesWithAssets: new Set(ownership.map(o => o.ownerEntityId)).size,
      unassignedAssets: allAssets.filter(asset => 
        !ownership.some(o => o.ownedAssetId === asset.id)
      ).length,
    }
    return summary
  }

  const summary = getOwnershipSummary()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <Network className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Structure de Détention</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Définissez qui possède quoi dans votre patrimoine. Cette étape permet d'optimiser votre fiscalité 
          et de préparer la transmission de vos biens.
        </p>
      </div>

      {/* Auto-assignment suggestions */}
      <AnimatePresence>
        {autoAssignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <CheckCircle className="w-5 h-5" />
                  <span>Affectation automatique suggérée</span>
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Nous proposons d'affecter automatiquement tous vos actifs à "{entities[0]?.name}" 
                  car c'est votre seule entité déclarée.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {autoAssignments.slice(0, 3).map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{suggestion.entity.name}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{suggestion.asset.name}</span>
                        <Badge variant="secondary">100%</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyAutoAssignment(suggestion)}
                      >
                        Appliquer
                      </Button>
                    </div>
                  ))}
                  {autoAssignments.length > 3 && (
                    <div className="text-sm text-blue-600 text-center">
                      +{autoAssignments.length - 3} autres actifs
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button onClick={applyAllAutoAssignments} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Appliquer tout ({autoAssignments.length})</span>
                  </Button>
                  <Button variant="outline" onClick={dismissAutoAssignments}>
                    Je préfère configurer manuellement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      {allAssets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Network className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Relations définies</div>
                  <div className="text-lg font-semibold">{summary.totalRelations}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Entités propriétaires</div>
                  <div className="text-lg font-semibold">{summary.entitiesWithAssets}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className={`w-5 h-5 ${summary.unassignedAssets > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                <div>
                  <div className="text-sm font-medium text-gray-600">Actifs non affectés</div>
                  <div className="text-lg font-semibold">{summary.unassignedAssets}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ownership Relations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5" />
              <span>Relations de propriété ({ownership.length})</span>
              {ownership.length > 0 && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2"
              disabled={showForm}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une relation</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {ownership.length === 0 && !showForm && autoAssignments.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Network className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucune relation de propriété définie
                </h3>
                <p className="text-gray-600 mb-4">
                  Définissez qui possède vos différents actifs pour une gestion patrimoniale optimale
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Définir la première relation</span>
                </Button>
              </motion.div>
            )}

            {ownership.map((relation) => {
              const ownerEntity = entities.find(e => e.id === relation.ownerEntityId)
              const ownedAsset = relation.ownedAssetId ? allAssets.find(a => a.id === relation.ownedAssetId) : null
              const ownedEntity = relation.ownedEntityId ? entities.find(e => e.id === relation.ownedEntityId) : null
              const IconComponent = ownedAsset ? getAssetIcon(relation.ownedAssetId!) : Building
              
              return (
                <motion.div
                  key={relation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 mb-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Owner */}
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{ownerEntity?.name}</div>
                          <div className="text-xs text-gray-500">Propriétaire</div>
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-gray-400" />

                      {/* Owned */}
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <IconComponent className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {ownedAsset ? ownedAsset.name : ownedEntity?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ownedAsset ? ownedAsset.category : 'Entité'}
                          </div>
                        </div>
                      </div>

                      {/* Percentage */}
                      <div className="flex items-center space-x-2">
                        <Percent className="w-4 h-4 text-purple-600" />
                        <Badge variant="secondary" className="font-semibold">
                          {relation.percentage}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(relation)}
                        className="flex items-center space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(relation.id)}
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
                  <span>{editingId ? 'Modifier la relation' : 'Ajouter une relation de propriété'}</span>
                </CardTitle>
                <CardDescription>
                  Définissez qui possède cet actif ou cette entité et dans quelle proportion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Owner Entity */}
                    <div>
                      <Label htmlFor="ownerEntityId">Propriétaire *</Label>
                      <Select
                        value={formData.ownerEntityId}
                        onValueChange={(value) => updateFormField('ownerEntityId', value)}
                      >
                        <SelectTrigger className={errors.ownerEntityId ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez le propriétaire" />
                        </SelectTrigger>
                        <SelectContent>
                          {entities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{entity.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.ownerEntityId && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.ownerEntityId}</span>
                        </div>
                      )}
                    </div>

                    {/* Percentage */}
                    <div>
                      <Label htmlFor="percentage">Pourcentage de détention *</Label>
                      <Input
                        id="percentage"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.percentage}
                        onChange={(e) => updateFormField('percentage', parseFloat(e.target.value) || 0)}
                        placeholder="100"
                        className={errors.percentage ? 'border-red-500' : ''}
                      />
                      {errors.percentage && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.percentage}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owned Asset */}
                  <div>
                    <Label htmlFor="ownedAssetId">Actif possédé</Label>
                    <Select
                      value={formData.ownedAssetId}
                      onValueChange={(value) => updateFormField('ownedAssetId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un actif" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucun actif</SelectItem>
                        {allAssets.map((asset) => {
                          const IconComponent = getAssetIcon(asset.id)
                          return (
                            <SelectItem key={asset.id} value={asset.id}>
                              <div className="flex items-center space-x-2">
                                <IconComponent className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{asset.name}</div>
                                  <div className="text-xs text-gray-500">{asset.category}</div>
                                </div>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Owned Entity */}
                  <div>
                    <Label htmlFor="ownedEntityId">Entité possédée</Label>
                    <Select
                      value={formData.ownedEntityId}
                      onValueChange={(value) => updateFormField('ownedEntityId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une entité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucune entité</SelectItem>
                        {entities.filter(e => e.id !== formData.ownerEntityId).map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4" />
                              <span>{entity.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {errors.owned && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.owned}</span>
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

      {/* Warning for unassigned assets */}
      {summary.unassignedAssets > 0 && autoAssignments.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-orange-700">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">
                {summary.unassignedAssets} actif(s) ne sont pas encore affectés à une entité. 
                Cela peut impacter vos optimisations fiscales.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
