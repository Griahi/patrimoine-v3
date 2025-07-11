"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  CreditCard, 
  Building, 
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Euro,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  X,
  Check,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { ExcelImportExport } from './ExcelImportExport'

interface Account {
  id: string
  name: string
  bank: string
  type: 'checking' | 'savings'
  balance: number
  currency: string
  iban?: string
  lastSyncAt?: Date
  isActive: boolean
}

interface Transaction {
  id: string
  accountId: string
  date: Date
  description: string
  amount: number
  category: string
  type: 'credit' | 'debit'
  balance: number
  isProcessed: boolean
  merchant?: string
}

interface CheckingAccountsManagerProps {
  selectedAccountId: string | null
  onAccountSelect: (accountId: string | null) => void
}

// Mock data - remplacer par des appels API réels
const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Compte courant principal',
    bank: 'BNP Paribas',
    type: 'checking',
    balance: 3455.39,
    currency: 'EUR',
    iban: 'FR76****0446',
    lastSyncAt: new Date('2024-01-15'),
    isActive: true
  },
  {
    id: '2',
    name: 'Compte épargne',
    bank: 'Crédit Agricole',
    type: 'savings',
    balance: 12450.50,
    currency: 'EUR',
    iban: 'FR14****0237',
    lastSyncAt: new Date('2024-01-14'),
    isActive: true
  }
]

const mockTransactions: Transaction[] = [
  {
    id: '1',
    accountId: '1',
    date: new Date('2024-01-15'),
    description: 'APPLE.COM/BILL CARTE 497400000000937T RIB 22,99EUR',
    amount: -22.99,
    category: 'Achats',
    type: 'debit',
    balance: 3455.39,
    isProcessed: true,
    merchant: 'Apple'
  },
  {
    id: '2',
    accountId: '1',
    date: new Date('2024-01-14'),
    description: 'SPB',
    amount: -49.99,
    category: 'Achats',
    type: 'debit',
    balance: 3478.38,
    isProcessed: true
  },
  {
    id: '3',
    accountId: '1',
    date: new Date('2024-01-13'),
    description: 'INST RECU',
    amount: 650.00,
    category: 'Virement',
    type: 'credit',
    balance: 3528.37,
    isProcessed: true
  },
  {
    id: '4',
    accountId: '1',
    date: new Date('2024-01-12'),
    description: 'APPLE.COM/BILL CARTE 497400000000937T RIB 16,99EUR',
    amount: -16.99,
    category: 'Achats',
    type: 'debit',
    balance: 2878.37,
    isProcessed: true,
    merchant: 'Apple'
  },
  {
    id: '5',
    accountId: '1',
    date: new Date('2024-01-11'),
    description: 'APPLE.COM/BILL CARTE 497400000000937T RIB 9,99EUR',
    amount: -9.99,
    category: 'Achats',
    type: 'debit',
    balance: 2895.36,
    isProcessed: true,
    merchant: 'Apple'
  },
  {
    id: '6',
    accountId: '1',
    date: new Date('2024-01-10'),
    description: 'SPB',
    amount: -452.97,
    category: 'Achats',
    type: 'debit',
    balance: 2905.35,
    isProcessed: true
  },
  {
    id: '7',
    accountId: '1',
    date: new Date('2024-01-09'),
    description: 'VIR PERMANENT ENTRETIEN MENSUEL JARDIN',
    amount: -4329.0,
    category: 'Services',
    type: 'debit',
    balance: 3358.32,
    isProcessed: true
  },
  {
    id: '8',
    accountId: '1',
    date: new Date('2024-01-08'),
    description: 'INST EMIS',
    amount: -4180.0,
    category: 'Virement',
    type: 'debit',
    balance: 7687.32,
    isProcessed: true
  },
  {
    id: '9',
    accountId: '1',
    date: new Date('2024-01-07'),
    description: 'INST EMIS',
    amount: -69.0,
    category: 'Virement',
    type: 'debit',
    balance: 11867.32,
    isProcessed: true
  }
]

export function CheckingAccountsManager({ selectedAccountId, onAccountSelect }: CheckingAccountsManagerProps) {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showExcelImportExport, setShowExcelImportExport] = useState(false)

  // Filtrer les transactions en fonction du compte sélectionné
  const filteredTransactions = transactions.filter(transaction => {
    const matchesAccount = selectedAccountId ? transaction.accountId === selectedAccountId : true
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory

    return matchesAccount && matchesSearch && matchesCategory
  })

  // Calculer le total des comptes
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  // Obtenir les catégories uniques
  const categories = Array.from(new Set(transactions.map(t => t.category)))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Achats': 'bg-red-100 text-red-800',
      'Virement': 'bg-blue-100 text-blue-800',
      'Services': 'bg-purple-100 text-purple-800',
      'Salaire': 'bg-green-100 text-green-800',
      'Banque': 'bg-orange-100 text-orange-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const handleImportTransactions = (importedTransactions: Transaction[]) => {
    // Ajouter les transactions importées à la liste existante
    setTransactions(prevTransactions => [...prevTransactions, ...importedTransactions])
    setShowExcelImportExport(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Liste des comptes */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Comptes</span>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedAccountId === account.id 
                      ? 'bg-blue-50 border-r-2 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onAccountSelect(account.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {account.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {account.bank}
                      </p>
                      {account.iban && (
                        <p className="text-xs text-gray-400 font-mono">
                          {account.iban}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(account.balance)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {account.type === 'checking' ? 'Courant' : 'Épargne'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total des comptes</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Transactions */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transactions
              </CardTitle>
                             <div className="flex items-center gap-2">
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => setShowExcelImportExport(true)}
                 >
                   <Upload className="h-4 w-4 mr-2" />
                   Importer
                 </Button>
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => setShowExcelImportExport(true)}
                 >
                   <Download className="h-4 w-4 mr-2" />
                   Exporter
                 </Button>
               </div>
            </div>
            
            {/* Search and Filters */}
            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une transaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Catégorie</Label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                      <option value="all">Toutes les catégories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterCategory('all')
                      setSearchTerm('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Aucune transaction trouvée</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedTransaction?.id === transaction.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${
                              transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {transaction.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatDate(transaction.date)}</span>
                            <Badge className={`${getCategoryColor(transaction.category)} text-xs`}>
                              {transaction.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Solde: {formatCurrency(transaction.balance)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Transaction Details */}
      <div className="lg:col-span-1">
        {selectedTransaction ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails de la transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Montant</Label>
                <p className={`text-2xl font-bold ${
                  selectedTransaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.amount >= 0 ? '+' : ''}{formatCurrency(selectedTransaction.amount)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Date</Label>
                <p className="text-sm text-gray-900">{formatDate(selectedTransaction.date)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Catégorie</Label>
                <Badge className={`${getCategoryColor(selectedTransaction.category)} text-xs`}>
                  {selectedTransaction.category}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Solde après transaction</Label>
                <p className="text-sm text-gray-900">{formatCurrency(selectedTransaction.balance)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Statut</Label>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-900">Traitée</span>
                </div>
              </div>

              {selectedTransaction.merchant && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Marchand</Label>
                  <p className="text-sm text-gray-900">{selectedTransaction.merchant}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Sélectionnez une transaction pour voir les détails</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Excel Import/Export Modal */}
      {showExcelImportExport && (
        <ExcelImportExport
          transactions={filteredTransactions}
          onImport={handleImportTransactions}
          onClose={() => setShowExcelImportExport(false)}
        />
      )}
    </div>
  )
} 