"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface PatrimoineData {
  name: string
  value: number
  percentage: number
  color: string
}

interface PatrimoineChartProps {
  data: PatrimoineData[]
}

// Fonction pour tronquer les noms longs
const truncateName = (name: string, maxLength: number = 15) => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + '...';
};

// Fonction pour obtenir un label personnalisé pour le pie chart
const renderCustomLabel = ({ name, percentage }: { name: string; percentage: number }) => {
  if (percentage < 5) return ''; // Ne pas afficher les labels pour les segments < 5%
  return `${truncateName(name, 12)}: ${percentage.toFixed(1)}%`;
};

export function PatrimoineChart({ data }: PatrimoineChartProps) {
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