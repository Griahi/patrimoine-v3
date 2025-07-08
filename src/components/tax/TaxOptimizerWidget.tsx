'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calculator, TrendingUp, Euro, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TaxOptimizerWidgetProps {
  userId: string;
}

interface TaxSummary {
  currentBurden: number;
  potentialSavings: number;
  optimizationsCount: number;
}

export default function TaxOptimizerWidget({ userId }: TaxOptimizerWidgetProps) {
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTaxSummary();
  }, [userId]);

  const loadTaxSummary = async () => {
    try {
      const [analysisResponse, optimizationsResponse] = await Promise.all([
        fetch(`/api/tax/analysis/${userId}`),
        fetch(`/api/tax/optimize/${userId}`)
      ]);

      if (analysisResponse.ok && optimizationsResponse.ok) {
        const analysis = await analysisResponse.json();
        const optimizations = await optimizationsResponse.json();

        const eligibleOptimizations = optimizations.filter((opt: any) => opt.eligibility.isEligible);
        const potentialSavings = eligibleOptimizations.reduce((sum: number, opt: any) => sum + opt.estimatedSavings, 0);

        setSummary({
          currentBurden: analysis.currentBurden.total,
          potentialSavings,
          optimizationsCount: eligibleOptimizations.length
        });
      }
    } catch (error) {
      console.error('Error loading tax summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calculator className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Données fiscales indisponibles</p>
        </CardContent>
      </Card>
    );
  }

  const savingsPercentage = summary.currentBurden > 0 ? 
    (summary.potentialSavings / summary.currentBurden) * 100 : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/tax')}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-blue-600" />
          Optimiseur Fiscal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Charge actuelle</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(summary.currentBurden)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Économies possibles</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(summary.potentialSavings)}
            </p>
          </div>
        </div>

        {summary.optimizationsCount > 0 && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">
                  {summary.optimizationsCount} optimisation{summary.optimizationsCount > 1 ? 's' : ''} trouvée{summary.optimizationsCount > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-green-600">
                  Réduction possible: {savingsPercentage.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        )}

        <Button 
          className="w-full" 
          onClick={(e) => {
            e.stopPropagation();
            router.push('/tax');
          }}
        >
          Voir les optimisations
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
} 