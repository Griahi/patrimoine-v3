"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"

interface ValuationData {
  date: string
  value: number
  assetId: string
  assetName: string
  assetType: string
}

interface TrendsChartProps {
  valuations: ValuationData[]
  assets: Array<{
    id: string
    name: string
    assetType: { name: string; color?: string }
  }>
}

export function ValuationTrendsChart({ valuations, assets }: TrendsChartProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ALL')
  const [period, setPeriod] = useState<string>('6M')

  const filteredData = useMemo(() => {
    let data = valuations

    // Filtrer par actif
    if (selectedAssetId !== 'ALL') {
      data = data.filter(v => v.assetId === selectedAssetId)
    }

    // Filtrer par période
    const now = new Date()
    const periodDays = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '2Y': 730,
      'ALL': Infinity
    }

    const cutoffDate = new Date(now.getTime() - (periodDays[period as keyof typeof periodDays] * 24 * 60 * 60 * 1000))
    data = data.filter(v => new Date(v.date) >= cutoffDate)

    // Grouper par date et sommer les valeurs
    const grouped = data.reduce((acc, val) => {
      const date = val.date
      if (!acc[date]) {
        acc[date] = { date, value: 0, details: [] }
      }
      acc[date].value += val.value
      acc[date].details.push({
        assetName: val.assetName,
        value: val.value,
        assetType: val.assetType
      })
      return acc
    }, {} as Record<string, { date: string; value: number; details: Array<{ assetName: string; value: number; assetType: string }> }>)

    return Object.values(grouped).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [valuations, selectedAssetId, period])

      const statistics = useMemo(() => {
    if (filteredData.length < 2) return null

    const values = filteredData.map(d => d.value)
    const firstValue = values[0]
    const lastValue = values[values.length - 1]
    const change = lastValue - firstValue
    const changePercent = (change / firstValue) * 100
    
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const volatility = Math.sqrt(
      values.reduce((sum, val) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        return sum + Math.pow(val - avg, 2)
      }, 0) / values.length
    )

    return {
      change,
      changePercent,
      maxValue,
      minValue,
      volatility,
      currentValue: lastValue
    }
  }, [filteredData])

  // Graphique simple sans recharts pour éviter les dépendances
  const SimpleLineChart = ({ data }: { data: Array<{ date: string; value: number }> }) => {
    if (data.length === 0) return null

    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = Math.min(...data.map(d => d.value))
    const range = maxValue - minValue || 1

    return (
      <div className="relative h-64 w-full bg-gray-50 rounded-lg p-4">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grille */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Ligne du graphique */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={data.map((d, i) => {
              const x = (i / (data.length - 1)) * 380 + 10
              const y = 190 - ((d.value - minValue) / range) * 180
              return `${x},${y}`
            }).join(' ')}
          />
          
          {/* Points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 380 + 10
            const y = 190 - ((d.value - minValue) / range) * 180
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )
          })}
        </svg>
        
        {/* Légendes */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-600">
          {data.length > 0 && new Date(data[0].date).toLocaleDateString('fr-FR')}
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-600">
          {data.length > 0 && new Date(data[data.length - 1].date).toLocaleDateString('fr-FR')}
        </div>
        <div className="absolute top-2 left-2 text-xs text-gray-600">
          {maxValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </div>
        <div className="absolute bottom-12 left-2 text-xs text-gray-600">
          {minValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Évolution des Valorisations
          </CardTitle>
          <div className="flex space-x-2">
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les actifs</SelectItem>
                {assets.map(asset => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1M">1M</SelectItem>
                <SelectItem value="3M">3M</SelectItem>
                <SelectItem value="6M">6M</SelectItem>
                <SelectItem value="1Y">1Y</SelectItem>
                <SelectItem value="2Y">2Y</SelectItem>
                <SelectItem value="ALL">Tout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistiques */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Valeur Actuelle</div>
              <div className="text-lg font-bold text-green-700">
                {statistics.currentValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Évolution</div>
              <div className={`text-lg font-bold flex items-center justify-center ${
                statistics.change >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {statistics.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {statistics.changePercent.toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">Maximum</div>
              <div className="text-lg font-bold text-gray-700">
                {statistics.maxValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">Minimum</div>
              <div className="text-lg font-bold text-gray-700">
                {statistics.minValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
            </div>
          </div>
        )}

        {/* Graphique */}
        {filteredData.length > 0 ? (
          <SimpleLineChart data={filteredData} />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune donnée disponible pour la période sélectionnée</p>
            </div>
          </div>
        )}

        {/* Détails des points de données */}
        {filteredData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Détails des valorisations</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {filteredData.slice(0, 10).map((point, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">
                    {new Date(point.date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-blue-600 font-bold">
                    {point.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              ))}
              {filteredData.length > 10 && (
                <div className="text-center text-xs text-gray-500">
                  ... et {filteredData.length - 10} autres valorisations
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 