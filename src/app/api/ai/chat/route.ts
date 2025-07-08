import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeQuery } from '@/services/ai/nlp-service';
import { generateResponse } from '@/services/ai/openai-service';
import { PatrimonyContext } from '@/types/ai';
import { z } from 'zod';

// Schéma de validation pour les requêtes de chat
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.object({
    entityIds: z.array(z.string()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification avec NextAuth v5
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Vous devez être connecté pour utiliser l\'assistant IA. Veuillez vous connecter et réessayer.' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Valider la requête
    const body = await request.json();
    const { message, context } = chatRequestSchema.parse(body);

    // Récupérer le contexte patrimonial enrichi
    const patrimonyContext = await buildPatrimonyContext(userId, context?.entityIds);

    // Analyser l'intention de la requête
    const intent = await analyzeQuery(message);

    // Générer la réponse avec OpenAI
    const response = await generateResponse({
      query: message,
      intent,
      context: patrimonyContext,
    });

    // Optionnel : Enregistrer la conversation pour améliorer le service
    await logChatInteraction(userId, message, response.text, intent);

    return NextResponse.json({
      response: response.text,
      data: response.data,
      suggestions: response.suggestions,
      intent: intent.type,
      confidence: intent.confidence,
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function buildPatrimonyContext(
  userId: string, 
  entityIds?: string[]
): Promise<PatrimonyContext> {
  // Construire la clause WHERE pour filtrer par entités si spécifié
  const whereClause = {
    ownerships: {
      some: {
        ownerEntity: {
          userId,
          ...(entityIds && entityIds.length > 0 ? { id: { in: entityIds } } : {})
        }
      }
    }
  };

  // Récupérer les actifs avec leurs valorisations
  const assets = await prisma.asset.findMany({
    where: whereClause,
    include: {
      assetType: {
        select: {
          name: true,
          code: true,
        }
      },
      valuations: {
        orderBy: { valuationDate: 'desc' },
        take: 2, // Dernière et avant-dernière pour calculer la performance
      },
      ownerships: {
        select: {
          percentage: true,
          ownerEntity: {
            select: {
              name: true,
              type: true,
            }
          }
        }
      }
    }
  });

  // Récupérer les entités
  const entities = await prisma.entity.findMany({
    where: {
      userId,
      ...(entityIds && entityIds.length > 0 ? { id: { in: entityIds } } : {})
    },
    select: {
      id: true,
      name: true,
      type: true,
    }
  });

  // Calculer la valeur totale et les performances
  let totalValue = 0;
  const processedAssets = assets.map(asset => {
    const latestValuation = asset.valuations[0];
    const previousValuation = asset.valuations[1];
    
    const currentValue = latestValuation?.value || 0;
    totalValue += currentValue;
    
    // Calculer la performance si on a deux valorisations
    let performance: number | undefined;
    if (latestValuation && previousValuation) {
      performance = (currentValue - previousValuation.value) / previousValuation.value;
    }

    return {
      id: asset.id,
      name: asset.name,
      type: asset.assetType.name,
      value: currentValue,
      performance,
    };
  });

  // Calculer les performances globales
  const monthlyPerformance = calculateMonthlyPerformance(assets);
  const yearlyPerformance = calculateYearlyPerformance(assets);

  // Calculer la diversification
  const diversification = calculateDiversification(processedAssets);

  // Estimer les frais bancaires (logique simplifiée)
  const bankFees = await estimateBankFees(userId);

  return {
    totalValue,
    assets: processedAssets,
    entities: entities.map(e => ({ id: e.id, name: e.name, type: e.type })),
    monthlyPerformance,
    yearlyPerformance,
    bankFees,
    diversification,
  };
}

function calculateMonthlyPerformance(assets: Array<{
  valuations: Array<{ value: number; valuationDate: Date }>;
}>): number | undefined {
  // Calculer la performance mensuelle moyenne
  const performances = assets
    .map(asset => {
      const valuations = asset.valuations;
      if (valuations.length >= 2) {
        const current = valuations[0];
        const previous = valuations[1];
        
        // Vérifier si c'est bien une comparaison mensuelle
        const daysDiff = Math.abs(
          new Date(current.valuationDate).getTime() - 
          new Date(previous.valuationDate).getTime()
        ) / (1000 * 60 * 60 * 24);
        
        if (daysDiff >= 25 && daysDiff <= 35) { // Environ un mois
          return (current.value - previous.value) / previous.value;
        }
      }
      return null;
    })
    .filter(p => p !== null) as number[];

  return performances.length > 0 
    ? performances.reduce((sum, p) => sum + p, 0) / performances.length 
    : undefined;
}

function calculateYearlyPerformance(assets: Array<{
  valuations: Array<{ value: number; valuationDate: Date }>;
}>): number | undefined {
  // Calculer la performance annuelle moyenne
  const performances = assets
    .map(asset => {
      const valuations = asset.valuations;
      if (valuations.length >= 2) {
        const current = valuations[0];
        const oldest = valuations[valuations.length - 1];
        
        // Vérifier si on a au moins 10 mois de données
        const daysDiff = Math.abs(
          new Date(current.valuationDate).getTime() - 
          new Date(oldest.valuationDate).getTime()
        ) / (1000 * 60 * 60 * 24);
        
        if (daysDiff >= 300) { // Plus de 10 mois
          return (current.value - oldest.value) / oldest.value;
        }
      }
      return null;
    })
    .filter(p => p !== null) as number[];

  return performances.length > 0 
    ? performances.reduce((sum, p) => sum + p, 0) / performances.length 
    : undefined;
}

function calculateDiversification(assets: Array<{
  type: string;
  value: number;
}>): PatrimonyContext['diversification'] {
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  
  if (totalValue === 0) {
    return { byAssetType: {}, concentration: 0 };
  }

  // Grouper par type d'actif
  const byAssetType: Record<string, number> = {};
  assets.forEach(asset => {
    if (!byAssetType[asset.type]) {
      byAssetType[asset.type] = 0;
    }
    byAssetType[asset.type] += asset.value / totalValue;
  });

  // Calculer la concentration (pourcentage du plus gros actif)
  const concentration = Math.max(...Object.values(byAssetType));

  return {
    byAssetType,
    concentration,
  };
}

async function estimateBankFees(userId: string): Promise<number | undefined> {
  // Logique simplifiée - récupérer les comptes bancaires et estimer les frais
  const bankAccounts = await prisma.asset.findMany({
    where: {
      ownerships: {
        some: {
          ownerEntity: { userId }
        }
      },
      assetType: {
        code: 'bank_account'
      }
    },
    select: {
      metadata: true,
    }
  });

  // Estimer les frais bancaires moyens par compte
  const avgFeesPerAccount = 8; // 8€ par mois par compte en moyenne
  return bankAccounts.length * avgFeesPerAccount;
}

async function logChatInteraction(
  userId: string,
  query: string,
  response: string,
  intent: { type: string; confidence: number }
): Promise<void> {
  try {
    // Optionnel : Enregistrer les interactions pour améliorer le service
    // Cette table n'existe pas encore dans le schéma, mais pourrait être ajoutée
    console.log('Chat interaction logged:', {
      userId,
      query: query.substring(0, 100),
      intent: intent.type,
      confidence: intent.confidence,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging chat interaction:', error);
  }
} 