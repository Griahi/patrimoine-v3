import { prisma } from '@/lib/prisma';
import { 
  ScenarioAction, 
  ProjectionPoint, 
  ProjectionMetrics,
  TIME_HORIZONS 
} from '@/types/projections';
import { addMonths, format } from 'date-fns';

export class ProjectionService {
  constructor(private userId: string) {}

  // Créer un scénario
  async createScenario(data: {
    name: string;
    description?: string;
    type: 'SIMPLE' | 'COMPLEX';
    actions: ScenarioAction[];
  }) {
    const snapshot = await this.createPatrimonySnapshot();
    
    const scenario = await prisma.projectionScenario.create({
      data: {
        userId: this.userId,
        name: data.name,
        description: data.description,
        type: data.type,
        baselineSnapshot: snapshot,
        actions: {
          create: data.actions.map((action, index) => ({
            type: action.type,
            name: action.name,
            executionDate: action.executionDate,
            targetAssetId: action.targetAssetId,
            assetType: action.assetType,
            amount: action.amount,
            parameters: action.parameters,
            order: action.order || index
          }))
        }
      },
      include: {
        actions: true
      }
    });
    
    return scenario;
  }

  // Récupérer les scénarios
  async getScenarios() {
    return prisma.projectionScenario.findMany({
      where: { userId: this.userId },
      include: {
        actions: true,
        results: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Récupérer un scénario
  async getScenario(id: string) {
    const scenario = await prisma.projectionScenario.findUnique({
      where: { id },
      include: {
        actions: {
          orderBy: { order: 'asc' }
        },
        results: true
      }
    });

    if (!scenario || scenario.userId !== this.userId) {
      throw new Error('Scenario not found');
    }

    return scenario;
  }

  // Mettre à jour un scénario
  async updateScenario(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      actions?: ScenarioAction[];
    }
  ) {
    const scenario = await this.getScenario(id);

    // Si les actions sont modifiées, supprimer les anciennes et créer les nouvelles
    if (data.actions) {
      await prisma.projectionAction.deleteMany({
        where: { scenarioId: id }
      });
    }

    return prisma.projectionScenario.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        actions: data.actions ? {
          create: data.actions.map((action, index) => ({
            type: action.type,
            name: action.name,
            executionDate: action.executionDate,
            targetAssetId: action.targetAssetId,
            assetType: action.assetType,
            amount: action.amount,
            parameters: action.parameters,
            order: action.order || index
          }))
        } : undefined
      },
      include: {
        actions: true,
        results: true
      }
    });
  }

  // Supprimer un scénario
  async deleteScenario(id: string) {
    await this.getScenario(id); // Vérifier les permissions
    return prisma.projectionScenario.delete({
      where: { id }
    });
  }

  // Créer un snapshot du patrimoine
  private async createPatrimonySnapshot() {
    try {
      const [assets, entities, debts] = await Promise.all([
        prisma.asset.findMany({
          where: { ownerships: { some: { ownerEntity: { userId: this.userId } } } },
          include: { 
            valuations: {
              orderBy: { valuationDate: 'desc' },
              take: 1
            },
            debts: true,
            assetType: true
          }
        }),
        prisma.entity.findMany({
          where: { userId: this.userId }
        }),
        prisma.debt.findMany({
          where: { asset: { ownerships: { some: { ownerEntity: { userId: this.userId } } } } }
        })
      ]);
      
      const totalValue = assets.reduce((sum, a) => 
        sum + Number(a.valuations[0]?.value || 0), 0
      );
      
      const totalDebt = debts.reduce((sum, d) => 
        sum + Number(d.currentAmount), 0
      );
      
      const snapshot = {
        assets: assets.map(a => ({
          id: a.id,
          type: a.assetType.name,
          name: a.name,
          currentValue: Number(a.valuations[0]?.value || 0),
          debts: a.debts.map(d => ({
            id: d.id,
            currentAmount: Number(d.currentAmount),
            interestRate: Number(d.interestRate)
          })),
          metadata: a.metadata
        })),
        entities,
        totalValue,
        totalDebt,
        netValue: totalValue - totalDebt,
        breakdown: this.calculateBreakdown(assets),
        snapshotDate: new Date()
      };
      
      return snapshot;
    } catch (error) {
      console.error('Error in createPatrimonySnapshot:', error);
      throw error;
    }
  }

