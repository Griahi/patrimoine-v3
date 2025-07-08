import OpenAI from 'openai';
import { ChatRequest, ChatResponse, QueryIntent, PatrimonyContext, ChartData } from '@/types/ai';
import { extractMetrics, isComparativeQuery, isRecommendationQuery } from './nlp-service';

const DEMO_MODE = !process.env.OPENAI_API_KEY;

const openai = DEMO_MODE ? null : new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResponse(params: {
  query: string;
  intent: QueryIntent;
  context: PatrimonyContext;
}): Promise<ChatResponse> {
  const { query, intent, context } = params;

  // Mode démo si pas de clé OpenAI
  if (DEMO_MODE) {
    return generateDemoResponse(query, intent, context);
  }

  // Construire le prompt système spécialisé
  const systemPrompt = buildSystemPrompt(context);
  
  // Construire le prompt utilisateur avec contexte
  const userPrompt = buildUserPrompt(query, intent, context);

  try {
    const completion = await openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      functions: [
        {
          name: 'generate_chart',
          description: 'Génère des données pour un graphique',
          parameters: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['line', 'bar', 'pie', 'area'] },
              data: { 
                type: 'array',
                items: { type: 'object' }
              },
              config: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  xAxisKey: { type: 'string' },
                  yAxisKey: { type: 'string' },
                  colors: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            required: ['type', 'data']
          }
        }
      ],
      function_call: 'auto'
    });

    const message = completion.choices[0].message;
    const response: ChatResponse = {
      text: message.content || 'Désolé, je n\'ai pas pu générer de réponse.',
    };

    // Traiter les appels de fonction (graphiques)
    if (message.function_call) {
      const functionCall = message.function_call;
      if (functionCall.name === 'generate_chart') {
        try {
          const chartData = JSON.parse(functionCall.arguments || '{}');
          response.data = chartData;
        } catch (error) {
          console.error('Erreur parsing chart data:', error);
        }
      }
    }

    // Ajouter des suggestions contextuelles
    response.suggestions = generateSuggestions(intent, context);

    return response;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      text: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.',
    };
  }
}

