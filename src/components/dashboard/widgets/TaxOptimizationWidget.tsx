"use client";

import React from 'react';
import { DollarSign, Calculator } from 'lucide-react';
import { WidgetProps } from '@/types/dashboard';

export default function TaxOptimizationWidget({ config, onInteraction, isPreview }: WidgetProps) {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Optimisation fiscale</h3>
        <DollarSign className="h-4 w-4 text-gray-400" />
      </div>

      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <div className="text-sm">Widget en développement</div>
        </div>
      </div>
    </div>
  );
} 