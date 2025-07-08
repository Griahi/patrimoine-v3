"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { LifeInsuranceMetadata } from "@/types/assets"

interface LifeInsuranceFormFieldsProps {
  metadata: Partial<LifeInsuranceMetadata>
  onMetadataChange: (metadata: Partial<LifeInsuranceMetadata>) => void
  errors: Record<string, string>
}

const insuranceTypes = [
  { value: 'savings', label: 'Épargne' },
  { value: 'provident', label: 'Prévoyance' }
]

export function LifeInsuranceFormFields({ metadata, onMetadataChange, errors }: LifeInsuranceFormFieldsProps) {
  const updateField = (field: keyof LifeInsuranceMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Assurance Vie</CardTitle>
        <CardDescription>
          Détails spécifiques pour ce contrat d'assurance vie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contract-number">Numéro de contrat *</Label>
            <Input
              id="contract-number"
              value={metadata.contractNumber || ''}
              onChange={(e) => updateField('contractNumber', e.target.value)}
              placeholder="Ex: 123456789"
              className={errors['metadata.contractNumber'] ? 'border-red-500' : ''}
            />
            {errors['metadata.contractNumber'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.contractNumber']}</p>
            )}
          </div>
          <div>
            <Label htmlFor="insurance-company">Compagnie d'assurance *</Label>
            <Input
              id="insurance-company"
              value={metadata.insuranceCompany || ''}
              onChange={(e) => updateField('insuranceCompany', e.target.value)}
              placeholder="Ex: AXA, Allianz, etc."
              className={errors['metadata.insuranceCompany'] ? 'border-red-500' : ''}
            />
            {errors['metadata.insuranceCompany'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.insuranceCompany']}</p>
            )}
          </div>
        </div>

        {/* Type and Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="insurance-type">Type d'assurance</Label>
            <Select
              value={metadata.type || ''}
              onValueChange={(value) => updateField('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {insuranceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="subscription-date">Date de souscription</Label>
            <Input
              id="subscription-date"
              type="date"
              value={metadata.subscriptionDate || ''}
              onChange={(e) => updateField('subscriptionDate', e.target.value)}
            />
          </div>
        </div>

        {/* Financial Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="premium-payments">Versements de primes (€)</Label>
            <Input
              id="premium-payments"
              type="number"
              min="0"
              step="0.01"
              value={metadata.premiumPayments || ''}
              onChange={(e) => updateField('premiumPayments', parseFloat(e.target.value) || 0)}
              placeholder="Montant total versé"
            />
          </div>
          <div>
            <Label htmlFor="surrender-value">Valeur de rachat (€)</Label>
            <Input
              id="surrender-value"
              type="number"
              min="0"
              step="0.01"
              value={metadata.surrenderValue || ''}
              onChange={(e) => updateField('surrenderValue', parseFloat(e.target.value) || 0)}
              placeholder="Valeur de rachat actuelle"
            />
          </div>
        </div>

        {/* Beneficiaries */}
        <div>
          <Label htmlFor="beneficiaries">Bénéficiaires</Label>
          <Input
            id="beneficiaries"
            value={metadata.beneficiaries || ''}
            onChange={(e) => updateField('beneficiaries', e.target.value)}
            placeholder="Ex: Conjoint, enfants, etc."
          />
        </div>
      </CardContent>
    </Card>
  )
} 