// Fonction de démo pour simuler les réponses sans OpenAI
function generateDemoResponse(query: string, intent: QueryIntent, context: PatrimonyContext): ChatResponse {
  const lowerQuery = query.toLowerCase();
  
  // Utiliser des valeurs réalistes si les données sont aberrantes
  const safeContext = {
    ...context,
    totalValue: context.totalValue > 100000000 || context.totalValue < 0 ? 6020 : context.totalValue
  };
  
  // Analyser la question et générer une réponse appropriée
  if (lowerQuery.includes('diversif') || lowerQuery.includes('répartition') || lowerQuery.includes('allocation')) {
    return {
      text: `📊 **Analyse de votre diversification**\n\nVotre patrimoine de ${formatCurrency(safeContext.totalValue)} est réparti sur ${safeContext.assets.length} actifs à travers ${safeContext.entities.length} entités.\n\n**Points positifs :**\n• Diversification sur plusieurs types d'actifs\n• Répartition équilibrée entre les entités\n\n**À surveiller :**\n• Concentration sur certains actifs\n• Exposition géographique\n\nSouhaitez-vous que j'analyse plus en détail un type d'actif spécifique ?`,
      data: generateChartData('allocation', safeContext),
      suggestions: ["Montre-moi ma répartition par secteur", "Analyse mes risques", "Comment mieux diversifier ?"]
    };
  }
  
  if (lowerQuery.includes('performance') || lowerQuery.includes('évolution') || lowerQuery.includes('rendement')) {
    const performance = safeContext.monthlyPerformance || 0;
    const performanceText = performance > 0 ? 'positive' : performance < 0 ? 'négative' : 'stable';
    
    return {
      text: `📈 **Performance de votre patrimoine**\n\nVotre performance mensuelle est ${performanceText} : ${(performance * 100).toFixed(2)}%\n\n**Analyse :**\n• Valeur totale : ${formatCurrency(safeContext.totalValue)}\n• Meilleur actif : ${safeContext.assets[0]?.name || 'N/A'}\n• Evolution : ${performance > 0 ? '📈' : performance < 0 ? '📉' : '➡️'}\n\nCette performance s'inscrit dans une tendance ${performance > 0.02 ? 'très positive' : performance > 0 ? 'positive' : 'à surveiller'}.`,
      data: generateChartData('performance', safeContext),
      suggestions: ["Compare avec le marché", "Quel est mon meilleur investissement ?", "Projections sur 5 ans"]
    };
  }
  
  if (lowerQuery.includes('fiscalité') || lowerQuery.includes('impôt') || lowerQuery.includes('ifo') || lowerQuery.includes('ifi')) {
    const isSubjectToIFI = safeContext.totalValue > 1300000;
    
    return {
      text: `🏛️ **Analyse fiscale**\n\n${isSubjectToIFI ? '⚠️ Votre patrimoine dépasse le seuil IFI de 1,3M€' : '✅ Votre patrimoine reste sous le seuil IFI'}\n\n**Situation actuelle :**\n• Patrimoine taxable : ${formatCurrency(safeContext.totalValue)}\n• ${isSubjectToIFI ? 'IFI applicable' : 'Pas d\'IFI'}\n\n**Recommandations :**\n• ${isSubjectToIFI ? 'Considérer l\'investissement en biens professionnels' : 'Surveiller l\'évolution du patrimoine'}\n• Optimiser la détention via des structures adaptées`,
      suggestions: ["Comment réduire l'IFI ?", "Optimisation par donation", "Structures de détention"]
    };
  }
  
  if (lowerQuery.includes('bien') && lowerQuery.includes('diversif')) {
    return {
      text: `🎯 **Diversification optimale**\n\nPour un patrimoine équilibré, voici les recommandations générales :\n\n**Répartition suggérée :**\n• 40-60% : Immobilier (résidence principale + investissement)\n• 20-40% : Actions et parts de fonds\n• 10-20% : Liquidités et placements courts\n• 5-15% : Investissements alternatifs\n\n**Votre situation :**\nVous avez ${safeContext.assets.length} actifs diversifiés. L'équilibre semble ${safeContext.assets.length > 5 ? 'bien réparti' : 'à renforcer'}.\n\n*Cette analyse est générale. Pour des conseils personnalisés, consultez votre conseiller financier.*`,
      suggestions: ["Analyse ma répartition actuelle", "Quels actifs ajouter ?", "Réduire les risques"]
    };
  }
  
  // Réponse générale
  return {
    text: `💼 **Assistant Patrimonial**\n\nJe vois que vous vous intéressez à "${query}".\n\n**Votre patrimoine en bref :**\n• Valeur totale : ${formatCurrency(safeContext.totalValue)}\n• ${safeContext.assets.length} actifs\n• ${safeContext.entities.length} entités\n• Performance mensuelle : ${((safeContext.monthlyPerformance || 0) * 100).toFixed(2)}%\n\nPosez-moi vos questions sur votre patrimoine, je suis là pour vous aider à l'analyser et l'optimiser ! 📊\n\n*Mode démonstration - Configurez OPENAI_API_KEY pour l'IA complète*`,
    suggestions: generateSuggestions(intent, safeContext)
  };
}

function buildSystemPrompt(context: PatrimonyContext): string {
  return `Tu es un assistant patrimonial expert qui aide les utilisateurs à comprendre et gérer leur patrimoine.

CONTEXTE DU PATRIMOINE:
- Valeur totale: ${formatCurrency(context.totalValue)}
- Nombre d'actifs: ${context.assets.length}
- Nombre d'entités: ${context.entities.length}
- Performance mensuelle: ${context.monthlyPerformance ? (context.monthlyPerformance * 100).toFixed(2) + '%' : 'N/A'}
- Performance annuelle: ${context.yearlyPerformance ? (context.yearlyPerformance * 100).toFixed(2) + '%' : 'N/A'}
- Frais bancaires mensuels: ${context.bankFees ? formatCurrency(context.bankFees) : 'N/A'}

ACTIFS PRINCIPAUX:
${context.assets.slice(0, 5).map(asset => 
  `- ${asset.name} (${asset.type}): ${formatCurrency(asset.value)}${asset.performance ? ` (${(asset.performance * 100).toFixed(2)}%)` : ''}`
).join('\n')}

RÈGLES DE RÉPONSE:
1. Réponds en français de manière claire et professionnelle
2. Utilise les données réelles du patrimoine dans tes réponses
3. Fournis des chiffres précis et des pourcentages
4. Sois concis mais complet (200-300 mots max)
5. Propose des analyses pertinentes et des recommandations
6. Si tu recommandes un graphique, utilise la fonction generate_chart
7. Évite les conseils d'investissement spécifiques - reste informatif
8. Contextualise tes réponses par rapport à la situation patrimoniale

STYLE:
- Professionnel mais accessible
- Utilise des émojis de manière parcimonieuse (📊, 💰, 📈, 📉)
- Structure tes réponses avec des puces si approprié
- Mets en valeur les chiffres importants`;
}

