"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface PatrimoineData {
  name: string
  value: number
  percentage: number
  color: string
}

interface PatrimoineChartProps {
  data: PatrimoineData[]
}

export function PatrimoineChart({ data }: PatrimoineChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name} ${percentage}%`}
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