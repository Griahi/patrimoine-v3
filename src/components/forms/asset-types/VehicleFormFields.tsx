"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { VehicleMetadata } from "@/types/assets"

interface VehicleFormFieldsProps {
  metadata: Partial<VehicleMetadata>
  onMetadataChange: (metadata: Partial<VehicleMetadata>) => void
  errors: Record<string, string>
}

const vehicleTypes = [
  { value: 'car', label: 'Voiture' },
  { value: 'motorcycle', label: 'Moto' },
  { value: 'boat', label: 'Bateau' },
  { value: 'other', label: 'Autre' }
]

const fuelTypes = [
  'Essence',
  'Diesel',
  'Électrique',
  'Hybride',
  'GPL',
  'GNV',
  'Autre'
]

export function VehicleFormFields({ metadata, onMetadataChange, errors }: VehicleFormFieldsProps) {
  const updateField = (field: keyof VehicleMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  const depreciation = (metadata.purchasePrice || 0) - (metadata.currentMarketValue || 0)
  const depreciationPercentage = metadata.purchasePrice ? (depreciation / metadata.purchasePrice) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Véhicule</CardTitle>
        <CardDescription>
          Détails spécifiques pour ce véhicule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="vehicle-type">Type de véhicule</Label>
          <Select
            value={metadata.vehicleType || ''}
            onValueChange={(value) => updateField('vehicleType', value as VehicleMetadata['vehicleType'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brand">Marque</Label>
            <Input
              id="brand"
              value={metadata.brand || ''}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder="Ex: BMW, Yamaha"
            />
          </div>
          <div>
            <Label htmlFor="model">Modèle</Label>
            <Input
              id="model"
              value={metadata.model || ''}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder="Ex: X3, R1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="registration">Immatriculation</Label>
            <Input
              id="registration"
              value={metadata.registrationNumber || ''}
              onChange={(e) => updateField('registrationNumber', e.target.value.toUpperCase())}
              placeholder="Ex: AB-123-CD"
            />
          </div>
          <div>
            <Label htmlFor="first-registration">Première mise en circulation</Label>
            <Input
              id="first-registration"
              type="date"
              value={metadata.firstRegistrationDate || ''}
              onChange={(e) => updateField('firstRegistrationDate', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mileage">Kilométrage</Label>
            <Input
              id="mileage"
              type="number"
              min="0"
              value={metadata.mileage || ''}
              onChange={(e) => updateField('mileage', parseInt(e.target.value) || 0)}
              placeholder="Kilomètres"
            />
          </div>
          <div>
            <Label htmlFor="fuel-type">Carburant</Label>
            <Select
              value={metadata.fuelType || ''}
              onValueChange={(value) => updateField('fuelType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de carburant" />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((fuel) => (
                  <SelectItem key={fuel} value={fuel}>
                    {fuel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="purchase-price">Prix d'achat (€)</Label>
            <Input
              id="purchase-price"
              type="number"
              min="0"
              step="0.01"
              value={metadata.purchasePrice || ''}
              onChange={(e) => updateField('purchasePrice', parseFloat(e.target.value) || 0)}
              placeholder="Prix d'acquisition"
            />
          </div>
          <div>
            <Label htmlFor="current-market-value">Valeur Argus actuelle (€)</Label>
            <Input
              id="current-market-value"
              type="number"
              min="0"
              step="0.01"
              value={metadata.currentMarketValue || ''}
              onChange={(e) => updateField('currentMarketValue', parseFloat(e.target.value) || 0)}
              placeholder="Estimation actuelle"
            />
          </div>
        </div>

        {/* Vehicle Summary */}
        {(metadata.purchasePrice || metadata.currentMarketValue) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-sm mb-3">Résumé du Véhicule</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Prix d'achat:</span>
                <div className="font-medium">
                  {(metadata.purchasePrice || 0).toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Valeur actuelle:</span>
                <div className="font-medium">
                  {(metadata.currentMarketValue || 0).toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Dépréciation:</span>
                <div className={`font-medium ${depreciation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {depreciation > 0 ? '-' : '+'}{Math.abs(depreciation).toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">% Dépréciation:</span>
                <div className={`font-medium ${depreciationPercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {depreciationPercentage > 0 ? '-' : '+'}{Math.abs(depreciationPercentage).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 