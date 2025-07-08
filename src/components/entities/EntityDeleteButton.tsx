'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/Button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog"
import { Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface EntityDeleteButtonProps {
  entityId: string
  entityName: string
  hasAssets: boolean
  hasEntities: boolean
}

export default function EntityDeleteButton({ 
  entityId, 
  entityName, 
  hasAssets, 
  hasEntities 
}: EntityDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const canDelete = !hasAssets && !hasEntities

  const handleDelete = async () => {
    if (!canDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/entities/${entityId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        router.push('/entities')
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Erreur lors de la suppression de l\'entité')
    } finally {
      setIsDeleting(false)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          disabled={!canDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Confirmer la suppression</span>
          </DialogTitle>
          <DialogDescription className="space-y-3">
            {canDelete ? (
              <>
                <p>
                  Êtes-vous sûr de vouloir supprimer l'entité <strong>{entityName}</strong> ?
                </p>
                <p className="text-sm text-muted-foreground">
                  Cette action est irréversible et supprimera définitivement toutes les données associées à cette entité.
                </p>
              </>
            ) : (
              <>
                <p>
                  Impossible de supprimer l'entité <strong>{entityName}</strong>.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Cette entité ne peut pas être supprimée car elle détient :
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {hasAssets && <li>Des actifs patrimoniaux</li>}
                    {hasEntities && <li>D'autres entités</li>}
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Veuillez d'abord transférer ou supprimer ces éléments avant de supprimer cette entité.
                  </p>
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          {canDelete && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 