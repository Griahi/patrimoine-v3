"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { Plus, Trash2, Users, CreditCard, Calculator } from "lucide-react"
import { BaseAssetFormData, ASSET_TYPE_CODES, AssetTypeCode, FinancingFormData, InterEntityLoanMetadata } from "@/types/assets"
import { StockFormFields } from "./asset-types/StockFormFields"
import { LifeInsuranceFormFields } from "./asset-types/LifeInsuranceFormFields"
import { BankAccountFormFields } from "./asset-types/BankAccountFormFields"
import { CryptocurrencyFormFields } from "./asset-types/CryptocurrencyFormFields"
import { InvestmentFundFormFields } from "./asset-types/InvestmentFundFormFields"
import { RealEstateFormFields } from "./asset-types/RealEstateFormFields"
import { PreciousMetalFormFields } from "./asset-types/PreciousMetalFormFields"
import { ValuableObjectFormFields } from "./asset-types/ValuableObjectFormFields"
import { VehicleFormFields } from "./asset-types/VehicleFormFields"
import { InterEntityLoanFormFields } from "./asset-types/InterEntityLoanFormFields"
import { OtherFormFields } from "./asset-types/OtherFormFields"

interface AssetType {
  id: string
  name: string
  code: string
  description: string
  color: string | null
}

interface Entity {
  id: string
  name: string
  type: string
}

