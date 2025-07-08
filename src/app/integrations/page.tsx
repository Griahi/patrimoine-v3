"use client"

import { useSession } from "@/hooks/useAuth"
import { redirect } from "next/navigation"
import IntegrationsManager from "@/components/integrations/IntegrationsManager"

export default function IntegrationsPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (!session) {
    redirect("/login?callbackUrl=/integrations")
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Intégrations</h1>
        <p className="text-muted-foreground">
          Connectez vos comptes bancaires et synchronisez vos données financières
        </p>
      </div>

      {/* Integrations Manager */}
      <IntegrationsManager />
    </div>
  )
} 