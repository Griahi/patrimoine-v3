"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  CheckCircle, Trophy, TrendingUp, Home, CreditCard, Building, 
  Package, Users, Network, DollarSign, BarChart3, AlertTriangle,
  Sparkles, Target, Shield, PiggyBank, Calendar, FileText
} from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboarding-store'

interface PatrimonyInsight {
  type: 'success' | 'warning' | 'info'
  title: string
  description: string
  icon: React.ComponentType<any>
  actions?: string[]
}

export default function SummaryStep() {
  const { data } = useOnboardingStore()
  const [insights, setInsights] = useState<PatrimonyInsight[]>([])
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)

  const entities = data.entities || []
  const bankAccounts = data.bankAccounts || []
  const stockPortfolio = data.stockPortfolio || []
  const realEstate = data.realEstate || []
  const otherAssets = data.otherAssets || []
  const ownership = data.ownership || []

  // Calculate totals
  const totals = {
    bankValue: bankAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    stockValue: stockPortfolio.reduce((sum, stock) => sum + (stock.quantity * (stock.currentPrice || stock.averagePrice)), 0),
    realEstateValue: realEstate.reduce((sum, property) => sum + property.estimatedValue, 0),
    realEstateDebt: realEstate.reduce((sum, property) => sum + (property.remainingDebt || 0), 0),
    otherAssetsValue: otherAssets.reduce((sum, asset) => sum + asset.estimatedValue, 0),
    monthlyRent: realEstate.reduce((sum, property) => sum + (property.monthlyRent || 0), 0),
  }

  const totalGrossValue = totals.bankValue + totals.stockValue + totals.realEstateValue + totals.otherAssetsValue
  const totalNetValue = totalGrossValue - totals.realEstateDebt
  const yearlyRentIncome = totals.monthlyRent * 12

  // Generate AI insights
  useEffect(() => {
    const generateInsights = () => {
      setIsGeneratingInsights(true)
      
      setTimeout(() => {
        const generatedInsights: PatrimonyInsight[] = []

        // Diversification analysis
        if (stockPortfolio.length === 0 && realEstate.length === 0) {
          generatedInsights.push({
            type: 'warning',
            title: 'Diversification limitée',
            description: 'Votre patrimoine semble concentré sur les comptes bancaires. Considérez diversifier avec des investissements financiers ou immobiliers.',
            icon: AlertTriangle,
            actions: ['Explorer les ETF', 'Investissement immobilier']
          })
        }

        // Real estate analysis
        if (realEstate.length > 0) {
          const avgRentYield = realEstate.reduce((sum, property) => {
            if (property.monthlyRent && property.estimatedValue > 0) {
              return sum + (property.monthlyRent * 12 / property.estimatedValue) * 100
            }
            return sum
          }, 0) / realEstate.filter(p => p.monthlyRent && p.monthlyRent > 0).length

          if (avgRentYield > 5) {
            generatedInsights.push({
              type: 'success',
              title: 'Excellent rendement locatif',
              description: `Votre rendement locatif moyen de ${avgRentYield.toFixed(1)}% est très attractif. Continuez sur cette voie !`,
              icon: Trophy,
              actions: ['Optimiser la fiscalité', 'Réinvestir les revenus']
            })
          }
        }

        // Stock portfolio analysis
        if (stockPortfolio.length > 0) {
          const totalCost = stockPortfolio.reduce((sum, stock) => sum + (stock.quantity * stock.averagePrice), 0)
          const currentValue = totals.stockValue
          const performance = ((currentValue - totalCost) / totalCost) * 100

          if (performance > 10) {
            generatedInsights.push({
              type: 'success',
              title: 'Performance boursière positive',
              description: `Votre portefeuille affiche une plus-value de ${performance.toFixed(1)}%. Excellente gestion !`,
              icon: TrendingUp,
              actions: ['Prendre des profits', 'Rééquilibrer le portefeuille']
            })
          }
        }

        // Debt analysis
        if (totals.realEstateDebt > 0) {
          const debtRatio = (totals.realEstateDebt / totalGrossValue) * 100
          if (debtRatio < 30) {
            generatedInsights.push({
              type: 'success',
              title: 'Endettement maîtrisé',
              description: `Votre taux d'endettement de ${debtRatio.toFixed(1)}% est très raisonnable et vous laisse de la marge de manœuvre.`,
              icon: Shield,
              actions: ['Optimiser la déductibilité', 'Investir le surplus']
            })
          }
        }

        // Entity structure analysis
        if (entities.length === 1) {
          generatedInsights.push({
            type: 'info',
            title: 'Structure patrimoniale simple',
            description: 'Votre patrimoine est détenu par une seule entité. Selon votre situation, une optimisation via des structures juridiques pourrait être bénéfique.',
            icon: Building,
            actions: ['Consultation notaire', 'Création SCI', 'Holding familiale']
          })
        }

        // Financial advice
        if (totals.bankValue > totalNetValue * 0.3) {
          generatedInsights.push({
            type: 'warning',
            title: 'Liquidités importantes',
            description: 'Vous détenez beaucoup de liquidités. Considérez des investissements pour faire fructifier ce capital.',
            icon: PiggyBank,
            actions: ['Assurance-vie', 'ETF diversifiés', 'Immobilier locatif']
          })
        }

        setInsights(generatedInsights)
        setIsGeneratingInsights(false)
      }, 2000)
    }

    generateInsights()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getInsightIcon = (insight: PatrimonyInsight) => {
    const IconComponent = insight.icon
    const colorClass = 
      insight.type === 'success' ? 'text-green-600' :
      insight.type === 'warning' ? 'text-orange-600' :
      'text-blue-600'
    
    return <IconComponent className={`w-5 h-5 ${colorClass}`} />
  }

  const getInsightBorderColor = (type: string) => {
    return type === 'success' ? 'border-green-200 bg-green-50' :
           type === 'warning' ? 'border-orange-200 bg-orange-50' :
           'border-blue-200 bg-blue-50'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Trophy className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Félicitations ! 🎉</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Votre patrimoine a été configuré avec succès. Voici un résumé complet de vos actifs 
          et nos premières recommandations personnalisées.
        </p>
      </div>

      {/* Global Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-700">Patrimoine brut</div>
                <div className="text-2xl font-bold text-green-800">{formatCurrency(totalGrossValue)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-700">Patrimoine net</div>
                <div className="text-2xl font-bold text-blue-800">{formatCurrency(totalNetValue)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-gray-600">Revenus locatifs/an</div>
                <div className="text-xl font-bold">{formatCurrency(yearlyRentIncome)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-gray-600" />
              <div>
                <div className="text-sm font-medium text-gray-600">Actifs configurés</div>
                <div className="text-xl font-bold">
                  {bankAccounts.length + stockPortfolio.length + realEstate.length + otherAssets.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Répartition du patrimoine</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Bank Accounts */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="font-semibold text-gray-800">Comptes bancaires</div>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(totals.bankValue)}</div>
              <div className="text-sm text-gray-500">{bankAccounts.length} compte(s)</div>
              <div className="text-xs text-gray-400">
                {totalGrossValue > 0 ? `${((totals.bankValue / totalGrossValue) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>

            {/* Stock Portfolio */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="font-semibold text-gray-800">Portefeuille boursier</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(totals.stockValue)}</div>
              <div className="text-sm text-gray-500">{stockPortfolio.length} titre(s)</div>
              <div className="text-xs text-gray-400">
                {totalGrossValue > 0 ? `${((totals.stockValue / totalGrossValue) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>

            {/* Real Estate */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                <Home className="w-6 h-6 text-orange-600" />
              </div>
              <div className="font-semibold text-gray-800">Immobilier</div>
              <div className="text-lg font-bold text-orange-600">{formatCurrency(totals.realEstateValue)}</div>
              <div className="text-sm text-gray-500">{realEstate.length} bien(s)</div>
              <div className="text-xs text-gray-400">
                {totalGrossValue > 0 ? `${((totals.realEstateValue / totalGrossValue) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>

            {/* Other Assets */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div className="font-semibold text-gray-800">Autres actifs</div>
              <div className="text-lg font-bold text-purple-600">{formatCurrency(totals.otherAssetsValue)}</div>
              <div className="text-sm text-gray-500">{otherAssets.length} actif(s)</div>
              <div className="text-xs text-gray-400">
                {totalGrossValue > 0 ? `${((totals.otherAssetsValue / totalGrossValue) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Entités et structure</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold">{entities.length}</div>
              <div className="text-sm text-gray-600">Entités déclarées</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Network className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <div className="font-semibold">{ownership.length}</div>
              <div className="text-sm text-gray-600">Relations de propriété</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Building className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">
                {entities.filter(e => e.type === 'LEGAL_ENTITY').length}
              </div>
              <div className="text-sm text-gray-600">Entités juridiques</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Analyses & Recommandations IA</span>
          </CardTitle>
          <CardDescription>
            Nos algorithmes ont analysé votre patrimoine et identifié des opportunités d'optimisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {isGeneratingInsights ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <Sparkles className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analyse en cours...</h3>
                <p className="text-gray-600">
                  Notre IA analyse votre patrimoine pour vous proposer des recommandations personnalisées
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 ${getInsightBorderColor(insight.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getInsightIcon(insight)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">{insight.title}</h4>
                        <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
                        {insight.actions && (
                          <div className="flex flex-wrap gap-2">
                            {insight.actions.map((action, actionIndex) => (
                              <Badge key={actionIndex} variant="secondary" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {insights.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Patrimoine équilibré</h3>
                    <p className="text-gray-600">
                      Votre configuration patrimoniale semble bien structurée. Continuez le monitoring 
                      régulier pour identifier de nouvelles opportunités.
                    </p>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Prochaines étapes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Explorez votre dashboard</div>
                <div className="text-sm text-gray-600">Visualisez vos performances en temps réel</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Configurez les alertes</div>
                <div className="text-sm text-gray-600">Soyez notifié des opportunités</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">Générez vos rapports</div>
                <div className="text-sm text-gray-600">Préparez vos déclarations fiscales</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="font-medium">Optimisations fiscales</div>
                <div className="text-sm text-gray-600">Réduisez votre charge fiscale</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
