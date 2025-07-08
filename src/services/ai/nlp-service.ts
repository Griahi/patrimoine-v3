import { QueryIntent } from '@/types/ai';

export async function analyzeQuery(query: string): Promise<QueryIntent> {
  // Patterns de détection d'intentions
  const patterns = {
    performance: /performance|rendement|évolution|progression|gagné|perdu|bénéfice|perte|ROI|retour sur investissement/i,
    comparison: /compare|versus|vs|différence|mieux|meilleur|pire|entre|par rapport/i,
    prediction: /futur|prévision|projection|dans \d+ ans|prédiction|anticiper|prévoir/i,
    tax: /impôt|fiscal|taxe|déclaration|IFI|TMI|plus-value|moins-value|déficit|foncier/i,
    alert: /alerte|risque|attention|problème|danger|anomalie|concentration/i,
  };

  // Extraction des entités (actifs, comptes, etc.)
  const entities = extractEntities(query);
  
  // Extraction de la période temporelle
  const timeframe = extractTimeframe(query);

  // Déterminer l'intention principale
  let type: QueryIntent['type'] = 'general';
  let confidence = 0.6;

  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.test(query)) {
      type = key as QueryIntent['type'];
      confidence = 0.85;
      break;
    }
  }

  // Améliorer la confiance si plusieurs indices
  if (entities.length > 0) confidence += 0.1;
  if (timeframe) confidence += 0.1;

  return {
    type,
    entities,
    timeframe,
    confidence: Math.min(confidence, 1),
  };
}

function extractEntities(query: string): string[] {
  const entities: string[] = [];
  
  // Types d'actifs couramment mentionnés
  const assetTypes = [
    'immobilier', 'actions', 'compte', 'PEA', 'assurance-vie', 'assurance vie',
    'livret', 'épargne', 'crypto', 'cryptomonnaie', 'bitcoin', 'ethereum',
    'obligations', 'fonds', 'SCPI', 'or', 'argent', 'métaux précieux',
    'véhicule', 'voiture', 'moto', 'bateau', 'art', 'collection'
  ];
  
  // Banques courantes
  const banks = [
    'BNP', 'Crédit Agricole', 'Société Générale', 'LCL', 'Banque Postale',
    'Crédit Mutuel', 'BPCE', 'Caisse d\'Épargne', 'Boursorama', 'ING',
    'Revolut', 'N26', 'Fortuneo', 'Hello Bank'
  ];

  // Recherche d'entités
  const searchTerms = [...assetTypes, ...banks];
  
  for (const term of searchTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(query)) {
      entities.push(term.toLowerCase());
    }
  }
  
  return [...new Set(entities)]; // Supprimer les doublons
}

function extractTimeframe(query: string): QueryIntent['timeframe'] | undefined {
  const now = new Date();
  
  // Patterns temporels
  const timePatterns = [
    { pattern: /cette année|year to date|ytd/i, months: 12, fromStart: true },
    { pattern: /année dernière|l'an dernier|année précédente/i, months: 12, offset: -12 },
    { pattern: /ce mois|mois actuel|mois en cours/i, months: 1, fromStart: true },
    { pattern: /mois dernier|mois précédent/i, months: 1, offset: -1 },
    { pattern: /(\d+) derniers mois/i, months: 'match' },
    { pattern: /(\d+) dernières années/i, months: 'match', multiplier: 12 },
    { pattern: /6 derniers mois|semestre/i, months: 6 },
    { pattern: /3 derniers mois|trimestre/i, months: 3 },
    { pattern: /depuis le début|depuis toujours/i, months: 120 } // 10 ans max
  ];

  for (const timePattern of timePatterns) {
    const match = query.match(timePattern.pattern);
    if (match) {
      let months = timePattern.months;
      
      if (months === 'match' && match[1]) {
        months = parseInt(match[1]);
        if (timePattern.multiplier) {
          months *= timePattern.multiplier;
        }
      }
      
      if (typeof months === 'number') {
        const end = new Date(now);
        const start = new Date(now);
        
        if (timePattern.fromStart) {
          // Depuis le début de la période
          if (months === 12) {
            start.setMonth(0, 1); // 1er janvier
          } else if (months === 1) {
            start.setDate(1); // 1er du mois
          } else {
            start.setMonth(start.getMonth() - months);
          }
        } else if (timePattern.offset) {
          // Période précédente
          end.setMonth(end.getMonth() + timePattern.offset);
          start.setMonth(end.getMonth() - months);
        } else {
          // Derniers X mois
          start.setMonth(start.getMonth() - months);
        }
        
        return { start, end };
      }
    }
  }
  
  return undefined;
}

// Fonction utilitaire pour extraire les métriques mentionnées
export function extractMetrics(query: string): string[] {
  const metrics: string[] = [];
  
  const metricPatterns = [
    { pattern: /performance|rendement|ROI/i, metric: 'performance' },
    { pattern: /valeur|montant|total/i, metric: 'value' },
    { pattern: /frais|coût|commission/i, metric: 'fees' },
    { pattern: /diversification|répartition|allocation/i, metric: 'diversification' },
    { pattern: /risque|volatilité|écart-type/i, metric: 'risk' },
    { pattern: /dividende|coupon|revenu/i, metric: 'income' },
  ];

  for (const metricPattern of metricPatterns) {
    if (metricPattern.pattern.test(query)) {
      metrics.push(metricPattern.metric);
    }
  }

  return [...new Set(metrics)];
}

// Fonction pour détecter les questions comparative
export function isComparativeQuery(query: string): boolean {
  const comparativePatterns = [
    /compare|versus|vs|différence/i,
    /mieux|meilleur|pire|plus|moins/i,
    /entre .+ et .+/i,
    /par rapport à/i,
    /\w+ ou \w+/i
  ];

  return comparativePatterns.some(pattern => pattern.test(query));
}

// Fonction pour détecter les questions de recommandation
export function isRecommendationQuery(query: string): boolean {
  const recommendationPatterns = [
    /recommande|conseil|suggère|propose/i,
    /que faire|comment|dois-je|devrais-je/i,
    /optimiser|améliorer|mieux faire/i,
    /stratégie|plan|approche/i
  ];

  return recommendationPatterns.some(pattern => pattern.test(query));
} 