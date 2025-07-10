import { Asset, Entity, Valuation } from '@/types/assets';

/**
 * Convertit une date string ou Date en objet Date
 */
const ensureDate = (date: string | Date): Date => {
  if (date instanceof Date) return date;
  return new Date(date);
};

/**
 * Calcule la valeur totale du patrimoine basée sur les actifs et leurs valorisations
 * Évite les doublons et valide les valeurs
 */
export const calculatePortfolioValue = (assets: Asset[]): number => {
  console.log('🔢 Calcul du patrimoine total...');
  console.log('📊 Nombre d\'actifs reçus:', assets.length);
  
  if (!assets || !Array.isArray(assets)) {
    console.warn('⚠️ Assets invalides:', assets);
    return 0;
  }

  let totalValue = 0;
  const processedAssets: { id: string; name: string; value: number }[] = [];
  
  assets.forEach((asset, index) => {
    try {
      // Vérifier que l'actif a un ID unique pour éviter les doublons
      if (!asset.id) {
        console.warn(`⚠️ Actif ${index} sans ID:`, asset);
        return;
      }

      // Vérifier si déjà traité (éviter doublons)
      if (processedAssets.find(p => p.id === asset.id)) {
        console.warn(`⚠️ Actif dupliqué détecté: ${asset.name} (${asset.id})`);
        return;
      }

      const latestValuation = asset.valuations?.[0];
      if (!latestValuation || !latestValuation.value) {
        console.log(`ℹ️ Actif sans valorisation: ${asset.name}`);
        processedAssets.push({ id: asset.id, name: asset.name, value: 0 });
        return;
      }

      // Conversion robuste de la valeur (gérer les Decimal de Prisma)
      let assetValue: number;
      if (typeof latestValuation.value === 'object' && latestValuation.value !== null) {
        // Conversion d'un Decimal Prisma en nombre
        assetValue = Number(latestValuation.value.toString());
      } else {
        assetValue = Number(latestValuation.value);
      }
      
      // Validation ajustée pour le patrimoine immobilier
      if (isNaN(assetValue) || assetValue < 0) {
        console.warn(`⚠️ Valeur invalide pour ${asset.name}:`, latestValuation.value);
        return;
      }

      // Seuil très élevé pour patrimoine immobilier (1 milliard max)
      if (assetValue > 1000000000) {
        console.warn(`⚠️ Valeur exceptionnellement élevée pour ${asset.name}: ${assetValue} EUR - Vérification recommandée`);
      }

      totalValue += assetValue;
      processedAssets.push({ id: asset.id, name: asset.name, value: assetValue });
      
      console.log(`✅ ${asset.name}: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(assetValue)}`);
    } catch (error) {
      console.error(`❌ Erreur calcul actif ${asset.name}:`, error);
    }
  });

  console.log('📊 Résumé du calcul:');
  console.log('- Actifs traités:', processedAssets.length);
  console.log('- Valeur totale calculée:', new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalValue));
  
  return totalValue;
};

/**
 * Calcule la performance du patrimoine basée sur les valuations historiques
 */
