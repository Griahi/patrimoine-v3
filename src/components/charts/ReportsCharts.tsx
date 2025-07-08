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
  ResponsiveContainer 
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

// Asset Distribution Chart
interface AssetDistributionChartProps {
  data: AssetTypeData[]
}

export function AssetDistributionChart({ data }: AssetDistributionChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => 
              `${name}: ${(percent * 100).toFixed(1)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [
            new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value),
            'Valeur'
          ]} />
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
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tickFormatter={(value) => `${value / 1000}k€`} />
          <Tooltip formatter={(value: any) => [
            new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value),
            'Valeur'
          ]} />
          <Bar dataKey="value" fill="#4F46E5" />
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
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `${value / 1000}k€`} />
          <Tooltip formatter={(value: any) => [
            new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value),
            'Valeur du patrimoine'
          ]} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#4F46E5" 
            strokeWidth={2}
            dot={{ fill: '#4F46E5' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 