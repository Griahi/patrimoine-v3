'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown"
import { 
  Calendar,
  Filter,
  RotateCcw,
  Users,
  Globe,
  Coins,
  Tag,
  Target
} from "lucide-react"

interface Entity {
  id: string
  name: string
  type: string
}

interface Asset {
  id: string
  name: string
  assetType: {
    id: string
    name: string
    code: string
    color?: string
  }
  ownerships: {
    id: string
    percentage: number
    ownerEntity: Entity
  }[]
  valuations: {
    id: string
    value: number
    currency: string
    valuationDate: string
    source: string
  }[]
}

interface FilterState {
  period: string
  customStartDate?: string
  customEndDate?: string
  entities: string[]
  assets: string[]
  currency: string
  reportType: string
  includeProjections: boolean
  liquidityFilter: string
  geographicFilter: string
  fiscalOptimization: boolean
}

interface ReportFiltersProps {
  entities: Entity[]
  assets: Asset[]
  onFiltersChange: (filters: FilterState) => void
  loading?: boolean
}

export default function ReportFilters({ entities, assets, onFiltersChange, loading = false }: ReportFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    period: 'ytd',
    entities: [],
    assets: [],
    currency: 'EUR',
    reportType: 'bilan_complet',
    includeProjections: false,
    liquidityFilter: 'all',
    geographicFilter: 'all',
    fiscalOptimization: false
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const periods = [
    { value: 'current', label: 'Situation actuelle' },
    { value: 'ytd', label: 'Depuis début d\'année' },
    { value: '1m', label: '1 mois' },
    { value: '3m', label: '3 mois' },
    { value: '6m', label: '6 mois' },
    { value: '1y', label: '1 an' },
    { value: '3y', label: '3 ans' },
    { value: '5y', label: '5 ans' },
    { value: 'custom', label: 'Période personnalisée' }
  ]

  const reportTypes = [
    { value: 'bilan_complet', label: 'Bilan Patrimonial Complet', description: 'Vue d\'ensemble actif/passif détaillée' },
    { value: 'performance', label: 'Rapport de Performance', description: 'Analyse des rendements et performances' },
    { value: 'diversification', label: 'Analyse de Diversification', description: 'Répartition et concentration des risques' },
    { value: 'fiscal', label: 'Rapport Fiscal', description: 'Optimisation et obligations fiscales' },
    { value: 'liquidite', label: 'Analyse de Liquidité', description: 'Disponibilité et échéances des actifs' },
    { value: 'stress_test', label: 'Tests de Résistance', description: 'Simulations de scénarios de marché' },
    { value: 'projection', label: 'Projections Patrimoniales', description: 'Évolution prévisionnelle à long terme' },
    { value: 'consolidation', label: 'Consolidation Multi-Entités', description: 'Vue consolidée de toutes les entités' }
  ]

  const currencies = [
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'USD', label: 'Dollar US ($)', symbol: '$' },
    { value: 'GBP', label: 'Livre Sterling (£)', symbol: '£' },
    { value: 'CHF', label: 'Franc Suisse (CHF)', symbol: 'CHF' },
    { value: 'JPY', label: 'Yen Japonais (¥)', symbol: '¥' }
  ]

  const liquidityOptions = [
    { value: 'all', label: 'Tous les actifs' },
    { value: 'immediate', label: 'Liquidité immédiate (J+1)' },
    { value: 'short', label: 'Court terme (< 1 mois)' },
    { value: 'medium', label: 'Moyen terme (1-12 mois)' },
    { value: 'long', label: 'Long terme (> 1 an)' },
    { value: 'illiquid', label: 'Actifs illiquides' }
  ]

  const getAssetTypeIcon = (assetTypeCode: string): string => {
    const iconMap: Record<string, string> = {
      'real_estate': '🏠',
      'stock': '📈',
      'bond': '📊',
      'bank_account': '🏦',
      'cryptocurrency': '₿',
      'precious_metal': '🥇',
      'investment_fund': '📈',
      'life_insurance': '🛡️',
      'vehicle': '🚗',
      'valuable_object': '💎',
      'other': '📋'
    }
    return iconMap[assetTypeCode] || '📋'
  }

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const toggleEntity = (entityId: string) => {
    const newEntities = filters.entities.includes(entityId)
      ? filters.entities.filter(id => id !== entityId)
      : [...filters.entities, entityId]
    updateFilter('entities', newEntities)
  }

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      period: 'ytd',
      entities: [],
      assets: [],
      currency: 'EUR',
      reportType: 'bilan_complet',
      includeProjections: false,
      liquidityFilter: 'all',
      geographicFilter: 'all',
      fiscalOptimization: false
    }
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const getSelectedReportType = () => {
    return reportTypes.find(type => type.value === filters.reportType)
  }

  return (
    <div className="space-y-4">
      {/* Type de Rapport - Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Type de Rapport
          </CardTitle>
          <CardDescription>
            Sélectionnez le type d'analyse souhaité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={filters.reportType} onValueChange={(value) => updateFilter('reportType', value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getSelectedReportType() && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
              {getSelectedReportType()?.description}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtres Principaux */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              <div>
                <CardTitle>Filtres de Rapport</CardTitle>
                <CardDescription>Personnalisez les paramètres d'analyse</CardDescription>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Moins' : 'Plus'} d'options
              </Button>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Période */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Période d'analyse
              </Label>
              <Select value={filters.period} onValueChange={(value) => updateFilter('period', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center">
                <Coins className="h-4 w-4 mr-1" />
                Devise de référence
              </Label>
              <Select value={filters.currency} onValueChange={(value) => updateFilter('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates personnalisées */}
          {filters.period === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={filters.customStartDate || ''}
                  onChange={(e) => updateFilter('customStartDate', e.target.value)}
                />
              </div>
              <div>
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={filters.customEndDate || ''}
                  onChange={(e) => updateFilter('customEndDate', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Sélection d'entités */}
          <div>
            <Label className="flex items-center mb-2">
              <Users className="h-4 w-4 mr-1" />
              Entités à inclure {filters.entities.length > 0 && `(${filters.entities.length} sélectionnées)`}
            </Label>
            <MultiSelectDropdown
              options={entities.map(entity => ({
                id: entity.id,
                label: entity.name,
                value: entity.id,
                description: entity.type === 'INDIVIDUAL' ? 'Personne physique' : 'Personne morale',
                type: entity.type,
                icon: entity.type === 'INDIVIDUAL' ? '👤' : '🏢'
              }))}
              selectedValues={filters.entities}
              onSelectionChange={(selectedValues) => updateFilter('entities', selectedValues)}
              placeholder="Sélectionner des entités"
              searchPlaceholder="Rechercher une entité..."
              maxDisplayItems={2}
              showSelectAll={true}
              showClearAll={true}
              emptyStateText="Aucune entité disponible"
              loading={loading}
              loadingText="Chargement des entités..."
            />
            {filters.entities.length === 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                Aucune entité sélectionnée = toutes les entités incluses
              </div>
            )}
          </div>

          {/* Sélection d'actifs */}
          <div>
            <Label className="flex items-center mb-2">
              <Tag className="h-4 w-4 mr-1" />
              Actifs à inclure {filters.assets.length > 0 && `(${filters.assets.length} sélectionnés)`}
            </Label>
            <MultiSelectDropdown
              options={assets.map(asset => {
                const latestValuation = asset.valuations[0]
                const assetValue = latestValuation ? latestValuation.value : 0
                const valueFormatted = assetValue.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: latestValuation?.currency || 'EUR'
                })
                
                return {
                  id: asset.id,
                  label: asset.name,
                  value: asset.id,
                  description: `${asset.assetType.name} - ${valueFormatted}`,
                  type: asset.assetType.code,
                  icon: getAssetTypeIcon(asset.assetType.code)
                }
              })}
              selectedValues={filters.assets}
              onSelectionChange={(selectedValues) => updateFilter('assets', selectedValues)}
              placeholder="Sélectionner des actifs"
              searchPlaceholder="Rechercher un actif..."
              maxDisplayItems={3}
              showSelectAll={true}
              showClearAll={true}
              emptyStateText="Aucun actif disponible"
              loading={loading}
              loadingText="Chargement des actifs..."
            />
            {filters.assets.length === 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                Aucun actif sélectionné = tous les actifs inclus
              </div>
            )}
          </div>

          {/* Options avancées */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="flex items-center mb-2">
                  <Globe className="h-4 w-4 mr-1" />
                  Filtre de liquidité
                </Label>
                <Select value={filters.liquidityFilter} onValueChange={(value) => updateFilter('liquidityFilter', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {liquidityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeProjections}
                    onChange={(e) => updateFilter('includeProjections', e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Inclure les projections</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.fiscalOptimization}
                    onChange={(e) => updateFilter('fiscalOptimization', e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Analyse fiscale</span>
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aperçu des filtres actifs */}
      {(filters.entities.length > 0 || filters.assets.length > 0 || filters.period !== 'ytd' || filters.currency !== 'EUR') && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Filtres actifs:</span>
                <div className="flex flex-wrap gap-1">
                  {filters.entities.length > 0 && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {filters.entities.length} entité{filters.entities.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {filters.assets.length > 0 && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {filters.assets.length} actif{filters.assets.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {filters.period !== 'ytd' && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {periods.find(p => p.value === filters.period)?.label}
                    </span>
                  )}
                  {filters.currency !== 'EUR' && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {currencies.find(c => c.value === filters.currency)?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 