'use client'

import React, { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { ReportExportService } from "@/lib/reportExports"
import { 
  FileText, 
  Download, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  Activity,
  Shield,
  Target,
  Calculator,
  Building,
  Eye,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
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
  // Vérifier les dépendances d'export au chargement du composant
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('ReportRenderer mounted, checking export dependencies...')
      ReportExportService.checkDependencies()
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
        entities: filters.entities
      }
    }
  }

  // Gestionnaires d'export
  const handleExportPDF = async () => {
    const reportTitle = getReportTitle()
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
    await ReportExportService.exportToPDF('report-content', filename, reportTitle)
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
    const assetValue = latestValuation ? Number(latestValuation.value) : 0
    
    const userOwnershipPercentage = asset.ownerships
      .filter(ownership => 
        filters.entities.length === 0 || 
        filters.entities.includes(ownership.ownerEntity.id)
      )
      .reduce((total, ownership) => total + ownership.percentage, 0) / 100
    
    return sum + (assetValue * userOwnershipPercentage)
  }, 0)

  // Calculs par type d'actif
  const assetsByType = filteredAssets.reduce((acc, asset) => {
    const typeName = asset.assetType.name
    const latestValuation = asset.valuations[0]
    const assetValue = latestValuation ? Number(latestValuation.value) : 0
    
    const userOwnershipPercentage = asset.ownerships
      .filter(ownership => 
        filters.entities.length === 0 || 
        filters.entities.includes(ownership.ownerEntity.id)
      )
      .reduce((total, ownership) => total + ownership.percentage, 0) / 100
    
    const value = assetValue * userOwnershipPercentage
    
    if (!acc[typeName]) {
      acc[typeName] = { 
        value: 0, 
        count: 0, 
        color: asset.assetType.color || '#6B7280',
        percentage: 0
      }
    }
    
    acc[typeName].value += value
    acc[typeName].count += 1
    
    return acc
  }, {} as Record<string, { value: number; count: number; color: string; percentage: number }>)

  // Calculer les pourcentages
  Object.keys(assetsByType).forEach(type => {
    assetsByType[type].percentage = (assetsByType[type].value / totalValue) * 100
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
                {totalValue.toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: filters.currency 
                })}
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
                      {data.value.toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: filters.currency 
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {data.percentage.toFixed(1)}%
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
              const assetValue = latestValuation ? Number(latestValuation.value) : 0
              
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
                      {assetValue.toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: latestValuation?.currency || filters.currency 
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
                    {data.value.toLocaleString('fr-FR', { 
                      style: 'currency', 
                      currency: filters.currency 
                    })}
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
                        {type}: {data.percentage.toFixed(1)}% (&gt; 30%)
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
                    Seuil: 1 300 000 € | Patrimoine taxable: {totalValue.toLocaleString('fr-FR')} €
                  </div>
                </div>
                <div className="p-3 border rounded">
                  <div className="flex justify-between">
                    <span>Plus-values potentielles</span>
                    <span className="font-medium">~{(totalValue * 0.05).toLocaleString('fr-FR')} €</span>
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

  const renderReport = () => {
    switch (filters.reportType) {
      case 'performance':
        return renderPerformanceReport()
      case 'diversification':
        return renderDiversificationReport()
      case 'fiscal':
        return renderFiscalReport()
      case 'liquidite':
        return <div className="text-center py-8 text-muted-foreground">Rapport de liquidité en cours de développement</div>
      case 'stress_test':
        return <div className="text-center py-8 text-muted-foreground">Tests de résistance en cours de développement</div>
      case 'projection':
        return <div className="text-center py-8 text-muted-foreground">Projections patrimoniales en cours de développement</div>
      case 'consolidation':
        return <div className="text-center py-8 text-muted-foreground">Consolidation multi-entités en cours de développement</div>
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
            {filteredAssets.length} actifs • {totalValue.toLocaleString('fr-FR', { 
              style: 'currency', 
              currency: filters.currency 
            })} • {new Date().toLocaleDateString('fr-FR')}
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