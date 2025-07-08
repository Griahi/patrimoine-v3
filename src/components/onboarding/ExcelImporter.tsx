"use client"

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  Download, FileSpreadsheet, AlertCircle, ChevronLeft, Upload, 
  CheckCircle, X, FileText, Loader2 
} from 'lucide-react'
import { parseExcelFile, exportTemplateToBuffer } from '@/services/excel-parser'
import { DataPreview } from './shared/DataPreview'
import { ImportProgress } from './shared/ImportProgress'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { type ValidationResult } from '@/utils/onboarding/excel-validator'

interface ExcelImporterProps {
  onBack: () => void
  onComplete: () => void
}

type ImporterState = 'upload' | 'preview' | 'importing' | 'completed'

export default function ExcelImporter({ onBack, onComplete }: ExcelImporterProps) {
  const [state, setState] = useState<ImporterState>('upload')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [importDetails, setImportDetails] = useState<any>(null)
  const [currentImportStep, setCurrentImportStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const { importExcelData, setLoading } = useOnboardingStore()

  // Handle file drop with more debugging
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('onDrop called with files:', acceptedFiles)
    }
    
    if (acceptedFiles.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No accepted files')
      }
      return
    }

    const file = acceptedFiles[0]
    if (process.env.NODE_ENV === 'development') {
      console.log('Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
    }
    
    setError(null)
    setLoading(true)

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Parsing file:', file.name)
      }
      const result = await parseExcelFile(file)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Parsing completed:', result)
      }
      setValidation(result.validation)
      
      if (result.validation.errors.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Validation successful, switching to preview')
        }
        setState('preview')
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('Validation errors:', result.validation.errors)
        }
        
        // Check if we have critical errors or just warnings
        const criticalErrors = result.validation.errors.filter(err => 
          !err.message.includes('n\'existe pas') // Cross-reference warnings
        )
        
        if (criticalErrors.length === 0) {
          // Only warnings, allow preview
          if (process.env.NODE_ENV === 'development') {
            console.log('Only warnings found, allowing preview')
          }
          setState('preview')
        } else {
          // Format errors properly for display
          const errorMessages = criticalErrors.map(err => 
            `${err.sheet} ligne ${err.row}: ${err.message} (${err.field})`
          ).join('\n')
          setError(`Erreurs de validation:\n${errorMessages}\n\nCorrigez ces erreurs ou utilisez le bouton "Debug Validation" pour plus de détails.`)
        }
      }
    } catch (error: any) {
      console.error('Excel Import Error:', {
        file: file.name,
        size: file.size,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      setError(error.message || 'Erreur lors de la lecture du fichier Excel')
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  // Download template
  const downloadTemplate = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting template download...')
      }
      
      // First try the API route method as it's more reliable
      const response = await fetch('/api/onboarding/template')
      if (process.env.NODE_ENV === 'development') {
        console.log('API response:', response.status, response.statusText)
      }
      
      if (response.ok) {
        const blob = await response.blob()
        if (process.env.NODE_ENV === 'development') {
          console.log('Template downloaded from API, size:', blob.size, 'bytes', 'type:', blob.type)
        }
        
        // Create download link
        const url = URL.createObjectURL(blob)
        if (process.env.NODE_ENV === 'development') {
          console.log('Object URL created:', url)
        }
        
        const link = document.createElement('a')
        link.href = url
        link.download = 'template-patrimoine.xlsx'
        link.style.display = 'none'
        
        document.body.appendChild(link)
        if (process.env.NODE_ENV === 'development') {
          console.log('Link added to document, triggering click...')
        }
        link.click()
        document.body.removeChild(link)
        
        setTimeout(() => URL.revokeObjectURL(url), 100)
        if (process.env.NODE_ENV === 'development') {
          console.log('Template download successful via API')
        }
        
        // Show success message
        alert('Téléchargement du template réussi!')
        return
      } else {
        console.error('Template Download Error:', {
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        })
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }
      
    } catch (error) {
      console.error('Template Download Error:', {
        error: error.message,
        timestamp: new Date().toISOString()
      })
      setError(`Erreur lors du téléchargement: ${error.message}`)
      alert(`Erreur de téléchargement: ${error.message}`)
    }
  }

  // Handle import
  const handleImport = async () => {
    if (!validation || !validation.isValid) return

    setState('importing')
    setProgress(0)
    setCurrentImportStep('entities')

    try {
      // Simulate import process with progress
      const steps = ['entities', 'bankAccounts', 'stockPortfolio', 'realEstate', 'ownership']
      let currentProgress = 0
      const stepIncrement = 100 / steps.length

      const details: any = {
        total: Object.values(validation.data).reduce((sum, items) => sum + (items?.length || 0), 0)
      }

      for (const step of steps) {
        setCurrentImportStep(step)
        const items = validation.data[step as keyof typeof validation.data] || []
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
        
        details[step] = items.length
        setImportDetails({ ...details })
        
        currentProgress += stepIncrement
        setProgress(currentProgress)
      }

      // Import data into store
      importExcelData(validation.data)
      
      setProgress(100)
      setState('completed')
      
      // Complete after a short delay
      setTimeout(() => {
        onComplete()
      }, 2000)

    } catch (error: any) {
      console.error('Import error:', error)
      setError(error.message || 'Erreur lors de l\'import')
      setState('preview')
    }
  }

  const resetImporter = () => {
    setState('upload')
    setValidation(null)
    setError(null)
    setProgress(0)
    setImportDetails(null)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Import Excel</h1>
            <p className="text-gray-600">Importez vos données patrimoniales depuis un fichier Excel</p>
          </div>
        </div>
        
        {state === 'upload' && (
          <div className="flex items-center space-x-2">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Télécharger le template</span>
            </Button>
            <Button 
              onClick={() => {
                const link = document.createElement('a')
                link.href = '/api/onboarding/template'
                link.download = 'template-patrimoine.xlsx'
                link.click()
              }} 
              variant="ghost" 
              size="sm"
              className="text-xs"
            >
              Téléchargement direct
            </Button>
          </div>
        )}
      </div>

      {/* Upload State */}
      {state === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <FileText className="w-5 h-5" />
                <span>Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 space-y-2">
              <p>1. Téléchargez le template Excel en cliquant sur le bouton ci-dessus</p>
              <p className="text-sm text-blue-600 ml-4">💡 Si cela ne fonctionne pas, essayez "Téléchargement direct"</p>
              <p>2. Remplissez les différentes feuilles avec vos données patrimoniales</p>
              <p>3. Glissez-déposez votre fichier complété dans la zone ci-dessous</p>
              <p>4. Vérifiez les données importées et confirmez l'import</p>
            </CardContent>
          </Card>

          {/* Drop Zone */}
          <Card>
            <CardContent className="p-0">
              <div
                {...getRootProps()}
                className={`p-12 text-center cursor-pointer transition-all duration-300 rounded-lg border-2 border-dashed ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50 transform scale-105' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                data-testid="dropzone"
              >
                <input {...getInputProps()} data-testid="file-input" />
                
                <motion.div
                  animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FileSpreadsheet 
                    className={`w-24 h-24 mx-auto mb-6 ${
                      isDragActive ? 'text-blue-500' : 'text-gray-400'
                    }`} 
                  />
                </motion.div>
                
                <h3 className={`text-2xl font-semibold mb-2 ${
                  isDragActive ? 'text-blue-700' : 'text-gray-800'
                }`}>
                  {isDragActive ? '✨ Déposez le fichier ici ✨' : 'Glissez-déposez votre fichier Excel'}
                </h3>
                <p className="text-gray-600 mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                <p className="text-sm text-gray-500">
                  Formats acceptés: .xlsx, .xls • Taille max: 10MB
                </p>
                
                {/* Debug info in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 text-xs text-gray-400 font-mono">
                    <p>isDragActive: {isDragActive.toString()}</p>
                    <p>dropzone ready</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Rejection Errors */}
          {fileRejections.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Fichier rejeté:</span>
                </div>
                {fileRejections.map(({ file, errors }) => (
                  <div key={file.name} className="mt-2 text-sm text-red-600">
                    <div className="font-medium">{file.name}</div>
                    <ul className="list-disc list-inside">
                      {errors.map(error => (
                        <li key={error.code}>{error.message}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* General Error */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Erreur:</span>
                    <div className="mt-2 whitespace-pre-line text-sm">{error}</div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setError(null)}
                  >
                    Réessayer
                  </Button>
                  {validation && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        console.log('Forcing preview with validation errors')
                        setState('preview')
                        setError(null)
                      }}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      Continuer malgré les erreurs
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Tools (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-800 text-sm">🛠️ Outils de Debug</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/onboarding/template')
                        const blob = await response.blob()
                        console.log('Test API - Status:', response.status, 'Size:', blob.size, 'Type:', blob.type)
                        alert(`API Test - Status: ${response.status}, Size: ${blob.size} bytes`)
                      } catch (err) {
                        console.error('API Test failed:', err)
                        alert(`API Test failed: ${err.message}`)
                      }
                    }}
                  >
                    Test API
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                      console.log('File input element:', fileInput)
                      console.log('File input attributes:', {
                        accept: fileInput?.accept,
                        multiple: fileInput?.multiple,
                        disabled: fileInput?.disabled
                      })
                      alert('Check console for file input debug info')
                    }}
                  >
                    Test Input
                  </Button>
                  {validation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('=== VALIDATION DEBUG ===')
                        console.log('Validation result:', validation)
                        console.log('Errors count:', validation.errors.length)
                        validation.errors.forEach((err, index) => {
                          console.log(`Error ${index + 1}:`, err)
                        })
                        console.log('Warnings count:', validation.warnings.length)
                        validation.warnings.forEach((warn, index) => {
                          console.log(`Warning ${index + 1}:`, warn)
                        })
                        console.log('Data:', validation.data)
                        alert(`${validation.errors.length} erreurs et ${validation.warnings.length} avertissements trouvés. Vérifiez la console.`)
                      }}
                    >
                      Debug Validation
                    </Button>
                  )}
                </div>
                <p className="text-xs text-purple-600">
                  Utilisez ces boutons pour diagnostiquer les problèmes
                </p>
                {validation && (
                  <div className="mt-4 p-3 bg-purple-100 rounded text-xs">
                    <div className="font-mono space-y-1">
                      <div>📊 Données parsées:</div>
                      <div className="ml-2">
                        • Entités: {validation.data.entities?.length || 0}
                      </div>
                      <div className="ml-2">
                        • Comptes bancaires: {validation.data.bankAccounts?.length || 0}
                      </div>
                      <div className="ml-2">
                        • Actions: {validation.data.stockPortfolio?.length || 0}
                      </div>
                      <div className="ml-2">
                        • Immobilier: {validation.data.realEstate?.length || 0}
                      </div>
                      <div className="ml-2">
                        • Détentions: {validation.data.ownership?.length || 0}
                      </div>
                      <div className="mt-2">
                        ⚠️ Erreurs: {validation.errors.length} | 
                        💡 Avertissements: {validation.warnings.length}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Preview State */}
      {state === 'preview' && validation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <DataPreview validation={validation} />
          
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={resetImporter}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            
            <Button 
              onClick={handleImport} 
              disabled={!validation.isValid}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>
                {validation.isValid 
                  ? 'Importer les données' 
                  : `Corriger les ${validation.errors.length} erreur(s)`
                }
              </span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Importing State */}
      {state === 'importing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ImportProgress 
            progress={progress} 
            currentStep={currentImportStep}
            details={importDetails}
          />
        </motion.div>
      )}

      {/* Completed State */}
      {state === 'completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Import terminé !</h2>
          <p className="text-gray-600 mb-8">
            Vos données ont été importées avec succès dans votre espace patrimonial.
          </p>
          <Button onClick={onComplete} size="lg">
            Accéder à mon patrimoine
          </Button>
        </motion.div>
      )}
    </div>
  )
} 