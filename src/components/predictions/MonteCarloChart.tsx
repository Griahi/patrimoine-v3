'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MonteCarloChartProps, MonteCarloScenario } from '@/types/predictions';

const MonteCarloChart: React.FC<MonteCarloChartProps> = ({
  result,
  showPercentiles = true,
  highlightedScenarios = [],
  onScenarioHover
}) => {
  const [viewMode, setViewMode] = useState<'distribution' | 'paths' | 'statistics'>('distribution');
  const [selectedPercentiles, setSelectedPercentiles] = useState(['p5', 'p25', 'p50', 'p75', 'p95']);

  // Préparer les données pour l'histogramme de distribution
  const distributionData = useMemo(() => {
    const bins = 50;
    const minValue = Math.min(...result.scenarios.map(s => s.finalValue));
    const maxValue = Math.max(...result.scenarios.map(s => s.finalValue));
    const binWidth = (maxValue - minValue) / bins;

    const histogram = Array(bins).fill(0).map((_, i) => ({
      binStart: minValue + i * binWidth,
      binEnd: minValue + (i + 1) * binWidth,
      count: 0,
      probability: 0
    }));

    result.scenarios.forEach(scenario => {
      const binIndex = Math.min(
        Math.floor((scenario.finalValue - minValue) / binWidth),
        bins - 1
      );
      histogram[binIndex].count++;
    });

    // Calculer les probabilités
    histogram.forEach(bin => {
      bin.probability = (bin.count / result.totalScenarios) * 100;
    });

    return histogram;
  }, [result]);

  // Préparer les données pour afficher les chemins de quelques scénarios
  const pathsData = useMemo(() => {
    // Sélectionner quelques scénarios représentatifs
    const selectedScenarios = [
      result.worstCaseScenario,
      ...result.scenarios.filter((_, i) => i % Math.floor(result.scenarios.length / 8) === 0).slice(0, 6),
      result.bestCaseScenario
    ];

    const maxPathLength = Math.max(...selectedScenarios.map(s => s.path.length));
    const pathsData = [];

    for (let i = 0; i < maxPathLength; i++) {
      const dataPoint: any = { step: i };
      selectedScenarios.forEach((scenario, index) => {
        if (i < scenario.path.length) {
          dataPoint[`scenario_${index}`] = scenario.path[i];
        }
      });
      pathsData.push(dataPoint);
    }

    return { pathsData, selectedScenarios };
  }, [result]);

  // Données des percentiles
  const percentilesData = useMemo(() => {
    return [
      { name: 'P5', value: result.statistics.percentiles.p5, color: '#ef4444' },
      { name: 'P10', value: result.statistics.percentiles.p10, color: '#f97316' },
      { name: 'P25', value: result.statistics.percentiles.p25, color: '#f59e0b' },
      { name: 'P50', value: result.statistics.percentiles.p50, color: '#10b981' },
      { name: 'P75', value: result.statistics.percentiles.p75, color: '#3b82f6' },
      { name: 'P90', value: result.statistics.percentiles.p90, color: '#6366f1' },
      { name: 'P95', value: result.statistics.percentiles.p95, color: '#8b5cf6' }
    ];
  }, [result]);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getOutcomeColor = (value: number) => {
    if (value < result.currentValue * 0.8) return '#ef4444'; // Rouge - perte importante
    if (value < result.currentValue) return '#f97316'; // Orange - perte
    if (value < result.currentValue * 1.2) return '#10b981'; // Vert - gain modéré
    return '#3b82f6'; // Bleu - gain important
  };

  return (
    <Card className="p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🎲 Simulation Monte Carlo
          </h3>
          <p className="text-sm text-gray-600">
            {result.totalScenarios.toLocaleString()} scénarios sur {result.timeHorizonYears} ans
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            <option value="distribution">Distribution</option>
            <option value="paths">Chemins</option>
            <option value="statistics">Statistiques</option>
          </select>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {formatValue(result.statistics.mean)}
          </div>
          <div className="text-sm text-gray-600">Moyenne</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">
            {formatValue(result.statistics.median)}
          </div>
          <div className="text-sm text-gray-600">Médiane</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {formatPercent(result.probabilityAnalysis.probabilityOfGain * 100)}
          </div>
          <div className="text-sm text-gray-600">P(Gain)</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">
            {formatPercent(result.probabilityAnalysis.probabilityOfLoss * 100)}
          </div>
          <div className="text-sm text-gray-600">P(Perte)</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {formatPercent(result.probabilityAnalysis.probabilityOfDoubling * 100)}
          </div>
          <div className="text-sm text-gray-600">P(Doubler)</div>
        </div>
      </div>

      {/* Graphique principal */}
      <div className="h-96 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'distribution' && (
            <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="binStart"
                tickFormatter={formatValue}
                stroke="#6b7280"
                fontSize={10}
              />
              <YAxis 
                label={{ value: 'Probabilité (%)', angle: -90, position: 'insideLeft' }}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip 
                formatter={([value, name]: [number, string]) => [
                  `${value.toFixed(2)}%`,
                  'Probabilité'
                ]}
                labelFormatter={(value) => `Valeur: ${formatValue(value)}`}
              />
              <Bar 
                dataKey="probability" 
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth={1}
              >
                {distributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getOutcomeColor(entry.binStart)} 
                  />
                ))}
              </Bar>
              
              {/* Lignes de percentiles */}
              {showPercentiles && percentilesData.map((percentile) => (
                <ReferenceLine
                  key={percentile.name}
                  x={percentile.value}
                  stroke={percentile.color}
                  strokeDasharray="3 3"
                  label={{ value: percentile.name, position: 'top' }}
                />
              ))}
              
              {/* Ligne de valeur actuelle */}
              <ReferenceLine
                x={result.currentValue}
                stroke="#000000"
                strokeWidth={2}
                label={{ value: 'Actuel', position: 'top' }}
              />
            </BarChart>
          )}

          {viewMode === 'paths' && (
            <LineChart data={pathsData.pathsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="step"
                label={{ value: 'Étapes temporelles', position: 'insideBottom', offset: -5 }}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatValue}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip 
                formatter={([value]: [number]) => [formatValue(value), 'Valeur']}
                labelFormatter={(value) => `Étape ${value}`}
              />
              
              {pathsData.selectedScenarios.map((scenario, index) => (
                <Line
                  key={`scenario-${index}`}
                  type="monotone"
                  dataKey={`scenario_${index}`}
                  stroke={
                    scenario.scenarioId === result.worstCaseScenario.scenarioId ? '#ef4444' :
                    scenario.scenarioId === result.bestCaseScenario.scenarioId ? '#10b981' :
                    '#6b7280'
                  }
                  strokeWidth={
                    scenario.scenarioId === result.worstCaseScenario.scenarioId ||
                    scenario.scenarioId === result.bestCaseScenario.scenarioId ? 3 : 1
                  }
                  strokeOpacity={
                    scenario.scenarioId === result.worstCaseScenario.scenarioId ||
                    scenario.scenarioId === result.bestCaseScenario.scenarioId ? 1 : 0.6
                  }
                  dot={false}
                />
              ))}
              
              <ReferenceLine
                y={result.currentValue}
                stroke="#000000"
                strokeDasharray="5 5"
                label="Valeur initiale"
              />
            </LineChart>
          )}

          {viewMode === 'statistics' && (
            <BarChart data={percentilesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name"
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatValue}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip 
                formatter={([value]: [number]) => [formatValue(value), 'Valeur']}
              />
              <Bar dataKey="value">
                {percentilesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
              
              <ReferenceLine
                y={result.currentValue}
                stroke="#000000"
                strokeWidth={2}
                strokeDasharray="5 5"
                label="Valeur actuelle"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Scénarios extrêmes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 border-red-200 bg-red-50">
          <h4 className="font-semibold text-red-800 mb-2">🔻 Pire scénario</h4>
          <div className="text-2xl font-bold text-red-600">
            {formatValue(result.worstCaseScenario.finalValue)}
          </div>
          <div className="text-sm text-red-700 mt-1">
            Perte de {formatValue(result.currentValue - result.worstCaseScenario.finalValue)} 
            ({(((result.worstCaseScenario.finalValue - result.currentValue) / result.currentValue) * 100).toFixed(1)}%)
          </div>
          <div className="text-xs text-red-600 mt-2">
            Inflation: {(result.worstCaseScenario.parameters.inflation * 100).toFixed(1)}% • 
            Volatilité: {(result.worstCaseScenario.parameters.marketVolatility * 100).toFixed(1)}%
          </div>
        </Card>

        <Card className="p-4 border-green-200 bg-green-50">
          <h4 className="font-semibold text-green-800 mb-2">🔺 Meilleur scénario</h4>
          <div className="text-2xl font-bold text-green-600">
            {formatValue(result.bestCaseScenario.finalValue)}
          </div>
          <div className="text-sm text-green-700 mt-1">
            Gain de {formatValue(result.bestCaseScenario.finalValue - result.currentValue)} 
            ({(((result.bestCaseScenario.finalValue - result.currentValue) / result.currentValue) * 100).toFixed(1)}%)
          </div>
          <div className="text-xs text-green-600 mt-2">
            Inflation: {(result.bestCaseScenario.parameters.inflation * 100).toFixed(1)}% • 
            Rendement: {(result.bestCaseScenario.parameters.stockMarketReturn * 100).toFixed(1)}%
          </div>
        </Card>
      </div>

      {/* Percentiles détaillés */}
      {showPercentiles && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">📊 Percentiles des résultats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {percentilesData.map((percentile) => (
              <div key={percentile.name} className="text-center">
                <div 
                  className="text-lg font-bold"
                  style={{ color: percentile.color }}
                >
                  {formatValue(percentile.value)}
                </div>
                <div className="text-xs text-gray-600">{percentile.name}</div>
                <div className="text-xs text-gray-500">
                  {(((percentile.value - result.currentValue) / result.currentValue) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informations de simulation */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <Badge variant="outline">
            🎲 {result.totalScenarios.toLocaleString()} scénarios
          </Badge>
          <Badge variant="outline">
            ⏱️ {result.timeHorizonYears} ans
          </Badge>
          <Badge variant="outline">
            📈 Médiane: {formatValue(result.statistics.median)}
          </Badge>
          <Badge variant="outline">
            📊 Écart-type: {formatValue(result.statistics.standardDeviation)}
          </Badge>
          <Badge variant="outline">
            🕒 {new Date(result.runDate).toLocaleDateString('fr-FR')}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default MonteCarloChart; 