"use client";

import React from 'react';
import { PatrimoineContainer } from '@/components/patrimoine';
import { CategoryData } from '@/utils/treemap-calculations';
import { toast } from 'sonner';

export default function TreemapPage() {
  // Gérer les détails d'une catégorie
  const handleCategoryDetail = (category: CategoryData) => {
    toast.info(`Exploration de la catégorie: ${category.nom}`);
    // Ici on pourrait ouvrir un modal ou naviguer vers une page de détail
    console.log('Category detail:', category);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header de la page */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Visualisation du Patrimoine
          </h1>
          <p className="text-gray-600">
            Analyse interactive de la répartition de votre patrimoine par catégories
          </p>
        </div>

        {/* Composant principal */}
        <PatrimoineContainer
          height={600}
          onCategoryDetail={handleCategoryDetail}
        />
      </div>
    </div>
  );
} 