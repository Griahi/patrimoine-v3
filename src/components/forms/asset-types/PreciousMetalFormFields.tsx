"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { PreciousMetalMetadata } from "@/types/assets"

interface PreciousMetalFormFieldsProps {
  metadata: Partial<PreciousMetalMetadata>
  onMetadataChange: (metadata: Partial<PreciousMetalMetadata>) => void
  errors: Record<string, string>
}

const metalTypes = [
  { value: 'gold', label: 'Or' },
  { value: 'silver', label: 'Argent' },
  { value: 'platinum', label: 'Platine' },
  { value: 'palladium', label: 'Palladium' }
]

const metalForms = [
  { value: 'ingot', label: 'Lingot' },
  { value: 'coin', label: 'Pièce' }
]

const weightUnits = [
  { value: 'grams', label: 'Grammes' },
  { value: 'ounces', label: 'Onces' }
]

export function PreciousMetalFormFields({ metadata, onMetadataChange, errors }: PreciousMetalFormFieldsProps) {
  const updateField = (field: keyof PreciousMetalMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  const totalValue = (metadata.weight || 0) * (metadata.pricePerUnit || 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Métaux Précieux</CardTitle>
        <CardDescription>
          Détails spécifiques pour ce métal précieux
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metal Type and Form */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="metal-type">Type de métal *</Label>
            <Select
              value={metadata.metalType || ''}
              onValueChange={(value) => updateField('metalType', value)}
            >
              <SelectTrigger className={errors['metadata.metalType'] ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez un métal" />
              </SelectTrigger>
              <SelectContent>
                {metalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors['metadata.metalType'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.metalType']}</p>
            )}
          </div>
          <div>
            <Label htmlFor="metal-form">Forme *</Label>
            <Select
              value={metadata.form || ''}
              onValueChange={(value) => updateField('form', value)}
            >
              <SelectTrigger className={errors['metadata.form'] ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez une forme" />
              </SelectTrigger>
              <SelectContent>
                {metalForms.map((form) => (
                  <SelectItem key={form.value} value={form.value}>
                    {form.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors['metadata.form'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.form']}</p>
            )}
          </div>
        </div>

        {/* Weight and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight">Poids *</Label>
            <Input
              id="weight"
              type="number"
              min="0"
              step="0.01"
              value={metadata.weight || ''}
              onChange={(e) => updateField('weight', parseFloat(e.target.value) || 0)}
              placeholder="Poids du métal"
              className={errors['metadata.weight'] ? 'border-red-500' : ''}
            />
            {errors['metadata.weight'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.weight']}</p>
            )}
          </div>
          <div>
            <Label htmlFor="weight-unit">Unité de poids</Label>
            <Select
              value={metadata.weightUnit || 'grams'}
              onValueChange={(value) => updateField('weightUnit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une unité" />
              </SelectTrigger>
              <SelectContent>
                {weightUnits.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Purity and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="purity">Pureté *</Label>
            <Input
              id="purity"
              type="number"
              min="0"
              max="1000"
              step="0.1"
              value={metadata.purity || ''}
              onChange={(e) => updateField('purity', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 999.9 (pour 24 carats)"
              className={errors['metadata.purity'] ? 'border-red-500' : ''}
            />
            {errors['metadata.purity'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.purity']}</p>
            )}
          </div>
          <div>
            <Label htmlFor="price-per-unit">Prix par unité (€)</Label>
            <Input
              id="price-per-unit"
              type="number"
              min="0"
              step="0.01"
              value={metadata.pricePerUnit || ''}
              onChange={(e) => updateField('pricePerUnit', parseFloat(e.target.value) || 0)}
              placeholder="Prix par gramme/once"
            />
          </div>
        </div>

        {/* Storage Location */}
        <div>
          <Label htmlFor="storage-location">Lieu de stockage</Label>
          <Input
            id="storage-location"
            value={metadata.storageLocation || ''}
            onChange={(e) => updateField('storageLocation', e.target.value)}
            placeholder="Ex: Coffre-fort, Banque, Domicile"
          />
        </div>

        {/* Value Summary */}
        {metadata.weight && metadata.pricePerUnit && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-sm mb-3">Résumé de Valeur</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Poids total:</span>
                <div className="font-medium">
                  {metadata.weight} {metadata.weightUnit === 'grams' ? 'g' : 'oz'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Valeur totale:</span>
                <div className="font-medium">
                  {totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 