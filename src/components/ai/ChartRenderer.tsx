"use client"

import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartData } from '@/types/ai';

interface ChartRendererProps {
  data: ChartData;
  className?: string;
}

export default function ChartRenderer({ data, className = '' }: ChartRendererProps) {
  const { type, data: chartData, config } = data;

  // Couleurs par défaut
  const defaultColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const colors = config?.colors || defaultColors;

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config?.xAxisKey || 'x'} 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip 
                formatter={(value: any) => [formatValue(value), config?.yAxisKey || 'Valeur']}
                labelFormatter={(label) => `${config?.xAxisKey || 'Période'}: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={config?.yAxisKey || 'value'} 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config?.xAxisKey || 'x'} 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip 
                formatter={(value: any) => [formatValue(value), config?.yAxisKey || 'Valeur']}
                labelFormatter={(label) => `${config?.xAxisKey || 'Catégorie'}: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey={config?.yAxisKey || 'value'} 
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage})`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry: unknown, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: string) => [
                  formatValue(value), 
                  name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config?.xAxisKey || 'x'} 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip 
                formatter={(value: any) => [formatValue(value), config?.yAxisKey || 'Valeur']}
                labelFormatter={(label) => `${config?.xAxisKey || 'Période'}: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={config?.yAxisKey || 'value'} 
                stroke={colors[0]} 
                fill={colors[0]}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-32 text-gray-500">
            Type de graphique non supporté: {type}
          </div>
        );
    }
  };

  return (
    <Card className={className}>
      {config?.title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{config.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}

// Fonction utilitaire pour formater les valeurs
function formatValue(value: unknown): string {
  if (typeof value === 'number') {
    // Si c'est un montant en euros (valeur > 1000)
    if (value >= 1000) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    // Si c'est un pourcentage (valeur < 1)
    if (value < 1 && value > -1) {
      return `${(value * 100).toFixed(2)}%`;
    }
    
    // Autres nombres
    return value.toFixed(2);
  }
  
  return String(value);
} 