  // Calculer la répartition par type
  private calculateBreakdown(assets: any[]) {
    const breakdown: Record<string, number> = {};
    
    assets.forEach(asset => {
      const value = Number(asset.valuations[0]?.value || 0);
      const type = asset.assetType.name;
      if (breakdown[type]) {
        breakdown[type] += value;
      } else {
        breakdown[type] = value;
      }
    });
    
    return breakdown;
  }

  // Calculer les projections
  async calculateProjections(
    scenarioId: string,
    timeHorizon: '1M' | '6M' | '1Y' | '5Y' | '10Y'
  ) {
    const scenario = await this.getScenario(scenarioId);
    const projection = await this.runProjection(scenario, timeHorizon);

    const result = await prisma.projectionResult.upsert({
      where: {
        scenarioId_timeHorizon: {
          scenarioId,
          timeHorizon
        }
      },
      update: {
        projectionData: projection.data,
        metrics: projection.metrics,
        insights: projection.insights,
        calculatedAt: new Date()
      },
      create: {
        scenarioId,
        timeHorizon,
        projectionData: projection.data,
        metrics: projection.metrics,
        insights: projection.insights
      }
    });

    return result;
  }

  // Calculer la baseline (sans scénario)
  async calculateBaseline(timeHorizon: '1M' | '6M' | '1Y' | '5Y' | '10Y') {
    const snapshot = await this.createPatrimonySnapshot();
    return this.projectBaseline(snapshot, timeHorizon);
  }

