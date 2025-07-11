"use client"

import { useState } from 'react'
import { CheckingAccountsManager } from '@/components/accounts/CheckingAccountsManager'
import { ExcelImportExport } from '@/components/accounts/ExcelImportExport'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  CreditCard, 
  Plus, 
  Download, 
  Upload, 
  TrendingUp,
  Building,
  AlertCircle,
  Link,
  Sync
} from 'lucide-react'

export default function AccountsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [showExcelModal, setShowExcelModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-8 w-8 text-blue-600" />
                Comptes courants
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez vos comptes bancaires et leurs transactions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowExcelModal(true)}
              >
                <Upload className="h-4 w-4" />
                Importer Excel
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowExcelModal(true)}
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Connecter Bridge
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouveau compte
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total des comptes</p>
                  <p className="text-2xl font-bold text-gray-900">€3,455,391</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Évolution mensuelle</p>
                  <p className="text-2xl font-bold text-green-600">+€22,450</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nombre de comptes</p>
                  <p className="text-2xl font-bold text-gray-900">4</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <CheckingAccountsManager 
          selectedAccountId={selectedAccountId}
          onAccountSelect={setSelectedAccountId}
        />

        {/* Excel Import/Export Modal */}
        {showExcelModal && (
          <ExcelImportExport
            transactions={[]} // Les transactions seront récupérées depuis l'API
            onImport={(transactions) => {
              // Traiter les transactions importées
              console.log('Transactions importées:', transactions)
              setShowExcelModal(false)
            }}
            onClose={() => setShowExcelModal(false)}
          />
        )}
      </div>
    </div>
  )
} 