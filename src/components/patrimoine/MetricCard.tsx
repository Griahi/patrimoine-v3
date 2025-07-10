import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/financial-calculations';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  currency?: string;
}

export function MetricCard({ 
  icon, 
  label, 
  value, 
  subtext, 
  variant = 'default',
  currency = 'EUR'
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600';
      case 'danger':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-900';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-500';
      case 'danger':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <Card className={`${getVariantStyles()} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-white ${getIconColor()}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{label}</p>
              <p className={`text-2xl font-bold ${getValueColor()}`}>
                {formatCurrency(value)}
              </p>
              {subtext && (
                <p className="text-xs text-gray-500 mt-1">{subtext}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 