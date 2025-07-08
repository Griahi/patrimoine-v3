"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { InterEntityLoanMetadata } from "@/types/assets"
import { Users, HandCoins, FileText, Shield } from "lucide-react"

interface Entity {
  id: string
  name: string
  type: string
}

interface InterEntityLoanFormFieldsProps {
  metadata: Partial<InterEntityLoanMetadata>
  onMetadataChange: (metadata: Partial<InterEntityLoanMetadata>) => void
  entities: Entity[]
  errors?: Record<string, string>
}

export function InterEntityLoanFormFields({
  metadata,
  onMetadataChange,
  entities,
  errors = {}
}: InterEntityLoanFormFieldsProps) {
  const [borrowerEntity, setBorrowerEntity] = useState<Entity | null>(null)
  const [lenderEntity, setLenderEntity] = useState<Entity | null>(null)

  useEffect(() => {
    if (metadata.borrowerEntityId) {
      const entity = entities.find(e => e.id === metadata.borrowerEntityId)
      setBorrowerEntity(entity || null)
    }
  }, [metadata.borrowerEntityId, entities])

  useEffect(() => {
    if (metadata.lenderEntityId) {
      const entity = entities.find(e => e.id === metadata.lenderEntityId)
      setLenderEntity(entity || null)
    }
  }, [metadata.lenderEntityId, entities])

  const updateField = (field: keyof InterEntityLoanMetadata, value: string) => {
    const updates: Partial<InterEntityLoanMetadata> = { [field]: value }
    
    // Auto-fill entity names when IDs are selected
    if (field === 'borrowerEntityId') {
      const entity = entities.find(e => e.id === value)
      if (entity) {
        updates.borrowerEntityName = entity.name
        setBorrowerEntity(entity)
      }
    } else if (field === 'lenderEntityId') {
      const entity = entities.find(e => e.id === value)
      if (entity) {
        updates.lenderEntityName = entity.name
        setLenderEntity(entity)
      }
    }
    
    onMetadataChange({ ...metadata, ...updates })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <HandCoins className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-800">Prêt Inter-Entité</CardTitle>
              <CardDescription className="text-amber-700">
                Créance entre deux entités de votre patrimoine
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Parties du prêt */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Parties du Prêt</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entité Prêteuse */}
            <div>
              <Label className="text-sm font-medium text-green-700">
                Entité Prêteuse (Créancier) *
              </Label>
              <Select
                value={metadata.lenderEntityId || ""}
                onValueChange={(value) => updateField('lenderEntityId', value)}
              >
                <SelectTrigger className="border-green-200 focus:border-green-400">
                  <SelectValue placeholder="Sélectionner le prêteur" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          entity.type === 'PHYSICAL_PERSON' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                        <span>{entity.name}</span>
                        <span className="text-xs text-gray-500">
                          ({entity.type === 'PHYSICAL_PERSON' ? 'Personne' : 'Société'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.lenderEntityId && (
                <p className="text-sm text-red-600 mt-1">{errors.lenderEntityId}</p>
              )}
            </div>

            {/* Entité Emprunteuse */}
            <div>
              <Label className="text-sm font-medium text-red-700">
                Entité Emprunteuse (Débiteur) *
              </Label>
              <Select
                value={metadata.borrowerEntityId || ""}
                onValueChange={(value) => updateField('borrowerEntityId', value)}
              >
                <SelectTrigger className="border-red-200 focus:border-red-400">
                  <SelectValue placeholder="Sélectionner l'emprunteur" />
                </SelectTrigger>
                <SelectContent>
                  {entities
                    .filter(entity => entity.id !== metadata.lenderEntityId)
                    .map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          entity.type === 'PHYSICAL_PERSON' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                        <span>{entity.name}</span>
                        <span className="text-xs text-gray-500">
                          ({entity.type === 'PHYSICAL_PERSON' ? 'Personne' : 'Société'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.borrowerEntityId && (
                <p className="text-sm text-red-600 mt-1">{errors.borrowerEntityId}</p>
              )}
            </div>
          </div>

          {/* Résumé visuel */}
          {lenderEntity && borrowerEntity && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-medium text-green-700">{lenderEntity.name}</p>
                  <p className="text-xs text-green-600">PRÊTEUR</p>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-400 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2">
                    <HandCoins className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="font-medium text-red-700">{borrowerEntity.name}</p>
                  <p className="text-xs text-red-600">EMPRUNTEUR</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails du prêt */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Détails du Prêt</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="loanPurpose">Objet du prêt *</Label>
              <Input
                id="loanPurpose"
                value={metadata.loanPurpose || ""}
                onChange={(e) => updateField('loanPurpose', e.target.value)}
                placeholder="Ex: Acquisition immobilière, besoin de trésorerie..."
                className={errors.loanPurpose ? "border-red-300" : ""}
              />
              {errors.loanPurpose && (
                <p className="text-sm text-red-600 mt-1">{errors.loanPurpose}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contractDate">Date du contrat *</Label>
              <Input
                id="contractDate"
                type="date"
                value={metadata.contractDate || ""}
                onChange={(e) => updateField('contractDate', e.target.value)}
                className={errors.contractDate ? "border-red-300" : ""}
              />
              {errors.contractDate && (
                <p className="text-sm text-red-600 mt-1">{errors.contractDate}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="guarantees">Garanties (optionnel)</Label>
            <Input
              id="guarantees"
              value={metadata.guarantees || ""}
              onChange={(e) => updateField('guarantees', e.target.value)}
              placeholder="Ex: Hypothèque, nantissement, caution personnelle..."
            />
          </div>

          <div>
            <Label htmlFor="legalDocumentRef">Référence document légal (optionnel)</Label>
            <Input
              id="legalDocumentRef"
              value={metadata.legalDocumentRef || ""}
              onChange={(e) => updateField('legalDocumentRef', e.target.value)}
              placeholder="Ex: Acte notarié n°123456, contrat du 01/01/2024..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Informations importantes */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-800">Informations importantes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• <strong>Créance :</strong> Un actif "créance" sera créé pour l&apos;entité prêteuse</p>
            <p>• <strong>Dette :</strong> Une dette correspondante sera créée pour l&apos;entité emprunteuse</p>
            <p>• <strong>Valorisation :</strong> Le montant initial représente la valeur de la créance</p>
            <p>• <strong>Financement :</strong> Vous pourrez ajouter les conditions de remboursement ensuite</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 