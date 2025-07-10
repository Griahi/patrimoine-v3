"use client"

import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ChartData } from '@/types/ai'

interface ChartRendererProps {
  data: ChartData
  className?: string
}

// Fonction pour tronquer les noms longs
const truncateName = (name: string, maxLength: number = 15) => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + '...';
};

export default function ChartRenderer({ data, className = '' }: ChartRendererProps) {
  const { type, data: chartData, config } = data;
  
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
  
  // Fonction pour formater les valeurs
  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k€`;
    }
    return `${value.toFixed(0)}€`;
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={config?.yAxisKey || 'value'} 
                stroke={colors[0]} 
                strokeWidth={3}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend />
              <Bar 
                dataKey={config?.yAxisKey || 'value'} 
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
                stroke="#fff"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => {
                  const percent = typeof percentage === 'number' ? percentage : 0;
                  return percent >= 5 ? `${truncateName(name, 12)}: ${percent.toFixed(1)}%` : '';
                }}
                outerRadius={120}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
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
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value: string) => truncateName(value, 20)}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={config?.yAxisKey || 'value'} 
                stroke={colors[0]} 
                fill={colors[0]}
                fillOpacity={0.3}
                strokeWidth={2}
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
    <Card className={`${className} w-full`}>
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