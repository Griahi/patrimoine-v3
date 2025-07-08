"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/hooks/useAuth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  DrawerFooter, 
  DrawerTitle, 
  DrawerDescription 
} from "@/components/ui/Drawer"
import { Users, Building2, Plus, Eye, Edit, Trash2, User, Save, X } from "lucide-react"
import { EntityType } from "../../generated/prisma"
import { toast } from "sonner"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select"
import { ConfirmationDialog } from "@/components/ui/Dialog"
import { calculateEntityTotalValue } from "@/lib/utils"

interface Entity {
  id: string
  name: string
  type: EntityType
  taxId: string | null
  address: any
  metadata?: any
  notes?: string
  createdAt: Date
  ownedAssets: Array<{
    percentage: number
    ownedAsset: {
      assetType: { name: string }
      valuations: Array<{ value: number }>
    }
  }>
  ownedEntities?: Array<{
    percentage: number
    ownerEntity: {
      id: string
      name: string
      type: string
    }
  }>
  _count: { ownedAssets: number }
}

interface EntityFormData {
  name: string
  type: 'PHYSICAL_PERSON' | 'LEGAL_ENTITY'
  taxId: string
  address: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
  }
  metadata: Record<string, any>
  notes: string
  shareholders: Array<{
    entityId: string
    percentage: number
  }>
}

function getEntityIcon(type: EntityType) {
  return type === EntityType.PHYSICAL_PERSON ? User : Building2
}

function getEntityTypeLabel(type: EntityType) {
  return type === EntityType.PHYSICAL_PERSON ? 'Personne physique' : 'Personne morale'
}

