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
  CreditCard, Building, Plus, Edit2, Trash2, Save, X, 
  Link, Wallet, Euro, AlertCircle, CheckCircle, Loader2,
  Smartphone, Shield, Zap
} from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboarding-store'

interface BankAccountFormData {
  bank: string
  type: 'current' | 'savings' | 'securities' | 'pea'
  iban?: string
  balance: number
  currency: string
  entityId?: string
  manual?: boolean
}

const bankAccountTypes = [
  { value: 'current', label: 'Compte courant', icon: CreditCard },
  { value: 'savings', label: 'Livret d\'épargne', icon: Wallet },
  { value: 'securities', label: 'Compte titres', icon: Building },
  { value: 'pea', label: 'PEA', icon: Euro },
]

const popularBanks = [
  'BNP Paribas', 'Crédit Agricole', 'Société Générale', 'LCL', 'Banque Populaire',
  'Crédit Mutuel', 'Caisse d\'Épargne', 'La Banque Postale', 'Crédit Lyonnais',
  'HSBC', 'Boursorama', 'Fortuneo', 'ING', 'Revolut', 'N26', 'Monabanq'
]

export default function BankAccountsStep() {
  const { data, addToStepArray, removeFromStepArray, updateArrayItem } = useOnboardingStore()
  const [mode, setMode] = useState<'choice' | 'bridge' | 'manual'>('choice')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<BankAccountFormData>({
    bank: '',
    type: 'current',
    iban: '',
    balance: 0,
    currency: 'EUR',
    entityId: '',
    manual: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isConnectingBridge, setIsConnectingBridge] = useState(false)

  const bankAccounts = data.bankAccounts || []
  const entities = data.entities || []

  const resetForm = () => {
    setFormData({
      bank: '',
      type: 'current',
      iban: '',
      balance: 0,
      currency: 'EUR',
      entityId: '',
      manual: true,
    })
    setErrors({})
    setEditingId(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.bank.trim()) {
      newErrors.bank = 'Le nom de la banque est requis'
    }

    if (formData.balance < 0) {
      newErrors.balance = 'Le solde ne peut pas être négatif'
    }

    if (formData.iban && !isValidIBAN(formData.iban)) {
      newErrors.iban = 'Format IBAN invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidIBAN = (iban: string): boolean => {
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/
    return ibanRegex.test(iban.replace(/\s/g, ''))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (editingId) {
      updateArrayItem('bankAccounts', editingId, { ...formData })
    } else {
      addToStepArray('bankAccounts', { ...formData })
    }

    resetForm()
    setShowForm(false)
  }

  const handleEdit = (account: any) => {
    setFormData({
      bank: account.bank,
      type: account.type,
      iban: account.iban || '',
      balance: account.balance,
      currency: account.currency,
      entityId: account.entityId || '',
      manual: account.manual || false,
    })
    setEditingId(account.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    removeFromStepArray('bankAccounts', id)
  }

  const handleCancel = () => {
    resetForm()
    setShowForm(false)
  }

  const updateFormField = (field: keyof BankAccountFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBridgeConnection = async () => {
    setIsConnectingBridge(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const bridgeAccounts = [
        {
          bank: 'BNP Paribas',
          type: 'current',
          iban: 'FR1420041010050500013M02606',
          balance: 5420.50,
          currency: 'EUR',
          manual: false,
        },
        {
          bank: 'BNP Paribas',
          type: 'savings',
          iban: 'FR1420041010050500013M02607',
          balance: 12500.00,
          currency: 'EUR',
          manual: false,
        },
      ]

      bridgeAccounts.forEach(account => {
        addToStepArray('bankAccounts', account)
      })

      setMode('choice')
    } catch (error) {
      console.error('Error connecting to Bridge:', error)
    } finally {
      setIsConnectingBridge(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getAccountTypeIcon = (type: string) => {
    const accountType = bankAccountTypes.find(t => t.value === type)
    return accountType ? accountType.icon : CreditCard
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Vos Comptes Bancaires</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ajoutez vos comptes bancaires pour une vision complète de votre patrimoine.
            Choisissez la méthode qui vous convient le mieux.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="group relative cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-500"
            onClick={() => setMode('bridge')}
          >
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Link className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Connexion Automatique</CardTitle>
                  <CardDescription>Via Bridge API</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-green-600">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Import automatique ultra-rapide</span>
                </div>
                <div className="flex items-center space-x-3 text-green-600">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Connexion sécurisée certifiée</span>
                </div>
                <div className="flex items-center space-x-3 text-green-600">
                  <Smartphone className="w-5 h-5" />
                  <span className="font-medium">Synchronisation temps réel</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="group relative cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-500"
            onClick={() => setMode('manual')}
          >
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Edit2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Saisie Manuelle</CardTitle>
                  <CardDescription>Contrôle total</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-purple-600">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Confidentialité maximale</span>
                </div>
                <div className="flex items-center space-x-3 text-purple-600">
                  <Edit2 className="w-5 h-5" />
                  <span className="font-medium">Contrôle total des données</span>
                </div>
                <div className="flex items-center space-x-3 text-purple-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Validation manuelle</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {bankAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Comptes ajoutés ({bankAccounts.length})</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bankAccounts.map((account) => {
                  const IconComponent = getAccountTypeIcon(account.type)
                  return (
                    <div key={account.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                      <div className="p-2 bg-white rounded-lg">
                        <IconComponent className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{account.bank}</div>
                        <div className="text-sm text-gray-600">
                          {bankAccountTypes.find(t => t.value === account.type)?.label}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(account.balance, account.currency)}</div>
                        <Badge variant={account.manual ? 'secondary' : 'default'} className="text-xs">
                          {account.manual ? 'Manuel' : 'Bridge'}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">
            Vous pourrez ajouter vos comptes bancaires plus tard dans les paramètres
          </p>
          <Button variant="outline" onClick={() => setMode('choice')}>
            Passer cette étape
          </Button>
        </div>
      </motion.div>
    )
  }

  if (mode === 'bridge') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Link className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Connexion Bridge</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connectez-vous à votre banque de manière sécurisée pour importer automatiquement vos comptes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connexion à votre banque</CardTitle>
            <CardDescription>
              Processus sécurisé et certifié par l'ACPR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnectingBridge ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {popularBanks.slice(0, 8).map((bank) => (
                    <div key={bank} className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2"></div>
                      <div className="text-sm font-medium">{bank}</div>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Button 
                    onClick={handleBridgeConnection}
                    className="flex items-center space-x-2"
                  >
                    <Link className="w-4 h-4" />
                    <span>Connecter ma banque</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Connexion en cours...</h3>
                <p className="text-gray-600">
                  Nous récupérons vos comptes bancaires en toute sécurité
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="outline" onClick={() => setMode('choice')}>
            Retour au choix
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full">
            <Edit2 className="w-8 h-8 text-purple-600" />
          </div>
          <div className="w-20"></div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2 mt-4">Saisie Manuelle</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Ajoutez vos comptes bancaires manuellement avec un contrôle total sur vos données.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Comptes bancaires ({bankAccounts.length})</span>
              {bankAccounts.length > 0 && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2"
              disabled={showForm}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un compte</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {bankAccounts.length === 0 && !showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucun compte bancaire ajouté
                </h3>
                <p className="text-gray-600 mb-4">
                  Ajoutez vos comptes pour une vision complète de votre patrimoine
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter votre premier compte</span>
                </Button>
              </motion.div>
            )}

            {bankAccounts.map((account) => {
              const IconComponent = getAccountTypeIcon(account.type)
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 mb-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-white rounded-lg">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-800">{account.bank}</h4>
                          <Badge variant="secondary">
                            {bankAccountTypes.find(t => t.value === account.type)?.label}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Solde:</span>
                            <span className="text-lg font-semibold text-green-600">
                              {formatCurrency(account.balance, account.currency)}
                            </span>
                          </div>
                          {account.iban && (
                            <div className="flex items-center space-x-2">
                              <span>IBAN:</span>
                              <span className="font-mono text-xs">
                                {account.iban.replace(/(.{4})/g, '$1 ').trim()}
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
                        onClick={() => handleEdit(account)}
                        className="flex items-center space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
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
                  <span>{editingId ? 'Modifier le compte' : 'Ajouter un compte'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank">Banque *</Label>
                      <Select
                        value={formData.bank}
                        onValueChange={(value) => updateFormField('bank', value)}
                      >
                        <SelectTrigger className={errors.bank ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionnez votre banque" />
                        </SelectTrigger>
                        <SelectContent>
                          {popularBanks.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Autre banque</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.bank && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.bank}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="type">Type de compte *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => updateFormField('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccountTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <type.icon className="w-4 h-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="balance">Solde *</Label>
                      <Input
                        id="balance"
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        onChange={(e) => updateFormField('balance', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className={errors.balance ? 'border-red-500' : ''}
                      />
                      {errors.balance && (
                        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.balance}</span>
                        </div>
                      )}
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

                  <div>
                    <Label htmlFor="iban">IBAN (optionnel)</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => updateFormField('iban', e.target.value.toUpperCase())}
                      placeholder="FR1420041010050500013M02606"
                      className={errors.iban ? 'border-red-500' : ''}
                    />
                    {errors.iban && (
                      <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.iban}</span>
                      </div>
                    )}
                  </div>

                  {entities.length > 0 && (
                    <div>
                      <Label htmlFor="entityId">Propriétaire (optionnel)</Label>
                      <Select
                        value={formData.entityId}
                        onValueChange={(value) => updateFormField('entityId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le propriétaire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucun propriétaire spécifique</SelectItem>
                          {entities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              {entity.name}
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