"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { Plus, Trash2 } from "lucide-react"
import { OtherMetadata } from "@/types/assets"

interface OtherFormFieldsProps {
  metadata: Partial<OtherMetadata>
  onMetadataChange: (metadata: Partial<OtherMetadata>) => void
  errors: Record<string, string>
}

const fieldTypes = [
  { value: 'text', label: 'Texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Oui/Non' }
]

export function OtherFormFields({ metadata, onMetadataChange, errors }: OtherFormFieldsProps) {
  const updateField = (field: keyof OtherMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  const addCustomField = () => {
    const newFields = [
      ...(metadata.customFields || []),
      { key: '', value: '', type: 'text' as const }
    ]
    updateField('customFields', newFields)
  }

  const removeCustomField = (index: number) => {
    const newFields = (metadata.customFields || []).filter((_, i) => i !== index)
    updateField('customFields', newFields)
  }

  const updateCustomField = (index: number, field: string, value: any) => {
    const newFields = (metadata.customFields || []).map((customField, i) => 
      i === index ? { ...customField, [field]: value } : customField
    )
    updateField('customFields', newFields)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Spécifiques - Autres Investissements</CardTitle>
        <CardDescription>
          Définissez des champs personnalisés pour ce type d'actif unique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Custom Category */}
        <div>
          <Label htmlFor="custom-category">Catégorie personnalisée *</Label>
          <Input
            id="custom-category"
            value={metadata.customCategory || ''}
            onChange={(e) => updateField('customCategory', e.target.value)}
            placeholder="Ex: Startup, Brevets, Royalties"
            className={errors['metadata.customCategory'] ? 'border-red-500' : ''}
          />
          {errors['metadata.customCategory'] && (
            <p className="text-sm text-red-500 mt-1">{errors['metadata.customCategory']}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Décrivez le type d'investissement ou d'actif
          </p>
        </div>

        {/* Custom Fields */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <Label className="text-base font-medium">Champs personnalisés</Label>
              <p className="text-sm text-muted-foreground">
                Ajoutez des informations spécifiques à votre actif
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addCustomField}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un champ
            </Button>
          </div>

          <div className="space-y-4">
            {(metadata.customFields || []).map((field, index) => (
              <div key={index} className="flex items-end space-x-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`field-key-${index}`}>Nom du champ</Label>
                  <Input
                    id={`field-key-${index}`}
                    value={field.key}
                    onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                    placeholder="Ex: Taux de participation"
                  />
                </div>
                
                <div className="w-32">
                  <Label htmlFor={`field-type-${index}`}>Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) => updateCustomField(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor={`field-value-${index}`}>Valeur</Label>
                  {field.type === 'boolean' ? (
                    <Select
                      value={field.value}
                      onValueChange={(value) => updateCustomField(index, 'value', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui</SelectItem>
                        <SelectItem value="false">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`field-value-${index}`}
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                      placeholder="Valeur"
                      step={field.type === 'number' ? '0.01' : undefined}
                    />
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomField(index)}
                  className="mb-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {(!metadata.customFields || metadata.customFields.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun champ personnalisé défini</p>
                <p className="text-sm">Cliquez sur "Ajouter un champ" pour commencer</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary of Custom Fields */}
        {metadata.customFields && metadata.customFields.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-sm mb-3">Résumé des Informations</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catégorie:</span>
                <span className="font-medium">{metadata.customCategory || 'Non définie'}</span>
              </div>
              {metadata.customFields.map((field, index) => (
                field.key && field.value && (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground">{field.key}:</span>
                    <span className="font-medium">
                      {field.type === 'boolean' 
                        ? (field.value === 'true' ? 'Oui' : 'Non')
                        : field.value
                      }
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Example */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-blue-600 mt-0.5">💡</div>
            <div>
              <p className="text-sm text-blue-800 font-medium">Exemples d'utilisation</p>
              <p className="text-xs text-blue-700 mt-1">
                • Parts dans une startup: "Pourcentage de participation", "Date d'investissement", "Valorisation"<br/>
                • Brevets: "Numéro de brevet", "Date d'expiration", "Domaine d'application"<br/>
                • Royalties: "Source", "Taux", "Échéance"
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 