'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Progress({ value, max = 100, className, size = 'md' }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-gray-200',
        sizeClasses[size],
        className
      )}
    >
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
} 