export default function EntitiesPage() {
  const { data: session, status } = useSession()
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // États pour la suppression avec confirmation
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState<EntityFormData>({
    name: '',
    type: 'PHYSICAL_PERSON',
    taxId: '',
    address: {},
    metadata: {},
    notes: '',
    shareholders: []
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      redirect("/login?callbackUrl=/entities")
      return
    }
    fetchEntities()
  }, [session, status])

  const fetchEntities = async () => {
    try {
      const response = await fetch('/api/entities')
      if (response.ok) {
        const data = await response.json()
        setEntities(data)
      }
    } catch (error) {
      console.error('Error fetching entities:', error)
      toast.error('Erreur lors du chargement des entités')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EntityFormData] as Record<string, any>),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'PHYSICAL_PERSON',
      taxId: '',
      address: {},
      metadata: {},
      notes: '',
      shareholders: []
    })
  }

  const addShareholder = () => {
    setFormData(prev => ({
      ...prev,
      shareholders: [...prev.shareholders, { entityId: '', percentage: 0 }]
    }))
  }

  const removeShareholder = (index: number) => {
    if (formData.shareholders.length > 1) {
      setFormData(prev => ({
        ...prev,
        shareholders: prev.shareholders.filter((_, i) => i !== index)
      }))
    }
  }

  const updateShareholder = (index: number, field: 'entityId' | 'percentage', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      shareholders: prev.shareholders.map((shareholder, i) => 
        i === index ? { ...shareholder, [field]: value } : shareholder
      )
    }))
  }

  const getTotalShareholderPercentage = () => {
    return formData.shareholders.reduce((sum, shareholder) => sum + (shareholder.percentage || 0), 0)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateDrawerOpen(true)
  }

  const handleEdit = (entity: Entity) => {
    setEditingEntity(entity)
    
    // Charger les associés existants si c'est une personne morale
    const existingShareholders = entity.ownedEntities ? entity.ownedEntities.map(ownership => ({
      entityId: ownership.ownerEntity.id,
      percentage: ownership.percentage
    })) : []
    
    setFormData({
      name: entity.name,
      type: entity.type as 'PHYSICAL_PERSON' | 'LEGAL_ENTITY',
      taxId: entity.taxId || '',
      address: entity.address || {},
      metadata: (entity as any).metadata || {},
      notes: (entity as any).notes || '',
      shareholders: existingShareholders
    })
    setIsEditDrawerOpen(true)
  }

  const handleDelete = (entity: Entity) => {
    setEntityToDelete(entity)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!entityToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/entities/${entityToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      toast.success('Entité supprimée avec succès')
      fetchEntities() // Refresh the data
      setIsDeleteDialogOpen(false)
      setEntityToDelete(null)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setEntityToDelete(null)
  }

  const handleSubmitCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    // Validation pour les associés des personnes morales
    if (formData.type === 'LEGAL_ENTITY' && formData.shareholders.length > 0) {
      if (formData.shareholders.some(shareholder => !shareholder.entityId)) {
        toast.error('Veuillez sélectionner tous les associés')
        return
      }

      const totalPercentage = getTotalShareholderPercentage()
      if (totalPercentage !== 100) {
        toast.error('La somme des pourcentages des associés doit être égale à 100%')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Entité créée avec succès')
        setIsCreateDrawerOpen(false)
        resetForm()
        fetchEntities()
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

  const handleSubmitEdit = async () => {
    if (!editingEntity || !formData.name.trim()) {
      toast.error('Le nom est requis')
      return
    }

    // Validation pour les associés des personnes morales
    if (formData.type === 'LEGAL_ENTITY' && formData.shareholders.length > 0) {
      if (formData.shareholders.some(shareholder => !shareholder.entityId)) {
        toast.error('Veuillez sélectionner tous les associés')
        return
      }

      const totalPercentage = getTotalShareholderPercentage()
      if (totalPercentage !== 100) {
        toast.error('La somme des pourcentages des associés doit être égale à 100%')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/entities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingEntity.id })
      })

      if (response.ok) {
        toast.success('Entité modifiée avec succès')
        setIsEditDrawerOpen(false)
        resetForm()
        fetchEntities()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      toast.error('Erreur lors de la modification')
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Entités</h1>
          <p className="text-muted-foreground">
            Gérez vos personnes physiques et morales
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Entité
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entités</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entities.length}</div>
            <p className="text-xs text-muted-foreground">
              Entités gérées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personnes Physiques</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entities.filter(e => e.type === EntityType.PHYSICAL_PERSON).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Personnes individuelles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personnes Morales</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entities.filter(e => e.type === EntityType.LEGAL_ENTITY).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sociétés et structures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entities List */}
      {entities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune entité</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Commencez par créer votre première entité pour organiser votre patrimoine.
              Une entité peut être une personne physique ou une société.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Créer ma première entité
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entities.map((entity) => {
            const Icon = getEntityIcon(entity.type)
            const totalValue = calculateEntityTotalValue(entity)

            return (
              <Card key={entity.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{entity.name}</CardTitle>
                        <CardDescription>
                          {getEntityTypeLabel(entity.type)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" title="Modifier l'entité" onClick={() => handleEdit(entity)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Supprimer l'entité"
                        onClick={() => handleDelete(entity)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {entity.taxId && (
                      <div className="text-sm">
                        <span className="font-medium">ID Fiscal:</span> {entity.taxId}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Actifs détenus:</span>
                      <span className="font-medium">{entity._count?.ownedAssets || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Valeur totale:</span>
                      <span className="font-medium text-primary">
                        {totalValue.toLocaleString('fr-FR', { 
                          style: 'currency', 
                          currency: 'EUR' 
                        })}
                      </span>
                    </div>

                    {/* Display shareholders for legal entities */}
                    {entity.type === EntityType.LEGAL_ENTITY && entity.ownedEntities && entity.ownedEntities.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Associés:</div>
                        <div className="space-y-1">
                          {entity.ownedEntities.map((ownership, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="flex items-center">
                                <span className={ownership.ownerEntity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'} title={ownership.ownerEntity.type === 'PHYSICAL_PERSON' ? 'Personne physique' : 'Personne morale'}>
                                  {ownership.ownerEntity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'}
                                </span>
                                <span className="ml-1">{ownership.ownerEntity.name}</span>
                              </span>
                              <span className="font-medium">{ownership.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Créé le {new Date(entity.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Entity Drawer */}
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <DrawerContent size="lg">
          <DrawerHeader>
            <DrawerTitle>Nouvelle Entité</DrawerTitle>
            <DrawerDescription>
              Créez une nouvelle personne physique ou morale
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerBody>
            <div className="space-y-6">
              {/* Entity Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Type d'Entité</CardTitle>
                  <CardDescription>
                    Sélectionnez le type d'entité à créer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === 'PHYSICAL_PERSON' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateFormData('type', 'PHYSICAL_PERSON')}
                    >
                      <div className="flex items-center space-x-3">
                        <User className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">Personne Physique</div>
                          <div className="text-sm text-muted-foreground">
                            Individu ou personne privée
                          </div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === 'LEGAL_ENTITY' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateFormData('type', 'LEGAL_ENTITY')}
                    >
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">Personne Morale</div>
                          <div className="text-sm text-muted-foreground">
                            Société, association, etc.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de Base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      {formData.type === 'PHYSICAL_PERSON' ? 'Nom complet' : 'Raison sociale'} *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      placeholder={
                        formData.type === 'PHYSICAL_PERSON' 
                          ? 'Ex: Jean Dupont' 
                          : 'Ex: SARL Dupont & Associés'
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="taxId">
                      {formData.type === 'PHYSICAL_PERSON' ? 'Numéro fiscal' : 'SIRET/SIREN'}
                    </Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => updateFormData('taxId', e.target.value)}
                      placeholder={
                        formData.type === 'PHYSICAL_PERSON' 
                          ? 'Ex: 1234567890123' 
                          : 'Ex: 12345678901234'
                      }
                    />
                  </div>

                  {/* Business Purpose for Legal Entities */}
                  {formData.type === 'LEGAL_ENTITY' && (
                    <div>
                      <Label htmlFor="businessPurpose">
                        Objet social
                      </Label>
                      <Input
                        id="businessPurpose"
                        value={formData.metadata.businessPurpose || ''}
                        onChange={(e) => updateFormData('metadata.businessPurpose', e.target.value)}
                        placeholder="Ex: Activité de conseil en gestion patrimoniale"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">
                      Notes
                    </Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      placeholder="Notes ou commentaires sur cette entité..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Adresse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Rue</Label>
                    <Input
                      id="street"
                      value={formData.address.street || ''}
                      onChange={(e) => updateFormData('address.street', e.target.value)}
                      placeholder="Ex: 123 Rue de la Paix"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        value={formData.address.postalCode || ''}
                        onChange={(e) => updateFormData('address.postalCode', e.target.value)}
                        placeholder="Ex: 75001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={formData.address.city || ''}
                        onChange={(e) => updateFormData('address.city', e.target.value)}
                        placeholder="Ex: Paris"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={formData.address.country || ''}
                      onChange={(e) => updateFormData('address.country', e.target.value)}
                      placeholder="Ex: France"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shareholders */}
              {formData.type === 'LEGAL_ENTITY' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Associés & Actionnaires</CardTitle>
                        <CardDescription>
                          Définissez qui possède des parts de cette société
                          <br />
                          <span className="text-xs text-muted-foreground">
                            💡 Ajoutez les associés et leurs pourcentages de participation
                          </span>
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={addShareholder}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un associé
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Distribution Buttons */}
                    {formData.shareholders.length > 1 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-800 mr-2">Répartitions rapides:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const equalShare = Math.round((100 / formData.shareholders.length) * 100) / 100
                            const updatedShareholders = formData.shareholders.map((shareholder, index) => ({
                              ...shareholder,
                              percentage: index === formData.shareholders.length - 1 
                                ? 100 - (equalShare * (formData.shareholders.length - 1))
                                : equalShare
                            }))
                            setFormData(prev => ({ ...prev, shareholders: updatedShareholders }))
                          }}
                        >
                          Parts égales ({(100 / formData.shareholders.length).toFixed(1)}% chacun)
                        </Button>
                        {formData.shareholders.length === 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const updatedShareholders = [
                                { ...formData.shareholders[0], percentage: 50 },
                                { ...formData.shareholders[1], percentage: 50 }
                              ]
                              setFormData(prev => ({ ...prev, shareholders: updatedShareholders }))
                            }}
                          >
                            50/50
                          </Button>
                        )}
                      </div>
                    )}

                    {formData.shareholders.length > 0 ? (
                      <>
                        {formData.shareholders.map((shareholder, index) => (
                          <div key={index} className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:border-primary/30 transition-colors">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <Label className="text-sm font-medium">
                                {index === 0 ? 'Premier associé' : `${index === 1 ? 'Deuxième' : index === 2 ? 'Troisième' : `${index + 1}ème`} associé`}
                              </Label>
                              <Select 
                                value={shareholder.entityId} 
                                onValueChange={(value) => updateShareholder(index, 'entityId', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Sélectionnez une personne/entité" />
                                </SelectTrigger>
                                <SelectContent>
                                  {entities.filter(entity => entity.id !== editingEntity?.id).map((entity) => (
                                    <SelectItem key={entity.id} value={entity.id}>
                                      <div className="flex items-center space-x-2">
                                        <span className={entity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'}>
                                          {entity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'}
                                        </span>
                                        <span>{entity.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-28">
                              <Label className="text-sm font-medium">Part (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={shareholder.percentage}
                                onChange={(e) => updateShareholder(index, 'percentage', parseFloat(e.target.value) || 0)}
                                className="mt-1 text-center"
                              />
                            </div>
                            {formData.shareholders.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeShareholder(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Supprimer cet associé"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        
                        {/* Total Validation */}
                        <div className={`flex items-center justify-between p-3 rounded-lg ${
                          getTotalShareholderPercentage() === 100 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {getTotalShareholderPercentage() === 100 ? (
                              <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>
                            ) : (
                              <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">!</div>
                            )}
                            <span className={`text-sm font-medium ${
                              getTotalShareholderPercentage() === 100 ? 'text-green-800' : 'text-red-800'
                            }`}>
                              Total des parts: {getTotalShareholderPercentage()}%
                            </span>
                          </div>
                          {getTotalShareholderPercentage() !== 100 && (
                            <span className="text-xs text-red-600">
                              Il manque {(100 - getTotalShareholderPercentage()).toFixed(2)}% pour atteindre 100%
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="text-amber-600 mt-0.5">💡</div>
                          <div>
                            <p className="text-sm text-amber-800 font-medium">Structure de propriété</p>
                            <p className="text-xs text-amber-700 mt-1">
                              Cliquez sur "Ajouter un associé" pour définir qui possède des parts de cette société. 
                              Vous pourrez ajuster les pourcentages de participation de chaque associé.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button onClick={handleSubmitCreate} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Création...' : 'Créer l\'entité'}
            </Button>
            <Button variant="outline" onClick={() => setIsCreateDrawerOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Entity Drawer */}
      <Drawer open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
        <DrawerContent size="lg">
          <DrawerHeader>
            <DrawerTitle>Modifier l'Entité</DrawerTitle>
            <DrawerDescription>
              Modifiez les informations de l'entité
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerBody>
            <div className="space-y-6">
              {/* Entity Type Display */}
              <Card>
                <CardHeader>
                  <CardTitle>Type d'Entité</CardTitle>
                  <CardDescription>
                    Le type d'entité ne peut pas être modifié
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border rounded-lg ${
                        formData.type === 'PHYSICAL_PERSON' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <User className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">Personne Physique</div>
                          <div className="text-sm text-muted-foreground">
                            Individu ou personne privée
                          </div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border rounded-lg ${
                        formData.type === 'LEGAL_ENTITY' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">Personne Morale</div>
                          <div className="text-sm text-muted-foreground">
                            Société, association, etc.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de Base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">
                      {formData.type === 'PHYSICAL_PERSON' ? 'Nom complet' : 'Raison sociale'} *
                    </Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      placeholder={
                        formData.type === 'PHYSICAL_PERSON' 
                          ? 'Ex: Jean Dupont' 
                          : 'Ex: SARL Dupont & Associés'
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-taxId">
                      {formData.type === 'PHYSICAL_PERSON' ? 'Numéro fiscal' : 'SIRET/SIREN'}
                    </Label>
                    <Input
                      id="edit-taxId"
                      value={formData.taxId}
                      onChange={(e) => updateFormData('taxId', e.target.value)}
                      placeholder={
                        formData.type === 'PHYSICAL_PERSON' 
                          ? 'Ex: 1234567890123' 
                          : 'Ex: 12345678901234'
                      }
                    />
                  </div>

                  {/* Business Purpose for Legal Entities */}
                  {formData.type === 'LEGAL_ENTITY' && (
                    <div>
                      <Label htmlFor="edit-businessPurpose">
                        Objet social
                      </Label>
                      <Input
                        id="edit-businessPurpose"
                        value={formData.metadata.businessPurpose || ''}
                        onChange={(e) => updateFormData('metadata.businessPurpose', e.target.value)}
                        placeholder="Ex: Activité de conseil en gestion patrimoniale"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label htmlFor="edit-notes">
                      Notes
                    </Label>
                    <textarea
                      id="edit-notes"
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      placeholder="Notes ou commentaires sur cette entité..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Adresse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="edit-street">Rue</Label>
                    <Input
                      id="edit-street"
                      value={formData.address.street || ''}
                      onChange={(e) => updateFormData('address.street', e.target.value)}
                      placeholder="Ex: 123 Rue de la Paix"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-postalCode">Code postal</Label>
                      <Input
                        id="edit-postalCode"
                        value={formData.address.postalCode || ''}
                        onChange={(e) => updateFormData('address.postalCode', e.target.value)}
                        placeholder="Ex: 75001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-city">Ville</Label>
                      <Input
                        id="edit-city"
                        value={formData.address.city || ''}
                        onChange={(e) => updateFormData('address.city', e.target.value)}
                        placeholder="Ex: Paris"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-country">Pays</Label>
                    <Input
                      id="edit-country"
                      value={formData.address.country || ''}
                      onChange={(e) => updateFormData('address.country', e.target.value)}
                      placeholder="Ex: France"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shareholders for Edit */}
              {formData.type === 'LEGAL_ENTITY' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Associés & Actionnaires</CardTitle>
                        <CardDescription>
                          Définissez qui possède des parts de cette société
                          <br />
                          <span className="text-xs text-muted-foreground">
                            💡 Modifiez les associés et leurs pourcentages de participation
                          </span>
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={addShareholder}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un associé
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Distribution Buttons */}
                    {formData.shareholders.length > 1 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-800 mr-2">Répartitions rapides:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const equalShare = Math.round((100 / formData.shareholders.length) * 100) / 100
                            const updatedShareholders = formData.shareholders.map((shareholder, index) => ({
                              ...shareholder,
                              percentage: index === formData.shareholders.length - 1 
                                ? 100 - (equalShare * (formData.shareholders.length - 1))
                                : equalShare
                            }))
                            setFormData(prev => ({ ...prev, shareholders: updatedShareholders }))
                          }}
                        >
                          Parts égales ({(100 / formData.shareholders.length).toFixed(1)}% chacun)
                        </Button>
                        {formData.shareholders.length === 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const updatedShareholders = [
                                { ...formData.shareholders[0], percentage: 50 },
                                { ...formData.shareholders[1], percentage: 50 }
                              ]
                              setFormData(prev => ({ ...prev, shareholders: updatedShareholders }))
                            }}
                          >
                            50/50
                          </Button>
                        )}
                      </div>
                    )}

                    {formData.shareholders.length > 0 ? (
                      <>
                        {formData.shareholders.map((shareholder, index) => (
                          <div key={index} className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:border-primary/30 transition-colors">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <Label className="text-sm font-medium">
                                {index === 0 ? 'Premier associé' : `${index === 1 ? 'Deuxième' : index === 2 ? 'Troisième' : `${index + 1}ème`} associé`}
                              </Label>
                              <Select 
                                value={shareholder.entityId} 
                                onValueChange={(value) => updateShareholder(index, 'entityId', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Sélectionnez une personne/entité" />
                                </SelectTrigger>
                                <SelectContent>
                                  {entities.filter(entity => entity.id !== editingEntity?.id).map((entity) => (
                                    <SelectItem key={entity.id} value={entity.id}>
                                      <div className="flex items-center space-x-2">
                                        <span className={entity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'}>
                                          {entity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'}
                                        </span>
                                        <span>{entity.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-28">
                              <Label className="text-sm font-medium">Part (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={shareholder.percentage}
                                onChange={(e) => updateShareholder(index, 'percentage', parseFloat(e.target.value) || 0)}
                                className="mt-1 text-center"
                              />
                            </div>
                            {formData.shareholders.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeShareholder(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Supprimer cet associé"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        
                        {/* Total Validation */}
                        <div className={`flex items-center justify-between p-3 rounded-lg ${
                          getTotalShareholderPercentage() === 100 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {getTotalShareholderPercentage() === 100 ? (
                              <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>
                            ) : (
                              <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">!</div>
                            )}
                            <span className={`text-sm font-medium ${
                              getTotalShareholderPercentage() === 100 ? 'text-green-800' : 'text-red-800'
                            }`}>
                              Total des parts: {getTotalShareholderPercentage()}%
                            </span>
                          </div>
                          {getTotalShareholderPercentage() !== 100 && (
                            <span className="text-xs text-red-600">
                              Il manque {(100 - getTotalShareholderPercentage()).toFixed(2)}% pour atteindre 100%
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="text-amber-600 mt-0.5">💡</div>
                          <div>
                            <p className="text-sm text-amber-800 font-medium">Structure de propriété</p>
                            <p className="text-xs text-amber-700 mt-1">
                              Cliquez sur "Ajouter un associé" pour définir qui possède des parts de cette société. 
                              Vous pourrez ajuster les pourcentages de participation de chaque associé.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Modification...' : 'Modifier l\'entité'}
            </Button>
            <Button variant="outline" onClick={() => setIsEditDrawerOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'entité"
        description={`Êtes-vous sûr de vouloir supprimer l'entité "${entityToDelete?.name}" ? Cette action est irréversible et ne peut être effectuée que si l'entité ne détient aucun actif.`}
        confirmText="Supprimer l'entité"
        cancelText="Annuler"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  )
} 