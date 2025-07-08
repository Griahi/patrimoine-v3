"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Bug, Shield, ShieldOff } from "lucide-react"

export function DevModeControls() {
  const [isLoading, setIsLoading] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const router = useRouter()

  // Check if we should show dev controls
  useEffect(() => {
    // Simple check - if we're on localhost or have a dev flag, show controls
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port === '3000'
    setShowControls(isDev)
  }, [])

  // Only show in development mode
  if (!showControls) {
    return null
  }

  const handleClearQuickAccess = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/clear-quick-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Accès rapide supprimé!")
        router.push("/login")
      } else {
        toast.error(result.message || "Erreur lors de la suppression")
      }
    } catch {
      toast.error("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAccess = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/quick-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Accès rapide activé!")
        router.refresh()
      } else {
        toast.error(result.message || "Erreur lors de l'activation")
      }
    } catch {
      toast.error("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge variant="outline" className="text-xs">
        <Bug className="h-3 w-3 mr-1" />
        DEV
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleQuickAccess}
        disabled={isLoading}
        className="text-xs"
      >
        <ShieldOff className="h-3 w-3 mr-1" />
        Accès Rapide
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearQuickAccess}
        disabled={isLoading}
        className="text-xs"
      >
        <Shield className="h-3 w-3 mr-1" />
        Auth Normale
      </Button>
    </div>
  )
} 