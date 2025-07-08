"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { ValuableObjectMetadata } from "@/types/assets"

interface ValuableObjectFormFieldsProps {
  metadata: Partial<ValuableObjectMetadata>
  onMetadataChange: (metadata: Partial<ValuableObjectMetadata>) => void
  errors: Record<string, string>
}

const categories = [
  { value: 'art', label: 'Art' },
  { value: 'jewelry', label: 'Bijoux' },
  { value: 'watches', label: 'Montres' },
  { value: 'collection', label: 'Collection' }
]

const conditions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'very_good', label: 'Très bon' },
  { value: 'good', label: 'Bon' },
  { value: 'fair', label: 'Correct' },
  { value: 'poor', label: 'Mauvais' }
]

export function ValuableObjectFormFields({ metadata, onMetadataChange, errors }: ValuableObjectFormFieldsProps) {
  const updateField = (field: keyof ValuableObjectMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Objets de Valeur</CardTitle>
        <CardDescription>
          Détails spécifiques pour cet objet de valeur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category */}
        <div>
          <Label htmlFor="category">Catégorie *</Label>
          <Select
            value={metadata.category || ''}
            onValueChange={(value) => updateField('category', value)}
          >
            <SelectTrigger className={errors['metadata.category'] ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors['metadata.category'] && (
            <p className="text-sm text-red-500 mt-1">{errors['metadata.category']}</p>
          )}
        </div>

        {/* Brand and Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brand">Marque</Label>
            <Input
              id="brand"
              value={metadata.brand || ''}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder="Ex: Rolex, Cartier, Picasso"
            />
          </div>
          <div>
            <Label htmlFor="model">Modèle</Label>
            <Input
              id="model"
              value={metadata.model || ''}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder="Ex: Submariner, Tank, Les Demoiselles"
            />
          </div>
        </div>

        {/* Year and Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="year">Année</Label>
            <Input
              id="year"
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={metadata.year || ''}
              onChange={(e) => updateField('year', parseInt(e.target.value) || 0)}
              placeholder="Année de fabrication"
            />
          </div>
          <div>
            <Label htmlFor="condition">État</Label>
            <Select
              value={metadata.condition || ''}
              onValueChange={(value) => updateField('condition', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez l'état" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Certificates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="authenticity-cert">Certificat d'authenticité</Label>
            <Select
              value={metadata.hasAuthenticityCertificate?.toString() || ''}
              onValueChange={(value) => updateField('hasAuthenticityCertificate', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="specific-insurance">Assurance spécifique</Label>
            <Select
              value={metadata.hasSpecificInsurance?.toString() || ''}
              onValueChange={(value) => updateField('hasSpecificInsurance', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Insurance Value */}
        {metadata.hasSpecificInsurance && (
          <div>
            <Label htmlFor="insurance-value">Valeur d'assurance (€)</Label>
            <Input
              id="insurance-value"
              type="number"
              min="0"
              step="0.01"
              value={metadata.insuranceValue || ''}
              onChange={(e) => updateField('insuranceValue', parseFloat(e.target.value) || 0)}
              placeholder="Valeur déclarée pour l'assurance"
            />
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-sm mb-3">Résumé</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Catégorie:</span>
              <div className="font-medium">
                {categories.find(c => c.value === metadata.category)?.label || 'Non spécifiée'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">État:</span>
              <div className="font-medium">
                {conditions.find(c => c.value === metadata.condition)?.label || 'Non spécifié'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Certificat d'authenticité:</span>
              <div className="font-medium">
                {metadata.hasAuthenticityCertificate ? 'Oui' : 'Non'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Assurance spécifique:</span>
              <div className="font-medium">
                {metadata.hasSpecificInsurance ? 'Oui' : 'Non'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 