"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/hooks/useAuth"
import { useParams } from "next/navigation"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  DrawerFooter, 
  DrawerTitle, 
  DrawerDescription 
} from "@/components/ui/Drawer"
import DebtCard from "@/components/DebtCard"
import { CreditCard, Plus, Eye, Edit, Trash2, Euro, Calendar, TrendingDown, AlertCircle, Save, X, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface Asset {
  id: string
  name: string
  assetType: {
    name: string
    color: string | null
  }
  debts: Array<{
    id: string
    debtType: string
    name: string
    initialAmount: number
    currentAmount: number
    interestRate: number
    startDate: string | Date
    endDate: string | Date
    amortizationType: string
    lender: string | null
    monthlyPayment: number | null
    payments: Array<{
      id: string
      paymentNumber: number
      paymentDate: string | Date
      principalAmount: number
      interestAmount: number
      totalAmount: number
      isPaid: boolean
    }>
  }>
  ownerships: Array<{
    ownerEntity: {
      name: string
    }
  }>
  valuations: Array<{
    value: number
  }>
}

interface DebtFormData {
  type: string
  amount: string
  interestRate: string
  duration: string
  amortizationType: string
  startDate: string
  lender: string
  description: string
}

function getDebtTypeLabel(debtType: string) {
  const labels = {
    LOAN: 'Prêt',
    MORTGAGE: 'Prêt immobilier',
    CREDIT_LINE: 'Ligne de crédit',
    BOND: 'Obligation',
    OTHER: 'Autre'
  }
  return labels[debtType as keyof typeof labels] || debtType
}

function getAmortizationTypeLabel(amortType: string) {
  const labels = {
    PROGRESSIVE: 'Progressif',
    LINEAR: 'Linéaire',
    IN_FINE: 'In Fine',
    BULLET: 'Bullet'
  }
  return labels[amortType as keyof typeof labels] || amortType
}

export default function AssetDebtsPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const assetId = params?.id as string

  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<any>(null)

  const [formData, setFormData] = useState<DebtFormData>({
    type: 'LOAN',
    amount: '',
    interestRate: '',
    duration: '',
    amortizationType: 'PROGRESSIVE',
    startDate: new Date().toISOString().split('T')[0],
    lender: '',
    description: ''
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      redirect(`/login?callbackUrl=/assets/${params.id}/debts`)
      return
    }
    if (assetId) {
      fetchAssetWithDebts()
    }
  }, [session, status, assetId])

  const fetchAssetWithDebts = async () => {
    try {
      const response = await fetch(`/api/assets/${assetId}/debts`)
      if (response.ok) {
        const data = await response.json()
        setAsset(data)
      } else if (response.status === 404) {
        notFound()
      }
    } catch (error) {
      console.error('Error fetching asset with debts:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      type: 'LOAN',
      amount: '',
      interestRate: '',
      duration: '',
      amortizationType: 'PROGRESSIVE',
      startDate: new Date().toISOString().split('T')[0],
      lender: '',
      description: ''
    })
  }

  const calculateMonthlyPayment = () => {
    const principal = parseFloat(formData.amount)
    const rate = parseFloat(formData.interestRate) / 100 / 12
    const months = parseInt(formData.duration) * 12

    if (!principal || !rate || !months) return 0

    if (formData.amortizationType === 'IN_FINE') {
      return (principal * rate).toFixed(2)
    }

    const monthlyPayment = principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
    return monthlyPayment.toFixed(2)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateDrawerOpen(true)
  }

  const handleViewDetails = (debt: any) => {
    setSelectedDebt(debt)
    setIsDetailsDrawerOpen(true)
  }

  const handleSubmitCreate = async () => {
    // Validation
    if (!formData.amount || !formData.interestRate || !formData.duration) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Le montant doit être supérieur à 0')
      return
    }

    if (parseFloat(formData.interestRate) < 0) {
      toast.error('Le taux d\'intérêt ne peut pas être négatif')
      return
    }

    if (parseInt(formData.duration) <= 0) {
      toast.error('La durée doit être supérieure à 0')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/assets/${assetId}/debts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.description || `Financement ${asset?.name}`,
          debtType: formData.type,
          initialAmount: parseFloat(formData.amount),
          interestRate: parseFloat(formData.interestRate),
          duration: parseInt(formData.duration),
          amortizationType: formData.amortizationType,
          startDate: new Date(formData.startDate),
          lender: formData.lender,
          notes: formData.description
        })
      })

      if (response.ok) {
        toast.success('Financement créé avec succès')
        setIsCreateDrawerOpen(false)
        resetForm()
        fetchAssetWithDebts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      toast.error('Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!asset) {
    return notFound()
  }

  const totalDebt = asset.debts.reduce((sum, debt) => sum + debt.currentAmount, 0)
  const monthlyPayments = asset.debts.reduce((sum, debt) => sum + (debt.monthlyPayment || 0), 0)
  const assetValue = asset.valuations[0] ? Number(asset.valuations[0].value) : 0
  const ltvRatio = assetValue > 0 ? (totalDebt / assetValue) * 100 : 0
  
  // Déterminer s'il y a des financements actifs
  const hasActiveFinancing = asset.debts.length > 0 && asset.debts.some(debt => 
    debt.currentAmount > 0 && debt.payments.some(payment => !payment.isPaid)
  )

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'actif
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Dettes et Financements</h1>
              {hasActiveFinancing && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Financement actif
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              {asset.name} • {asset.assetType.name}
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Financement
        </Button>
      </div>

      {/* Debt Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={hasActiveFinancing ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dette Totale</CardTitle>
            <TrendingDown className={`h-4 w-4 ${hasActiveFinancing ? 'text-green-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasActiveFinancing ? 'text-green-700' : 'text-red-600'}`}>
              {totalDebt.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className={`text-xs ${hasActiveFinancing ? 'text-green-600' : 'text-muted-foreground'}`}>
              {asset.debts.length} financement{asset.debts.length > 1 ? 's' : ''}
              {hasActiveFinancing ? ' • Actif' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className={hasActiveFinancing ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/30'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensualités</CardTitle>
            <Calendar className={`h-4 w-4 ${hasActiveFinancing ? 'text-blue-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasActiveFinancing ? 'text-blue-700' : 'text-gray-600'}`}>
              {monthlyPayments.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className={`text-xs ${hasActiveFinancing ? 'text-blue-600' : 'text-muted-foreground'}`}>
              Total mensuel{hasActiveFinancing ? ' • En cours' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratio LTV</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ltvRatio > 80 ? 'text-red-600' : ltvRatio > 60 ? 'text-orange-600' : 'text-green-600'}`}>
              {ltvRatio.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Loan to Value
            </p>
          </CardContent>
        </Card>

        <Card className={hasActiveFinancing ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200 bg-gray-50/30'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Nette</CardTitle>
            <Euro className={`h-4 w-4 ${hasActiveFinancing ? 'text-purple-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasActiveFinancing ? 'text-purple-700' : 'text-green-600'}`}>
              {(assetValue - totalDebt).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className={`text-xs ${hasActiveFinancing ? 'text-purple-600' : 'text-muted-foreground'}`}>
              Valeur - Dette{hasActiveFinancing ? ' • Impact financement' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debts List */}
      {asset.debts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun financement</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Cet actif n'a actuellement aucun financement ou dette associé.
              Ajoutez un prêt, crédit ou autre financement.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un financement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {asset.debts.map((debt) => (
            <DebtCard 
              key={debt.id} 
              debt={{
                id: debt.id,
                type: debt.debtType,
                amount: debt.initialAmount,
                remainingAmount: debt.currentAmount,
                interestRate: debt.interestRate,
                duration: Math.ceil((new Date(debt.endDate).getTime() - new Date(debt.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)),
                amortizationType: debt.amortizationType,
                startDate: typeof debt.startDate === 'string' ? debt.startDate : new Date(debt.startDate).toISOString(),
                lender: debt.lender,
                description: debt.name,
                payments: debt.payments.map(payment => ({
                  id: payment.id,
                  paymentDate: typeof payment.paymentDate === 'string' ? payment.paymentDate : new Date(payment.paymentDate).toISOString(),
                  principalAmount: payment.principalAmount,
                  interestAmount: payment.interestAmount,
                  totalAmount: payment.totalAmount,
                  status: payment.isPaid ? 'PAID' : 'PENDING'
                }))
              }}
              onViewDetails={() => handleViewDetails(debt)}
            />
          ))}
        </div>
      )}

      {/* Create Debt Drawer */}
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <DrawerContent size="xl">
          <DrawerHeader>
            <DrawerTitle>Nouveau Financement</DrawerTitle>
            <DrawerDescription>
              Ajoutez un nouveau financement pour {asset.name}
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerBody>
            <div className="space-y-6">
              {/* Asset Info */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900">Actif concerné</h3>
                  <p className="text-sm text-gray-600">{asset.name}</p>
                </CardContent>
              </Card>

              {/* Debt Type and Amortization */}
              <Card>
                <CardHeader>
                  <CardTitle>Type de Financement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="debt-type">Type de financement</Label>
                      <Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOAN">Prêt</SelectItem>
                          <SelectItem value="MORTGAGE">Hypothèque</SelectItem>
                          <SelectItem value="CREDIT_LINE">Ligne de crédit</SelectItem>
                          <SelectItem value="BOND">Obligation</SelectItem>
                          <SelectItem value="OTHER">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amortization-type">Type d'amortissement</Label>
                      <Select value={formData.amortizationType} onValueChange={(value) => updateFormData('amortizationType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROGRESSIVE">Progressif (mensualités constantes)</SelectItem>
                          <SelectItem value="LINEAR">Linéaire (capital constant)</SelectItem>
                          <SelectItem value="IN_FINE">In fine (intérêts seuls)</SelectItem>
                          <SelectItem value="BULLET">Bullet (remboursement unique)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Détails Financiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="debt-amount">Montant (€) *</Label>
                      <Input
                        id="debt-amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => updateFormData('amount', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="interest-rate">Taux d'intérêt (%) *</Label>
                      <Input
                        id="interest-rate"
                        type="number"
                        step="0.01"
                        value={formData.interestRate}
                        onChange={(e) => updateFormData('interestRate', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="debt-duration">Durée (années) *</Label>
                      <Input
                        id="debt-duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => updateFormData('duration', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {formData.amount && formData.interestRate && formData.duration && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-blue-900">Estimation des mensualités</h4>
                        <p className="text-2xl font-bold text-blue-900">
                          {calculateMonthlyPayment()} €/mois
                        </p>
                        {formData.amortizationType === 'IN_FINE' && (
                          <p className="text-sm text-blue-700">
                            Intérêts uniquement. Capital à rembourser : {parseFloat(formData.amount).toLocaleString()} €
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations Complémentaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Date de début *</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateFormData('startDate', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="debt-lender">Prêteur</Label>
                      <Input
                        id="debt-lender"
                        type="text"
                        value={formData.lender}
                        onChange={(e) => updateFormData('lender', e.target.value)}
                        placeholder="Ex: Banque XYZ"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="debt-description">Description</Label>
                    <textarea
                      id="debt-description"
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder="Détails supplémentaires sur ce financement..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button onClick={handleSubmitCreate} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Création...' : 'Créer le financement'}
            </Button>
            <Button variant="outline" onClick={() => setIsCreateDrawerOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Debt Details Drawer */}
      <Drawer open={isDetailsDrawerOpen} onOpenChange={setIsDetailsDrawerOpen}>
        <DrawerContent size="xl">
          <DrawerHeader>
            <DrawerTitle>Détails du Financement</DrawerTitle>
            <DrawerDescription>
              {selectedDebt?.name || 'Informations détaillées sur ce financement'}
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerBody>
            {selectedDebt && (
              <div className="space-y-6">
                {/* Informations générales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Informations Générales</span>
                      <Badge variant="outline">
                        {getDebtTypeLabel(selectedDebt.debtType)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nom du financement</Label>
                        <p className="font-medium">{selectedDebt.name}</p>
                      </div>
                      <div>
                        <Label>Type</Label>
                        <p className="font-medium">{getDebtTypeLabel(selectedDebt.debtType)}</p>
                      </div>
                      <div>
                        <Label>Prêteur</Label>
                        <p className="font-medium">{selectedDebt.lender || 'Non spécifié'}</p>
                      </div>
                      <div>
                        <Label>Type d'amortissement</Label>
                        <p className="font-medium">{getAmortizationTypeLabel(selectedDebt.amortizationType)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Détails financiers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Détails Financiers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <h4 className="text-sm font-medium text-red-700">Montant Initial</h4>
                        <p className="text-2xl font-bold text-red-900">
                          {selectedDebt.initialAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <h4 className="text-sm font-medium text-orange-700">Capital Restant</h4>
                        <p className="text-2xl font-bold text-orange-900">
                          {selectedDebt.currentAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-700">Taux d'Intérêt</h4>
                        <p className="text-2xl font-bold text-blue-900">
                          {selectedDebt.interestRate}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <h4 className="text-sm font-medium text-green-700">Mensualité</h4>
                        <p className="text-2xl font-bold text-green-900">
                          {selectedDebt.monthlyPayment?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dates et durée */}
                <Card>
                  <CardHeader>
                    <CardTitle>Calendrier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Date de début</Label>
                        <p className="font-medium">
                          {new Date(selectedDebt.startDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <Label>Date de fin</Label>
                        <p className="font-medium">
                          {new Date(selectedDebt.endDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <Label>Durée</Label>
                        <p className="font-medium">
                          {selectedDebt.duration} mois
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Échéancier complet */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Échéancier de Remboursement</span>
                      <Badge variant="outline">
                        {selectedDebt.payments?.length || 0} échéances
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDebt.payments && selectedDebt.payments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-2">N°</th>
                              <th className="text-left py-3 px-2">Date</th>
                              <th className="text-right py-3 px-2">Capital</th>
                              <th className="text-right py-3 px-2">Intérêts</th>
                              <th className="text-right py-3 px-2">Total</th>
                              <th className="text-right py-3 px-2">Solde</th>
                              <th className="text-center py-3 px-2">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="max-h-96 overflow-y-auto">
                            {selectedDebt.payments.map((payment: any, index: number) => (
                              <tr key={payment.id} className={`border-b ${payment.isPaid ? 'bg-green-50' : ''}`}>
                                <td className="py-2 px-2 font-medium">{payment.paymentNumber}</td>
                                <td className="py-2 px-2">
                                  {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="text-right py-2 px-2">
                                  {payment.principalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </td>
                                <td className="text-right py-2 px-2">
                                  {payment.interestAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </td>
                                <td className="text-right py-2 px-2 font-semibold">
                                  {payment.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </td>
                                <td className="text-right py-2 px-2">
                                  {payment.remainingBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </td>
                                <td className="text-center py-2 px-2">
                                  <Badge 
                                    variant={payment.isPaid ? "default" : "outline"}
                                    className={payment.isPaid ? "bg-green-100 text-green-800" : ""}
                                  >
                                    {payment.isPaid ? 'Payé' : 'À payer'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Aucun échéancier disponible pour ce financement.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DrawerBody>

          <DrawerFooter>
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline">
                  Enregistrer un paiement
                </Button>
              </div>
              <Button variant="outline" onClick={() => setIsDetailsDrawerOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Fermer
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
} 