export const calculatePerformance = (assets: Asset[]): number => {
  console.log('📈 Calcul de la performance...');
  
  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    console.log('⚠️ Pas d\'actifs pour calculer la performance');
    return 0;
  }

  let totalCurrentValue = 0;
  let totalPreviousValue = 0;
  let assetsWithHistory = 0;

  assets.forEach(asset => {
    const valuations = asset.valuations || [];
    if (valuations.length >= 2) {
      // Conversion robuste des valeurs (gérer les Decimal de Prisma)
      let currentValue: number;
      let previousValue: number;
      
      if (typeof valuations[0].value === 'object' && valuations[0].value !== null) {
        currentValue = Number(valuations[0].value.toString());
      } else {
        currentValue = Number(valuations[0].value);
      }
      
      if (typeof valuations[1].value === 'object' && valuations[1].value !== null) {
        previousValue = Number(valuations[1].value.toString());
      } else {
        previousValue = Number(valuations[1].value);
      }
      
      // Validation des valeurs
      if (!isNaN(currentValue) && !isNaN(previousValue) && currentValue >= 0 && previousValue >= 0) {
        totalCurrentValue += currentValue;
        totalPreviousValue += previousValue;
        assetsWithHistory++;
      }
    } else if (valuations.length === 1) {
      // Si pas de valuation précédente, considérer comme stable
      let currentValue: number;
      
      if (typeof valuations[0].value === 'object' && valuations[0].value !== null) {
        currentValue = Number(valuations[0].value.toString());
      } else {
        currentValue = Number(valuations[0].value);
      }
      
      if (!isNaN(currentValue) && currentValue >= 0) {
        totalCurrentValue += currentValue;
        totalPreviousValue += currentValue;
      }
    }
  });

  console.log(`📊 Performance - Actifs avec historique: ${assetsWithHistory}/${assets.length}`);
  console.log(`📊 Valeur actuelle: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalCurrentValue)}`);
  console.log(`📊 Valeur précédente: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPreviousValue)}`);

  if (totalPreviousValue === 0) {
    console.log('⚠️ Pas de valeur précédente pour calculer la performance');
    return 0;
  }

  const performance = ((totalCurrentValue - totalPreviousValue) / totalPreviousValue) * 100;
  console.log(`📈 Performance calculée: ${performance.toFixed(2)}%`);
  
  return performance;
};

/**
 * Récupère les activités récentes basées sur les assets et entities
 */
export const getRecentActivities = (assets: Asset[], entities: Entity[]): Array<{
  id: string;
  type: 'create' | 'update' | 'delete' | 'view';
  title: string;
  description: string;
  timestamp: Date;
  entityType: 'asset' | 'entity' | 'valuation';
}> => {
  const activities: Array<{
    id: string;
    type: 'create' | 'update' | 'delete' | 'view';
    title: string;
    description: string;
    timestamp: Date;
    entityType: 'asset' | 'entity' | 'valuation';
  }> = [];

  // Ajouter les activités basées sur les assets récents
  assets.forEach(asset => {
    if (asset.createdAt && isRecent(ensureDate(asset.createdAt))) {
      activities.push({
        id: `asset-${asset.id}`,
        type: 'create',
        title: 'Nouvel actif ajouté',
        description: `${asset.name} - ${asset.assetType?.name || 'Type non spécifié'}`,
        timestamp: ensureDate(asset.createdAt),
        entityType: 'asset'
      });
    }

    if (asset.updatedAt && isRecent(ensureDate(asset.updatedAt)) && asset.createdAt !== asset.updatedAt) {
      activities.push({
        id: `asset-update-${asset.id}`,
        type: 'update',
        title: 'Actif modifié',
        description: `${asset.name} - Informations mises à jour`,
        timestamp: ensureDate(asset.updatedAt),
        entityType: 'asset'
      });
    }

    // Ajouter les activités de valorisation
    if (asset.valuations && asset.valuations.length > 0) {
      const recentValuation = asset.valuations[0];
      if (recentValuation.valuationDate && isRecent(ensureDate(recentValuation.valuationDate))) {
        activities.push({
          id: `valuation-${asset.id}`,
          type: 'update',
          title: 'Valorisation mise à jour',
          description: `${asset.name} - ${formatCurrency(recentValuation.value)}`,
          timestamp: ensureDate(recentValuation.valuationDate),
          entityType: 'valuation'
        });
      }
    }
  });

  // Ajouter les activités basées sur les entities récentes
  entities.forEach(entity => {
    if (entity.createdAt && isRecent(ensureDate(entity.createdAt))) {
      activities.push({
        id: `entity-${entity.id}`,
        type: 'create',
        title: 'Nouvelle entité créée',
        description: `${entity.name} - ${entity.type === 'INDIVIDUAL' ? 'Personne physique' : 'Personne morale'}`,
        timestamp: ensureDate(entity.createdAt),
        entityType: 'entity'
      });
    }
  });

  // Trier par date (plus récent en premier) et limiter à 10 activités
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
};

