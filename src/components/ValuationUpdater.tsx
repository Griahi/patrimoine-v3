"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, DrawerTitle } from "@/components/ui/Drawer"
import { TrendingUp, TrendingDown, Minus, History, Save, X, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Asset {
  id: string
  name: string
  assetType: { name: string; color?: string }
  valuations: Array<{
    id: string
    value: number
    valuationDate: string
    source: string
    currency: string
    notes?: string
  }>
  ownerships: Array<{
    percentage: number
    ownerEntity: { name: string }
  }>
}

interface ValuationUpdateProps {
  assets: Asset[]
  onUpdate: () => void
}

export function ValuationUpdater({ assets, onUpdate }: ValuationUpdateProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [valuationDate, setValuationDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Calculer les statistiques
  const assetsNeedingUpdate = assets.filter(asset => {
    if (!asset.valuations.length) return true
    const lastUpdate = new Date(asset.valuations[0].valuationDate)
    const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    return daysSince > 30
  })

  const handleOpenUpdate = (asset: Asset) => {
    setSelectedAsset(asset)
    setNewValue(asset.valuations.length > 0 ? asset.valuations[0].value.toString() : "")
    setValuationDate(new Date().toISOString().split('T')[0])
    setNotes("")
    setIsDrawerOpen(true)
    setShowHistory(false)
  }

  const handleSubmitUpdate = async () => {
    if (!selectedAsset || !newValue) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/assets/${selectedAsset.id}/valuations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: parseFloat(newValue),
          valuationDate: valuationDate,
          notes: notes,
          source: 'MANUAL'
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      toast.success('Valorisation mise à jour avec succès')
      setIsDrawerOpen(false)
      onUpdate()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateChange = (asset: Asset) => {
    if (asset.valuations.length < 2) return null
    
    const current = asset.valuations[0].value
    const previous = asset.valuations[1].value
    const change = current - previous
    const changePercent = (change / previous) * 100
    
    return { change, changePercent }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getLastUpdateDays = (asset: Asset) => {
    if (!asset.valuations.length) return null
    const lastUpdate = new Date(asset.valuations[0].valuationDate)
    return Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2" />
              Mise à Jour des Valorisations
            </span>
            {assetsNeedingUpdate.length > 0 && (
              <Badge variant="destructive">
                {assetsNeedingUpdate.length} à actualiser
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assets.map((asset) => {
              const change = calculateChange(asset)
              const daysSinceUpdate = getLastUpdateDays(asset)
              const needsUpdate = daysSinceUpdate === null || daysSinceUpdate > 30

              return (
                <div 
                  key={asset.id}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-all cursor-pointer ${
                    needsUpdate ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleOpenUpdate(asset)}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: asset.assetType.color || '#6B7280' }}
                    />
                    <div>
                      <div className="font-medium text-sm">{asset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {asset.assetType.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Valeur actuelle */}
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {asset.valuations.length > 0 
                          ? asset.valuations[0].value.toLocaleString('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })
                          : 'Non valorisé'
                        }
                      </div>
                      {change && (
                        <div className="flex items-center justify-end space-x-1 text-xs">
                          {getChangeIcon(change.change)}
                          <span className={change.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {change.changePercent.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status de mise à jour */}
                    <div className="text-right">
                      {daysSinceUpdate !== null ? (
                        <Badge 
                          variant={needsUpdate ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {needsUpdate ? `${daysSinceUpdate}j` : 'À jour'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Jamais valorisé
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Drawer de mise à jour */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Mettre à jour: {selectedAsset?.name}
            </DrawerTitle>
          </DrawerHeader>
          
          <DrawerBody>
            {selectedAsset && (
              <div className="space-y-6">
                {/* Valorisation actuelle */}
                {selectedAsset.valuations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Valorisation Actuelle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {selectedAsset.valuations[0].value.toLocaleString('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Dernière valorisation
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {new Date(selectedAsset.valuations[0].valuationDate).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Source: {selectedAsset.valuations[0].source}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Formulaire de nouvelle valorisation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nouvelle Valorisation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newValue">Nouvelle valeur (€)</Label>
                        <Input
                          id="newValue"
                          type="number"
                          step="0.01"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="valuationDate">Date de valorisation</Label>
                        <Input
                          id="valuationDate"
                          type="date"
                          value={valuationDate}
                          onChange={(e) => setValuationDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (optionnel)</Label>
                      <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Raison de la mise à jour, source..."
                      />
                    </div>

                    {/* Comparaison */}
                    {selectedAsset.valuations.length > 0 && newValue && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          Comparaison avec la valorisation précédente
                        </div>
                        {(() => {
                          const current = parseFloat(newValue)
                          const previous = selectedAsset.valuations[0].value
                          const change = current - previous
                          const changePercent = (change / previous) * 100

                          return (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-700">
                                Évolution: {change.toLocaleString('fr-FR', { 
                                  style: 'currency', 
                                  currency: 'EUR',
                                  signDisplay: 'always'
                                })}
                              </span>
                              <div className="flex items-center space-x-1">
                                {getChangeIcon(change)}
                                <span className={`text-sm font-medium ${
                                  change >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {changePercent.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Historique */}
                <Card>
                  <CardHeader>
                    <CardTitle 
                      className="text-lg flex items-center justify-between cursor-pointer"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <span className="flex items-center">
                        <History className="h-5 w-5 mr-2" />
                        Historique des Valorisations
                      </span>
                      <Badge variant="secondary">
                        {selectedAsset.valuations.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  {showHistory && (
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedAsset.valuations.map((valuation, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <span className="font-medium">
                                {valuation.value.toLocaleString('fr-FR', { 
                                  style: 'currency', 
                                  currency: 'EUR' 
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({valuation.source})
                              </span>
                              {valuation.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {valuation.notes}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(valuation.valuationDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
          </DrawerBody>

          <DrawerFooter>
            <div className="flex space-x-2">
              <Button 
                onClick={handleSubmitUpdate}
                disabled={!newValue || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDrawerOpen(false)}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
} 