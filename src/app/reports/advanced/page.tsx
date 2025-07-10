'use client'

import { useState, useEffect, useCallback } from 'react'
import { redirect } from 'next/navigation'
import { useSession } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import ReportFilters from '@/components/reports/ReportFilters'
import ReportRenderer from '@/components/reports/ReportRenderer'
import { useReportsEntityFilter } from '@/hooks/useEntityFilter'
import { 
  FileText, 
  ArrowLeft,
  Filter
} from "lucide-react"
import Link from 'next/link'

interface Entity {
  id: string
  name: string
  type: string
  userId: string
  metadata?: Record<string, unknown>
  notes?: string
}

interface Asset {
  id: string
  name: string
  description?: string
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

export default function AdvancedReportsPage() {
  const { status } = useSession()
  const [entities, setEntities] = useState<Entity[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    selectedEntityIds,
    setSelectedEntityIds,
    hasSelection
  } = useReportsEntityFilter()

  const [filters, setFilters] = useState<FilterState>(() => ({
    period: 'ytd',
    entities: selectedEntityIds,
    assets: [],
    currency: 'EUR',
    reportType: 'bilan_complet',
    includeProjections: false,
    liquidityFilter: 'all',
    geographicFilter: 'all',
    fiscalOptimization: false
  }))

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Charger les entités
      const entitiesResponse = await fetch('/api/entities')
      if (!entitiesResponse.ok) {
        throw new Error('Failed to load entities')
      }
      const entitiesData = await entitiesResponse.json()

      // Charger les actifs avec filtrage par entités
      const entityQueryParam = hasSelection && selectedEntityIds.length > 0 
        ? `?entityIds=${selectedEntityIds.join(',')}` 
        : ''
      
      const assetsResponse = await fetch(`/api/assets${entityQueryParam}`)
      if (!assetsResponse.ok) {
        throw new Error('Failed to load assets')
      }
      const assetsData = await assetsResponse.json()

      setEntities(entitiesData)
      setAssets(assetsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [hasSelection, selectedEntityIds])

  useEffect(() => {
    if (status === 'authenticated') {
      loadData()
    }
  }, [status, loadData])

  // Gestionnaire de changement de filtres
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    // Mettre à jour les entités sélectionnées via le hook
    setSelectedEntityIds(newFilters.entities)
  }, [setSelectedEntityIds])

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/login?callbackUrl=/reports/advanced')
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">❌ Erreur</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadData} variant="outline">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux rapports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Rapports Avancés</h1>
            <p className="text-muted-foreground">
              Analyses détaillées avec filtrage par entités
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {selectedEntityIds.length > 0 
              ? `${selectedEntityIds.length} entité${selectedEntityIds.length > 1 ? 's' : ''} sélectionnée${selectedEntityIds.length > 1 ? 's' : ''}`
              : 'Toutes les entités'
            }
          </span>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres de Rapport
          </CardTitle>
          <CardDescription>
            Personnalisez votre rapport en sélectionnant les entités, la période et les options d'analyse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters
            entities={entities}
            assets={assets}
            onFiltersChange={handleFiltersChange}
            loading={loading}
          />
        </CardContent>
      </Card>

      <hr className="border-t border-border" />

      {/* Renderer de rapport */}
      <ReportRenderer
        assets={assets}
        entities={entities}
        filters={filters}
        loading={loading}
      />

      {/* Résumé des filtres actifs */}
      {(filters.entities.length > 0 || filters.assets.length > 0 || filters.period !== 'ytd' || filters.currency !== 'EUR' || filters.reportType !== 'bilan_complet') && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Filtres actifs:</span>
                <div className="flex flex-wrap gap-2">
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
                  {filters.reportType !== 'bilan_complet' && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {filters.reportType}
                    </span>
                  )}
                  {filters.period !== 'ytd' && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {filters.period}
                    </span>
                  )}
                  {filters.currency !== 'EUR' && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {filters.currency}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const defaultFilters = {
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
                  setSelectedEntityIds([])
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information d'aide */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                Filtrage par Entités
              </h3>
              <p className="text-sm text-blue-700">
                Sélectionnez une ou plusieurs entités pour filtrer les données du rapport. 
                Les métriques et graphiques s'adapteront automatiquement à votre sélection.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <strong>Conseil:</strong> Utilisez le filtrage pour analyser le patrimoine familial, 
                comparer différentes entités ou vous concentrer sur des actifs spécifiques.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 