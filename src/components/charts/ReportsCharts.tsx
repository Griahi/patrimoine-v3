"use client"

import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'

// Types
interface AssetTypeData {
  name: string
  value: number
  count: number
  color: string
}

interface EntityData {
  name: string
  value: number
  type: string
}

interface EvolutionData {
  month: string
  value: number
}

// Fonction pour tronquer les noms longs
const truncateName = (name: string, maxLength: number = 15) => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + '...';
};

// Fonction pour obtenir un label personnalisé pour le pie chart
const renderCustomLabel = ({ name, percent }: { name: string; percent: number }) => {
  if (percent < 0.05) return ''; // Ne pas afficher les labels pour les segments < 5%
  return `${truncateName(name, 12)}: ${(percent * 100).toFixed(1)}%`;
};

// Asset Distribution Chart
interface AssetDistributionChartProps {
  data: AssetTypeData[]
}

export function AssetDistributionChart({ data }: AssetDistributionChartProps) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: string) => [
              new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value),
              'Valeur'
            ]}
            labelFormatter={(label) => `${label}`}
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
    </div>
  )
}

// Assets by Entity Chart
interface AssetsByEntityChartProps {
  data: EntityData[]
}

export function AssetsByEntityChart({ data }: AssetsByEntityChartProps) {
  // Tronquer les noms des entités pour éviter les chevauchements
  const processedData = data.map(item => ({
    ...item,
    displayName: truncateName(item.name, 15)
  }));

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="displayName"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => `${Math.round(value / 1000)}k€`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: any, name: string) => [
              new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value),
              'Valeur'
            ]}
            labelFormatter={(label) => {
              // Retrouver le nom complet
              const originalItem = data.find(item => truncateName(item.name, 15) === label);
              return originalItem ? originalItem.name : label;
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <Bar 
            dataKey="value" 
            fill="#4F46E5"
            radius={[4, 4, 0, 0]}
            stroke="#fff"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Portfolio Evolution Chart
interface PortfolioEvolutionChartProps {
  data: EvolutionData[]
}

export function PortfolioEvolutionChart({ data }: PortfolioEvolutionChartProps) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => `${Math.round(value / 1000)}k€`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: any) => [
              new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value),
              'Valeur du patrimoine'
            ]}
            labelFormatter={(label) => `Mois: ${label}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#4F46E5" 
            strokeWidth={3}
            dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#4F46E5', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 