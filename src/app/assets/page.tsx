"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/hooks/useAuth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  DrawerFooter, 
  DrawerTitle, 
  DrawerDescription 
} from "@/components/ui/Drawer"
import { TrendingUp, Building2, Plus, Eye, Edit, Euro, Calendar, CreditCard, Save, X, Trash2, Users, Filter, List, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { DynamicAssetForm } from "@/components/forms/DynamicAssetForm"
import { BaseAssetFormData } from "@/types/assets"
import { ConfirmationDialog } from "@/components/ui/Dialog"
import { 
  formatCurrency, 
  calculateAssetValue, 
  calculateOwnershipPercentage, 
  validateValuation 
} from "@/utils/financial-calculations"
import { useRouter } from "next/navigation"

interface Asset {
  id: string
  name: string
  description: string | null
  metadata?: any
  assetType: {
    id: string
    name: string
    code: string
    color: string | null
  }
  valuations: Array<{
    value: number
    valuationDate: Date
  }>
  ownerships: Array<{
    percentage: number
    ownerEntity: {
      id: string
      name: string
    }
  }>
  debts?: Array<{
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
    lender: string | null
    notes: string | null
  }>
  createdAt: Date
}

interface AssetType {
  id: string
  name: string
  code: string
  description: string
  color: string | null
}

interface Entity {
  id: string
  name: string
  type: string
}

// Using BaseAssetFormData from types/assets.ts

export default function AssetsPage() {
  const { data: session, status } = useSession()
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // États pour la suppression avec confirmation
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Nouveau état pour le filtrage par type d'actif
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState<string | null>(null)

  const [formData, setFormData] = useState<BaseAssetFormData>({
    name: '',
    description: '',
    assetTypeId: '',
    owners: [{ entityId: '', percentage: 100 }],
    initialValue: 0,
    valuationDate: new Date().toISOString().split('T')[0],
    metadata: {}
  })

  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      redirect("/login?callbackUrl=/assets")
      return
    }
    fetchData()
  }, [session, status])

  const fetchData = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 DEBUT fetchData - Rechargement des données...')
      }
      const [assetsRes, assetTypesRes, entitiesRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/asset-types'),
        fetch('/api/entities')
      ])

      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Réponses APIs:', {
          assets: assetsRes.status,
          assetTypes: assetTypesRes.status,
          entities: entitiesRes.status
        })
      }

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json()
        if (process.env.NODE_ENV === 'development') {
          console.log('📋 Actifs récupérés:', assetsData.length, 'actifs')
          console.log('📋 Premier actif:', assetsData[0]?.name || 'Aucun actif')
        }
        setAssets(assetsData)
      }

      if (assetTypesRes.ok) {
        const assetTypesData = await assetTypesRes.json()
        if (process.env.NODE_ENV === 'development') {
          console.log('🏷️ Types d\'actifs récupérés:', assetTypesData.length)
          console.log('🏷️ Types d\'actifs détail:', assetTypesData)
        }
        setAssetTypes(assetTypesData)
      } else {
        console.error('❌ Erreur récupération types d\'actifs:', assetTypesRes.status, assetTypesRes.statusText)
        // Fallback avec types d'actifs par défaut
        const fallbackAssetTypes = [
          { id: 'real_estate', name: 'Immobilier résidentiel', code: 'real_estate', description: 'Biens immobiliers résidentiels', color: '#3B82F6' },
          { id: 'stocks', name: 'Actions cotées', code: 'stocks', description: 'Actions sur marché boursier', color: '#10B981' },
          { id: 'bank_account', name: 'Compte bancaire', code: 'bank_account', description: 'Comptes bancaires', color: '#6B7280' },
          { id: 'crypto', name: 'Cryptomonnaies', code: 'crypto', description: 'Crypto-monnaies', color: '#F59E0B' },
          { id: 'life_insurance', name: 'Assurance vie', code: 'life_insurance', description: 'Contrats d\'assurance vie', color: '#EF4444' },
          { id: 'other', name: 'Autre', code: 'other', description: 'Autres actifs', color: '#8B5CF6' }
        ]
        console.log('🔄 Utilisation des types d\'actifs de fallback:', fallbackAssetTypes.length)
        setAssetTypes(fallbackAssetTypes)
      }

      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json()
        if (process.env.NODE_ENV === 'development') {
          console.log('👥 Entités récupérées:', entitiesData.length)
          console.log('👥 Entités détail:', entitiesData)
        }
        setEntities(entitiesData)
      } else {
        console.error('❌ Erreur récupération entités:', entitiesRes.status, entitiesRes.statusText)
        // Fallback avec entité par défaut
        const fallbackEntities = [
          { id: 'default-entity', name: 'Entité par défaut', type: 'PHYSICAL_PERSON' }
        ]
        console.log('🔄 Utilisation des entités de fallback:', fallbackEntities.length)
        setEntities(fallbackEntities)
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ FIN fetchData - Données mises à jour')
      }
    } catch (error) {
      console.error('Assets Data Fetch Error:', {
        error: error.message,
        timestamp: new Date().toISOString()
      })
      toast.error('Erreur lors du chargement des données')
      
      // Fallback complet en cas d'erreur
      console.log('🔄 Utilisation des données de fallback complètes')
      setAssetTypes([
        { id: 'real_estate', name: 'Immobilier résidentiel', code: 'real_estate', description: 'Biens immobiliers résidentiels', color: '#3B82F6' },
        { id: 'stocks', name: 'Actions cotées', code: 'stocks', description: 'Actions sur marché boursier', color: '#10B981' },
        { id: 'bank_account', name: 'Compte bancaire', code: 'bank_account', description: 'Comptes bancaires', color: '#6B7280' },
        { id: 'crypto', name: 'Cryptomonnaies', code: 'crypto', description: 'Crypto-monnaies', color: '#F59E0B' },
        { id: 'life_insurance', name: 'Assurance vie', code: 'life_insurance', description: 'Contrats d\'assurance vie', color: '#EF4444' },
        { id: 'other', name: 'Autre', code: 'other', description: 'Autres actifs', color: '#8B5CF6' }
      ])
      setEntities([
        { id: 'default-entity', name: 'Entité par défaut', type: 'PHYSICAL_PERSON' }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour filtrer les actifs selon le type sélectionné
  const filteredAssets = selectedAssetTypeId 
    ? assets.filter(asset => asset.assetType.id === selectedAssetTypeId)
    : assets

  // Fonction pour gérer la sélection d'un type d'actif
  const handleAssetTypeFilter = (assetTypeId: string) => {
    setSelectedAssetTypeId(assetTypeId === selectedAssetTypeId ? null : assetTypeId)
  }

  // Fonction pour effacer le filtre
  const clearFilter = () => {
    setSelectedAssetTypeId(null)
  }

  // Obtenir le nom du type d'actif sélectionné
  const getSelectedAssetTypeName = () => {
    if (!selectedAssetTypeId) return null
    const assetType = assetTypes.find(type => type.id === selectedAssetTypeId)
    return assetType ? assetType.name : null
  }

  // Legacy functions removed - now handled by DynamicAssetForm

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      assetTypeId: '',
      owners: [{ entityId: '', percentage: 100 }],
      initialValue: 0,
      valuationDate: new Date().toISOString().split('T')[0],
      metadata: {}
    })
  }

  const handleAssetSubmit = async (formData: BaseAssetFormData) => {
    setIsSubmitting(true)
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 DEBUT CREATION ACTIF - Données soumises:', formData)
      }
      
      // Check if this is an inter-entity loan (already handled by specialized API)
      const selectedAssetType = assetTypes.find(type => type.id === formData.assetTypeId)
      if (selectedAssetType?.code === 'inter_entity_loan') {
        // Inter-entity loans are handled by the specialized component
        // Just show success and refresh
        toast.success('Prêt inter-entité créé avec succès')
        setIsCreateDrawerOpen(false)
        resetForm()
        fetchData()
        return
      }

      // 1. Create the asset first (for regular assets)
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Envoi requête POST vers /api/assets')
      }
      const assetResponse = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Réponse API assets:', assetResponse.status, assetResponse.statusText)
      }

      if (!assetResponse.ok) {
        const error = await assetResponse.json()
        console.error('Asset Creation Error:', {
          status: assetResponse.status,
          error: error.error || 'Unknown error',
          timestamp: new Date().toISOString()
        })
        throw new Error(error.error || 'Erreur lors de la création de l\'actif')
      }

      const createdAsset = await assetResponse.json()
      console.log('✅ Actif créé avec succès:', createdAsset)

      // 2. Create financing if enabled
      if (formData.hasFinancing && formData.financing) {
        try {
          const financingResponse = await fetch(`/api/assets/${createdAsset.id}/debts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.financing.name,
              debtType: formData.financing.debtType,
              initialAmount: formData.financing.initialAmount,
              interestRate: formData.financing.interestRate,
              duration: formData.financing.duration,
              amortizationType: formData.financing.amortizationType,
              startDate: formData.financing.startDate,
              lender: formData.financing.lender,
              notes: formData.financing.notes
            })
          })

          if (!financingResponse.ok) {
            const financingError = await financingResponse.json()
            console.error('Erreur lors de la création du financement:', financingError)
            toast.warning('Actif créé avec succès, mais erreur lors de la création du financement')
          } else {
            toast.success('Actif et financement créés avec succès')
          }
        } catch (financingError) {
          console.error('Erreur lors de la création du financement:', financingError)
          toast.warning('Actif créé avec succès, mais erreur lors de la création du financement')
        }
      } else {
        toast.success('Actif créé avec succès')
      }

      console.log('🎯 Fermeture du drawer et refresh des données')
      setIsCreateDrawerOpen(false)
      resetForm()
      await fetchData()
      console.log('🔄 Données rafraîchies, actifs actuels:', assets.length)
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssetCancel = () => {
    setIsCreateDrawerOpen(false)
    resetForm()
  }

  const handleAssetEdit = async (formData: BaseAssetFormData) => {
    if (!editingAsset) return

    setIsSubmitting(true)
    try {
      // 1. Update the asset first
      const assetResponse = await fetch(`/api/assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          assetTypeId: formData.assetTypeId,
          owners: formData.owners,
          valuationValue: formData.initialValue,
          valuationDate: formData.valuationDate,
          metadata: formData.metadata
        }),
      })

      if (!assetResponse.ok) {
        throw new Error('Erreur lors de la modification de l\'actif')
      }

      // 2. Handle financing
      const existingDebt = editingAsset.debts && editingAsset.debts.length > 0 ? editingAsset.debts[0] : null
      let financingSuccess = true
      let financingMessage = ''

      if (formData.hasFinancing && formData.financing) {
        // User wants financing
        if (existingDebt) {
          // Update existing financing
          try {
            const updateResponse = await fetch(`/api/assets/${editingAsset.id}/debts/${existingDebt.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.financing.name,
                debtType: formData.financing.debtType,
                initialAmount: formData.financing.initialAmount,
                interestRate: formData.financing.interestRate,
                duration: formData.financing.duration,
                amortizationType: formData.financing.amortizationType,
                startDate: formData.financing.startDate,
                lender: formData.financing.lender,
                notes: formData.financing.notes
              })
            })
            
            if (!updateResponse.ok) {
              financingSuccess = false
              financingMessage = 'Erreur lors de la modification du financement'
            }
          } catch (error) {
            financingSuccess = false
            financingMessage = 'Erreur lors de la modification du financement'
          }
        } else {
          // Create new financing
          try {
            const createResponse = await fetch(`/api/assets/${editingAsset.id}/debts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.financing.name,
                debtType: formData.financing.debtType,
                initialAmount: formData.financing.initialAmount,
                interestRate: formData.financing.interestRate,
                duration: formData.financing.duration,
                amortizationType: formData.financing.amortizationType,
                startDate: formData.financing.startDate,
                lender: formData.financing.lender,
                notes: formData.financing.notes
              })
            })
            
            if (!createResponse.ok) {
              financingSuccess = false
              financingMessage = 'Erreur lors de la création du financement'
            }
          } catch (error) {
            financingSuccess = false
            financingMessage = 'Erreur lors de la création du financement'
          }
        }
      } else if (existingDebt) {
        // User disabled financing but there was an existing one - delete it
        try {
          const deleteResponse = await fetch(`/api/assets/${editingAsset.id}/debts/${existingDebt.id}`, {
            method: 'DELETE'
          })
          
          if (!deleteResponse.ok) {
            financingSuccess = false
            financingMessage = 'Erreur lors de la suppression du financement'
          }
        } catch (error) {
          financingSuccess = false
          financingMessage = 'Erreur lors de la suppression du financement'
        }
      }

      // Show appropriate success/warning message
      if (financingSuccess) {
        if (formData.hasFinancing) {
          toast.success('Actif et financement modifiés avec succès')
        } else {
          toast.success('Actif modifié avec succès')
        }
      } else {
        toast.warning(`Actif modifié avec succès, mais ${financingMessage}`)
      }

      setIsEditDrawerOpen(false)
      setEditingAsset(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Erreur lors de la modification de l\'actif:', error)
      toast.error('Erreur lors de la modification de l\'actif')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCancel = () => {
    setIsEditDrawerOpen(false)
    setEditingAsset(null)
    resetForm()
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateDrawerOpen(true)
  }

  const handleView = (asset: Asset) => {
    setViewingAsset(asset)
    setIsViewDrawerOpen(true)
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    
    // Check if asset has existing financing
    const existingDebt = asset.debts && asset.debts.length > 0 ? asset.debts[0] : null
    
    // Pré-remplir le formulaire avec les données de l'actif
    setFormData({
      name: asset.name,
      description: asset.description || '',
      assetTypeId: asset.assetType.id,
      owners: asset.ownerships.map(ownership => ({
        entityId: ownership.ownerEntity.id,
        percentage: ownership.percentage
      })),
      initialValue: asset.valuations.length > 0 ? Number(asset.valuations[0].value) : 0,
      valuationDate: asset.valuations.length > 0 
        ? new Date(asset.valuations[0].valuationDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      metadata: {},
      // Include financing data if exists
      hasFinancing: !!existingDebt,
      financing: existingDebt ? {
        name: existingDebt.name,
        debtType: existingDebt.debtType as any,
        initialAmount: existingDebt.initialAmount,
        interestRate: existingDebt.interestRate,
        duration: existingDebt.duration,
        amortizationType: existingDebt.amortizationType as any,
        startDate: new Date(existingDebt.startDate).toISOString().split('T')[0],
        lender: existingDebt.lender || '',
        notes: existingDebt.notes || ''
      } : {
        name: '',
        debtType: 'MORTGAGE',
        initialAmount: 0,
        interestRate: 0,
        duration: 240,
        amortizationType: 'PROGRESSIVE',
        startDate: new Date().toISOString().split('T')[0],
        lender: '',
        notes: ''
      }
    })
    setIsEditDrawerOpen(true)
  }

  const handleDelete = (asset: Asset) => {
    setAssetToDelete(asset)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/assets/${assetToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      toast.success('Actif supprimé avec succès')
      fetchData() // Refresh the data
      setIsDeleteDialogOpen(false)
      setAssetToDelete(null)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setAssetToDelete(null)
  }

  // Legacy submit functions removed - now handled by DynamicAssetForm

  // Calculate statistics (mise à jour pour tenir compte du filtre)
  const totalValue = filteredAssets.reduce((sum, asset) => {
    const latestValuation = asset.valuations[0]
    if (!latestValuation) return sum
    
    const validatedValuation = validateValuation(latestValuation)
    if (!validatedValuation.isValid) return sum
    
    const userOwnershipPercentage = calculateOwnershipPercentage(asset.ownerships)
    const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
    
    return sum + assetValue
  }, 0)

  const assetsByType = assetTypes.map(type => ({
    ...type,
    count: assets.filter(asset => asset.assetType.id === type.id).length,
    value: assets
      .filter(asset => asset.assetType.id === type.id)
      .reduce((sum, asset) => {
        const latestValuation = asset.valuations[0]
        if (!latestValuation) return sum
        
        const validatedValuation = validateValuation(latestValuation)
        if (!validatedValuation.isValid) return sum
        
        const userOwnershipPercentage = calculateOwnershipPercentage(asset.ownerships)
        const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
        
        return sum + assetValue
      }, 0)
  }))

  // selectedAssetType removed - now handled by DynamicAssetForm

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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Actifs</h1>
          <p className="text-muted-foreground">
            Gérez votre portefeuille d'actifs
            {selectedAssetTypeId && ` • Filtrés par ${getSelectedAssetTypeName()}`}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Actif
        </Button>
      </div>

      {/* Filtre actuel et bouton reset */}
      {selectedAssetTypeId && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">
                    Filtré par type d'actif
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Affichage des actifs de type "{getSelectedAssetTypeName()}" uniquement
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilter}>
                <List className="h-4 w-4 mr-1" />
                Tous les actifs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards (mise à jour pour tenir compte du filtre) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedAssetTypeId ? 'Valeur Filtrée' : 'Valeur Totale'}
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedAssetTypeId ? `Valeur ${getSelectedAssetTypeName()}` : 'Valeur du portefeuille'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedAssetTypeId ? 'Actifs Filtrés' : 'Total Actifs'}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAssets.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedAssetTypeId ? `Actifs ${getSelectedAssetTypeName()}` : 'Actifs suivis'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types d'Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assetsByType.filter(type => type.count > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Catégories utilisées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière MAJ</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assets.length > 0 ? 'Aujourd\'hui' : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Valorisation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Types Overview - Cartes cliquables pour filtrer */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Type d'Actif</CardTitle>
          <CardDescription>
            Vue d'ensemble de vos actifs par catégorie • Cliquez sur un type pour filtrer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assetsByType.map((type) => (
              <div 
                key={type.id} 
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedAssetTypeId === type.id 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-border hover:border-primary/50'
                } ${type.count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => type.count > 0 && handleAssetTypeFilter(type.id)}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: type.color || '#6B7280' }}
                  />
                  <div>
                    <div className={`font-medium ${selectedAssetTypeId === type.id ? 'text-primary' : ''}`}>
                      {type.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {type.count} actif{type.count > 1 ? 's' : ''}
                      {selectedAssetTypeId === type.id && ' • Sélectionné'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${selectedAssetTypeId === type.id ? 'text-primary' : ''}`}>
                    {formatCurrency(type.value)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {/* Calcul du pourcentage basé sur la valeur totale de TOUS les actifs */}
                    {(() => {
                      const totalAllAssets = assets.reduce((sum, asset) => {
                        const latestValuation = asset.valuations[0]
                        if (!latestValuation) return sum
                        
                        const validatedValuation = validateValuation(latestValuation)
                        if (!validatedValuation.isValid) return sum
                        
                        const userOwnershipPercentage = calculateOwnershipPercentage(asset.ownerships)
                        const assetValue = calculateAssetValue(validatedValuation.value, userOwnershipPercentage)
                        
                        return sum + assetValue
                      }, 0)
                      
                      return totalAllAssets > 0 ? ((type.value / totalAllAssets) * 100).toFixed(1) : '0'
                    })()}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assets List - Mise à jour avec le filtre */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {selectedAssetTypeId ? `Aucun actif de type "${getSelectedAssetTypeName()}"` : 'Aucun actif'}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {selectedAssetTypeId 
                ? `Vous n'avez pas encore d'actifs de type "${getSelectedAssetTypeName()}". Créez-en un ou changez de filtre.`
                : 'Commencez par ajouter vos premiers actifs pour suivre votre patrimoine. Vous pouvez ajouter des biens immobiliers, actions, comptes bancaires, etc.'
              }
            </p>
            <div className="flex space-x-2">
              {selectedAssetTypeId && (
                <Button variant="outline" onClick={clearFilter}>
                  <List className="h-4 w-4 mr-2" />
                  Voir tous les actifs
                </Button>
              )}
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {selectedAssetTypeId ? `Ajouter un actif ${getSelectedAssetTypeName()}` : 'Ajouter mon premier actif'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedAssetTypeId ? `Actifs ${getSelectedAssetTypeName()}` : 'Tous les Actifs'}
            </CardTitle>
            <CardDescription>
              {selectedAssetTypeId 
                ? `Liste des actifs de type "${getSelectedAssetTypeName()}" (${filteredAssets.length} actif${filteredAssets.length > 1 ? 's' : ''})`
                : 'Liste détaillée de vos actifs'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAssets.map((asset) => {
                const latestValuation = asset.valuations[0]
                const owners = asset.ownerships.map(ownership => ({
                  entity: ownership.ownerEntity,
                  percentage: ownership.percentage
                }))

                // Check if this is an inter-entity loan
                const isInterEntityLoan = asset.assetType.code === 'inter_entity_loan'
                const loanMetadata = isInterEntityLoan ? asset.metadata : null

                return (
                  <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: asset.assetType.color || '#6B7280' }}
                      />
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.assetType.name}
                        </div>
                        {asset.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {asset.description}
                          </div>
                        )}
                        
                        {/* Special display for inter-entity loans */}
                        {isInterEntityLoan && loanMetadata ? (
                          <div className="text-xs mt-2 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600 font-medium">📤 Prêteur:</span>
                              <span className="text-green-700">{loanMetadata.lenderEntityName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-red-600 font-medium">📥 Emprunteur:</span>
                              <span className="text-red-700">{loanMetadata.borrowerEntityName}</span>
                            </div>
                            {loanMetadata.contractDate && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">📅 Contrat:</span>
                                <span className="text-gray-600">
                                  {new Date(loanMetadata.contractDate).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            )}
                            {loanMetadata.loanPurpose && (
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-500">🎯 Objet:</span>
                                <span className="text-blue-600">{loanMetadata.loanPurpose}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">
                            Propriétaires: {owners.map(owner => 
                              `${owner.entity.name} (${owner.percentage}%)`
                            ).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">
                          {latestValuation 
                            ? formatCurrency(Number(latestValuation.value))
                            : 'Non valorisé'
                          }
                        </div>
                        {latestValuation && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(latestValuation.valuationDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" title="Voir l'actif" onClick={() => handleView(asset)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Voir les détails"
                          onClick={() => router.push(`/assets/${asset.id}`)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Gérer les valorisations"
                          onClick={() => router.push(`/assets/${asset.id}?tab=valuations`)}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Gérer les financements"
                          onClick={() => router.push(`/assets/${asset.id}/debts`)}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Modifier l'actif" onClick={() => handleEdit(asset)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Supprimer l'actif"
                          onClick={() => handleDelete(asset)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Asset Drawer */}
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <DrawerContent size="xl">
          <DrawerHeader>
            <DrawerTitle>Nouvel Actif</DrawerTitle>
            <DrawerDescription>
              Ajoutez un nouvel actif à votre portefeuille avec des formulaires spécialisés
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerBody>
            <DynamicAssetForm
              assetTypes={assetTypes}
              entities={entities}
              onSubmit={handleAssetSubmit}
              onCancel={handleAssetCancel}
              isSubmitting={isSubmitting}
              initialData={formData}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* View Asset Drawer */}
      <Drawer open={isViewDrawerOpen} onOpenChange={setIsViewDrawerOpen}>
        <DrawerContent size="lg">
          <DrawerHeader>
            <DrawerTitle>Détails de l'Actif</DrawerTitle>
            <DrawerDescription>
              Informations complètes sur {viewingAsset?.name}
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerBody>
            {viewingAsset && (
              <div className="space-y-6">
                {/* Asset Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: viewingAsset.assetType.color || '#6B7280' }}
                      />
                      <div>
                        <CardTitle className="text-xl">{viewingAsset.name}</CardTitle>
                        <CardDescription>{viewingAsset.assetType.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {viewingAsset.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {viewingAsset.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Date de création</Label>
                        <p className="text-sm font-medium">
                          {new Date(viewingAsset.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Catégorie</Label>
                        <p className="text-sm font-medium">{viewingAsset.assetType.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Valuation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Euro className="h-5 w-5 mr-2" />
                      Valorisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {viewingAsset.valuations.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <Label className="text-xs font-medium text-green-800">Valeur actuelle</Label>
                            <p className="text-2xl font-bold text-green-900">
                              {formatCurrency(Number(viewingAsset.valuations[0].value))}
                            </p>
                          </div>
                          <div className="text-right">
                            <Label className="text-xs font-medium text-green-800">Dernière mise à jour</Label>
                            <p className="text-sm text-green-700">
                              {new Date(viewingAsset.valuations[0].valuationDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        
                        {viewingAsset.valuations.length > 1 && (
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Historique des valorisations</Label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {viewingAsset.valuations.slice(1).map((valuation, index) => (
                                <div key={index} className="flex justify-between items-center p-2 border rounded">
                                  <span className="text-sm">
                                    {formatCurrency(Number(valuation.value))}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(valuation.valuationDate).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Euro className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucune valorisation disponible</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Inter-Entity Loan Details or Ownership */}
                {viewingAsset.assetType.code === 'inter_entity_loan' && viewingAsset.metadata ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Détails du Prêt Inter-Entité
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Lender */}
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full text-lg">
                              📤
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-800">Prêteur (Créancier)</div>
                              <div className="text-lg font-bold text-green-900">
                                {viewingAsset.metadata.lenderEntityName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-700">Détient la créance</div>
                            <div className="text-lg font-bold text-green-800">100%</div>
                          </div>
                        </div>

                        {/* Borrower */}
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-full text-lg">
                              📥
                            </div>
                            <div>
                              <div className="text-sm font-medium text-red-800">Emprunteur (Débiteur)</div>
                              <div className="text-lg font-bold text-red-900">
                                {viewingAsset.metadata.borrowerEntityName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-red-700">Doit rembourser</div>
                            <div className="text-lg font-bold text-red-800">
                              {viewingAsset.valuations.length > 0 
                                ? formatCurrency(Number(viewingAsset.valuations[0].value))
                                : '-'
                              }
                            </div>
                          </div>
                        </div>

                        {/* Additional loan details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {viewingAsset.metadata.contractDate && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="text-sm font-medium text-blue-800 mb-1">📅 Date du contrat</div>
                              <div className="text-blue-900">
                                {new Date(viewingAsset.metadata.contractDate).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          )}
                          
                          {viewingAsset.metadata.loanPurpose && (
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="text-sm font-medium text-purple-800 mb-1">🎯 Objet du prêt</div>
                              <div className="text-purple-900">{viewingAsset.metadata.loanPurpose}</div>
                            </div>
                          )}
                          
                          {viewingAsset.metadata.guarantees && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="text-sm font-medium text-orange-800 mb-1">🛡️ Garanties</div>
                              <div className="text-orange-900">{viewingAsset.metadata.guarantees}</div>
                            </div>
                          )}
                          
                          {viewingAsset.metadata.legalDocumentRef && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="text-sm font-medium text-gray-800 mb-1">📄 Référence légale</div>
                              <div className="text-gray-900">{viewingAsset.metadata.legalDocumentRef}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Propriété
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {viewingAsset.ownerships.map((ownership, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">{ownership.ownerEntity.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">Propriétaire</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">{ownership.percentage}%</div>
                              <div className="text-xs text-muted-foreground">de propriété</div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-800">Total des parts</span>
                            <span className="text-lg font-bold text-blue-900">
                              {viewingAsset.ownerships.reduce((sum, ownership) => sum + ownership.percentage, 0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions Rapides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-16 flex flex-col items-center justify-center"
                        onClick={() => router.push(`/assets/${viewingAsset.id}/debts`)}
                      >
                        <CreditCard className="h-6 w-6 mb-1" />
                        <span className="text-sm">Financements</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-16 flex flex-col items-center justify-center"
                        onClick={() => {
                          if (viewingAsset) {
                            setIsViewDrawerOpen(false)
                            handleEdit(viewingAsset)
                          }
                        }}
                      >
                        <Edit className="h-6 w-6 mb-1" />
                        <span className="text-sm">Modifier</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DrawerBody>

          <DrawerFooter>
            <Button variant="outline" onClick={() => setIsViewDrawerOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Asset Drawer */}
      <Drawer open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
        <DrawerContent size="xl">
          <DrawerHeader>
            <DrawerTitle>Modifier l'Actif</DrawerTitle>
            <DrawerDescription>
              Modifiez les informations de {editingAsset?.name} avec des formulaires spécialisés
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerBody>
            <DynamicAssetForm
              assetTypes={assetTypes}
              entities={entities}
              onSubmit={handleAssetEdit}
              onCancel={handleEditCancel}
              isSubmitting={isSubmitting}
              initialData={formData}
              mode="edit"
              editingAssetId={editingAsset?.id}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'actif"
        description={`Êtes-vous sûr de vouloir supprimer l'actif "${assetToDelete?.name}" ? Cette action est irréversible et supprimera également toutes les valorisations, propriétés et financements associés.`}
        confirmText="Supprimer l'actif"
        cancelText="Annuler"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  )
} 