"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { StockMetadata } from "@/types/assets"

interface StockFormFieldsProps {
  metadata: Partial<StockMetadata>
  onMetadataChange: (metadata: Partial<StockMetadata>) => void
  errors: Record<string, string>
}

const currencies = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dollar US ($)' },
  { value: 'GBP', label: 'Livre Sterling (£)' },
  { value: 'CHF', label: 'Franc Suisse (CHF)' },
  { value: 'JPY', label: 'Yen Japonais (¥)' }
]

const marketPlaces = [
  { value: 'EURONEXT_PARIS', label: 'Euronext Paris' },
  { value: 'NASDAQ', label: 'NASDAQ' },
  { value: 'NYSE', label: 'New York Stock Exchange' },
  { value: 'LSE', label: 'London Stock Exchange' },
  { value: 'FRANKFURT', label: 'Bourse de Francfort' },
  { value: 'MILAN', label: 'Borsa Italiana' },
  { value: 'OTHER', label: 'Autre' }
]

export function StockFormFields({ metadata, onMetadataChange, errors }: StockFormFieldsProps) {
  const updateField = (field: keyof StockMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  // Calculate total value
  const totalValue = (metadata.quantity || 0) * (metadata.currentPrice || 0)
  const purchaseValue = (metadata.quantity || 0) * (metadata.unitPurchasePrice || 0)
  const gainLoss = totalValue - purchaseValue
  const gainLossPercentage = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Actions</CardTitle>
        <CardDescription>
          Détails spécifiques pour cet investissement en actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Identification */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stock-isin">Code ISIN *</Label>
            <Input
              id="stock-isin"
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
            <Label htmlFor="stock-symbol">Symbole/Ticker *</Label>
            <Input
              id="stock-symbol"
              value={metadata.symbol || ''}
              onChange={(e) => updateField('symbol', e.target.value)}
              placeholder="Ex: MC.PA"
              className={errors['metadata.symbol'] ? 'border-red-500' : ''}
            />
            {errors['metadata.symbol'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.symbol']}</p>
            )}
          </div>
        </div>

        {/* Quantity and Prices */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="stock-quantity">Quantité *</Label>
            <Input
              id="stock-quantity"
              type="number"
              min="0"
              step="1"
              value={metadata.quantity || ''}
              onChange={(e) => updateField('quantity', parseInt(e.target.value) || 0)}
              placeholder="Nombre d'actions"
              className={errors['metadata.quantity'] ? 'border-red-500' : ''}
            />
            {errors['metadata.quantity'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.quantity']}</p>
            )}
          </div>
          <div>
            <Label htmlFor="stock-purchase-price">Prix d'achat unitaire</Label>
            <Input
              id="stock-purchase-price"
              type="number"
              min="0"
              step="0.01"
              value={metadata.unitPurchasePrice || ''}
              onChange={(e) => updateField('unitPurchasePrice', parseFloat(e.target.value) || 0)}
              placeholder="Prix par action"
            />
          </div>
          <div>
            <Label htmlFor="stock-current-price">Prix actuel</Label>
            <Input
              id="stock-current-price"
              type="number"
              min="0"
              step="0.01"
              value={metadata.currentPrice || ''}
              onChange={(e) => updateField('currentPrice', parseFloat(e.target.value) || 0)}
              placeholder="Prix actuel"
            />
          </div>
        </div>

        {/* Currency and Market */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stock-currency">Devise</Label>
            <Select
              value={metadata.currency || 'EUR'}
              onValueChange={(value) => updateField('currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une devise" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="stock-marketplace">Place de marché</Label>
            <Select
              value={metadata.marketPlace || ''}
              onValueChange={(value) => updateField('marketPlace', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une place de marché" />
              </SelectTrigger>
              <SelectContent>
                {marketPlaces.map((market) => (
                  <SelectItem key={market.value} value={market.value}>
                    {market.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Broker Fees */}
        <div>
          <Label htmlFor="stock-broker-fees">Frais de courtage (€)</Label>
          <Input
            id="stock-broker-fees"
            type="number"
            min="0"
            step="0.01"
            value={metadata.brokerFees || ''}
            onChange={(e) => updateField('brokerFees', parseFloat(e.target.value) || 0)}
            placeholder="Frais de transaction"
          />
        </div>

        {/* Performance Summary */}
        {metadata.quantity && (metadata.unitPurchasePrice || metadata.currentPrice) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-sm mb-3">Résumé de Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Valeur d'achat:</span>
                <div className="font-medium">
                  {purchaseValue.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: metadata.currency || 'EUR' 
                  })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Valeur actuelle:</span>
                <div className="font-medium">
                  {totalValue.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: metadata.currency || 'EUR' 
                  })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Plus/Moins-value:</span>
                <div className={`font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {gainLoss >= 0 ? '+' : ''}{gainLoss.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: metadata.currency || 'EUR' 
                  })}
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