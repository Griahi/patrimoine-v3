"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, AlertTriangle, Info, Users, Building, CreditCard, TrendingUp, Home, FileText } from 'lucide-react'
import { type ValidationResult } from '@/utils/onboarding/excel-validator'

interface DataPreviewProps {
  validation: ValidationResult
}

export function DataPreview({ validation }: DataPreviewProps) {
  const { data, errors, warnings, isValid } = validation

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'entities': return <Users className="w-5 h-5" />
      case 'bankAccounts': return <CreditCard className="w-5 h-5" />
      case 'stockPortfolio': return <TrendingUp className="w-5 h-5" />
      case 'realEstate': return <Home className="w-5 h-5" />
      case 'ownership': return <FileText className="w-5 h-5" />
      default: return <Building className="w-5 h-5" />
    }
  }

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'entities': return 'Entités'
      case 'bankAccounts': return 'Comptes Bancaires'
      case 'stockPortfolio': return 'Portefeuille Boursier'
      case 'realEstate': return 'Biens Immobiliers'
      case 'ownership': return 'Structure de Détention'
      default: return section
    }
  }

  const getSectionDescription = (section: string, count: number) => {
    switch (section) {
      case 'entities': 
        return `${count} ${count > 1 ? 'entités trouvées' : 'entité trouvée'} (personnes physiques et morales)`
      case 'bankAccounts': 
        return `${count} ${count > 1 ? 'comptes bancaires trouvés' : 'compte bancaire trouvé'}`
      case 'stockPortfolio': 
        return `${count} ${count > 1 ? 'positions boursières trouvées' : 'position boursière trouvée'}`
      case 'realEstate': 
        return `${count} ${count > 1 ? 'biens immobiliers trouvés' : 'bien immobilier trouvé'}`
      case 'ownership': 
        return `${count} ${count > 1 ? 'relations de détention trouvées' : 'relation de détention trouvée'}`
      default: 
        return `${count} éléments trouvés`
    }
  }

  const totalItems = Object.values(data).reduce((sum, items) => sum + (items?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                {isValid ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                )}
                <span>Aperçu des données importées</span>
              </CardTitle>
              <CardDescription>
                {totalItems} éléments au total détectés dans votre fichier Excel
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
              <div className="text-sm text-gray-500">éléments</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Data Sections */}
      <div className="grid gap-4">
        {Object.entries(data).map(([section, items]) => {
          if (!items || items.length === 0) return null

          return (
            <Card key={section} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center space-x-3">
                  {getSectionIcon(section)}
                  <span>{getSectionTitle(section)}</span>
                  <Badge variant="secondary">{items.length}</Badge>
                </CardTitle>
                <CardDescription>
                  {getSectionDescription(section, items.length)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {section === 'entities' && (
                          <>
                            <th className="text-left p-3 font-medium">Nom</th>
                            <th className="text-left p-3 font-medium">Type</th>
                            <th className="text-left p-3 font-medium">Identifiant</th>
                          </>
                        )}
                        {section === 'bankAccounts' && (
                          <>
                            <th className="text-left p-3 font-medium">Banque</th>
                            <th className="text-left p-3 font-medium">Type</th>
                            <th className="text-left p-3 font-medium">Solde</th>
                            <th className="text-left p-3 font-medium">Propriétaire</th>
                          </>
                        )}
                        {section === 'stockPortfolio' && (
                          <>
                            <th className="text-left p-3 font-medium">Symbole</th>
                            <th className="text-left p-3 font-medium">Nom</th>
                            <th className="text-left p-3 font-medium">Quantité</th>
                            <th className="text-left p-3 font-medium">Prix Unitaire</th>
                          </>
                        )}
                        {section === 'realEstate' && (
                          <>
                            <th className="text-left p-3 font-medium">Adresse</th>
                            <th className="text-left p-3 font-medium">Type</th>
                            <th className="text-left p-3 font-medium">Valeur</th>
                            <th className="text-left p-3 font-medium">Propriétaire</th>
                          </>
                        )}
                        {section === 'ownership' && (
                          <>
                            <th className="text-left p-3 font-medium">Propriétaire</th>
                            <th className="text-left p-3 font-medium">Actif/Entité</th>
                            <th className="text-left p-3 font-medium">Pourcentage</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, index: number) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          {section === 'entities' && (
                            <>
                              <td className="p-3 font-medium">{item.name}</td>
                              <td className="p-3">
                                <Badge variant={item.type === 'LEGAL_ENTITY' ? 'default' : 'secondary'}>
                                  {item.type === 'LEGAL_ENTITY' ? 'Société' : 'Personne'}
                                </Badge>
                              </td>
                              <td className="p-3 text-gray-600">{item.taxId || '-'}</td>
                            </>
                          )}
                          {section === 'bankAccounts' && (
                            <>
                              <td className="p-3 font-medium">{item.bank}</td>
                              <td className="p-3">
                                <Badge variant="outline">{item.type}</Badge>
                              </td>
                              <td className="p-3 text-right font-mono">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: item.currency || 'EUR'
                                }).format(item.balance)}
                              </td>
                              <td className="p-3 text-gray-600">{item.entityOwner}</td>
                            </>
                          )}
                          {section === 'stockPortfolio' && (
                            <>
                              <td className="p-3 font-mono font-medium">{item.symbol}</td>
                              <td className="p-3">{item.name}</td>
                              <td className="p-3 text-right">{item.quantity}</td>
                              <td className="p-3 text-right font-mono">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: item.currency || 'EUR'
                                }).format(item.averagePrice)}
                              </td>
                            </>
                          )}
                          {section === 'realEstate' && (
                            <>
                              <td className="p-3">{item.address}</td>
                              <td className="p-3">
                                <Badge variant="outline">{item.type}</Badge>
                              </td>
                              <td className="p-3 text-right font-mono">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'EUR'
                                }).format(item.estimatedValue)}
                              </td>
                              <td className="p-3 text-gray-600">{item.entityOwner}</td>
                            </>
                          )}
                          {section === 'ownership' && (
                            <>
                              <td className="p-3">{item.ownerEntity}</td>
                              <td className="p-3">{item.ownedAssetOrEntity}</td>
                              <td className="p-3 text-right font-medium">{item.percentage}%</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Errors and Warnings */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-4">
          {errors.length > 0 && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Erreurs détectées ({errors.length})</span>
                </CardTitle>
                <CardDescription>
                  Ces erreurs doivent être corrigées avant l'import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {errors.map((error, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-red-800">
                          {error.sheet} - Ligne {error.row}
                        </div>
                        <div className="text-red-700">
                          <span className="font-medium">{error.field}:</span> {error.message}
                        </div>
                        {error.value && (
                          <div className="text-red-600 text-xs">
                            Valeur: "{error.value}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {warnings.length > 0 && (
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yellow-700">
                  <Info className="w-5 h-5" />
                  <span>Avertissements ({warnings.length})</span>
                </CardTitle>
                <CardDescription>
                  Ces avertissements n'empêchent pas l'import mais méritent attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {warnings.map((warning, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-yellow-50 rounded">
                      <Info className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-yellow-800">
                          {warning.sheet} - Ligne {warning.row}
                        </div>
                        <div className="text-yellow-700">
                          <span className="font-medium">{warning.field}:</span> {warning.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
} 