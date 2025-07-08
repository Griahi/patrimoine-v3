"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "@/hooks/useAuth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import DebtCard from "@/components/DebtCard"
import { 
  CreditCard, 
  Euro, 
  Calendar, 
  TrendingDown, 
  Building,
  PieChart,
  Search
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"

interface Debt {
  id: string
  name: string
  debtType: string
  initialAmount: number
  currentAmount: number
  interestRate: number
  duration: number
  amortizationType: string
  startDate: string
  endDate: string
  monthlyPayment: number | null
  lender: string | null
  notes: string | null
  asset: {
    id: string
    name: string
    assetType: {
      name: string
      color: string | null
    }
    ownerships: Array<{
      ownerEntity: {
        name: string
      }
    }>
    valuations: Array<{
      value: number
    }>
  }
  payments: Array<{
    id: string
    paymentNumber: number
    paymentDate: string
    principalAmount: number
    interestAmount: number
    totalAmount: number
    isPaid: boolean
  }>
}

interface DebtSummary {
  totalDebt: number
  totalInitialAmount: number
  totalMonthlyPayments: number
  activeDebtsCount: number
  totalDebtsCount: number
}

export default function LoansPage() {
  const { data: session, status } = useSession()
  const [debts, setDebts] = useState<Debt[]>([])
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([])
  const [summary, setSummary] = useState<DebtSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const fetchDebts = async () => {
    try {
      const response = await fetch("/api/debts")
      if (response.ok) {
        const data = await response.json()
        setDebts(data.debts)
        setSummary(data.summary)
      } else {
        toast.error("Erreur lors du chargement des prêts")
      }
    } catch (error) {
      console.error("Error fetching debts:", error)
      toast.error("Erreur lors du chargement des prêts")
    } finally {
      setLoading(false)
    }
  }

  const filterDebts = useCallback(() => {
    let filtered = debts

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(debt => 
        debt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.lender?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(debt => debt.debtType === filterType)
    }

    // Filter by status
    if (filterStatus === "active") {
      filtered = filtered.filter(debt => 
        debt.currentAmount > 0 && debt.payments.some(payment => !payment.isPaid)
      )
    } else if (filterStatus === "completed") {
      filtered = filtered.filter(debt => 
        debt.currentAmount === 0 || debt.payments.every(payment => payment.isPaid)
      )
    }

    setFilteredDebts(filtered)
  }, [debts, searchTerm, filterType, filterStatus])

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      redirect("/login?callbackUrl=/loans")
      return
    }
    fetchDebts()
  }, [session, status])

  useEffect(() => {
    filterDebts()
  }, [filterDebts])

  const getDebtTypeLabel = (type: string) => {
    const labels = {
      LOAN: 'Prêt',
      MORTGAGE: 'Prêt immobilier',
      CREDIT_LINE: 'Ligne de crédit',
      BOND: 'Obligation',
      OTHER: 'Autre'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getDebtStatusColor = (debt: Debt) => {
    const isActive = debt.currentAmount > 0 && debt.payments.some(payment => !payment.isPaid)
    return isActive ? 'success' : 'secondary'
  }

  const getDebtStatusText = (debt: Debt) => {
    const isActive = debt.currentAmount > 0 && debt.payments.some(payment => !payment.isPaid)
    return isActive ? 'Actif' : 'Soldé'
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Prêts</h1>
          <p className="text-gray-600 mt-2">
            Vue d&apos;ensemble de tous vos prêts et financements
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dette Totale</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.totalDebt.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
              <p className="text-xs text-muted-foreground">
                sur {summary.totalInitialAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} initial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensualités Totales</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {summary.totalMonthlyPayments.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
              <p className="text-xs text-muted-foreground">
                par mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prêts Actifs</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.activeDebtsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                en cours de remboursement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prêts</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalDebtsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                prêts au total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nom du prêt, actif, prêteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Type de prêt</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="LOAN">Prêt</SelectItem>
                  <SelectItem value="MORTGAGE">Prêt immobilier</SelectItem>
                  <SelectItem value="CREDIT_LINE">Ligne de crédit</SelectItem>
                  <SelectItem value="BOND">Obligation</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="completed">Soldés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debts List */}
      {filteredDebts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {debts.length === 0 ? "Aucun prêt trouvé" : "Aucun prêt ne correspond aux filtres"}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {debts.length === 0 
                ? "Vous n'avez actuellement aucun prêt enregistré dans votre patrimoine."
                : "Modifiez vos critères de recherche pour voir plus de résultats."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredDebts.map((debt) => (
            <div key={debt.id} className="space-y-4">
              {/* Asset Header */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{debt.asset.name}</h3>
                    <p className="text-sm text-gray-600">
                      {debt.asset.assetType.name} • 
                      {debt.asset.ownerships.map(o => o.ownerEntity.name).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getDebtStatusColor(debt)}>
                    {getDebtStatusText(debt)}
                  </Badge>
                  <Badge variant="outline">
                    {getDebtTypeLabel(debt.debtType)}
                  </Badge>
                </div>
              </div>

              {/* Debt Card */}
              <DebtCard 
                debt={{
                  id: debt.id,
                  type: debt.debtType,
                  amount: debt.initialAmount,
                  remainingAmount: debt.currentAmount,
                  interestRate: debt.interestRate,
                  duration: Math.ceil((new Date(debt.endDate).getTime() - new Date(debt.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)),
                  amortizationType: debt.amortizationType,
                  startDate: debt.startDate,
                  lender: debt.lender,
                  description: debt.name,
                  payments: debt.payments.map(payment => ({
                    id: payment.id,
                    paymentDate: payment.paymentDate,
                    principalAmount: payment.principalAmount,
                    interestAmount: payment.interestAmount,
                    totalAmount: payment.totalAmount,
                    status: payment.isPaid ? 'PAID' : 'PENDING'
                  }))
                }}
                onViewDetails={() => {
                  // Navigate to asset debt details
                  window.location.href = `/assets/${debt.asset.id}/debts`
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 