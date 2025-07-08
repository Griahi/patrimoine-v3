"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { RealEstateMetadata } from "@/types/assets"

interface RealEstateFormFieldsProps {
  metadata: Partial<RealEstateMetadata>
  onMetadataChange: (metadata: Partial<RealEstateMetadata>) => void
  errors: Record<string, string>
}

const propertyTypes = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'house', label: 'Maison' },
  { value: 'land', label: 'Terrain' },
  { value: 'commercial', label: 'Local commercial' }
]

const countries = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'ES', label: 'Espagne' },
  { value: 'IT', label: 'Italie' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'OTHER', label: 'Autre' }
]

export function RealEstateFormFields({ metadata, onMetadataChange, errors }: RealEstateFormFieldsProps) {
  const updateField = (field: keyof RealEstateMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  const updateAddressField = (field: keyof RealEstateMetadata['address'], value: string) => {
    onMetadataChange({
      ...metadata,
      address: {
        ...metadata.address,
        [field]: value
      }
    })
  }

  // Calculate investment metrics
  const totalInvestment = (metadata.purchasePrice || 0) + (metadata.notaryFees || 0) + (metadata.renovationCosts || 0)
  const annualRent = (metadata.monthlyRent || 0) * 12
  const grossYield = totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0
  const netYield = totalInvestment > 0 ? ((annualRent - (metadata.annualPropertyTax || 0)) / totalInvestment) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Immobilier</CardTitle>
        <CardDescription>
          Détails spécifiques pour ce bien immobilier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Type */}
        <div>
          <Label htmlFor="property-type">Type de bien *</Label>
          <Select
            value={metadata.propertyType || ''}
            onValueChange={(value) => updateField('propertyType', value as RealEstateMetadata['propertyType'])}
          >
            <SelectTrigger className={errors['metadata.propertyType'] ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionnez le type de bien" />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors['metadata.propertyType'] && (
            <p className="text-sm text-red-500 mt-1">{errors['metadata.propertyType']}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <Label className="text-base font-medium">Adresse complète</Label>
          <div className="space-y-3 mt-2">
            <div>
              <Label htmlFor="address-street">Adresse *</Label>
              <Input
                id="address-street"
                value={metadata.address?.street || ''}
                onChange={(e) => updateAddressField('street', e.target.value)}
                placeholder="Ex: 123 Rue de la Paix"
                className={errors['metadata.address.street'] ? 'border-red-500' : ''}
              />
              {errors['metadata.address.street'] && (
                <p className="text-sm text-red-500 mt-1">{errors['metadata.address.street']}</p>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="address-postal-code">Code postal *</Label>
                <Input
                  id="address-postal-code"
                  value={metadata.address?.postalCode || ''}
                  onChange={(e) => updateAddressField('postalCode', e.target.value)}
                  placeholder="Ex: 75001"
                  className={errors['metadata.address.postalCode'] ? 'border-red-500' : ''}
                />
                {errors['metadata.address.postalCode'] && (
                  <p className="text-sm text-red-500 mt-1">{errors['metadata.address.postalCode']}</p>
                )}
              </div>
              <div>
                <Label htmlFor="address-city">Ville *</Label>
                <Input
                  id="address-city"
                  value={metadata.address?.city || ''}
                  onChange={(e) => updateAddressField('city', e.target.value)}
                  placeholder="Ex: Paris"
                  className={errors['metadata.address.city'] ? 'border-red-500' : ''}
                />
                {errors['metadata.address.city'] && (
                  <p className="text-sm text-red-500 mt-1">{errors['metadata.address.city']}</p>
                )}
              </div>
              <div>
                <Label htmlFor="address-country">Pays</Label>
                <Select
                  value={metadata.address?.country || 'FR'}
                  onValueChange={(value) => updateAddressField('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Characteristics */}
        <div>
          <Label className="text-base font-medium">Caractéristiques physiques</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="surface">Surface (m²) *</Label>
              <Input
                id="surface"
                type="number"
                min="0"
                step="0.1"
                value={metadata.surface || ''}
                onChange={(e) => updateField('surface', parseFloat(e.target.value) || 0)}
                placeholder="Surface en m²"
                className={errors['metadata.surface'] ? 'border-red-500' : ''}
              />
              {errors['metadata.surface'] && (
                <p className="text-sm text-red-500 mt-1">{errors['metadata.surface']}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rooms">Nombre de pièces</Label>
              <Input
                id="rooms"
                type="number"
                min="0"
                step="1"
                value={metadata.rooms || ''}
                onChange={(e) => updateField('rooms', parseInt(e.target.value) || 0)}
                placeholder="Nombre de pièces"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div>
          <Label className="text-base font-medium">Informations financières</Label>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase-price">Prix d'acquisition (€) *</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={metadata.purchasePrice || ''}
                  onChange={(e) => updateField('purchasePrice', parseFloat(e.target.value) || 0)}
                  placeholder="Prix d'achat"
                  className={errors['metadata.purchasePrice'] ? 'border-red-500' : ''}
                />
                {errors['metadata.purchasePrice'] && (
                  <p className="text-sm text-red-500 mt-1">{errors['metadata.purchasePrice']}</p>
                )}
              </div>
              <div>
                <Label htmlFor="notary-fees">Frais de notaire (€)</Label>
                <Input
                  id="notary-fees"
                  type="number"
                  min="0"
                  step="0.01"
                  value={metadata.notaryFees || ''}
                  onChange={(e) => updateField('notaryFees', parseFloat(e.target.value) || 0)}
                  placeholder="Frais de notaire"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="renovation-costs">Travaux réalisés (€)</Label>
                <Input
                  id="renovation-costs"
                  type="number"
                  min="0"
                  step="0.01"
                  value={metadata.renovationCosts || ''}
                  onChange={(e) => updateField('renovationCosts', parseFloat(e.target.value) || 0)}
                  placeholder="Coût des travaux"
                />
              </div>
              <div>
                <Label htmlFor="annual-property-tax">Taxe foncière annuelle (€)</Label>
                <Input
                  id="annual-property-tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={metadata.annualPropertyTax || ''}
                  onChange={(e) => updateField('annualPropertyTax', parseFloat(e.target.value) || 0)}
                  placeholder="Taxe foncière"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rental Information */}
        <div>
          <Label htmlFor="monthly-rent">Valeur locative mensuelle (€)</Label>
          <Input
            id="monthly-rent"
            type="number"
            min="0"
            step="0.01"
            value={metadata.monthlyRent || ''}
            onChange={(e) => updateField('monthlyRent', parseFloat(e.target.value) || 0)}
            placeholder="Loyer mensuel ou estimation"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Loyer perçu ou estimation de la valeur locative
          </p>
        </div>

        {/* Investment Summary */}
        {totalInvestment > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-sm mb-3">Résumé d'Investissement</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Investissement total:</span>
                <div className="font-medium">
                  {totalInvestment.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  Prix + frais + travaux
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Loyers annuels:</span>
                <div className="font-medium">
                  {annualRent.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metadata.monthlyRent ? 'Basé sur le loyer mensuel' : 'Estimation nécessaire'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Rendement brut:</span>
                <div className={`font-medium ${grossYield >= 3 ? 'text-green-600' : grossYield >= 2 ? 'text-orange-600' : 'text-red-600'}`}>
                  {grossYield.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Loyers / Investissement
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Rendement net:</span>
                <div className={`font-medium ${netYield >= 2.5 ? 'text-green-600' : netYield >= 1.5 ? 'text-orange-600' : 'text-red-600'}`}>
                  {netYield.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Après taxe foncière
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 