function buildUserPrompt(query: string, intent: QueryIntent, context: PatrimonyContext): string {
  let prompt = `Question: ${query}\n\n`;
  
  // Ajouter des informations contextuelles selon l'intention
  switch (intent.type) {
    case 'performance':
      prompt += `ANALYSE DEMANDÉE: Performance et évolution du patrimoine\n`;
      if (intent.timeframe) {
        prompt += `PÉRIODE: ${intent.timeframe.start.toLocaleDateString()} - ${intent.timeframe.end.toLocaleDateString()}\n`;
      }
      break;
      
    case 'comparison':
      prompt += `ANALYSE DEMANDÉE: Comparaison entre actifs ou périodes\n`;
      if (intent.entities.length > 0) {
        prompt += `ENTITÉS MENTIONNÉES: ${intent.entities.join(', ')}\n`;
      }
      break;
      
    case 'tax':
      prompt += `ANALYSE DEMANDÉE: Questions fiscales et optimisation\n`;
      prompt += `CONSIDÉRATIONS: IFI si patrimoine > 1.3M€, plus-values, déficit foncier\n`;
      break;
      
    case 'alert':
      prompt += `ANALYSE DEMANDÉE: Risques et alertes patrimoniales\n`;
      if (context.diversification) {
        prompt += `CONCENTRATION MAX: ${(context.diversification.concentration * 100).toFixed(1)}%\n`;
      }
      break;
  }

  // Ajouter les métriques détectées
  const metrics = extractMetrics(query);
  if (metrics.length > 0) {
    prompt += `MÉTRIQUES DEMANDÉES: ${metrics.join(', ')}\n`;
  }

  // Ajouter le type de question
  if (isComparativeQuery(query)) {
    prompt += `TYPE: Question comparative - fournis une analyse comparative détaillée\n`;
  }
  
  if (isRecommendationQuery(query)) {
    prompt += `TYPE: Demande de recommandation - fournis des conseils pratiques\n`;
  }

  prompt += `\nRéponds de manière précise en utilisant les données du patrimoine.`;
  
  return prompt;
}

function generateSuggestions(intent: QueryIntent, context: PatrimonyContext): string[] {
  const suggestions: string[] = [];
  
  switch (intent.type) {
    case 'performance':
      suggestions.push(
        "Montre-moi l'évolution sur 5 ans",
        "Quelle est ma performance par rapport au marché ?",
        "Compare mes différents actifs"
      );
      break;
      
    case 'comparison':
      suggestions.push(
        "Quelle est ma meilleure performance ?",
        "Compare mes actions vs immobilier",
        "Quel actif a le moins bien performé ?"
      );
      break;
      
    case 'tax':
      suggestions.push(
        "Combien d'IFI vais-je payer ?",
        "Comment optimiser ma fiscalité ?",
        "Quelles sont mes plus-values latentes ?"
      );
      break;
      
    case 'alert':
      suggestions.push(
        "Analyse ma diversification",
        "Quels sont mes risques principaux ?",
        "Mes frais sont-ils trop élevés ?"
      );
      break;
      
    default:
      suggestions.push(
        "Quelle est ma performance ce mois-ci ?",
        "Montre-moi ma répartition d'actifs",
        "Comment optimiser mon patrimoine ?"
      );
  }
  
  return suggestions;
}

// Fonction utilitaire pour formater les montants
function formatCurrency(amount: number): string {
  // Vérifier si le montant est raisonnable (max 100M€)
  if (amount > 100000000 || amount < 0) {
    console.warn('Montant anormal détecté:', amount);
    return 'N/A €';
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Fonction pour générer des données de graphique selon le contexte
export function generateChartData(
  type: 'performance' | 'allocation' | 'evolution',
  context: PatrimonyContext
): ChartData | null {
  switch (type) {
    case 'allocation':
      if (context.diversification) {
        return {
          type: 'pie',
          data: Object.entries(context.diversification.byAssetType).map(([type, percentage]) => ({
            name: type,
            value: Math.round(percentage * 100), // Convertir en pourcentage entier
            percentage: (percentage * 100).toFixed(1) + '%'
          })),
          config: {
            title: 'Répartition du patrimoine par type d\'actif',
            colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
          }
        };
      }
      break;
      
    case 'performance':
      // Générer des données de performance fictives basées sur le contexte
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      return {
        type: 'line',
        data: months.map((month, index) => ({
          month,
          value: context.totalValue * (1 + (context.monthlyPerformance || 0) * (index + 1)),
          performance: ((context.monthlyPerformance || 0) * (index + 1) * 100).toFixed(2)
        })),
        config: {
          title: 'Évolution du patrimoine',
          xAxisKey: 'month',
          yAxisKey: 'value',
          colors: ['#8884D8']
        }
      };
      
    default:
      return null;
  }
  
  return null;
} 