/**
 * Vérifie si une date est récente (dans les 30 derniers jours)
 */
const isRecent = (date: Date): boolean => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return date >= thirtyDaysAgo;
};

/**
 * Formate un nombre en devise
 */
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Calcule la répartition du patrimoine par type d'actif
 */
export const calculateAssetTypeDistribution = (assets: Asset[]): Array<{
  type: string;
  value: number;
  percentage: number;
  color: string;
}> => {
  const totalValue = calculatePortfolioValue(assets);
  
  if (totalValue === 0) return [];

  const distribution = assets.reduce((acc, asset) => {
    const assetType = asset.assetType?.name || 'Non spécifié';
    const assetValue = asset.valuations?.[0]?.value || 0;
    const color = asset.assetType?.color || '#8b5cf6';

    if (acc[assetType]) {
      acc[assetType].value += assetValue;
    } else {
      acc[assetType] = {
        type: assetType,
        value: assetValue,
        percentage: 0,
        color
      };
    }

    return acc;
  }, {} as Record<string, { type: string; value: number; percentage: number; color: string }>);

  // Calculer les pourcentages
  Object.values(distribution).forEach(item => {
    item.percentage = (item.value / totalValue) * 100;
  });

  return Object.values(distribution)
    .sort((a, b) => b.value - a.value);
};

/**
 * Calcule les top actifs par valeur
 */
export const getTopAssets = (assets: Asset[], limit: number = 5): Array<{
  id: string;
  name: string;
  type: string;
  value: number;
  percentage: number;
  owner?: string;
}> => {
  const totalValue = calculatePortfolioValue(assets);
  
  return assets
    .filter(asset => asset.valuations && asset.valuations.length > 0)
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.assetType?.name || 'Non spécifié',
      value: asset.valuations![0].value,
      percentage: totalValue > 0 ? (asset.valuations![0].value / totalValue) * 100 : 0,
      owner: asset.ownerships?.[0]?.ownerEntity?.name
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

/**
 * Calcule les données d'évolution du patrimoine
 */
export const calculateEvolutionData = (assets: Asset[], months: number = 12): Array<{
  month: string;
  value: number;
}> => {
  const evolutionData: Array<{ month: string; value: number }> = [];
  
  // Créer les mois pour la période
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    const monthKey = date.toISOString().slice(0, 7); // Format YYYY-MM
    const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    
    // Calculer la valeur du patrimoine pour ce mois
    let monthValue = 0;
    
    assets.forEach(asset => {
      if (asset.valuations) {
        // Trouver la valuation la plus proche de ce mois
        const closestValuation = asset.valuations.find(valuation => {
          const valuationDate = ensureDate(valuation.valuationDate);
          const valuationMonth = valuationDate.toISOString().slice(0, 7);
          return valuationMonth <= monthKey;
        });
        
        if (closestValuation) {
          monthValue += closestValuation.value;
        }
      }
    });
    
    evolutionData.push({
      month: monthLabel,
      value: monthValue
    });
  }
  
  return evolutionData;
};

/**
 * Génère des alertes basées sur les données réelles
 */
