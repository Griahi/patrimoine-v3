"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { InvestmentFundMetadata } from "@/types/assets"

interface InvestmentFundFormFieldsProps {
  metadata: Partial<InvestmentFundMetadata>
  onMetadataChange: (metadata: Partial<InvestmentFundMetadata>) => void
  errors: Record<string, string>
}

const fundTypes = [
  { value: 'OPCVM', label: 'OPCVM' },
  { value: 'FCP', label: 'FCP' },
  { value: 'SICAV', label: 'SICAV' },
  { value: 'ETF', label: 'ETF' }
]

export function InvestmentFundFormFields({ metadata, onMetadataChange, errors }: InvestmentFundFormFieldsProps) {
  const updateField = (field: keyof InvestmentFundMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  const totalValue = (metadata.numberOfShares || 0) * (metadata.currentNavPrice || 0)
  const purchaseValue = (metadata.numberOfShares || 0) * (metadata.purchaseNavPrice || 0)
  const gainLoss = totalValue - purchaseValue
  const gainLossPercentage = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Fonds d'Investissement</CardTitle>
        <CardDescription>
          Détails spécifiques pour ce fonds d'investissement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fund Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fund-isin">Code ISIN *</Label>
            <Input
              id="fund-isin"
              value={metadata.isin || ''}
              onChange={(e) => updateField('isin', e.target.value)}
              placeholder="Ex: FR0000121014"
              className={errors['metadata.isin'] ? 'border-red-500' : ''}
            />
            {errors['metadata.isin'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.isin']}</p>
            )}
          </div>
          <div>
            <Label htmlFor="fund-name">Nom du fonds *</Label>
            <Input
              id="fund-name"
              value={metadata.fundName || ''}
              onChange={(e) => updateField('fundName', e.target.value)}
              placeholder="Ex: Amundi CAC 40 UCITS ETF"
              className={errors['metadata.fundName'] ? 'border-red-500' : ''}
            />
            {errors['metadata.fundName'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.fundName']}</p>
            )}
          </div>
        </div>

        {/* Fund Type */}
        <div>
          <Label htmlFor="fund-type">Type de fonds</Label>
          <Select
            value={metadata.fundType || ''}
            onValueChange={(value) => updateField('fundType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un type" />
            </SelectTrigger>
            <SelectContent>
              {fundTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shares and Prices */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="shares-number">Nombre de parts *</Label>
            <Input
              id="shares-number"
              type="number"
              min="0"
              step="0.01"
              value={metadata.numberOfShares || ''}
              onChange={(e) => updateField('numberOfShares', parseFloat(e.target.value) || 0)}
              placeholder="Nombre de parts"
              className={errors['metadata.numberOfShares'] ? 'border-red-500' : ''}
            />
            {errors['metadata.numberOfShares'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.numberOfShares']}</p>
            )}
          </div>
          <div>
            <Label htmlFor="purchase-nav">VL d'achat (€)</Label>
            <Input
              id="purchase-nav"
              type="number"
              min="0"
              step="0.01"
              value={metadata.purchaseNavPrice || ''}
              onChange={(e) => updateField('purchaseNavPrice', parseFloat(e.target.value) || 0)}
              placeholder="Valeur liquidative d'achat"
            />
          </div>
          <div>
            <Label htmlFor="current-nav">VL actuelle (€)</Label>
            <Input
              id="current-nav"
              type="number"
              min="0"
              step="0.01"
              value={metadata.currentNavPrice || ''}
              onChange={(e) => updateField('currentNavPrice', parseFloat(e.target.value) || 0)}
              placeholder="Valeur liquidative actuelle"
            />
          </div>
        </div>

        {/* Management Fees */}
        <div>
          <Label htmlFor="management-fees">Frais de gestion (%)</Label>
          <Input
            id="management-fees"
            type="number"
            min="0"
            step="0.01"
            value={metadata.managementFees || ''}
            onChange={(e) => updateField('managementFees', parseFloat(e.target.value) || 0)}
            placeholder="Frais de gestion annuels"
          />
        </div>

        {/* Performance Summary */}
        {metadata.numberOfShares && (metadata.purchaseNavPrice || metadata.currentNavPrice) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-sm mb-3">Résumé de Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Valeur d'achat:</span>
                <div className="font-medium">
                  {purchaseValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Valeur actuelle:</span>
                <div className="font-medium">
                  {totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Plus/Moins-value:</span>
                <div className={`font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {gainLoss >= 0 ? '+' : ''}{gainLoss.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Performance:</span>
                <div className={`font-medium ${gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 