interface DynamicAssetFormProps {
  assetTypes: AssetType[]
  entities: Entity[]
  onSubmit: (formData: BaseAssetFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  initialData?: Partial<BaseAssetFormData>
  mode?: 'create' | 'edit'
  editingAssetId?: string
}

export function DynamicAssetForm({
  assetTypes,
  entities,
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData,
  mode = 'create',
  editingAssetId
}: DynamicAssetFormProps) {
  const [formData, setFormData] = useState<BaseAssetFormData>({
    name: '',
    description: '',
    assetTypeId: '',
    owners: [{ entityId: '', percentage: 100 }],
    initialValue: 0,
    valuationDate: new Date().toISOString().split('T')[0],
    metadata: {},
    hasFinancing: false,
    financing: {
      name: '',
      debtType: 'MORTGAGE',
      initialAmount: 0,
      interestRate: 0,
      duration: 240, // 20 years in months
      amortizationType: 'PROGRESSIVE',
      startDate: new Date().toISOString().split('T')[0],
      lender: '',
      notes: ''
    },
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedAssetType = assetTypes.find(type => type.id === formData.assetTypeId)

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Update metadata
  const updateMetadata = (metadata: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...metadata }
    }))
  }

  // Update financing data
  const updateFinancing = (field: keyof FinancingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      financing: {
        ...prev.financing!,
        [field]: value
      }
    }))
    // Clear financing errors when field is updated
    if (errors[`financing.${field}`]) {
      setErrors(prev => ({ ...prev, [`financing.${field}`]: '' }))
    }
  }

  // Toggle financing
  const toggleFinancing = (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      hasFinancing: enabled
    }))
    // Clear financing errors when disabling
    if (!enabled) {
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('financing.')) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  // Calculate monthly payment for financing
  const calculateMonthlyPayment = () => {
    if (!formData.financing || !formData.hasFinancing) return 0
    
    const { initialAmount, interestRate, duration, amortizationType } = formData.financing
    
    if (!initialAmount || !interestRate || !duration) return 0
    
    const principal = initialAmount
    const monthlyRate = interestRate / 100 / 12
    const totalMonths = duration
    
    switch (amortizationType) {
      case 'PROGRESSIVE':
        if (monthlyRate === 0) return principal / totalMonths
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
      case 'LINEAR':
        return (principal / totalMonths) + (principal * monthlyRate)
      case 'IN_FINE':
        return principal * monthlyRate
      case 'BULLET':
        return 0
      default:
        return 0
    }
  }

  // Owner management
  const addOwner = () => {
    setFormData(prev => ({
      ...prev,
      owners: [...prev.owners, { entityId: '', percentage: 0 }]
    }))
  }

  const removeOwner = (index: number) => {
    if (formData.owners.length > 1) {
      setFormData(prev => ({
        ...prev,
        owners: prev.owners.filter((_, i) => i !== index)
      }))
    }
  }

  const updateOwner = (index: number, field: 'entityId' | 'percentage', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      owners: prev.owners.map((owner, i) => 
        i === index ? { ...owner, [field]: value } : owner
      )
    }))
  }

  const getTotalPercentage = () => {
    return formData.owners.reduce((sum, owner) => sum + (owner.percentage || 0), 0)
  }

  // Set equal distribution
  const setEqualDistribution = () => {
    const equalShare = Math.round((100 / formData.owners.length) * 100) / 100
    const updatedOwners = formData.owners.map((owner, index) => ({
      ...owner,
      percentage: index === formData.owners.length - 1 
        ? 100 - (equalShare * (formData.owners.length - 1)) // Adjust last to reach 100%
        : equalShare
    }))
    setFormData(prev => ({ ...prev, owners: updatedOwners }))
  }

  // Validation
  const validate = (): boolean => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 VALIDATION DEBUG:')
      console.log('selectedAssetType:', selectedAssetType)
      console.log('selectedAssetType?.code:', selectedAssetType?.code)
      console.log('Is inter-entity loan?', selectedAssetType?.code === 'inter_entity_loan')
    }
    
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'actif est requis'
    }

    if (!formData.assetTypeId) {
      newErrors.assetTypeId = 'Veuillez sélectionner un type d\'actif'
    }

    // Special validation for inter-entity loans
    if (selectedAssetType?.code === 'inter_entity_loan') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 VALIDATION PRÊT INTER-ENTITÉ')
        console.log('metadata:', formData.metadata)
      }
      const metadata = formData.metadata as Partial<InterEntityLoanMetadata>
      
      if (!metadata.lenderEntityId) {
        newErrors.lenderEntityId = 'L\'entité prêteuse est requise'
      }
      
      if (!metadata.borrowerEntityId) {
        newErrors.borrowerEntityId = 'L\'entité emprunteuse est requise'
      }
      
      if (metadata.lenderEntityId === metadata.borrowerEntityId) {
        newErrors.borrowerEntityId = 'Le prêteur et l\'emprunteur ne peuvent pas être la même entité'
      }
      
      if (!metadata.loanPurpose?.trim()) {
        newErrors.loanPurpose = 'L\'objet du prêt est requis'
      }
      
      if (!metadata.contractDate) {
        newErrors.contractDate = 'La date du contrat est requise'
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 VALIDATION ACTIF CLASSIQUE')
        console.log('owners:', formData.owners)
      }
      
      // Regular asset validation
      if (formData.owners.some(owner => !owner.entityId)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ ERREUR: Propriétaires manquants')
        }
        newErrors.owners = 'Veuillez sélectionner tous les propriétaires'
      }

      const totalPercentage = getTotalPercentage()
      if (Math.abs(totalPercentage - 100) > 0.01) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ ERREUR: Pourcentages incorrects')
        }
        newErrors.percentage = 'La somme des pourcentages doit être égale à 100%'
      }
    }

    if (formData.initialValue <= 0) {
      newErrors.initialValue = 'La valeur initiale doit être supérieure à 0'
    }

    // Financing validation
    if (formData.hasFinancing && formData.financing) {
      if (!formData.financing.name.trim()) {
        newErrors['financing.name'] = 'Le nom du financement est requis'
      }
      
      if (formData.financing.initialAmount <= 0) {
        newErrors['financing.initialAmount'] = 'Le montant du financement doit être supérieur à 0'
      }
      
      if (formData.financing.interestRate < 0) {
        newErrors['financing.interestRate'] = 'Le taux d\'intérêt ne peut pas être négatif'
      }
      
      if (formData.financing.duration <= 0) {
        newErrors['financing.duration'] = 'La durée doit être supérieure à 0'
      }
      
      // Check if financing amount doesn't exceed asset value
      if (formData.financing.initialAmount > formData.initialValue) {
        newErrors['financing.initialAmount'] = 'Le financement ne peut pas dépasser la valeur de l\'actif'
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📝 ERREURS TROUVÉES:', newErrors)
      console.log('✅ VALIDATION RÉUSSIE?', Object.keys(newErrors).length === 0)
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (validate()) {
      // Use special API for inter-entity loans
      if (selectedAssetType?.code === 'inter_entity_loan') {
        await handleInterEntityLoanSubmit()
      } else {
        await onSubmit(formData)
      }
    }
  }

  const handleInterEntityLoanSubmit = async () => {
    try {
      const response = await fetch('/api/assets/inter-entity-loan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          initialValue: formData.initialValue,
          valuationDate: formData.valuationDate,
          metadata: formData.metadata,
          financing: formData.financing
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du prêt inter-entité')
      }

      // Call parent to handle success (parent will detect it's an inter-entity loan)
      await onSubmit(formData)
      
    } catch (error) {
      console.error('Error creating inter-entity loan:', error)
      throw error
    }
  }

  // Render specific form fields based on asset type
  const renderSpecificFields = () => {
    if (!selectedAssetType) return null

    const props = {
      metadata: formData.metadata,
      onMetadataChange: updateMetadata,
      errors
    }

    switch (selectedAssetType.code as AssetTypeCode) {
      case ASSET_TYPE_CODES.STOCKS:
        return <StockFormFields {...props} />
      case ASSET_TYPE_CODES.LIFE_INSURANCE:
        return <LifeInsuranceFormFields {...props} />
      case ASSET_TYPE_CODES.BANK_ACCOUNTS:
        return <BankAccountFormFields {...props} />
      case ASSET_TYPE_CODES.CRYPTO:
        return <CryptocurrencyFormFields {...props} />
      case ASSET_TYPE_CODES.INVESTMENT_FUNDS:
        return <InvestmentFundFormFields {...props} />
      case ASSET_TYPE_CODES.REAL_ESTATE:
        return <RealEstateFormFields {...props} />
      case ASSET_TYPE_CODES.PRECIOUS_METALS:
        return <PreciousMetalFormFields {...props} />
      case ASSET_TYPE_CODES.VALUABLE_OBJECTS:
        return <ValuableObjectFormFields {...props} />
      case ASSET_TYPE_CODES.VEHICLES:
        return <VehicleFormFields {...props} />
      case ASSET_TYPE_CODES.INTER_ENTITY_LOAN:
        return <InterEntityLoanFormFields {...props} entities={entities} />
      case ASSET_TYPE_CODES.OTHER:
        return <OtherFormFields {...props} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Asset Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Type d'Actif</CardTitle>
          <CardDescription>
            Sélectionnez la catégorie de votre actif
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assetTypes.length === 0 ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">⚠️ Aucun type d'actif chargé!</p>
              <p className="text-red-600 text-sm mt-1">
                Vérifiez que l'API /api/asset-types fonctionne correctement.
              </p>
            </div>
          ) : (
            <Select 
              value={formData.assetTypeId} 
              onValueChange={(value) => {
                console.log('🔄 Asset type selection changed:', value)
                updateFormData('assetTypeId', value)
                // Reset metadata when changing asset type
                updateMetadata({})
              }}
            >
              <SelectTrigger className={errors.assetTypeId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Choisissez un type d'actif" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color || '#6B7280' }}
                      />
                      <span>{type.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.assetTypeId && (
            <p className="text-sm text-red-500 mt-1">{errors.assetTypeId}</p>
          )}
          {selectedAssetType && (
            <div>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedAssetType.description}
              </p>
              {/* Debug info */}
              <p className="text-xs text-blue-600 mt-1">
                Debug: Type sélectionné = "{selectedAssetType.name}" (code: {selectedAssetType.code})
                {selectedAssetType.code === 'inter_entity_loan' ? ' ✅ PRÊT INTER-ENTITÉ DÉTECTÉ' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="asset-name">Nom de l'actif *</Label>
            <Input
              id="asset-name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Ex: Appartement Paris 15ème"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="asset-description">Description</Label>
            <Input
              id="asset-description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Ex: T3 de 65m² avec balcon"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initial-value">Valeur initiale (€) *</Label>
              <Input
                id="initial-value"
                type="number"
                step="0.01"
                min="0"
                value={formData.initialValue}
                onChange={(e) => updateFormData('initialValue', parseFloat(e.target.value) || 0)}
                className={errors.initialValue ? 'border-red-500' : ''}
              />
              {errors.initialValue && (
                <p className="text-sm text-red-500 mt-1">{errors.initialValue}</p>
              )}
            </div>
            <div>
              <Label htmlFor="valuation-date">Date de valorisation *</Label>
              <Input
                id="valuation-date"
                type="date"
                value={formData.valuationDate}
                onChange={(e) => updateFormData('valuationDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specific Fields */}
      {renderSpecificFields()}

      {/* Financing Section */}
      {selectedAssetType?.code !== 'inter_entity_loan' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Financement (Optionnel)
                </CardTitle>
                <CardDescription>
                  Associez un financement à cet actif si il a été acheté avec un prêt
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {formData.hasFinancing ? 'Activé' : 'Désactivé'}
                </span>
                <Button
                  type="button"
                  variant={formData.hasFinancing ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFinancing(!formData.hasFinancing)}
                >
                  {formData.hasFinancing ? 'Désactiver' : 'Activer le financement'}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {formData.hasFinancing && (
            <CardContent className="space-y-6">
              {/* Basic Financing Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="financing-name">Nom du financement *</Label>
                  <Input
                    id="financing-name"
                    value={formData.financing?.name || ''}
                    onChange={(e) => updateFinancing('name', e.target.value)}
                    placeholder={`Financement ${formData.name || 'actif'}`}
                    className={errors['financing.name'] ? 'border-red-500' : ''}
                  />
                  {errors['financing.name'] && (
                    <p className="text-sm text-red-500 mt-1">{errors['financing.name']}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="financing-type">Type de financement</Label>
                  <Select
                    value={formData.financing?.debtType || 'MORTGAGE'}
                    onValueChange={(value: any) => updateFinancing('debtType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORTGAGE">Prêt immobilier</SelectItem>
                      <SelectItem value="LOAN">Prêt personnel</SelectItem>
                      <SelectItem value="CREDIT_LINE">Ligne de crédit</SelectItem>
                      <SelectItem value="BOND">Obligation</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="financing-amount">Montant financé (€) *</Label>
                  <Input
                    id="financing-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.initialValue}
                    value={formData.financing?.initialAmount || 0}
                    onChange={(e) => updateFinancing('initialAmount', parseFloat(e.target.value) || 0)}
                    className={errors['financing.initialAmount'] ? 'border-red-500' : ''}
                  />
                  {errors['financing.initialAmount'] && (
                    <p className="text-sm text-red-500 mt-1">{errors['financing.initialAmount']}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: {formData.initialValue.toLocaleString()} €
                  </p>
                </div>

                <div>
                  <Label htmlFor="financing-rate">Taux d'intérêt (%) *</Label>
                  <Input
                    id="financing-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.financing?.interestRate || 0}
                    onChange={(e) => updateFinancing('interestRate', parseFloat(e.target.value) || 0)}
                    className={errors['financing.interestRate'] ? 'border-red-500' : ''}
                  />
                  {errors['financing.interestRate'] && (
                    <p className="text-sm text-red-500 mt-1">{errors['financing.interestRate']}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="financing-duration">Durée (mois) *</Label>
                  <Input
                    id="financing-duration"
                    type="number"
                    min="1"
                    value={formData.financing?.duration || 240}
                    onChange={(e) => updateFinancing('duration', parseInt(e.target.value) || 240)}
                    className={errors['financing.duration'] ? 'border-red-500' : ''}
                  />
                  {errors['financing.duration'] && (
                    <p className="text-sm text-red-500 mt-1">{errors['financing.duration']}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {((formData.financing?.duration || 240) / 12).toFixed(1)} années
                  </p>
                </div>
              </div>

              {/* Amortization and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="financing-amortization">Type d'amortissement</Label>
                  <Select
                    value={formData.financing?.amortizationType || 'PROGRESSIVE'}
                    onValueChange={(value: any) => updateFinancing('amortizationType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROGRESSIVE">Progressif (mensualités constantes)</SelectItem>
                      <SelectItem value="LINEAR">Linéaire (capital constant)</SelectItem>
                      <SelectItem value="IN_FINE">In fine (intérêts seuls)</SelectItem>
                      <SelectItem value="BULLET">Bullet (remboursement unique)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="financing-start-date">Date de début</Label>
                  <Input
                    id="financing-start-date"
                    type="date"
                    value={formData.financing?.startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => updateFinancing('startDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="financing-lender">Organisme prêteur</Label>
                  <Input
                    id="financing-lender"
                    value={formData.financing?.lender || ''}
                    onChange={(e) => updateFinancing('lender', e.target.value)}
                    placeholder="Ex: BNP Paribas"
                  />
                </div>

                <div>
                  <Label htmlFor="financing-notes">Notes</Label>
                  <Input
                    id="financing-notes"
                    value={formData.financing?.notes || ''}
                    onChange={(e) => updateFinancing('notes', e.target.value)}
                    placeholder="Informations complémentaires"
                  />
                </div>
              </div>

              {/* Monthly Payment Calculation */}
              {formData.financing?.initialAmount && formData.financing?.interestRate && formData.financing?.duration && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calculator className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Mensualité estimée</span>
                    </div>
                    <div className="text-lg font-bold text-blue-900">
                      {calculateMonthlyPayment().toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    Calcul basé sur un amortissement {formData.financing.amortizationType.toLowerCase()}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Debug pour la section propriétaires */}
      {selectedAssetType && (
        <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
          <strong>Debug Propriétaires:</strong> 
          {selectedAssetType.code === 'inter_entity_loan' ? 
            '🚫 SECTION PROPRIÉTAIRES CACHÉE POUR PRÊT INTER-ENTITÉ' : 
            '✅ SECTION PROPRIÉTAIRES VISIBLE'
          }
        </div>
      )}

      {/* Ownership (hidden for inter-entity loans) */}
      {selectedAssetType?.code !== 'inter_entity_loan' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Propriétaires & Parts</CardTitle>
                <CardDescription>
                  Définissez qui possède cet actif et dans quelles proportions
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addOwner}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un copropriétaire
              </Button>
            </div>
          </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Distribution Buttons */}
          {formData.owners.length > 1 && (
            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-800 mr-2">Répartitions rapides:</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={setEqualDistribution}
              >
                Parts égales ({(100 / formData.owners.length).toFixed(1)}% chacun)
              </Button>
            </div>
          )}

          {/* Owners List */}
          <div className="space-y-3">
            {formData.owners.map((owner, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {index === 0 ? 'Premier propriétaire' : `${index + 1}ème propriétaire`}
                  </span>
                </div>
                
                <div className="flex-1">
                  <Select
                    value={owner.entityId}
                    onValueChange={(value) => updateOwner(index, 'entityId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une personne/entité" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={owner.percentage}
                    onChange={(e) => updateOwner(index, 'percentage', parseFloat(e.target.value) || 0)}
                    placeholder="Part (%)"
                  />
                </div>

                {formData.owners.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOwner(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Total Percentage Display */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            Math.abs(getTotalPercentage() - 100) < 0.01 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <span className="text-sm font-medium">
              Total des parts: {getTotalPercentage().toFixed(1)}%
            </span>
            {Math.abs(getTotalPercentage() - 100) < 0.01 ? (
              <span className="text-green-600 text-sm">✓ Parfait!</span>
            ) : (
              <span className="text-red-600 text-sm">
                Il manque {(100 - getTotalPercentage()).toFixed(1)}% pour atteindre 100%
              </span>
            )}
          </div>

          {errors.owners && (
            <p className="text-sm text-red-500">{errors.owners}</p>
          )}
          {errors.percentage && (
            <p className="text-sm text-red-500">{errors.percentage}</p>
          )}
        </CardContent>
      </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={onCancel} className="min-w-[100px]">
          Annuler
        </Button>
        <Button 
          variant="default" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {isSubmitting 
            ? (mode === 'edit' ? 'Modification...' : 'Création...') 
            : (mode === 'edit' ? 'Sauvegarder les modifications' : 'Créer l\'actif')
          }
        </Button>
      </div>
    </div>
  )
} 