export const generateRealAlerts = (assets: Asset[], entities: Entity[]): Array<{
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: Date;
}> => {
  const alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'success' | 'error';
    title: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    isRead: boolean;
    createdAt: Date;
  }> = [];

  // Analyser la concentration par type d'actif
  const distribution = calculateAssetTypeDistribution(assets);
  if (distribution.length > 0) {
    const maxConcentration = Math.max(...distribution.map(d => d.percentage));
    
    if (maxConcentration > 70) {
      const concentratedType = distribution.find(d => d.percentage === maxConcentration);
      alerts.push({
        id: 'concentration-alert',
        type: 'warning',
        title: 'Concentration élevée',
        message: `${maxConcentration.toFixed(1)}% de votre patrimoine est concentré sur ${concentratedType?.type}`,
        severity: 'high',
        isRead: false,
        createdAt: new Date()
      });
    }
  }

  // Vérifier les valorisations en attente
  const assetsNeedingValuation = assets.filter(asset => {
    const lastValuation = asset.valuations?.[0];
    if (!lastValuation) return true;
    
    try {
      const valuationDate = ensureDate(lastValuation.valuationDate);
      const daysSinceValuation = (Date.now() - valuationDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceValuation > 90; // Plus de 90 jours
    } catch (error) {
      console.warn('Error parsing valuation date:', lastValuation.valuationDate);
      return true; // Considérer comme ayant besoin d'une valorisation si on ne peut pas parser la date
    }
  });

  if (assetsNeedingValuation.length > 0) {
    alerts.push({
      id: 'valuation-pending',
      type: 'info',
      title: 'Valorisation en attente',
      message: `${assetsNeedingValuation.length} actif${assetsNeedingValuation.length > 1 ? 's' : ''} nécessite${assetsNeedingValuation.length > 1 ? 'nt' : ''} une mise à jour de valorisation`,
      severity: 'medium',
      isRead: false,
      createdAt: new Date()
    });
  }

  // Vérifier la performance
  const performance = calculatePerformance(assets);
  if (performance > 10) {
    alerts.push({
      id: 'performance-positive',
      type: 'success',
      title: 'Performance positive',
      message: `Votre portefeuille a gagné ${performance.toFixed(1)}% sur la période`,
      severity: 'low',
      isRead: false,
      createdAt: new Date()
    });
  } else if (performance < -10) {
    alerts.push({
      id: 'performance-negative',
      type: 'warning',
      title: 'Performance négative',
      message: `Votre portefeuille a perdu ${Math.abs(performance).toFixed(1)}% sur la période`,
      severity: 'high',
      isRead: false,
      createdAt: new Date()
    });
  }

  return alerts.slice(0, 5); // Limiter à 5 alertes
};

/**
 * Génère des insights IA réels basés sur les données du patrimoine
 */
