"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/hooks/useAuth"
import { useParams, useRouter } from "next/navigation"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { ArrowLeft, CreditCard, Calculator, Save, X, Info } from "lucide-react"
import { toast } from "sonner"

interface Asset {
  id: string
  name: string
  assetType: {
    name: string
    color: string | null
  }
  valuations: Array<{
    value: number
    currency: string
  }>
}

interface DebtFormData {
  debtType: string
  name: string
  initialAmount: string
  interestRate: string
  duration: string
  amortizationType: string
  startDate: string
  lender: string
  notes: string
}

export default function NewDebtPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const assetId = params?.id as string

  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<DebtFormData>({
    debtType: 'MORTGAGE',
    name: '',
    initialAmount: '',
    interestRate: '',
    duration: '',
    amortizationType: 'PROGRESSIVE',
    startDate: new Date().toISOString().split('T')[0],
    lender: '',
    notes: ''
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      redirect("/login")
      return
    }
    if (assetId) {
      fetchAsset()
    }
  }, [session, status, assetId])

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/assets/${assetId}`)
      if (response.ok) {
        const data = await response.json()
        setAsset(data)
        // Set default debt name based on asset
        setFormData(prev => ({
          ...prev,
          name: `Financement ${data.name}`
        }))
      } else if (response.status === 404) {
        notFound()
      }
    } catch (error) {
      console.error('Error fetching asset:', error)
      toast.error('Erreur lors du chargement de l\'actif')
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

  const calculateMonthlyPayment = () => {
    const principal = parseFloat(formData.initialAmount)
    const rate = parseFloat(formData.interestRate) / 100 / 12
    const months = parseInt(formData.duration) * 12

    if (!principal || !rate || !months) return 0

    if (formData.amortizationType === 'IN_FINE') {
      return (principal * rate).toFixed(2)
    }

    if (formData.amortizationType === 'BULLET') {
      return '0 (remboursement unique à l\'échéance)'
    }

    const monthlyPayment = principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
    return monthlyPayment.toFixed(2)
  }

  const calculateTotalInterest = () => {
    const principal = parseFloat(formData.initialAmount)
    const rate = parseFloat(formData.interestRate) / 100
    const years = parseInt(formData.duration)

    if (!principal || !rate || !years) return 0

    if (formData.amortizationType === 'IN_FINE') {
      return (principal * rate * years).toFixed(2)
    }

    const monthlyPayment = parseFloat(calculateMonthlyPayment())
    const totalPaid = monthlyPayment * years * 12
    return (totalPaid - principal).toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.initialAmount || !formData.interestRate || !formData.duration) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (parseFloat(formData.initialAmount) <= 0) {
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
          ...formData,
          initialAmount: parseFloat(formData.initialAmount),
          interestRate: parseFloat(formData.interestRate),
          duration: parseInt(formData.duration),
          startDate: new Date(formData.startDate),
        })
      })

      if (response.ok) {
        toast.success('Financement créé avec succès')
        router.push(`/assets/${assetId}/debts`)
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

  const getDebtTypeLabel = (type: string) => {
    const labels = {
      LOAN: 'Prêt personnel',
      MORTGAGE: 'Prêt immobilier',
      CREDIT_LINE: 'Ligne de crédit',
      BOND: 'Obligation',
      OTHER: 'Autre'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getAmortizationTypeLabel = (type: string) => {
    const labels = {
      PROGRESSIVE: 'Progressif (mensualités constantes)',
      LINEAR: 'Linéaire (capital constant)', 
      IN_FINE: 'In fine (intérêts seuls)',
      BULLET: 'Bullet (remboursement unique)'
    }
    return labels[type as keyof typeof labels] || type
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!asset) {
    return notFound()
  }

  const assetValue = asset.valuations[0] ? Number(asset.valuations[0].value) : 0
  const debtAmount = parseFloat(formData.initialAmount) || 0
  const ltvRatio = assetValue > 0 ? (debtAmount / assetValue) * 100 : 0

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/assets/${assetId}/debts`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux financements
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nouveau Financement</h1>
            <p className="text-muted-foreground">
              {asset.name} • {asset.assetType.name}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire principal */}
          <div className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Informations générales
                </CardTitle>
                <CardDescription>
                  Définissez les caractéristiques principales du financement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="debt-name">Nom du financement *</Label>
                  <Input
                    id="debt-name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Ex: Prêt immobilier BNP"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="debt-type">Type de financement *</Label>
                  <Select value={formData.debtType} onValueChange={(value) => updateFormData('debtType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORTGAGE">Prêt immobilier</SelectItem>
                      <SelectItem value="LOAN">Prêt personnel</SelectItem>
                      <SelectItem value="CREDIT_LINE">Ligne de crédit</SelectItem>
                      <SelectItem value="BOND">Obligation</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lender">Organisme prêteur</Label>
                  <Input
                    id="lender"
                    value={formData.lender}
                    onChange={(e) => updateFormData('lender', e.target.value)}
                    placeholder="Ex: BNP Paribas"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    placeholder="Informations complémentaires"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Détails financiers */}
            <Card>
              <CardHeader>
                <CardTitle>Conditions financières</CardTitle>
                <CardDescription>
                  Montant, taux et modalités de remboursement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="debt-amount">Montant (€) *</Label>
                    <Input
                      id="debt-amount"
                      type="number"
                      step="0.01"
                      value={formData.initialAmount}
                      onChange={(e) => updateFormData('initialAmount', e.target.value)}
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <Label htmlFor="start-date">Date de début</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateFormData('startDate', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="amortization-type">Type d'amortissement</Label>
                  <Select 
                    value={formData.amortizationType} 
                    onValueChange={(value) => updateFormData('amortizationType', value)}
                  >
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
              </CardContent>
            </Card>
          </div>

          {/* Aperçu et calculs */}
          <div className="space-y-6">
            {/* Simulation */}
            {formData.initialAmount && formData.interestRate && formData.duration && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Simulation
                  </CardTitle>
                  <CardDescription>
                    Calculs automatiques basés sur vos paramètres
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Mensualités</h4>
                    <p className="text-2xl font-bold text-blue-900">
                      {calculateMonthlyPayment()} €/mois
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {getAmortizationTypeLabel(formData.amortizationType)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-700">Intérêts totaux</h5>
                      <p className="text-lg font-bold text-gray-900">
                        {calculateTotalInterest()} €
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-700">Coût total</h5>
                      <p className="text-lg font-bold text-gray-900">
                        {(parseFloat(formData.initialAmount) + parseFloat(calculateTotalInterest())).toLocaleString('fr-FR')} €
                      </p>
                    </div>
                  </div>

                  {assetValue > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-900 mb-2">Ratio LTV</h4>
                      <p className={`text-xl font-bold ${ltvRatio > 80 ? 'text-red-600' : ltvRatio > 60 ? 'text-orange-600' : 'text-green-600'}`}>
                        {ltvRatio.toFixed(1)}%
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Dette / Valeur de l'actif
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informations sur l'actif */}
            <Card>
              <CardHeader>
                <CardTitle>Actif concerné</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom:</span>
                    <span className="font-medium">{asset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{asset.assetType.name}</span>
                  </div>
                  {assetValue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valeur:</span>
                      <span className="font-medium">
                        {assetValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aide */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <Info className="h-5 w-5 mr-2" />
                  Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700 text-sm space-y-2">
                <p><strong>Progressif:</strong> Mensualités constantes avec capital croissant</p>
                <p><strong>Linéaire:</strong> Capital constant, mensualités décroissantes</p>
                <p><strong>In fine:</strong> Intérêts seuls, capital à l'échéance</p>
                <p><strong>Bullet:</strong> Tout à l'échéance (capital + intérêts)</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/assets/${assetId}/debts`)}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Création...' : 'Créer le financement'}
          </Button>
        </div>
      </form>
    </div>
  )
} 