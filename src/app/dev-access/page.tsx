"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { toast } from "sonner"
import { DynamicAssetForm } from "@/components/forms/DynamicAssetForm"
import { BaseAssetFormData } from "@/types/assets"

export default function DevAccessPage() {
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Types d'actifs par défaut pour les tests
  const defaultAssetTypes = [
    {
      id: 'real_estate',
      name: 'Immobilier résidentiel',
      code: 'real_estate',
      description: 'Biens immobiliers résidentiels',
      color: '#3B82F6'
    },
    {
      id: 'stocks',
      name: 'Actions cotées',
      code: 'stocks',
      description: 'Actions sur marché boursier',
      color: '#10B981'
    },
    {
      id: 'bank_account',
      name: 'Compte bancaire',
      code: 'bank_account',
      description: 'Comptes bancaires',
      color: '#6B7280'
    },
    {
      id: 'crypto',
      name: 'Cryptomonnaies',
      code: 'crypto',
      description: 'Crypto-monnaies',
      color: '#F59E0B'
    },
    {
      id: 'life_insurance',
      name: 'Assurance vie',
      code: 'life_insurance',
      description: 'Contrats d\'assurance vie',
      color: '#EF4444'
    },
    {
      id: 'other',
      name: 'Autre',
      code: 'other',
      description: 'Autres actifs',
      color: '#8B5CF6'
    }
  ]

  // Entités par défaut pour les tests
  const defaultEntities = [
    {
      id: 'entity-1',
      name: 'Jean Dupont',
      type: 'PHYSICAL_PERSON'
    },
    {
      id: 'entity-2',
      name: 'Marie Martin',
      type: 'PHYSICAL_PERSON'
    },
    {
      id: 'entity-3',
      name: 'SCI Famille',
      type: 'LEGAL_ENTITY'
    }
  ]

  const handleAssetSubmit = async (formData: BaseAssetFormData) => {
    setIsSubmitting(true)
    try {
      console.log('🚀 Asset form submitted with data:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Actif créé avec succès (simulation)')
      setShowAssetForm(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors de la création de l\'actif')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssetCancel = () => {
    setShowAssetForm(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🚀 Accès de Développement</CardTitle>
          <CardDescription>
            Tests et debugging pour le développement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => setShowAssetForm(true)}
              className="w-full"
            >
              Tester le formulaire d'actif
            </Button>
            
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-asset-types')
                  const data = await response.json()
                  console.log('API Test Response:', data)
                  toast.success(`API Test OK: ${data.length} types d'actifs`)
                } catch (error) {
                  console.error('API Test Error:', error)
                  toast.error('Erreur API Test')
                }
              }}
              className="w-full"
            >
              Tester l'API des types d'actifs
            </Button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Informations de test</h3>
            <ul className="text-sm space-y-1">
              <li>• Types d'actifs mockés: {defaultAssetTypes.length}</li>
              <li>• Entités mockées: {defaultEntities.length}</li>
              <li>• Formulaire: DynamicAssetForm</li>
              <li>• Mode: Développement</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {showAssetForm && (
        <Card>
          <CardHeader>
            <CardTitle>Test du Formulaire d'Actif</CardTitle>
            <CardDescription>
              Formulaire de création d'actif avec données mockées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicAssetForm
              assetTypes={defaultAssetTypes}
              entities={defaultEntities}
              onSubmit={handleAssetSubmit}
              onCancel={handleAssetCancel}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
} 