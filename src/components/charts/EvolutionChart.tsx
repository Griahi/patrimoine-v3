"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface EvolutionData {
  month: string
  value: number
}

interface EvolutionChartProps {
  data: EvolutionData[]
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
              'Valeur'
            ]}
            labelFormatter={(label) => `Mois: ${label}`}
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