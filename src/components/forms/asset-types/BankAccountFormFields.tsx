"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { BankAccountMetadata } from "@/types/assets"

interface BankAccountFormFieldsProps {
  metadata: Partial<BankAccountMetadata>
  onMetadataChange: (metadata: Partial<BankAccountMetadata>) => void
  errors: Record<string, string>
}

const accountTypes = [
  { value: 'current', label: 'Compte courant' },
  { value: 'savings', label: 'Compte épargne' },
  { value: 'term', label: 'Compte à terme' }
]

const currencies = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dollar US ($)' },
  { value: 'GBP', label: 'Livre Sterling (£)' },
  { value: 'CHF', label: 'Franc Suisse (CHF)' }
]

export function BankAccountFormFields({ metadata, onMetadataChange, errors }: BankAccountFormFieldsProps) {
  const updateField = (field: keyof BankAccountMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Compte Bancaire</CardTitle>
        <CardDescription>
          Détails spécifiques pour ce compte bancaire
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bank-name">Nom de la banque *</Label>
            <Input
              id="bank-name"
              value={metadata.bank || ''}
              onChange={(e) => updateField('bank', e.target.value)}
              placeholder="Ex: BNP Paribas, Crédit Agricole"
              className={errors['metadata.bank'] ? 'border-red-500' : ''}
            />
            {errors['metadata.bank'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.bank']}</p>
            )}
          </div>
          <div>
            <Label htmlFor="account-type">Type de compte</Label>
            <Select
              value={metadata.accountType || ''}
              onValueChange={(value) => updateField('accountType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={metadata.iban || ''}
              onChange={(e) => updateField('iban', e.target.value)}
              placeholder="Ex: FR76 1234 5678 9012 3456 7890 123"
            />
          </div>
          <div>
            <Label htmlFor="bic">BIC/SWIFT</Label>
            <Input
              id="bic"
              value={metadata.bic || ''}
              onChange={(e) => updateField('bic', e.target.value)}
              placeholder="Ex: BNPAFRPP"
            />
          </div>
        </div>

        {/* Balance and Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="current-balance">Solde actuel *</Label>
            <Input
              id="current-balance"
              type="number"
              step="0.01"
              value={metadata.currentBalance || ''}
              onChange={(e) => updateField('currentBalance', parseFloat(e.target.value) || 0)}
              placeholder="Solde du compte"
              className={errors['metadata.currentBalance'] ? 'border-red-500' : ''}
            />
            {errors['metadata.currentBalance'] && (
              <p className="text-sm text-red-500 mt-1">{errors['metadata.currentBalance']}</p>
            )}
          </div>
          <div>
            <Label htmlFor="currency">Devise</Label>
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
        </div>

        {/* Interest Rate */}
        <div>
          <Label htmlFor="interest-rate">Taux d'intérêt (%)</Label>
          <Input
            id="interest-rate"
            type="number"
            min="0"
            step="0.01"
            value={metadata.interestRate || ''}
            onChange={(e) => updateField('interestRate', parseFloat(e.target.value) || 0)}
            placeholder="Taux d'intérêt annuel"
          />
        </div>
      </CardContent>
    </Card>
  )
} 