"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Building,
  Eye,
  Sync,
  MoreVertical
} from 'lucide-react'

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

interface AccountSummaryCardProps {
  account: Account
  transactions: number
  monthlyChange: number
  isSelected: boolean
  onClick: () => void
}

export function AccountSummaryCard({ 
  account, 
  transactions, 
  monthlyChange, 
  isSelected, 
  onClick 
}: AccountSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: account.currency,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getTypeLabel = (type: string) => {
    return type === 'checking' ? 'Compte courant' : 'Compte épargne'
  }

  const getTypeColor = (type: string) => {
    return type === 'checking' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              account.type === 'checking' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              <CreditCard className={`h-5 w-5 ${
                account.type === 'checking' ? 'text-blue-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {account.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{account.bank}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Solde actuel</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(account.balance)}
          </p>
        </div>

        {/* Monthly Change */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {monthlyChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {monthlyChange >= 0 ? '+' : ''}{formatCurrency(monthlyChange)}
            </span>
          </div>
          <span className="text-xs text-gray-500">Ce mois</span>
        </div>

        {/* Account Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={getTypeColor(account.type)}>
              {getTypeLabel(account.type)}
            </Badge>
            <span className="text-xs text-gray-500">
              {transactions} transactions
            </span>
          </div>

          {account.iban && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">IBAN</span>
              <span className="text-xs font-mono text-gray-700">
                {account.iban}
              </span>
            </div>
          )}

          {account.lastSyncAt && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Sync className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">Dernière sync</span>
              </div>
              <span className="text-xs text-gray-700">
                {formatDate(account.lastSyncAt)}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            Détails
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Sync className="h-4 w-4 mr-1" />
            Sync
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 