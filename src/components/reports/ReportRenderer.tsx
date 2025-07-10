'use client'

import React, { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { ReportExportService } from "@/lib/reportExports"
import { 
  formatCurrency, 
  formatPercentage, 
  calculateAssetValue, 
  calculateOwnershipPercentage, 
  validateValuation
} from "@/utils/financial-calculations"
import { 
  FileText, 
  Download, 
  TrendingUp, 
  PieChart, 
  Target,
  Calculator,
  Building,
  Eye,
  AlertTriangle,
  CheckCircle,
  Printer
} from "lucide-react"

interface Asset {
  id: string
  name: string
  assetType: {
    id: string
    name: string
    color?: string
  }
  valuations: Array<{
    value: number
    valuationDate: string
    currency: string
  }>
  ownerships: Array<{
    percentage: number
    ownerEntity: {
      id: string
      name: string
      type: string
    }
  }>
  metadata?: any
}

interface Entity {
  id: string
  name: string
  type: string
  ownedAssets: Array<{
    percentage: number
    ownedAsset: Asset
  }>
}

interface FilterState {
  period: string
  entities: string[]
  assets: string[]
  currency: string
  reportType: string
  includeProjections: boolean
  liquidityFilter: string
  fiscalOptimization: boolean
}

interface ReportRendererProps {
  assets: Asset[]
  entities: Entity[]
  filters: FilterState
  loading?: boolean
}

export default function ReportRenderer({ assets, entities, filters, loading }: ReportRendererProps) {
  // Les dépendances seront vérifiées au moment de l'export pour éviter les erreurs
  // au chargement du composant
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('ReportRenderer mounted, export features will be loaded on demand')
    }
  }, [])

  // Filtrer les actifs selon les critères
  const filteredAssets = assets.filter(asset => {
    // Filtre par entité
    if (filters.entities.length > 0) {
      const hasMatchingEntity = asset.ownerships.some(ownership => 
        filters.entities.includes(ownership.ownerEntity.id)
      )
      if (!hasMatchingEntity) return false
    }

    // Filtre par actifs spécifiques
    if (filters.assets.length > 0) {
      if (!filters.assets.includes(asset.id)) return false
    }

    // Filtre par liquidité
    if (filters.liquidityFilter !== 'all') {
      // Ici on pourrait ajouter la logique de liquidité basée sur les métadonnées
      // Pour l'instant, on considère tous les actifs
    }

    return true
  })

  // Préparer les données pour l'export
  const prepareExportData = () => {
    return {
      totalValue,
      assetsByType,
      assets: filteredAssets,
      entities,
      filters: {
        reportType: filters.reportType,
        period: filters.period,
        currency: filters.currency,
        entities: filters.entities,
        assets: filters.assets
      }
    }
  }

  // Gestionnaires d'export
  const handleExportPDF = async () => {
    const reportTitle = getReportTitle()
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`
    
    // Récupérer le nom de l'entité principale pour l'affichage
    let entityName = '';
    if (filters.entities.length === 1) {
      // Si une seule entité est sélectionnée, utiliser son nom
      const selectedEntity = entities.find(entity => entity.id === filters.entities[0]);
      if (selectedEntity) {
        entityName = selectedEntity.name;
      }
    } else if (filters.entities.length > 1) {
      // Si plusieurs entités sont sélectionnées, afficher le nombre
      entityName = `${filters.entities.length} entités sélectionnées`;
    } else {
      // Si aucune entité spécifique n'est sélectionnée, afficher "Toutes les entités"
      entityName = 'Toutes les entités';
    }

    const subtitle = `Période: ${filters.period} | ${new Date().toLocaleDateString('fr-FR')}`;
    
    try {
      // Essayer d'abord la méthode sécurisée avec les informations d'entité
      await ReportExportService.exportToPDFSecure(
        'report-content', 
        filename, 
        reportTitle, 
        entityName,
        subtitle
      )
    } catch (error) {
      console.warn('Export PDF sécurisé a échoué, utilisation de la méthode legacy:', error)
      // Fallback vers la méthode legacy si la sécurisée échoue
      await ReportExportService.exportToPDF('report-content', filename + '.pdf', reportTitle)
    }
  }

  const handleExportExcel = () => {
    const reportTitle = getReportTitle()
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`
    const exportData = prepareExportData()
    ReportExportService.exportToExcel(exportData, filename)
  }

  const handlePrint = () => {
    const reportTitle = getReportTitle()
    ReportExportService.printReport('report-content', reportTitle)
  }

  const handleExportCSV = () => {
    const reportTitle = getReportTitle()
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    const exportData = prepareExportData()
    ReportExportService.exportToCSV(exportData, filename)
  }

  const getReportTitle = () => {
    switch (filters.reportType) {
      case 'bilan_complet': return 'Bilan Patrimonial Complet'
      case 'performance': return 'Rapport de Performance'
      case 'diversification': return 'Analyse de Diversification'
      case 'fiscal': return 'Rapport Fiscal'
      case 'liquidite': return 'Analyse de Liquidité'
      case 'stress_test': return 'Tests de Résistance'
      case 'projection': return 'Projections Patrimoniales'
      case 'consolidation': return 'Consolidation Multi-Entités'
      default: return 'Rapport Patrimonial'
    }
  }

  // Calculer les données agrégées
  const totalValue = filteredAssets.reduce((sum, asset) => {
    const latestValuation = asset.valuations[0]
    const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false }
    
    const relevantOwnerships = asset.ownerships.filter(ownership => 
      filters.entities.length === 0 || 
      filters.entities.includes(ownership.ownerEntity.id)
    )
    
    const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships)
    const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
    
    return sum + assetValue
  }, 0)

  // Calculs par type d'actif
  const assetsByType = filteredAssets.reduce((acc, asset) => {
    const typeName = asset.assetType.name
    const latestValuation = asset.valuations[0]
    const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false }
    
    const relevantOwnerships = asset.ownerships.filter(ownership => 
      filters.entities.length === 0 || 
      filters.entities.includes(ownership.ownerEntity.id)
    )
    
    const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships)
    const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
    
    if (!acc[typeName]) {
      acc[typeName] = { 
        value: 0, 
        count: 0, 
        color: asset.assetType.color || '#6B7280',
        percentage: 0
      }
    }
    
    acc[typeName].value += assetValue
    acc[typeName].count += 1
    
    return acc
  }, {} as Record<string, { value: number; count: number; color: string; percentage: number }>)

  // Calculer les pourcentages
  Object.keys(assetsByType).forEach(type => {
    assetsByType[type].percentage = totalValue > 0 ? (assetsByType[type].value / totalValue) * 100 : 0
  })

  const renderBilanComplet = () => (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Patrimoine Consolidé
          </CardTitle>
          <CardDescription>Situation au {new Date().toLocaleDateString('fr-FR')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(totalValue, { currency: filters.currency })}
              </div>
              <div className="text-sm text-muted-foreground">Actif Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{filteredAssets.length}</div>
              <div className="text-sm text-muted-foreground">Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{Object.keys(assetsByType).length}</div>
              <div className="text-sm text-muted-foreground">Types d'actifs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Répartition par type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Répartition par Type d'Actif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(assetsByType)
              .sort(([,a], [,b]) => b.value - a.value)
              .map(([type, data]) => (
                <div key={type} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: data.color }}
                    />
                    <div>
                      <div className="font-medium">{type}</div>
                      <div className="text-sm text-muted-foreground">
                        {data.count} actif{data.count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(data.value, { currency: filters.currency })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(data.percentage)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Détail des actifs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Détail des Actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAssets.map(asset => {
              const latestValuation = asset.valuations[0]
              const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: filters.currency, isValid: false }
              
              return (
                <div key={asset.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: asset.assetType.color || '#6B7280' }}
                    />
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {asset.assetType.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(validatedValuation.value, { 
                        currency: validatedValuation.currency
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {latestValuation?.valuationDate ? 
                        new Date(latestValuation.valuationDate).toLocaleDateString('fr-FR') : 
                        'Non valorisé'
                      }
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPerformanceReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Analyse de Performance
          </CardTitle>
          <CardDescription>Évolution et rendements sur la période sélectionnée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-600">+12.5%</div>
              <div className="text-sm text-muted-foreground">Rendement total</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">+8.3%</div>
              <div className="text-sm text-muted-foreground">Rendement annualisé</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-orange-600">15.2%</div>
              <div className="text-sm text-muted-foreground">Volatilité</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-purple-600">0.82</div>
              <div className="text-sm text-muted-foreground">Ratio de Sharpe</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance par Type d'Actif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(assetsByType).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: data.color }}
                  />
                  <span className="font-medium">{type}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">
                    +{(Math.random() * 20 - 5).toFixed(1)}%
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(data.value, { currency: filters.currency })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDiversificationReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Analyse de Diversification
          </CardTitle>
          <CardDescription>Répartition des risques et concentration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Indices de Concentration</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Indice de Herfindahl</span>
                  <span className="font-medium">0.24</span>
                </div>
                <div className="flex justify-between">
                  <span>Concentration Top 3</span>
                  <span className="font-medium">68.5%</span>
                </div>
                <div className="flex justify-between">
                  <span>Nombre effectif d'actifs</span>
                  <span className="font-medium">4.2</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Alertes de Concentration</h4>
              <div className="space-y-2">
                {Object.entries(assetsByType)
                  .filter(([, data]) => data.percentage > 30)
                  .map(([type, data]) => (
                    <div key={type} className="flex items-center space-x-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        {type}: {formatPercentage(data.percentage)} (&gt; 30%)
                      </span>
                    </div>
                  ))}
                {Object.entries(assetsByType).every(([, data]) => data.percentage <= 30) && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Diversification satisfaisante</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderFiscalReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Analyse Fiscale
          </CardTitle>
          <CardDescription>Optimisation et obligations fiscales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Estimations Fiscales</h4>
              <div className="space-y-3">
                <div className="p-3 border rounded">
                  <div className="flex justify-between">
                    <span>IFI (Impôt Fortune Immobilière)</span>
                    <span className="font-medium">0 €</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Seuil: 1 300 000 € | Patrimoine taxable: {formatCurrency(totalValue, { currency: filters.currency })}
                  </div>
                </div>
                <div className="p-3 border rounded">
                  <div className="flex justify-between">
                    <span>Plus-values potentielles</span>
                    <span className="font-medium">{formatCurrency(totalValue * 0.05, { currency: filters.currency })}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimation basée sur l'évolution moyenne
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Recommandations</h4>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <div className="text-sm font-medium text-blue-900">Optimisation PEA</div>
                  <div className="text-sm text-blue-700">
                    Envisager un transfert vers le PEA pour optimiser la fiscalité
                  </div>
                </div>
                <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                  <div className="text-sm font-medium text-green-900">Assurance-vie</div>
                  <div className="text-sm text-green-700">
                    Bonne utilisation des enveloppes fiscalement avantageuses
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Fonction pour déterminer le niveau de liquidité d'un actif
  const getLiquidityLevel = (assetType: string): { level: string; days: string; color: string } => {
    const type = assetType.toLowerCase()
    
    if (type.includes('bank') || type.includes('cash') || type.includes('épargne') || type.includes('compte')) {
      return { level: 'Immédiate', days: '0-1 jour', color: '#10B981' }
    }
    if (type.includes('stock') || type.includes('action') || type.includes('etf') || type.includes('obligation')) {
      return { level: 'Court terme', days: '1-3 jours', color: '#3B82F6' }
    }
    if (type.includes('fund') || type.includes('fonds') || type.includes('scpi') || type.includes('assurance')) {
      return { level: 'Moyen terme', days: '1-4 semaines', color: '#F59E0B' }
    }
    if (type.includes('real') || type.includes('immobilier') || type.includes('private') || type.includes('equity')) {
      return { level: 'Long terme', days: '3-12 mois', color: '#EF4444' }
    }
    
    // Par défaut : moyen terme
    return { level: 'Moyen terme', days: '1-4 semaines', color: '#F59E0B' }
  }

  const renderLiquidityReport = () => {
    // Calculer les données de liquidité
    const liquidityData = filteredAssets.reduce((acc, asset) => {
      const latestValuation = asset.valuations[0]
      const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false }
      
      const relevantOwnerships = asset.ownerships.filter(ownership => 
        filters.entities.length === 0 || 
        filters.entities.includes(ownership.ownerEntity.id)
      )
      
      const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships)
      const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
      
      const liquidityInfo = getLiquidityLevel(asset.assetType.name)
      
      if (!acc[liquidityInfo.level]) {
        acc[liquidityInfo.level] = {
          value: 0,
          count: 0,
          percentage: 0,
          days: liquidityInfo.days,
          color: liquidityInfo.color,
          assets: []
        }
      }
      
      acc[liquidityInfo.level].value += assetValue
      acc[liquidityInfo.level].count += 1
      acc[liquidityInfo.level].assets.push({
        ...asset,
        value: assetValue,
        liquidityDays: liquidityInfo.days
      })
      
      return acc
    }, {} as Record<string, { 
      value: number; 
      count: number; 
      percentage: number; 
      days: string; 
      color: string;
      assets: Array<Asset & { value: number; liquidityDays: string }>
    }>)

    // Calculer les pourcentages
    Object.keys(liquidityData).forEach(level => {
      liquidityData[level].percentage = totalValue > 0 ? (liquidityData[level].value / totalValue) * 100 : 0
    })

    // Ordonner par liquidité décroissante
    const orderedLevels = ['Immédiate', 'Court terme', 'Moyen terme', 'Long terme']
    const liquidityLevels = orderedLevels.filter(level => liquidityData[level])

    // Calculer les métriques de liquidité
    const immediateValue = liquidityData['Immédiate']?.value || 0
    const shortTermValue = liquidityData['Court terme']?.value || 0
    const liquidityRatio = totalValue > 0 ? ((immediateValue + shortTermValue) / totalValue) * 100 : 0

    return (
      <div className="space-y-6">
        {/* Vue d'ensemble de la liquidité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Analyse de Liquidité
            </CardTitle>
            <CardDescription>Disponibilité et échéances des actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-green-600">
                  {formatPercentage(liquidityRatio)}
                </div>
                <div className="text-sm text-muted-foreground">Ratio de liquidité</div>
                <div className="text-xs text-muted-foreground mt-1">
                  (Immédiate + Court terme)
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(immediateValue + shortTermValue, { currency: filters.currency })}
                </div>
                <div className="text-sm text-muted-foreground">Liquidité accessible</div>
                <div className="text-xs text-muted-foreground mt-1">
                  (≤ 3 jours)
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-orange-600">
                  {liquidityLevels.length}
                </div>
                <div className="text-sm text-muted-foreground">Niveaux de liquidité</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Diversification temporelle
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par niveau de liquidité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Répartition par Niveau de Liquidité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liquidityLevels.map(level => {
                const data = liquidityData[level]
                return (
                  <div key={level} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: data.color }}
                      />
                      <div>
                        <div className="font-medium">{level}</div>
                        <div className="text-sm text-muted-foreground">
                          Délai: {data.days} • {data.count} actif{data.count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(data.value, { currency: filters.currency })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercentage(data.percentage)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Analyse et recommandations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Analyse et Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Évaluation du Profil</h4>
                <div className="space-y-3">
                  {liquidityRatio >= 50 && (
                    <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                      <div className="text-sm font-medium text-green-900">Excellente liquidité</div>
                      <div className="text-sm text-green-700">
                        Plus de 50% de vos actifs sont facilement mobilisables
                      </div>
                    </div>
                  )}
                  {liquidityRatio >= 25 && liquidityRatio < 50 && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <div className="text-sm font-medium text-blue-900">Bonne liquidité</div>
                      <div className="text-sm text-blue-700">
                        Équilibre satisfaisant entre liquidité et rendement
                      </div>
                    </div>
                  )}
                  {liquidityRatio < 25 && (
                    <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                      <div className="text-sm font-medium text-orange-900">Liquidité limitée</div>
                      <div className="text-sm text-orange-700">
                        Considérez renforcer votre réserve de liquidités
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Recommandations</h4>
                <div className="space-y-3">
                  {liquidityRatio < 15 && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <div className="text-sm font-medium text-red-900">Action requise</div>
                      <div className="text-sm text-red-700">
                        Constituez une réserve d'urgence de 3-6 mois de charges
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <div className="text-sm font-medium text-blue-900">Optimisation</div>
                    <div className="text-sm text-blue-700">
                      Équilibrez rendement et accessibilité selon vos besoins
                    </div>
                  </div>

                  {Object.keys(liquidityData).length < 3 && (
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                      <div className="text-sm font-medium text-yellow-900">Diversification</div>
                      <div className="text-sm text-yellow-700">
                        Diversifiez vos échéances pour plus de flexibilité
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Détail par actif */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Détail par Actif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liquidityLevels.map(level => {
                const data = liquidityData[level]
                return (
                  <div key={level}>
                    <h5 className="font-medium text-sm mb-2 flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: data.color }}
                      />
                      {level} ({data.days})
                    </h5>
                    <div className="grid grid-cols-1 gap-2 ml-5">
                      {data.assets.map(asset => (
                        <div key={asset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{asset.name}</span>
                            <span className="text-muted-foreground">({asset.assetType.name})</span>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(asset.value, { currency: filters.currency })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStressTestReport = () => {
    // Définir les scénarios de stress avec impact par type d'actif
    const stressScenarios = [
      {
        name: 'Krach Boursier',
        description: 'Chute des marchés actions de 30%',
        probability: 'Faible (5-10 ans)',
        impacts: {
          'Actions': -30,
          'ETF': -25,
          'Obligations': -5,
          'Immobilier': -10,
          'Épargne': 0,
          'Cryptomonnaies': -50,
          'default': -15
        },
        color: '#EF4444'
      },
      {
        name: 'Crise Immobilière',
        description: 'Baisse de l\'immobilier de 20%',
        probability: 'Modérée (3-5 ans)',
        impacts: {
          'Immobilier': -20,
          'SCPI': -15,
          'Actions': -10,
          'Obligations': 5,
          'Épargne': 0,
          'default': -5
        },
        color: '#F59E0B'
      },
      {
        name: 'Inflation Élevée',
        description: 'Inflation persistante à 6%/an',
        probability: 'Élevée (1-2 ans)',
        impacts: {
          'Épargne': -6,
          'Obligations': -8,
          'Immobilier': 3,
          'Actions': -2,
          'Cryptomonnaies': 10,
          'Matières Premières': 15,
          'default': -3
        },
        color: '#8B5CF6'
      },
      {
        name: 'Crise de Liquidité',
        description: 'Assèchement du crédit',
        probability: 'Faible (10+ ans)',
        impacts: {
          'Immobilier': -25,
          'Actions': -20,
          'Obligations': -3,
          'Épargne': 0,
          'Private Equity': -30,
          'default': -12
        },
        color: '#EC4899'
      }
    ]

    // Calculer l'impact de chaque scénario sur le portefeuille
    const scenarioResults = stressScenarios.map(scenario => {
      let totalLoss = 0
      let totalValue = 0
      const impactsByType: Record<string, { value: number; loss: number; impactRate: number }> = {}

      filteredAssets.forEach(asset => {
        const latestValuation = asset.valuations[0]
        const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false }
        
        const relevantOwnerships = asset.ownerships.filter(ownership => 
          filters.entities.length === 0 || 
          filters.entities.includes(ownership.ownerEntity.id)
        )
        
        const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships)
        const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
        
        // Déterminer l'impact selon le type d'actif
        const assetTypeName = asset.assetType.name
        const impactRate = scenario.impacts[assetTypeName] || scenario.impacts['default']
        const loss = assetValue * (Math.abs(impactRate) / 100)
        
        if (!impactsByType[assetTypeName]) {
          impactsByType[assetTypeName] = { value: 0, loss: 0, impactRate }
        }
        
        impactsByType[assetTypeName].value += assetValue
        impactsByType[assetTypeName].loss += loss
        
        totalValue += assetValue
        if (impactRate < 0) {
          totalLoss += loss
        }
      })

      const totalImpactRate = totalValue > 0 ? (totalLoss / totalValue) * 100 : 0

      return {
        ...scenario,
        totalValue,
        totalLoss,
        totalImpactRate,
        impactsByType
      }
    })

    // Calculer le "worst case" (scénario le plus défavorable)
    const worstCaseScenario = scenarioResults.reduce((worst, current) => 
      current.totalLoss > worst.totalLoss ? current : worst
    )

    // Calculer les métriques de résistance
    const averageLoss = scenarioResults.reduce((sum, scenario) => sum + scenario.totalLoss, 0) / scenarioResults.length
    const maxLoss = Math.max(...scenarioResults.map(s => s.totalLoss))
    const resilientAssets = Object.entries(assetsByType).filter(([_, data]) => data.percentage > 0).length

    return (
      <div className="space-y-6">
        {/* Vue d'ensemble des tests de résistance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Tests de Résistance
            </CardTitle>
            <CardDescription>Simulation de scénarios de marché défavorables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-red-600">
                  -{formatPercentage(worstCaseScenario.totalImpactRate)}
                </div>
                <div className="text-sm text-muted-foreground">Pire scénario</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {worstCaseScenario.name}
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(maxLoss, { currency: filters.currency })}
                </div>
                <div className="text-sm text-muted-foreground">Perte maximale</div>
                <div className="text-xs text-muted-foreground mt-1">
                  En valeur absolue
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-blue-600">
                  {resilientAssets}
                </div>
                <div className="text-sm text-muted-foreground">Types d'actifs</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Diversification
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résultats par scénario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Résultats par Scénario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scenarioResults.map((result, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: result.color }}
                      />
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.description} • Probabilité: {result.probability}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">
                        -{formatCurrency(result.totalLoss, { currency: filters.currency })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        -{formatPercentage(result.totalImpactRate)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Détail par type d'actif */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    {Object.entries(result.impactsByType).map(([type, impact]) => (
                      <div key={type} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{type}</span>
                        <span className={`font-medium ${impact.impactRate < 0 ? 'text-red-600' : impact.impactRate > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {impact.impactRate > 0 ? '+' : ''}{impact.impactRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analyse de résistance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Analyse de Résistance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Profil de Risque</h4>
                <div className="space-y-3">
                  {worstCaseScenario.totalImpactRate <= 15 && (
                    <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                      <div className="text-sm font-medium text-green-900">Portefeuille Résilient</div>
                      <div className="text-sm text-green-700">
                        Votre portefeuille résiste bien aux chocs majeurs
                      </div>
                    </div>
                  )}
                  {worstCaseScenario.totalImpactRate > 15 && worstCaseScenario.totalImpactRate <= 30 && (
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                      <div className="text-sm font-medium text-yellow-900">Risque Modéré</div>
                      <div className="text-sm text-yellow-700">
                        Exposition significative aux crises sectorielles
                      </div>
                    </div>
                  )}
                  {worstCaseScenario.totalImpactRate > 30 && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <div className="text-sm font-medium text-red-900">Risque Élevé</div>
                      <div className="text-sm text-red-700">
                        Vulnérabilité importante aux chocs de marché
                      </div>
                    </div>
                  )}

                  <div className="p-3 border rounded">
                    <div className="text-sm font-medium">Perte moyenne</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(averageLoss, { currency: filters.currency })} sur {scenarioResults.length} scénarios
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Stratégies de Protection</h4>
                <div className="space-y-3">
                  {worstCaseScenario.totalImpactRate > 25 && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <div className="text-sm font-medium text-blue-900">Diversification</div>
                      <div className="text-sm text-blue-700">
                        Renforcez la diversification sectorielle et géographique
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <div className="text-sm font-medium text-purple-900">Actifs Défensifs</div>
                    <div className="text-sm text-purple-700">
                      Augmentez la part d'obligations et de liquidités
                    </div>
                  </div>

                  {scenarioResults.some(s => s.name === 'Inflation Élevée' && s.totalImpactRate > 5) && (
                    <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                      <div className="text-sm font-medium text-orange-900">Protection Inflation</div>
                      <div className="text-sm text-orange-700">
                        Considérez les actifs réels (immobilier, matières premières)
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 border-l-4 border-gray-500 rounded">
                    <div className="text-sm font-medium text-gray-900">Suivi Régulier</div>
                    <div className="text-sm text-gray-700">
                      Réévaluez ces tests tous les 6 mois
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stress test détaillé par actif */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Impact Détaillé par Actif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Actif</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-right p-2">Valeur Actuelle</th>
                    {scenarioResults.slice(0, 3).map((scenario, index) => (
                      <th key={index} className="text-right p-2" style={{ color: scenario.color }}>
                        {scenario.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => {
                    const latestValuation = asset.valuations[0]
                    const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false }
                    
                    const relevantOwnerships = asset.ownerships.filter(ownership => 
                      filters.entities.length === 0 || 
                      filters.entities.includes(ownership.ownerEntity.id)
                    )
                    
                    const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships)
                    const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
                    
                    return (
                      <tr key={asset.id} className="border-b">
                        <td className="p-2 font-medium">{asset.name}</td>
                        <td className="p-2 text-muted-foreground">{asset.assetType.name}</td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(assetValue, { currency: filters.currency })}
                        </td>
                        {scenarioResults.slice(0, 3).map((scenario, index) => {
                          const impactRate = scenario.impacts[asset.assetType.name] || scenario.impacts['default']
                          const loss = assetValue * (Math.abs(impactRate) / 100)
                          return (
                            <td key={index} className="p-2 text-right">
                              <span className={`${impactRate < 0 ? 'text-red-600' : impactRate > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                {impactRate > 0 ? '+' : ''}{impactRate}%
                              </span>
                              <div className="text-xs text-muted-foreground">
                                {impactRate < 0 ? '-' : '+'}{formatCurrency(loss, { currency: filters.currency })}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderProjectionReport = () => {
    // Définir les hypothèses de croissance par type d'actif (rendement annuel moyen)
    const growthAssumptions = {
      'Actions': { optimistic: 10, realistic: 7, pessimistic: 3 },
      'ETF': { optimistic: 9, realistic: 6.5, pessimistic: 2.5 },
      'Obligations': { optimistic: 4, realistic: 2.5, pessimistic: 0.5 },
      'Immobilier': { optimistic: 6, realistic: 4, pessimistic: 1 },
      'Épargne': { optimistic: 2, realistic: 1.5, pessimistic: 0.5 },
      'Cryptomonnaies': { optimistic: 25, realistic: 12, pessimistic: -5 },
      'SCPI': { optimistic: 5, realistic: 3.5, pessimistic: 1 },
      'Assurance-vie': { optimistic: 4, realistic: 3, pessimistic: 1.5 },
      'default': { optimistic: 6, realistic: 4, pessimistic: 1 }
    }

    // Horizons de projection
    const timeHorizons = [1, 3, 5, 10, 15, 20]

    // Calculer les projections pour chaque scénario
    const calculateProjections = (scenario: 'optimistic' | 'realistic' | 'pessimistic') => {
      return timeHorizons.map(years => {
        let totalProjectedValue = 0
        const assetProjections: Record<string, number> = {}

        filteredAssets.forEach(asset => {
          const latestValuation = asset.valuations[0]
          const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false }
          
          const relevantOwnerships = asset.ownerships.filter(ownership => 
            filters.entities.length === 0 || 
            filters.entities.includes(ownership.ownerEntity.id)
          )
          
          const userOwnershipPercentage = calculateOwnershipPercentage(relevantOwnerships)
          const currentAssetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
          
          // Obtenir le taux de croissance selon le type d'actif
          const assetTypeName = asset.assetType.name
          const growthRate = growthAssumptions[assetTypeName]?.[scenario] || growthAssumptions['default'][scenario]
          
          // Calculer la valeur projetée avec intérêts composés
          const projectedValue = currentAssetValue * Math.pow(1 + (growthRate / 100), years)
          
          if (!assetProjections[assetTypeName]) {
            assetProjections[assetTypeName] = 0
          }
          assetProjections[assetTypeName] += projectedValue
          totalProjectedValue += projectedValue
        })

        return {
          years,
          totalValue: totalProjectedValue,
          assetProjections,
          growth: totalProjectedValue - totalValue,
          growthRate: totalValue > 0 ? ((totalProjectedValue / totalValue) - 1) * 100 : 0
        }
      })
    }

    const optimisticProjections = calculateProjections('optimistic')
    const realisticProjections = calculateProjections('realistic')
    const pessimisticProjections = calculateProjections('pessimistic')

    // Calculer quelques métriques clés
    const projection10Years = realisticProjections.find(p => p.years === 10)
    const projection5Years = realisticProjections.find(p => p.years === 5)
    const averageAnnualGrowth = projection10Years ? Math.pow(projection10Years.totalValue / totalValue, 1/10) - 1 : 0

    // Simuler l'impact d'épargne régulière
    const monthlyContribution = 1000 // Exemple : 1000€/mois
    const calculateWithContributions = (years: number, annualReturn: number) => {
      const monthlyReturn = annualReturn / 12 / 100
      const months = years * 12
      
      // Valeur actuelle projetée
      const currentValueProjected = totalValue * Math.pow(1 + annualReturn / 100, years)
      
      // Valeur des versements réguliers (formule d'annuité)
      const contributionsValue = monthlyContribution * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn)
      
      return currentValueProjected + contributionsValue
    }

    return (
      <div className="space-y-6">
        {/* Vue d'ensemble des projections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Projections Patrimoniales
            </CardTitle>
            <CardDescription>Évolution prévisionnelle à long terme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(projection10Years?.totalValue || 0, { currency: filters.currency })}
                </div>
                <div className="text-sm text-muted-foreground">Projection 10 ans</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Scénario réaliste
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-blue-600">
                  +{formatPercentage(averageAnnualGrowth * 100)}
                </div>
                <div className="text-sm text-muted-foreground">Croissance annuelle</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Moyenne projetée
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency((projection10Years?.growth || 0), { currency: filters.currency })}
                </div>
                <div className="text-sm text-muted-foreground">Plus-value potentielle</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Sur 10 ans
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scénarios de projection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Scénarios de Croissance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Horizon</th>
                    <th className="text-right p-2 text-green-600">Optimiste</th>
                    <th className="text-right p-2 text-blue-600">Réaliste</th>
                    <th className="text-right p-2 text-orange-600">Pessimiste</th>
                    <th className="text-right p-2">Écart Min-Max</th>
                  </tr>
                </thead>
                <tbody>
                  {timeHorizons.map(years => {
                    const optimistic = optimisticProjections.find(p => p.years === years)
                    const realistic = realisticProjections.find(p => p.years === years)
                    const pessimistic = pessimisticProjections.find(p => p.years === years)
                    
                    const minValue = Math.min(optimistic?.totalValue || 0, realistic?.totalValue || 0, pessimistic?.totalValue || 0)
                    const maxValue = Math.max(optimistic?.totalValue || 0, realistic?.totalValue || 0, pessimistic?.totalValue || 0)
                    
                    return (
                      <tr key={years} className="border-b">
                        <td className="p-2 font-medium">{years} an{years > 1 ? 's' : ''}</td>
                        <td className="p-2 text-right text-green-600 font-medium">
                          {formatCurrency(optimistic?.totalValue || 0, { currency: filters.currency })}
                          <div className="text-xs text-green-500">
                            +{formatPercentage(optimistic?.growthRate || 0)}
                          </div>
                        </td>
                        <td className="p-2 text-right text-blue-600 font-medium">
                          {formatCurrency(realistic?.totalValue || 0, { currency: filters.currency })}
                          <div className="text-xs text-blue-500">
                            +{formatPercentage(realistic?.growthRate || 0)}
                          </div>
                        </td>
                        <td className="p-2 text-right text-orange-600 font-medium">
                          {formatCurrency(pessimistic?.totalValue || 0, { currency: filters.currency })}
                          <div className="text-xs text-orange-500">
                            +{formatPercentage(pessimistic?.growthRate || 0)}
                          </div>
                        </td>
                        <td className="p-2 text-right text-muted-foreground">
                          {formatCurrency(maxValue - minValue, { currency: filters.currency })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Impact de l'épargne régulière */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Impact de l'Épargne Régulière
            </CardTitle>
            <CardDescription>
              Simulation avec versements mensuels de {formatCurrency(monthlyContribution, { currency: filters.currency })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Avec Épargne Régulière</h4>
                <div className="space-y-3">
                  {[5, 10, 15, 20].map(years => {
                    const withContributions = calculateWithContributions(years, 4) // 4% de rendement moyen
                    const withoutContributions = realisticProjections.find(p => p.years === years)?.totalValue || 0
                    const contributionImpact = withContributions - withoutContributions
                    
                    return (
                      <div key={years} className="flex justify-between items-center p-3 border rounded">
                        <span className="font-medium">{years} ans</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(withContributions, { currency: filters.currency })}
                          </div>
                          <div className="text-sm text-green-600">
                            +{formatCurrency(contributionImpact, { currency: filters.currency })} grâce à l'épargne
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Métriques d'Épargne</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <div className="text-sm font-medium text-blue-900">Effort d'épargne recommandé</div>
                    <div className="text-sm text-blue-700">
                      10-15% du revenu net
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <div className="text-sm font-medium text-green-900">Impact 20 ans</div>
                    <div className="text-sm text-green-700">
                      L'épargne régulière pourrait doubler votre patrimoine
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <div className="text-sm font-medium text-purple-900">Effet composé</div>
                    <div className="text-sm text-purple-700">
                      Les intérêts génèrent eux-mêmes des intérêts
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hypothèses et recommandations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Hypothèses et Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Hypothèses de Rendement (Annuel)</h4>
                <div className="space-y-2">
                  {Object.entries(assetsByType).map(([type, data]) => {
                    const assumptions = growthAssumptions[type] || growthAssumptions['default']
                    return (
                      <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: data.color }}
                          />
                          <span>{type}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-green-600">{assumptions.optimistic}%</span>
                          <span className="mx-1 text-blue-600">{assumptions.realistic}%</span>
                          <span className="text-orange-600">{assumptions.pessimistic}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Recommandations Stratégiques</h4>
                <div className="space-y-3">
                  {averageAnnualGrowth < 0.03 && (
                    <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                      <div className="text-sm font-medium text-orange-900">Diversification</div>
                      <div className="text-sm text-orange-700">
                        Votre allocation semble conservative. Considérez plus d'actions.
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <div className="text-sm font-medium text-blue-900">Rééquilibrage</div>
                    <div className="text-sm text-blue-700">
                      Rééquilibrez votre portefeuille chaque année
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <div className="text-sm font-medium text-green-900">Horizon de temps</div>
                    <div className="text-sm text-green-700">
                      Plus l'horizon est long, plus les risques peuvent être pris
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <div className="text-sm font-medium text-purple-900">Révision</div>
                    <div className="text-sm text-purple-700">
                      Révisez ces projections tous les 2-3 ans
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projection détaillée par type d'actif */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Évolution par Type d'Actif (10 ans)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(assetsByType).map(([type, currentData]) => {
                const projection = projection10Years?.assetProjections[type] || 0
                const growth = projection - currentData.value
                const growthRate = currentData.value > 0 ? ((projection / currentData.value) - 1) * 100 : 0
                
                return (
                  <div key={type} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: currentData.color }}
                      />
                      <div>
                        <div className="font-medium">{type}</div>
                        <div className="text-sm text-muted-foreground">
                          Actuellement: {formatCurrency(currentData.value, { currency: filters.currency })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(projection, { currency: filters.currency })}
                      </div>
                      <div className="text-sm text-green-600">
                        +{formatCurrency(growth, { currency: filters.currency })} ({formatPercentage(growthRate)})
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderConsolidationReport = () => {
    // Calculer les données par entité
    const entitiesData = entities.map(entity => {
      const entityAssets = filteredAssets.filter(asset => 
        asset.ownerships.some(ownership => ownership.ownerEntity.id === entity.id)
      )
      
      let totalValue = 0
      const assetsByType: Record<string, { value: number; count: number; color: string }> = {}
      
      entityAssets.forEach(asset => {
        const latestValuation = asset.valuations[0]
        const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false }
        
        const entityOwnership = asset.ownerships.find(ownership => ownership.ownerEntity.id === entity.id)
        const ownershipPercentage = entityOwnership ? entityOwnership.percentage : 0
        const assetValue = (validatedValuation.value * ownershipPercentage) / 100
        
        totalValue += assetValue
        
        const typeName = asset.assetType.name
        if (!assetsByType[typeName]) {
          assetsByType[typeName] = { 
            value: 0, 
            count: 0, 
            color: asset.assetType.color || '#6B7280' 
          }
        }
        assetsByType[typeName].value += assetValue
        assetsByType[typeName].count += 1
      })
      
      // Calculer l'indice de diversification de cette entité
      const typeValues = Object.values(assetsByType).map(type => type.value)
      const herfindahlIndex = typeValues.reduce((sum, value) => {
        const percentage = totalValue > 0 ? value / totalValue : 0
        return sum + Math.pow(percentage, 2)
      }, 0)
      
      return {
        ...entity,
        totalValue,
        assetsByType,
        assetsCount: entityAssets.length,
        typesCount: Object.keys(assetsByType).length,
        herfindahlIndex,
        diversificationScore: 1 / herfindahlIndex // Plus c'est élevé, plus c'est diversifié
      }
    }).filter(entity => entity.totalValue > 0) // Filtrer les entités sans actifs

    // Métriques globales consolidées
    const globalTotalValue = entitiesData.reduce((sum, entity) => sum + entity.totalValue, 0)
    const globalAssetsCount = entitiesData.reduce((sum, entity) => sum + entity.assetsCount, 0)
    const averageDiversification = entitiesData.length > 0 
      ? entitiesData.reduce((sum, entity) => sum + entity.diversificationScore, 0) / entitiesData.length 
      : 0

    // Analyse des relations entre entités
    const crossEntityAssets = filteredAssets.filter(asset => asset.ownerships.length > 1)
    const sharedAssetsValue = crossEntityAssets.reduce((sum, asset) => {
      const latestValuation = asset.valuations[0]
      const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false }
      return sum + validatedValuation.value
    }, 0)

    // Consolidation par type d'actif global
    const globalAssetsByType = entitiesData.reduce((acc, entity) => {
      Object.entries(entity.assetsByType).forEach(([type, data]) => {
        if (!acc[type]) {
          acc[type] = { value: 0, count: 0, color: data.color, percentage: 0 }
        }
        acc[type].value += data.value
        acc[type].count += data.count
      })
      return acc
    }, {} as Record<string, { value: number; count: number; color: string; percentage: number }>)

    // Calculer les pourcentages globaux
    Object.keys(globalAssetsByType).forEach(type => {
      globalAssetsByType[type].percentage = globalTotalValue > 0 
        ? (globalAssetsByType[type].value / globalTotalValue) * 100 
        : 0
    })

    // Détecter les déséquilibres
    const getBalanceRecommendations = () => {
      const recommendations: Array<{ type: 'warning' | 'info' | 'success'; title: string; description: string }> = []
      
      // Vérifier la concentration par entité
      const largestEntity = entitiesData.reduce((max, entity) => 
        entity.totalValue > max.totalValue ? entity : max
      , entitiesData[0] || { totalValue: 0 })
      
      if (largestEntity && globalTotalValue > 0 && (largestEntity.totalValue / globalTotalValue) > 0.7) {
        recommendations.push({
          type: 'warning',
          title: 'Concentration élevée',
          description: `${largestEntity.name} représente ${((largestEntity.totalValue / globalTotalValue) * 100).toFixed(1)}% du patrimoine total`
        })
      }

      // Vérifier les entités peu diversifiées
      const poorlyDiversified = entitiesData.filter(entity => entity.typesCount < 3 && entity.totalValue > globalTotalValue * 0.1)
      if (poorlyDiversified.length > 0) {
        recommendations.push({
          type: 'warning',
          title: 'Diversification limitée',
          description: `${poorlyDiversified.length} entité(s) avec moins de 3 types d'actifs`
        })
      }

      // Actifs partagés
      if (crossEntityAssets.length > 0) {
        recommendations.push({
          type: 'info',
          title: 'Actifs partagés détectés',
          description: `${crossEntityAssets.length} actif(s) détenus par plusieurs entités`
        })
      }

      // Équilibre global
      if (entitiesData.length > 1 && averageDiversification > 2) {
        recommendations.push({
          type: 'success',
          title: 'Bonne diversification',
          description: 'Les entités présentent une diversification satisfaisante'
        })
      }

      return recommendations
    }

    const recommendations = getBalanceRecommendations()

    return (
      <div className="space-y-6">
        {/* Vue d'ensemble consolidée */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Consolidation Multi-Entités
            </CardTitle>
            <CardDescription>Vue consolidée de toutes les entités</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(globalTotalValue, { currency: filters.currency })}
                </div>
                <div className="text-sm text-muted-foreground">Patrimoine Total</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Toutes entités confondues
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-green-600">
                  {entitiesData.length}
                </div>
                <div className="text-sm text-muted-foreground">Entités Actives</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Avec actifs valorisés
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-purple-600">
                  {globalAssetsCount}
                </div>
                <div className="text-sm text-muted-foreground">Actifs Total</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Répartis entre entités
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-3xl font-bold text-orange-600">
                  {crossEntityAssets.length}
                </div>
                <div className="text-sm text-muted-foreground">Actifs Partagés</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Multi-détention
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par entité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Répartition par Entité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entitiesData
                .sort((a, b) => b.totalValue - a.totalValue)
                .map(entity => {
                  const entityPercentage = globalTotalValue > 0 ? (entity.totalValue / globalTotalValue) * 100 : 0
                  return (
                    <div key={entity.id} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg ${entity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'}`}>
                              {entity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'}
                            </span>
                            <div>
                              <div className="font-medium">{entity.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {entity.type === 'PHYSICAL_PERSON' ? 'Personne physique' : 'Personne morale'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(entity.totalValue, { currency: filters.currency })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPercentage(entityPercentage)} du total
                          </div>
                        </div>
                      </div>
                      
                      {/* Métriques de l'entité */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{entity.assetsCount}</div>
                          <div className="text-xs text-muted-foreground">Actifs</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{entity.typesCount}</div>
                          <div className="text-xs text-muted-foreground">Types</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{entity.diversificationScore.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">Diversification</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className={`font-medium ${entity.herfindahlIndex < 0.3 ? 'text-green-600' : entity.herfindahlIndex < 0.5 ? 'text-orange-600' : 'text-red-600'}`}>
                            {entity.herfindahlIndex < 0.3 ? 'Bien' : entity.herfindahlIndex < 0.5 ? 'Moyen' : 'Faible'}
                          </div>
                          <div className="text-xs text-muted-foreground">Équilibre</div>
                        </div>
                      </div>

                      {/* Répartition par type d'actif de l'entité */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(entity.assetsByType)
                          .sort(([,a], [,b]) => b.value - a.value)
                          .map(([type, data]) => {
                            const typePercentage = entity.totalValue > 0 ? (data.value / entity.totalValue) * 100 : 0
                            return (
                              <div key={type} className="flex justify-between items-center p-2 bg-white border rounded text-sm">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: data.color }}
                                  />
                                  <span>{type}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    {formatCurrency(data.value, { currency: filters.currency })}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatPercentage(typePercentage)}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* Consolidation globale par type d'actif */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Consolidation Globale par Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(globalAssetsByType)
                .sort(([,a], [,b]) => b.value - a.value)
                .map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: data.color }}
                      />
                      <div>
                        <div className="font-medium">{type}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.count} actif{data.count > 1 ? 's' : ''} • Réparti sur {
                            entitiesData.filter(entity => entity.assetsByType[type]).length
                          } entité{entitiesData.filter(entity => entity.assetsByType[type]).length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(data.value, { currency: filters.currency })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercentage(data.percentage)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Analyse et recommandations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Analyse et Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Recommandations Détectées</h4>
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className={`p-3 border-l-4 rounded ${
                      rec.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                      rec.type === 'success' ? 'bg-green-50 border-green-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className={`text-sm font-medium ${
                        rec.type === 'warning' ? 'text-orange-900' :
                        rec.type === 'success' ? 'text-green-900' :
                        'text-blue-900'
                      }`}>
                        {rec.title}
                      </div>
                      <div className={`text-sm ${
                        rec.type === 'warning' ? 'text-orange-700' :
                        rec.type === 'success' ? 'text-green-700' :
                        'text-blue-700'
                      }`}>
                        {rec.description}
                      </div>
                    </div>
                  ))}
                  
                  {recommendations.length === 0 && (
                    <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                      <div className="text-sm font-medium text-green-900">Structure optimale</div>
                      <div className="text-sm text-green-700">
                        Aucun déséquilibre majeur détecté
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Optimisations Suggérées</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <div className="text-sm font-medium text-blue-900">Rééquilibrage</div>
                    <div className="text-sm text-blue-700">
                      Rééquilibrez entre entités pour optimiser la fiscalité
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <div className="text-sm font-medium text-purple-900">Diversification</div>
                    <div className="text-sm text-purple-700">
                      Évitez la duplication d'actifs similaires entre entités
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <div className="text-sm font-medium text-green-900">Transmission</div>
                    <div className="text-sm text-green-700">
                      Planifiez la transmission entre personnes physiques et morales
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actifs partagés (si applicable) */}
        {crossEntityAssets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Actifs à Détention Multiple
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {crossEntityAssets.map(asset => {
                  const latestValuation = asset.valuations[0]
                  const validatedValuation = latestValuation ? validateValuation(latestValuation) : { value: 0, currency: 'EUR', isValid: false }
                  
                  return (
                    <div key={asset.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(validatedValuation.value, { currency: validatedValuation.currency })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {asset.assetType.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {asset.ownerships.map(ownership => (
                          <div key={ownership.ownerEntity.id} className="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded text-sm">
                            <span className={ownership.ownerEntity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'}>
                              {ownership.ownerEntity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'}
                            </span>
                            <span>{ownership.ownerEntity.name}</span>
                            <span className="font-medium">{ownership.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderReport = () => {
    switch (filters.reportType) {
      case 'performance':
        return renderPerformanceReport()
      case 'diversification':
        return renderDiversificationReport()
      case 'fiscal':
        return renderFiscalReport()
      case 'liquidite':
        return renderLiquidityReport()
      case 'stress_test':
        return renderStressTestReport()
      case 'projection':
        return renderProjectionReport()
      case 'consolidation':
        return renderConsolidationReport()
      default:
        return renderBilanComplet()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-2xl font-bold">
            {getReportTitle()}
          </h2>
          <p className="text-muted-foreground">
            {filteredAssets.length} actifs • {formatCurrency(totalValue, { currency: filters.currency })} • {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileText className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileText className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Contenu du rapport */}
      <div id="report-content" className="space-y-6">
        {/* En-tête pour impression/export */}
        <div className="hidden print:block">
          <h1 className="text-3xl font-bold text-center mb-2">{getReportTitle()}</h1>
          <p className="text-center text-muted-foreground mb-4">
            Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
          </p>
          <div className="border-b-2 border-gray-200 mb-6"></div>
        </div>

        {/* Rendu du rapport */}
        {renderReport()}
      </div>
    </div>
  )
} 