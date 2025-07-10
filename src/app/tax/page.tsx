import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import TaxOptimizer from '@/components/tax/TaxOptimizer';
import { getServerSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Optimiseur Fiscal | Gestion de Patrimoine',
  description: 'Optimisez votre fiscalité avec des stratégies personnalisées et un simulateur intelligent.',
};

export default async function TaxPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login?callbackUrl=/tax');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Optimiseur Fiscal Intelligent
        </h1>
        <p className="text-gray-600 text-lg">
          Analysez votre situation fiscale et découvrez des stratégies d'optimisation personnalisées
        </p>
      </div>

      <TaxOptimizer userId={session.user.id} />
    </div>
  );
} 