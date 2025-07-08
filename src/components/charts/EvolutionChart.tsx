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
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
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