export const generateRealAIInsights = (assets: Asset[], entities: Entity[]): Array<{
  id: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}> => {
  const insights: Array<{
    id: string;
    type: 'opportunity' | 'risk' | 'optimization' | 'trend';
    title: string;
    description: string;
    confidence: number;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    data?: any;
  }> = [];

  const totalValue = calculatePortfolioValue(assets);
  const performance = calculatePerformance(assets);
  const distribution = calculateAssetTypeDistribution(assets);
  
  if (distribution.length === 0) {
    // Pas d'actifs, retourner un insight sur le démarrage
    insights.push({
      id: 'getting-started',
      type: 'opportunity',
      title: 'Commencez votre suivi patrimonial',
      description: 'Ajoutez vos premiers actifs pour bénéficier d\'analyses personnalisées et d\'insights IA.',
      confidence: 1.0,
      impact: 'high',
      actionable: true,
      data: { totalValue, assetsCount: assets.length }
    });
    return insights;
  }

  const maxConcentration = Math.max(...distribution.map(d => d.percentage));

  // Insight sur la concentration
  if (maxConcentration > 60) {
    const concentratedType = distribution.find(d => d.percentage === maxConcentration);
    insights.push({
      id: 'concentration-risk',
      type: 'risk',
      title: 'Risque de concentration',
      description: `${maxConcentration.toFixed(1)}% de votre patrimoine est concentré sur ${concentratedType?.type}. Considérez une diversification.`,
      confidence: 0.85,
      impact: maxConcentration > 80 ? 'high' : 'medium',
      actionable: true,
      data: { type: concentratedType?.type, percentage: maxConcentration }
    });
  }

  // Insight sur l'optimisation fiscale
  if (totalValue > 100000) {
    let potentialSavings = 0;
    
    // Calculer les économies potentielles basées sur le patrimoine
    if (totalValue > 1000000) {
      potentialSavings = totalValue * 0.02; // 2% du patrimoine
    } else if (totalValue > 500000) {
      potentialSavings = totalValue * 0.015; // 1.5% du patrimoine
    } else {
      potentialSavings = totalValue * 0.01; // 1% du patrimoine
    }

    insights.push({
      id: 'tax-optimization',
      type: 'optimization',
      title: 'Optimisation fiscale possible',
      description: `Avec un patrimoine de ${formatCurrency(totalValue)}, vous pourriez économiser environ ${formatCurrency(potentialSavings)} par an avec une optimisation fiscale.`,
      confidence: 0.75,
      impact: 'medium',
      actionable: true,
      data: { currentValue: totalValue, potentialSavings }
    });
  }

  // Insight sur la performance
  if (performance > 15) {
    insights.push({
      id: 'performance-excellent',
      type: 'trend',
      title: 'Performance exceptionnelle',
      description: `Votre portefeuille surperforme avec +${performance.toFixed(1)}%. Considérez de sécuriser une partie des gains.`,
      confidence: 0.9,
      impact: 'high',
      actionable: true,
      data: { performance }
    });
  } else if (performance < -15) {
    insights.push({
      id: 'performance-poor',
      type: 'risk',
      title: 'Performance préoccupante',
      description: `Votre portefeuille a perdu ${Math.abs(performance).toFixed(1)}%. Une révision de stratégie pourrait être nécessaire.`,
      confidence: 0.8,
      impact: 'high',
      actionable: true,
      data: { performance }
    });
  }

  // Insight sur les opportunités de diversification
  if (distribution.length < 3 && totalValue > 50000) {
    insights.push({
      id: 'diversification-opportunity',
      type: 'opportunity',
      title: 'Opportunité de diversification',
      description: `Votre patrimoine n'est réparti que sur ${distribution.length} type${distribution.length > 1 ? 's' : ''} d'actifs. Une diversification pourrait réduire les risques.`,
      confidence: 0.7,
      impact: 'medium',
      actionable: true,
      data: { currentTypes: distribution.length, totalValue }
    });
  }

  // Insight sur les valorisations obsolètes
  const outdatedAssets = assets.filter(asset => {
    const lastValuation = asset.valuations?.[0];
    if (!lastValuation) return true;
    
    try {
      const valuationDate = ensureDate(lastValuation.valuationDate);
      const daysSinceValuation = (Date.now() - valuationDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceValuation > 180; // Plus de 6 mois
    } catch (error) {
      console.warn('Error parsing valuation date:', lastValuation.valuationDate);
      return true;
    }
  });

  if (outdatedAssets.length > 0) {
    insights.push({
      id: 'valuation-update',
      type: 'optimization',
      title: 'Mise à jour des valorisations',
      description: `${outdatedAssets.length} actif${outdatedAssets.length > 1 ? 's' : ''} n'${outdatedAssets.length > 1 ? 'ont' : 'a'} pas été valorisé${outdatedAssets.length > 1 ? 's' : ''} depuis plus de 6 mois. Une actualisation améliorerait la précision de votre suivi.`,
      confidence: 0.9,
      impact: 'low',
      actionable: true,
      data: { outdatedCount: outdatedAssets.length }
    });
  }

  // Insight sur les opportunités d'investissement
  if (performance > 5 && totalValue > 200000) {
    insights.push({
      id: 'investment-opportunity',
      type: 'opportunity',
      title: 'Opportunité d\'investissement',
      description: `Avec une performance positive de ${performance.toFixed(1)}% et un patrimoine solide, c'est peut-être le moment d'explorer de nouvelles opportunités d'investissement.`,
      confidence: 0.6,
      impact: 'medium',
      actionable: true,
      data: { performance, totalValue }
    });
  }

  return insights.slice(0, 5); // Limiter à 5 insights
}; 