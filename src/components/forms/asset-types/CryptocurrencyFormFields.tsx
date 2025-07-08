"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { CryptocurrencyMetadata } from "@/types/assets"

interface CryptocurrencyFormFieldsProps {
  metadata: Partial<CryptocurrencyMetadata>
  onMetadataChange: (metadata: Partial<CryptocurrencyMetadata>) => void
  errors: Record<string, string>
}

const popularCryptos = [
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'BNB', label: 'Binance Coin (BNB)' },
  { value: 'SOL', label: 'Solana (SOL)' },
  { value: 'ADA', label: 'Cardano (ADA)' },
  { value: 'DOT', label: 'Polkadot (DOT)' },
  { value: 'AVAX', label: 'Avalanche (AVAX)' },
  { value: 'MATIC', label: 'Polygon (MATIC)' },
  { value: 'LINK', label: 'Chainlink (LINK)' },
  { value: 'UNI', label: 'Uniswap (UNI)' },
  { value: 'OTHER', label: 'Autre' }
]

const platforms = [
  { value: 'binance', label: 'Binance' },
  { value: 'coinbase', label: 'Coinbase' },
  { value: 'kraken', label: 'Kraken' },
  { value: 'bitpanda', label: 'Bitpanda' },
  { value: 'crypto_com', label: 'Crypto.com' },
  { value: 'etoro', label: 'eToro' },
  { value: 'hardware_wallet', label: 'Wallet hardware' },
  { value: 'metamask', label: 'MetaMask' },
  { value: 'trust_wallet', label: 'Trust Wallet' },
  { value: 'other', label: 'Autre' }
]

export function CryptocurrencyFormFields({ metadata, onMetadataChange, errors }: CryptocurrencyFormFieldsProps) {
  const updateField = (field: keyof CryptocurrencyMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  // Calculate performance
  const currentValue = (metadata.quantity || 0) * (metadata.averagePurchasePrice || 0)
  const isGain = currentValue > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Cryptomonnaies</CardTitle>
        <CardDescription>
          Détails spécifiques pour cet investissement en cryptomonnaies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cryptocurrency Symbol */}
        <div>
          <Label htmlFor="crypto-symbol">Cryptomonnaie *</Label>
          <Select
            value={metadata.symbol || ''}
            onValueChange={(value) => {
              updateField('symbol', value)
              // If "OTHER" is selected, clear the symbol to allow custom input
              if (value === 'OTHER') {
                updateField('symbol', '')
              }
            }}
          >
            <SelectTrigger className={errors['metadata.symbol'] ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionnez une cryptomonnaie" />
            </SelectTrigger>
            <SelectContent>
              {popularCryptos.map((crypto) => (
                <SelectItem key={crypto.value} value={crypto.value}>
                  {crypto.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors['metadata.symbol'] && (
            <p className="text-sm text-red-500 mt-1">{errors['metadata.symbol']}</p>
          )}
        </div>

        {/* Custom Symbol Input (if OTHER is selected) */}
        {metadata.symbol === 'OTHER' && (
          <div>
            <Label htmlFor="custom-symbol">Symbole personnalisé *</Label>
            <Input
              id="custom-symbol"
              value={metadata.symbol || ''}
              onChange={(e) => updateField('symbol', e.target.value.toUpperCase())}
              placeholder="Ex: DOGE"
              className={errors['metadata.symbol'] ? 'border-red-500' : ''}
            />
          </div>
        )}

        {/* Quantity and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="crypto-quantity">Quantité *</Label>
            <Input
              id="crypto-quantity"
              type="number"
              min="0"
              step="0.00000001"
              value={metadata.quantity || ''}
              onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
              placeholder="Quantité détenue"
              className={errors['metadata.quantity'] ? 'border-red-500' : ''}
            />
            {errors['metadata.quantity'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.quantity']}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Nombre de tokens/coins détenus
            </p>
          </div>
          <div>
            <Label htmlFor="crypto-avg-price">Prix d'achat moyen (€)</Label>
            <Input
              id="crypto-avg-price"
              type="number"
              min="0"
              step="0.01"
              value={metadata.averagePurchasePrice || ''}
              onChange={(e) => updateField('averagePurchasePrice', parseFloat(e.target.value) || 0)}
              placeholder="Prix moyen d'acquisition"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Prix d'achat moyen par unité
            </p>
          </div>
        </div>

        {/* Platform */}
        <div>
          <Label htmlFor="crypto-platform">Plateforme/Wallet *</Label>
          <Select
            value={metadata.platform || ''}
            onValueChange={(value) => updateField('platform', value)}
          >
            <SelectTrigger className={errors['metadata.platform'] ? 'border-red-500' : ''}>
              <SelectValue placeholder="Où sont stockés vos cryptos ?" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.value} value={platform.value}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors['metadata.platform'] && (
            <p className="text-sm text-red-500 mt-1">{errors['metadata.platform']}</p>
          )}
        </div>

        {/* Wallet Address (Optional) */}
        <div>
          <Label htmlFor="crypto-wallet">Adresse du wallet (optionnel)</Label>
          <Input
            id="crypto-wallet"
            value={metadata.walletAddress || ''}
            onChange={(e) => updateField('walletAddress', e.target.value)}
            placeholder="Ex: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Adresse publique du wallet (pour suivi). Cette information n'est pas obligatoire.
          </p>
        </div>

        {/* Investment Summary */}
        {metadata.quantity && metadata.averagePurchasePrice && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-sm mb-3">Résumé de l'Investissement</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Investissement total:</span>
                <div className="font-medium">
                  {currentValue.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  Quantité × Prix moyen
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Cryptomonnaie:</span>
                <div className="font-medium">
                  {metadata.symbol} × {metadata.quantity}
                </div>
                <div className="text-xs text-muted-foreground">
                  Symbole et quantité
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Stockage:</span>
                <div className="font-medium">
                  {platforms.find(p => p.value === metadata.platform)?.label || metadata.platform}
                </div>
                <div className="text-xs text-muted-foreground">
                  Plateforme/Wallet
                </div>
              </div>
            </div>
            
            {metadata.walletAddress && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Adresse du wallet:</span>
                <div className="font-mono text-xs mt-1 break-all">
                  {metadata.walletAddress}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-blue-600 mt-0.5">🔒</div>
            <div>
              <p className="text-sm text-blue-800 font-medium">Note de sécurité</p>
              <p className="text-xs text-blue-700 mt-1">
                Ne partagez jamais vos clés privées ou phrases de récupération. 
                L'adresse du wallet (publique) est optionnelle et sert uniquement au suivi.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 