'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  PredictionChartProps, 
  ChartDataPoint, 
  AssetPrediction, 
  PortfolioPrediction 
} from '@/types/predictions';
import { format, parseISO, addDays, addMonths, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';

const PredictionChart: React.FC<PredictionChartProps> = ({
  assetId,
  portfolioData,
  selectedHorizon: initialHorizon,
  showConfidenceInterval: initialShowConfidence,
  height = 400,
  onHorizonChange,
  onExportChart
}) => {
  const [viewMode, setViewMode] = useState<'line' | 'area'>('area');
  const [showHistorical, setShowHistorical] = useState(true);
  const [selectedHorizon, setSelectedHorizon] = useState<'1M' | '6M' | '1Y' | '5Y'>(initialHorizon);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(initialShowConfidence);

  const chartData = useMemo(() => {
    if (!portfolioData) return [];

    const data: ChartDataPoint[] = [];
    const currentDate = new Date();
    const currentValue = portfolioData.totalCurrentValue;

    // Points historiques (simulés pour la démo)
    if (showHistorical) {
      for (let i = 90; i >= 0; i--) {
        const date = addDays(currentDate, -i);
        const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
        const historicalValue = currentValue * (1 + variation * i / 90);
        
        data.push({
          date: format(date, 'yyyy-MM-dd'),
          historical: historicalValue,
          isProjection: false
        });
      }
    }

    // Point actuel
    data.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      historical: currentValue,
      predicted: currentValue,
      upperBound: currentValue,
      lowerBound: currentValue,
      isProjection: false
    });

    // Points de prédiction
    const prediction = portfolioData.predictions[selectedHorizon];
    if (prediction && prediction.value !== undefined) {
      const daysToPredict = getHorizonDays(selectedHorizon);
      const steps = Math.min(20, daysToPredict); // Maximum 20 points pour la visualisation

      for (let i = 1; i <= steps; i++) {
        const futureDate = addDays(currentDate, (daysToPredict / steps) * i);
        const progress = i / steps;
        
        // Interpolation linéaire pour la prédiction
        const predictedValue = currentValue + (prediction.value - currentValue) * progress;
        const upperBound = prediction.confidence?.upper !== undefined 
          ? currentValue + (prediction.confidence.upper - currentValue) * progress 
          : predictedValue * 1.1;
        const lowerBound = prediction.confidence?.lower !== undefined 
          ? currentValue + (prediction.confidence.lower - currentValue) * progress 
          : predictedValue * 0.9;

        data.push({
          date: format(futureDate, 'yyyy-MM-dd'),
          predicted: predictedValue,
          upperBound: showConfidenceInterval ? upperBound : undefined,
          lowerBound: showConfidenceInterval ? lowerBound : undefined,
          isProjection: true
        });
      }
    }

    return data;
  }, [portfolioData, selectedHorizon, showConfidenceInterval, showHistorical]);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd MMM yy', { locale: fr });
  };

  const getHorizonColor = (horizon: string) => {
    switch (horizon) {
      case '1M': return '#10b981'; // Green
      case '6M': return '#3b82f6'; // Blue
      case '1Y': return '#f59e0b'; // Orange
      case '5Y': return '#ef4444'; // Red
      default: return '#6b7280';
    }
  };

  const currentValue = portfolioData?.totalCurrentValue || 0;
  const prediction = portfolioData?.predictions[selectedHorizon];
  const projectedGain = (prediction?.value && currentValue) ? prediction.value - currentValue : 0;
  const projectedGainPercent = currentValue > 0 ? (projectedGain / currentValue) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.dataKey}:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🔮 Prédictions ML
          </h3>
          <p className="text-sm text-gray-600">
            Projections basées sur l'intelligence artificielle
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportChart || (() => alert('Fonctionnalité d\'export à venir'))}
            className="text-xs"
          >
            📊 Exporter
          </Button>
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Sélecteur d'horizon */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Horizon:</span>
          <div className="flex gap-1">
            {(['1M', '6M', '1Y', '5Y'] as const).map((horizon) => (
              <Button
                key={horizon}
                variant={selectedHorizon === horizon ? 'default' : 'outline'}
                size="sm"
                onClick={() => onHorizonChange ? onHorizonChange(horizon) : setSelectedHorizon(horizon)}
                className="text-xs px-3 py-1"
                style={{
                  backgroundColor: selectedHorizon === horizon ? getHorizonColor(horizon) : undefined,
                  borderColor: getHorizonColor(horizon)
                }}
              >
                {horizon}
              </Button>
            ))}
          </div>
        </div>

        {/* Contrôles d'affichage */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showHistorical}
              onChange={(e) => setShowHistorical(e.target.checked)}
              className="rounded"
            />
            Historique
          </label>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showConfidenceInterval}
              onChange={(e) => setShowConfidenceInterval(e.target.checked)}
              className="rounded"
            />
            Intervalle de confiance
          </label>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'line' | 'area')}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="area">Zone</option>
            <option value="line">Ligne</option>
          </select>
        </div>
      </div>

      {/* Métriques clés */}
      {prediction && prediction.value !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatValue(prediction.value || 0)}
            </div>
            <div className="text-sm text-gray-600">Valeur prédite</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${projectedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {projectedGain >= 0 ? '+' : ''}{formatValue(projectedGain)}
            </div>
            <div className="text-sm text-gray-600">Gain/Perte</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${projectedGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {projectedGainPercent >= 0 ? '+' : ''}{projectedGainPercent.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Performance</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {((prediction.confidence?.level || 0.95) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Confiance</div>
          </div>
        </div>
      )}

      {/* Graphique */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => formatValue(value)}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Zone de confiance */}
              {showConfidenceInterval && (
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill={getHorizonColor(selectedHorizon)}
                  fillOpacity={0.1}
                  name="Intervalle de confiance"
                />
              )}
              
              {showConfidenceInterval && (
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                />
              )}

              {/* Ligne historique */}
              {showHistorical && (
                <Area
                  type="monotone"
                  dataKey="historical"
                  stroke="#6b7280"
                  fill="#6b7280"
                  fillOpacity={0.2}
                  name="Historique"
                />
              )}

              {/* Ligne de prédiction */}
              <Area
                type="monotone"
                dataKey="predicted"
                stroke={getHorizonColor(selectedHorizon)}
                fill={getHorizonColor(selectedHorizon)}
                fillOpacity={0.3}
                strokeWidth={2}
                name="Prédiction"
              />

              {/* Ligne de référence actuelle */}
              <ReferenceLine 
                y={currentValue} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label="Valeur actuelle"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => formatValue(value)}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Lignes de confiance */}
              {showConfidenceInterval && (
                <>
                  <Line
                    type="monotone"
                    dataKey="upperBound"
                    stroke={getHorizonColor(selectedHorizon)}
                    strokeOpacity={0.5}
                    strokeDasharray="2 2"
                    dot={false}
                    name="Limite haute"
                  />
                  <Line
                    type="monotone"
                    dataKey="lowerBound"
                    stroke={getHorizonColor(selectedHorizon)}
                    strokeOpacity={0.5}
                    strokeDasharray="2 2"
                    dot={false}
                    name="Limite basse"
                  />
                </>
              )}

              {/* Ligne historique */}
              {showHistorical && (
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#6b7280"
                  strokeWidth={2}
                  dot={false}
                  name="Historique"
                />
              )}

              {/* Ligne de prédiction */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke={getHorizonColor(selectedHorizon)}
                strokeWidth={3}
                dot={false}
                name="Prédiction"
              />

              {/* Ligne de référence actuelle */}
              <ReferenceLine 
                y={currentValue} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label="Valeur actuelle"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Informations sur le modèle */}
      {portfolioData && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
            <Badge variant="outline">
              🧠 Modèle LSTM
            </Badge>
            <Badge variant="outline">
              📊 {portfolioData.assetBreakdown.length} actifs analysés
            </Badge>
            <Badge variant="outline">
              🎯 Confiance {(prediction?.confidence?.level || 0.95) * 100}%
            </Badge>
            <Badge variant="outline">
              🕒 Mis à jour {format(parseISO(portfolioData.lastUpdated), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
};

// Fonction utilitaire pour convertir l'horizon en jours
function getHorizonDays(horizon: '1M' | '6M' | '1Y' | '5Y'): number {
  switch (horizon) {
    case '1M': return 30;
    case '6M': return 180;
    case '1Y': return 365;
    case '5Y': return 1825;
    default: return 365;
  }
}

export default PredictionChart; 