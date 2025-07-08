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
  Users, Building, Plus, Edit2, Trash2, Save, X, 
  User, Mail, FileText, AlertCircle, CheckCircle 
} from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboarding-store'

interface EntityFormData {
  name: string
  type: 'PHYSICAL_PERSON' | 'LEGAL_ENTITY'
  taxId?: string
  address?: string
  email?: string
  notes?: string
}

export default function EntitiesStep() {
  const { data, addToStepArray, removeFromStepArray, updateArrayItem } = useOnboardingStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<EntityFormData>({
    name: '',
    type: 'PHYSICAL_PERSON',
    taxId: '',
    address: '',
    email: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const entities = data.entities || []

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'PHYSICAL_PERSON',
      taxId: '',
      address: '',
      email: '',
      notes: '',
    })
    setErrors({})
    setEditingId(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (editingId) {
      // Update existing entity
      updateArrayItem('entities', editingId, { ...formData })
    } else {
      // Add new entity
      addToStepArray('entities', { ...formData })
    }

    resetForm()
    setShowForm(false)
  }

  const handleEdit = (entity: any) => {
    setFormData({
      name: entity.name,
      type: entity.type,
      taxId: entity.taxId || '',
      address: entity.address || '',
      email: entity.email || '',
      notes: entity.notes || '',
    })
    setEditingId(entity.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    removeFromStepArray('entities', id)
  }

  const handleCancel = () => {
    resetForm()
    setShowForm(false)
  }

  const updateFormField = (field: keyof EntityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
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
          <Users className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Vos Entités</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Ajoutez les personnes physiques et morales qui composent votre patrimoine. 
          Cela peut inclure vous-même, votre conjoint, vos enfants, ainsi que vos sociétés et holdings.
        </p>
      </div>

      {/* Current Entities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Entités déclarées ({entities.length})</span>
              {entities.length > 0 && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2"
              disabled={showForm}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une entité</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Au moins une entité est requise pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {entities.length === 0 && !showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucune entité déclarée
                </h3>
                <p className="text-gray-600 mb-4">
                  Commencez par ajouter au moins une entité pour structurer votre patrimoine
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter votre première entité</span>
                </Button>
              </motion.div>
            )}

            {entities.map((entity) => (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border rounded-lg p-4 mb-4 bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      {entity.type === 'PHYSICAL_PERSON' ? (
                        <User className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Building className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{entity.name}</h4>
                        <Badge variant={entity.type === 'PHYSICAL_PERSON' ? 'default' : 'secondary'}>
                          {entity.type === 'PHYSICAL_PERSON' ? 'Personne physique' : 'Entité juridique'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {entity.taxId && (
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>ID fiscal: {entity.taxId}</span>
                          </div>
                        )}
                        {entity.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span>{entity.email}</span>
                          </div>
                        )}
                        {entity.address && (
                          <div className="flex items-center space-x-2">
                            <span>{entity.address}</span>
                          </div>
                        )}
                        {entity.notes && (
                          <div className="text-gray-500 italic">
                            {entity.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(entity)}
                      className="flex items-center space-x-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Modifier</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(entity.id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
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
                  <span>{editingId ? 'Modifier l\'entité' : 'Ajouter une entité'}</span>
                </CardTitle>
                <CardDescription>
                  Remplissez les informations de l'entité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <Label htmlFor="name">Nom *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormField('name', e.target.value)}
                        placeholder="Nom de l'entité"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Type */}
                    <div>
                      <Label htmlFor="type">Type d'entité *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => updateFormField('type', value as 'PHYSICAL_PERSON' | 'LEGAL_ENTITY')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PHYSICAL_PERSON">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>Personne physique</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="LEGAL_ENTITY">
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4" />
                              <span>Entité juridique</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tax ID */}
                    <div>
                      <Label htmlFor="taxId">
                        {formData.type === 'PHYSICAL_PERSON' ? 'Numéro fiscal' : 'SIRET/SIREN'}
                      </Label>
                      <Input
                        id="taxId"
                        value={formData.taxId}
                        onChange={(e) => updateFormField('taxId', e.target.value)}
                        placeholder={formData.type === 'PHYSICAL_PERSON' ? 'Ex: 1234567890123' : 'Ex: 12345678901234'}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormField('email', e.target.value)}
                        placeholder="email@exemple.com"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormField('address', e.target.value)}
                      placeholder="123 rue de la Paix, 75001 Paris"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => updateFormField('notes', e.target.value)}
                      placeholder="Informations complémentaires..."
                    />
                  </div>

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

      {/* Validation Summary */}
      {entities.length === 0 && !showForm && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">
                Au moins une entité est requise pour continuer à l'étape suivante
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
} 