import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { User, Building2, ArrowLeft, Edit, Euro, Calendar, MapPin, Hash, FileText, Target } from "lucide-react"
import Link from "next/link"
import { EntityType } from "../../../generated/prisma"
import EntityDeleteButton from "@/components/entities/EntityDeleteButton"
import { getServerSession } from "@/lib/auth-helper"

async function getEntity(entityId: string, userId: string) {
  try {
    const entity = await prisma.entity.findFirst({
      where: {
        id: entityId,
        userId: userId
      },
      include: {
        ownedAssets: {
          include: {
            ownedAsset: {
              include: {
                assetType: true,
                valuations: {
                  orderBy: { valuationDate: 'desc' },
                  take: 1
                }
              }
            }
          }
        },
        ownedEntities: {
          include: {
            ownedEntity: true
          }
        }
      }
    })

    return entity
  } catch (error) {
    console.error('Error fetching entity:', error)
    return null
  }
}

function getEntityIcon(type: EntityType) {
  switch (type) {
    case 'PHYSICAL_PERSON':
      return User
    case 'LEGAL_ENTITY':
      return Building2
    default:
      return Building2
  }
}

function getEntityTypeLabel(type: EntityType) {
  switch (type) {
    case 'PHYSICAL_PERSON':
      return 'Personne physique'
    case 'LEGAL_ENTITY':
      return 'Personne morale'
    default:
      return 'Entité'
  }
}

export default async function EntityDetailPage({ params }: { params: { id: string } }) {
  // Utiliser le helper d'authentification unifié
  const session = await getServerSession()

  if (!session) {
    // Le middleware devrait gérer cela, mais au cas où...
    redirect(`/login?callbackUrl=/entities/${params.id}`)
  }

  const entity = await getEntity(params.id, session.user.id)

  if (!entity) {
    notFound()
  }

  const Icon = getEntityIcon(entity.type)
  
  // Calculate total value of owned assets
  const totalValue = entity.ownedAssets.reduce((sum, ownership) => {
    const latestValuation = ownership.ownedAsset?.valuations[0]
    const assetValue = latestValuation ? Number(latestValuation.value) : 0
    const ownershipPercentage = Number(ownership.percentage) / 100
    return sum + (assetValue * ownershipPercentage)
  }, 0)

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/entities">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux entités
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <Icon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{entity.name}</h1>
              <p className="text-muted-foreground">
                {getEntityTypeLabel(entity.type)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/entities/${entity.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
          <EntityDeleteButton
            entityId={entity.id}
            entityName={entity.name}
            hasAssets={entity.ownedAssets.length > 0}
            hasEntities={entity.ownedEntities.length > 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entity Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Type d'entité</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Icon className="h-4 w-4" />
                  <span>{getEntityTypeLabel(entity.type)}</span>
                </div>
              </div>

              {entity.taxId && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {entity.type === EntityType.PHYSICAL_PERSON ? 'Numéro fiscal' : 'SIRET/SIREN'}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Hash className="h-4 w-4" />
                    <span>{entity.taxId}</span>
                  </div>
                </div>
              )}

              {entity.type === EntityType.LEGAL_ENTITY && entity.metadata && (entity.metadata as any).businessPurpose && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Objet social</div>
                  <div className="flex items-start space-x-2 mt-1">
                    <Target className="h-4 w-4 mt-1 flex-shrink-0" />
                    <span className="text-sm">{(entity.metadata as any).businessPurpose}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-muted-foreground">Date de création</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(entity.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          {entity.address && Object.keys(entity.address as any).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Adresse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <div className="space-y-1">
                    {(entity.address as any).street && (
                      <div>{(entity.address as any).street}</div>
                    )}
                    <div className="flex space-x-2">
                      {(entity.address as any).postalCode && (
                        <span>{(entity.address as any).postalCode}</span>
                      )}
                      {(entity.address as any).city && (
                        <span>{(entity.address as any).city}</span>
                      )}
                    </div>
                    {(entity.address as any).country && (
                      <div>{(entity.address as any).country}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {entity.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm whitespace-pre-wrap">{entity.notes}</div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Actifs détenus</span>
                <span className="font-semibold">{entity.ownedAssets.length}</span>
              </div>
              {entity.ownedEntities.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Entités détenues</span>
                  <span className="font-semibold">{entity.ownedEntities.length}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valeur totale</span>
                <span className="font-semibold text-primary">
                  {totalValue.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assets List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Actifs détenus</CardTitle>
              <CardDescription>
                Liste des actifs appartenant à cette entité
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entity.ownedAssets.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun actif</h3>
                  <p className="text-muted-foreground mb-4">
                    Cette entité ne détient actuellement aucun actif.
                  </p>
                  <Link href="/assets/new">
                    <Button>Ajouter un actif</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {entity.ownedAssets.map((ownership) => {
                    const asset = ownership.ownedAsset
                    const latestValuation = asset?.valuations[0]
                    const assetValue = latestValuation ? Number(latestValuation.value) : 0
                    const entityShare = (assetValue * Number(ownership.percentage)) / 100

                    return (
                      <div key={ownership.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: asset?.assetType.color || '#6B7280' }}
                          />
                          <div>
                            <div className="font-medium">{asset?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {asset?.assetType.name} • {Number(ownership.percentage)}% de propriété
                            </div>
                            {asset?.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {asset.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-medium">
                            {entityShare.toLocaleString('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Number(ownership.percentage)}% de {assetValue.toLocaleString('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </div>
                          {latestValuation && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(latestValuation.valuationDate).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 