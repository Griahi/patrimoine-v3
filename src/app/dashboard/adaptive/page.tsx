import { Suspense } from 'react';
import AdaptiveDashboard from '@/components/dashboard/AdaptiveDashboard';

export default function AdaptiveDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <AdaptiveDashboard />
    </Suspense>
  );
} 