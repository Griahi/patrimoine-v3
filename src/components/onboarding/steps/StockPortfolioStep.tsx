"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { 
  TrendingUp, TrendingDown, Plus, Edit2, Trash2, Save, X, 
  Search, AlertCircle, CheckCircle,
  Building, BarChart3, FileText, Import, Upload
} from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboarding-store'

interface StockFormData {
  symbol: string
  name: string
  quantity: number
  averagePrice: number
  currentPrice?: number
  currency: string
  accountId?: string
}

export default function StockPortfolioStep() {
  const { data, addToStepArray, removeFromStepArray, updateArrayItem } = useOnboardingStore()
  const [mode, setMode] = useState<'choice' | 'manual'>('choice')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<StockFormData>({
    symbol: '',
    name: '',
    quantity: 0,
    averagePrice: 0,
    currentPrice: 0,
    currency: 'EUR',
    accountId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const stockPortfolio = data.stockPortfolio || []
  const bankAccounts = data.bankAccounts?.filter(account => 
    account.type === 'securities' || account.type === 'pea'
  ) || []

  const resetForm = () => {
    setFormData({
      symbol: '',
      name: '',
      quantity: 0,
      averagePrice: 0,
      currentPrice: 0,
      currency: 'EUR',
      accountId: '',
    })
    setErrors({})
    setEditingId(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Le symbole est requis'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La quantité doit être positive'
    }

    if (formData.averagePrice <= 0) {
      newErrors.averagePrice = 'Le prix d\'achat doit être positif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (editingId) {
      updateArrayItem('stockPortfolio', editingId, { ...formData })
    } else {
      addToStepArray('stockPortfolio', { ...formData })
    }

    resetForm()
    setShowForm(false)
  }

  const handleEdit = (stock: any) => {
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity,
      averagePrice: stock.averagePrice,
      currentPrice: stock.currentPrice || 0,
      currency: stock.currency,
      accountId: stock.accountId || '',
    })
    setEditingId(stock.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    removeFromStepArray('stockPortfolio', id)
  }

  const handleCancel = () => {
    resetForm()
    setShowForm(false)
  }

  const updateFormField = (field: keyof StockFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const calculateGainLoss = (stock: any) => {
    if (!stock.currentPrice || !stock.averagePrice) return null
    
    const totalValue = stock.quantity * stock.currentPrice
    const totalCost = stock.quantity * stock.averagePrice
    const gainLoss = totalValue - totalCost
    const gainLossPercent = (gainLoss / totalCost) * 100
    
    return {
      amount: gainLoss,
      percentage: gainLossPercent,
      isPositive: gainLoss >= 0,
    }
  }

  const getTotalPortfolioValue = () => {
    return stockPortfolio.reduce((total, stock) => {
      const value = stock.quantity * (stock.currentPrice || stock.averagePrice)
      return total + value
    }, 0)
  }

  if (mode === 'choice') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Votre Portefeuille Boursier</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ajoutez vos investissements en actions, ETF et autres titres financiers pour suivre vos performances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="group relative cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-500"
            onClick={() => setMode('manual')}
          >
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Saisie Manuelle</CardTitle>
                  <CardDescription>Contrôle total</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-blue-600">
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Saisie détaillée</span>
                </div>
                <div className="flex items-center space-x-3 text-blue-600">
                  <Building className="w-5 h-5" />
                  <span className="font-medium">Contrôle total</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative opacity-50 cursor-not-allowed">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gray-400 rounded-lg">
                  <Import className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Import CSV/Excel</CardTitle>
                  <CardDescription>Bientôt disponible</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-500">
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Import en masse</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-500">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Fichiers CSV/Excel</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {stockPortfolio.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Votre Portefeuille ({stockPortfolio.length} titres)</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </CardTitle>
              <CardDescription>
                Valeur totale estimée : {formatCurrency(getTotalPortfolioValue(), 'EUR')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockPortfolio.map((stock) => {
                  const gainLoss = calculateGainLoss(stock)
                  return (
                    <div key={stock.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{stock.symbol}</div>
                          <div className="text-sm text-gray-600">{stock.name}</div>
                          <div className="text-xs text-gray-500">
                            {stock.quantity} actions × {formatCurrency(stock.averagePrice, stock.currency)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(stock.quantity * (stock.currentPrice || stock.averagePrice), stock.currency)}
                        </div>
                        {gainLoss && (
                          <div className={`text-sm ${gainLoss.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {gainLoss.isPositive ? '+' : ''}{formatCurrency(gainLoss.amount, stock.currency)}
                            {' '}({gainLoss.percentage.toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button variant="outline" onClick={() => setMode('choice')}>
            Passer cette étape
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-between w-full max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={() => setMode('choice')}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Retour</span>
          </Button>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <div className="w-20"></div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2 mt-4">Gestion du Portefeuille</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Ajoutez vos titres financiers pour suivre vos investissements et leurs performances.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Titres en portefeuille ({stockPortfolio.length})</span>
              {stockPortfolio.length > 0 && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2"
              disabled={showForm}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un titre</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {stockPortfolio.length === 0 && !showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucun titre en portefeuille
                </h3>
                <p className="text-gray-600 mb-4">
                  Ajoutez vos premiers titres pour suivre vos investissements
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter votre premier titre</span>
                </Button>
              </motion.div>
            )}

            {stockPortfolio.map((stock) => {
              const gainLoss = calculateGainLoss(stock)
              return (
                <motion.div
                  key={stock.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 mb-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-white rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-800">{stock.symbol}</h4>
                          <Badge variant="secondary">{stock.name}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span>Quantité: {stock.quantity}</span>
                            <span>Prix moyen: {formatCurrency(stock.averagePrice, stock.currency)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Valeur actuelle:</span>
                            <span className="text-lg font-semibold text-green-600">
                              {formatCurrency(stock.quantity * (stock.currentPrice || stock.averagePrice), stock.currency)}
                            </span>
                          </div>
                          {gainLoss && (
                            <div className={`flex items-center space-x-2 ${gainLoss.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {gainLoss.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              <span>
                                {gainLoss.isPositive ? '+' : ''}{formatCurrency(gainLoss.amount, stock.currency)}
                                {' '}({gainLoss.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(stock)}
                        className="flex items-center space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(stock.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>{editingId ? 'Modifier le titre' : 'Ajouter un titre'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="symbol">Symbole *</Label>
                      <Input
                        id="symbol"
                        value={formData.symbol}
                        onChange={(e) => updateFormField('symbol', e.target.value.toUpperCase())}
                        placeholder="Ex: AAPL"
                        className={errors.symbol ? 'border-red-500' : ''}
                      />
                      {errors.symbol && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.symbol}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name">Nom du titre *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormField('name', e.target.value)}
                        placeholder="Ex: Apple Inc."
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="quantity">Quantité *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => updateFormField('quantity', parseFloat(e.target.value) || 0)}
                        placeholder="10"
                        className={errors.quantity ? 'border-red-500' : ''}
                      />
                      {errors.quantity && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.quantity}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="averagePrice">Prix d'achat moyen *</Label>
                      <Input
                        id="averagePrice"
                        type="number"
                        step="0.01"
                        value={formData.averagePrice}
                        onChange={(e) => updateFormField('averagePrice', parseFloat(e.target.value) || 0)}
                        placeholder="150.00"
                        className={errors.averagePrice ? 'border-red-500' : ''}
                      />
                      {errors.averagePrice && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.averagePrice}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="currentPrice">Prix actuel (optionnel)</Label>
                      <Input
                        id="currentPrice"
                        type="number"
                        step="0.01"
                        value={formData.currentPrice}
                        onChange={(e) => updateFormField('currentPrice', parseFloat(e.target.value) || 0)}
                        placeholder="175.50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="currency">Devise</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => updateFormField('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la devise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CHF">CHF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {bankAccounts.length > 0 && (
                    <div>
                      <Label htmlFor="accountId">Compte de titres (optionnel)</Label>
                      <Select
                        value={formData.accountId}
                        onValueChange={(value) => updateFormField('accountId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le compte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucun compte spécifique</SelectItem>
                          {bankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.bank} - {account.type === 'securities' ? 'Compte titres' : 'PEA'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Annuler</span>
                    </Button>
                    <Button
                      type="submit"
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingId ? 'Modifier' : 'Ajouter'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
