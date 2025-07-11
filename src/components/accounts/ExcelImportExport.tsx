"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  Upload, 
  Download, 
  File, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  FileSpreadsheet,
  Users
} from 'lucide-react'

interface Transaction {
  id: string
  accountId: string
  date: Date
  description: string
  amount: number
  category: string
  type: 'credit' | 'debit'
  balance: number
  merchant?: string
}

interface ExcelImportExportProps {
  transactions: Transaction[]
  onImport: (transactions: Transaction[]) => void
  onClose: () => void
}

interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  transactions: Transaction[]
}

export function ExcelImportExport({ transactions, onImport, onClose }: ExcelImportExportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setUploadProgress(0)

    try {
      // Simuler la lecture du fichier Excel
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = e.target?.result
        if (!data) return

        // Simuler le traitement du fichier Excel
        const result = await processExcelFile(data as string)
        setImportResult(result)
        setUploadProgress(100)
        
        if (result.success && result.transactions.length > 0) {
          onImport(result.transactions)
        }
      }

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setUploadProgress(progress)
        }
      }

      reader.readAsText(file)
    } catch (error) {
      console.error('Error reading file:', error)
      setImportResult({
        success: false,
        imported: 0,
        errors: ['Erreur lors de la lecture du fichier'],
        transactions: []
      })
    } finally {
      setIsImporting(false)
    }
  }

  const processExcelFile = async (data: string): Promise<ImportResult> => {
    // Simuler le traitement du fichier Excel
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Données simulées d'import
    const mockImportedTransactions: Transaction[] = [
      {
        id: `import_${Date.now()}_1`,
        accountId: '1',
        date: new Date('2024-01-20'),
        description: 'Salaire janvier',
        amount: 3500.00,
        category: 'Salaire',
        type: 'credit',
        balance: 6955.39,
        merchant: 'Entreprise ABC'
      },
      {
        id: `import_${Date.now()}_2`,
        accountId: '1',
        date: new Date('2024-01-19'),
        description: 'Facture électricité',
        amount: -125.50,
        category: 'Services',
        type: 'debit',
        balance: 3455.39
      },
      {
        id: `import_${Date.now()}_3`,
        accountId: '1',
        date: new Date('2024-01-18'),
        description: 'Courses supermarché',
        amount: -78.90,
        category: 'Achats',
        type: 'debit',
        balance: 3580.89
      }
    ]

    return {
      success: true,
      imported: mockImportedTransactions.length,
      errors: [],
      transactions: mockImportedTransactions
    }
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Simuler l'export Excel
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Créer le contenu CSV pour l'export
      const csvContent = generateCSVContent(transactions)
      
      // Créer le blob et télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting file:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSVContent = (transactions: Transaction[]): string => {
    const headers = ['Date', 'Description', 'Montant', 'Catégorie', 'Type', 'Solde', 'Marchand']
    const rows = transactions.map(transaction => [
      transaction.date.toLocaleDateString('fr-FR'),
      transaction.description,
      transaction.amount.toString(),
      transaction.category,
      transaction.type === 'credit' ? 'Crédit' : 'Débit',
      transaction.balance.toString(),
      transaction.merchant || ''
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadTemplate = () => {
    const templateContent = `Date,Description,Montant,Catégorie,Type,Solde,Marchand
2024-01-15,Exemple transaction,-50.00,Achats,Débit,1000.00,Exemple marchand
2024-01-14,Exemple virement,500.00,Virement,Crédit,1050.00,`
    
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template_transactions.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import/Export Excel
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Import Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import de transactions</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.xlsx,.xls"
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Glissez-déposez votre fichier Excel ici, ou
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    <File className="h-4 w-4 mr-2" />
                    Sélectionner un fichier
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500">
                  Formats acceptés: .csv, .xlsx, .xls
                </div>
              </div>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Traitement du fichier...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {importResult && (
              <div className={`p-4 rounded-lg border ${
                importResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {importResult.success ? 'Import réussi' : 'Erreur d\'import'}
                  </span>
                </div>
                
                {importResult.success && (
                  <p className="text-sm text-green-700">
                    {importResult.imported} transactions importées avec succès
                  </p>
                )}
                
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-700 mb-1">Erreurs:</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le modèle
              </Button>
              <span className="text-sm text-gray-500">
                Utilisez ce modèle pour formater vos données
              </span>
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Export des transactions</h3>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Exporter toutes les transactions</p>
                  <p className="text-sm text-gray-600">
                    {transactions.length} transactions disponibles
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleExport}
                disabled={isExporting || transactions.length === 0}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Exporter CSV
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Informations importantes</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Les dates doivent être au format DD/MM/YYYY</li>
              <li>• Les montants négatifs représentent des débits</li>
              <li>• Les montants positifs représentent des crédits</li>
              <li>• Les catégories doivent correspondre aux catégories existantes</li>
              <li>• L'import remplace les données existantes si elles ont le même ID</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 