  // Projeter la baseline
  private async projectBaseline(snapshot: any, timeHorizon: string) {
    const horizon = TIME_HORIZONS.find(h => h.value === timeHorizon)!;
    const projectionPoints: ProjectionPoint[] = [];
    const startDate = new Date();

    // Paramètres de projection par défaut
    const defaultGrowthRate = 0.05; // 5% par an
    const defaultInflation = 0.02; // 2% par an

    for (let month = 0; month <= horizon.months; month++) {
      const currentDate = addMonths(startDate, month);
      const yearFraction = month / 12;
      
      // Calculer la croissance composée
      const growthFactor = Math.pow(1 + defaultGrowthRate, yearFraction);
      const inflationFactor = Math.pow(1 + defaultInflation, yearFraction);
      
      const totalValue = snapshot.totalValue * growthFactor;
      const totalDebt = snapshot.totalDebt * inflationFactor;
      
      projectionPoints.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        totalValue,
        liquidValue: totalValue * 0.2, // 20% liquide par défaut
        netValue: totalValue - totalDebt,
        breakdown: this.projectBreakdown(snapshot.breakdown, growthFactor),
        cashflow: 0,
        debt: totalDebt
      });
    }

    return {
      data: projectionPoints,
      metrics: this.calculateMetrics(projectionPoints)
    };
  }

  // Projeter la répartition
  private projectBreakdown(
    breakdown: Record<string, number>, 
    growthFactor: number
  ): Record<string, number> {
    const projected: Record<string, number> = {};
    
    Object.entries(breakdown).forEach(([type, value]) => {
      projected[type] = value * growthFactor;
    });
    
    return projected;
  }

  // Moteur de projection avec scénarios
  private async runProjection(scenario: any, timeHorizon: string) {
    const horizon = TIME_HORIZONS.find(h => h.value === timeHorizon)!;
    const baseline = scenario.baselineSnapshot;
    const projectionPoints: ProjectionPoint[] = [];
    const insights: string[] = [];
    
    // État initial
    let currentState = {
      assets: new Map(baseline.assets.map((a: any) => [a.id, { ...a }])),
      totalValue: baseline.totalValue,
      totalDebt: baseline.totalDebt,
      monthlyIncome: 0,
      monthlyExpenses: 0
    };

    // Trier les actions par date
    const sortedActions = [...scenario.actions].sort(
      (a, b) => new Date(a.executionDate).getTime() - new Date(b.executionDate).getTime()
    );

    const startDate = new Date();

    // Projeter mois par mois
    for (let month = 0; month <= horizon.months; month++) {
      const currentDate = addMonths(startDate, month);
      
      // Appliquer les actions du mois
      for (const action of sortedActions) {
        const actionDate = new Date(action.executionDate);
        if (
          actionDate.getFullYear() === currentDate.getFullYear() &&
          actionDate.getMonth() === currentDate.getMonth()
        ) {
          currentState = await this.applyAction(currentState, action, insights);
        }
      }
      
      // Appliquer la croissance naturelle
      currentState = this.applyGrowth(currentState, 1 / 12);
      
      // Enregistrer le point de projection
      projectionPoints.push(this.createProjectionPoint(currentState, currentDate));
    }

    return {
      data: projectionPoints,
      metrics: this.calculateMetrics(projectionPoints),
      insights
    };
  }

  // Appliquer une action
  private async applyAction(state: any, action: any, insights: string[]) {
    switch (action.type) {
      case 'SELL':
        return this.applySellAction(state, action, insights);
      case 'BUY':
        return this.applyBuyAction(state, action, insights);
      case 'INVEST':
        return this.applyInvestAction(state, action, insights);
      case 'YIELD':
        return this.applyYieldAction(state, action, insights);
      case 'EXPENSE':
        return this.applyExpenseAction(state, action, insights);
      case 'TAX':
        return this.applyTaxAction(state, action, insights);
      default:
        return state;
    }
  }

  // Action SELL
  private applySellAction(state: any, action: any, insights: string[]) {
    const asset = state.assets.get(action.targetAssetId);
    if (!asset) return state;

    const sellPrice = this.calculateSellPrice(asset, action.parameters);
    const capitalGain = sellPrice - asset.currentValue;
    const tax = action.parameters.capitalGainsTax ? capitalGain * 0.3 : 0;
    
    state.assets.delete(action.targetAssetId);
    state.totalValue += sellPrice - asset.currentValue - tax;
    
    insights.push(
      `Vente de ${asset.name} pour ${sellPrice.toLocaleString()}€` +
      (capitalGain > 0 ? ` (plus-value: ${capitalGain.toLocaleString()}€)` : '')
    );
    
    return state;
  }

  // Action BUY
  private applyBuyAction(state: any, action: any, insights: string[]) {
    const amount = Number(action.amount);
    const params = action.parameters;
    
    if (params.financing?.type === 'LOAN' || params.financing?.type === 'MIXED') {
      const loanAmount = params.financing.loanAmount || amount;
      state.totalDebt += loanAmount;
      state.monthlyExpenses += this.calculateMonthlyPayment(
        loanAmount,
        params.financing.interestRate || 0.03,
        params.financing.duration || 240
      );
    }
    
    state.totalValue += amount;
    
    insights.push(
      `Achat de ${params.assetDetails?.name || 'nouvel actif'} pour ${amount.toLocaleString()}€`
    );
    
    return state;
  }

  // Action INVEST
  private applyInvestAction(state: any, action: any, insights: string[]) {
    const monthlyAmount = action.parameters.monthlyAmount || 0;
    state.monthlyExpenses += monthlyAmount;
    
    insights.push(
      `Investissement programmé de ${monthlyAmount.toLocaleString()}€/mois`
    );
    
    return state;
  }

  // Action YIELD
  private applyYieldAction(state: any, action: any, insights: string[]) {
    const yieldPercentage = action.parameters.yieldPercentage || 0;
    const monthlyYield = yieldPercentage / 100 / 12;
    
    if (action.parameters.targetAssets === 'ALL') {
      state.monthlyIncome += state.totalValue * monthlyYield;
    }
    
    insights.push(
      `Rendement de ${yieldPercentage}% appliqué`
    );
    
    return state;
  }

  // Action EXPENSE
  private applyExpenseAction(state: any, action: any, insights: string[]) {
    const amount = Number(action.amount);
    
    if (action.parameters.isRecurring) {
      state.monthlyExpenses += amount;
      insights.push(
        `Nouvelle dépense récurrente de ${amount.toLocaleString()}€/mois`
      );
    } else {
      state.totalValue -= amount;
      insights.push(
        `Dépense ponctuelle de ${amount.toLocaleString()}€`
      );
    }
    
    return state;
  }

  // Action TAX
  private applyTaxAction(state: any, action: any, insights: string[]) {
    const amount = Number(action.amount);
    state.totalValue -= amount;
    
    insights.push(
      `Impact fiscal de ${amount.toLocaleString()}€`
    );
    
    return state;
  }

  // Calculer le prix de vente
  private calculateSellPrice(asset: any, parameters: any): number {
    switch (parameters.sellPriceType) {
      case 'FIXED':
        return parameters.sellPrice || asset.currentValue;
      case 'PERCENTAGE':
        return asset.currentValue * (1 + (parameters.sellPrice || 0) / 100);
      default:
        return asset.currentValue;
    }
  }

  // Calculer la mensualité d'un prêt
  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    const monthlyRate = annualRate / 12;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  }

  // Appliquer la croissance
  private applyGrowth(state: any, yearFraction: number) {
    const growthRate = 0.05; // 5% par an
    const growthFactor = Math.pow(1 + growthRate, yearFraction);
    
    state.totalValue *= growthFactor;
    
    // Appliquer aussi aux revenus mensuels
    state.totalValue += (state.monthlyIncome - state.monthlyExpenses) * 12 * yearFraction;
    
    return state;
  }

  // Créer un point de projection
  private createProjectionPoint(state: any, date: Date): ProjectionPoint {
    const netValue = state.totalValue - state.totalDebt;
    
    return {
      date: format(date, 'yyyy-MM-dd'),
      totalValue: state.totalValue,
      liquidValue: state.totalValue * 0.2,
      netValue,
      breakdown: this.calculateStateBreakdown(state),
      cashflow: state.monthlyIncome - state.monthlyExpenses,
      debt: state.totalDebt,
      monthlyIncome: state.monthlyIncome,
      monthlyExpenses: state.monthlyExpenses
    };
  }

  // Calculer la répartition de l'état
  private calculateStateBreakdown(state: any): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    state.assets.forEach((asset: any) => {
      if (breakdown[asset.type]) {
        breakdown[asset.type] += asset.currentValue;
      } else {
        breakdown[asset.type] = asset.currentValue;
      }
    });
    
    return breakdown;
  }

  // Calculer les métriques
  private calculateMetrics(points: ProjectionPoint[]): ProjectionMetrics {
    if (points.length === 0) {
      throw new Error('No projection points');
    }

    const initialValue = points[0].totalValue;
    const finalValue = points[points.length - 1].totalValue;
    const totalReturn = finalValue - initialValue;
    const totalReturnPercentage = (totalReturn / initialValue) * 100;
    
    // Calcul du drawdown maximum
    let maxDrawdown = 0;
    let maxDrawdownDate = '';
    let peak = initialValue;
    
    points.forEach(point => {
      if (point.totalValue > peak) {
        peak = point.totalValue;
      }
      const drawdown = (peak - point.totalValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownDate = point.date;
      }
    });
    
    // Calcul de la volatilité
    const returns = [];
    for (let i = 1; i < points.length; i++) {
      const monthlyReturn = (points[i].totalValue - points[i-1].totalValue) / points[i-1].totalValue;
      returns.push(monthlyReturn);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(12); // Annualisée
    
    // Calcul du ratio de Sharpe (avec taux sans risque de 2%)
    const riskFreeRate = 0.02;
    const years = points.length / 12;
    const annualizedReturn = Math.pow(finalValue / initialValue, 1 / years) - 1;
    const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility;
    
    // Ratios de liquidité et d'endettement
    const finalPoint = points[points.length - 1];
    const liquidityRatio = finalPoint.liquidValue / finalPoint.totalValue;
    const debtRatio = finalPoint.debt / finalPoint.totalValue;
    
    // Impact fiscal (estimation)
    const taxImpact = totalReturn * 0.3; // 30% par défaut
    
    return {
      initialValue,
      finalValue,
      totalReturn,
      totalReturnPercentage,
      annualizedReturn,
      maxDrawdown: maxDrawdown * 100,
      maxDrawdownDate,
      volatility: volatility * 100,
      sharpeRatio,
      liquidityRatio: liquidityRatio * 100,
      debtRatio: debtRatio * 100,
      taxImpact
    };
  }
} 