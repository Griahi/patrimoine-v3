"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/hooks/useAuth"
import { Sidebar } from "@/components/Sidebar"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Détection du mode mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Sur mobile, le sidebar est fermé par défaut
      if (mobile) {
        setSidebarCollapsed(true)
        setMobileMenuOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fermer le menu mobile lors du clic sur l'overlay
  const handleOverlayClick = () => {
    setMobileMenuOpen(false)
  }

  // Gérer le clic sur le bouton menu mobile
  const handleMobileMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Si pas de session, afficher le contenu sans sidebar
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar showMenuButton={false} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 bottom-0 z-30">
          <Sidebar 
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </aside>
      )}

      {/* Sidebar - Mobile */}
      {isMobile && (
        <>
          {/* Overlay */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={handleOverlayClick}
            />
          )}
          
          {/* Sidebar mobile */}
          <aside className={cn(
            "fixed left-0 top-0 bottom-0 z-50 transform transition-transform duration-300 ease-in-out",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <Sidebar 
              collapsed={false}
              onCollapsedChange={() => setMobileMenuOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        !isMobile && !sidebarCollapsed ? "ml-64" : !isMobile && sidebarCollapsed ? "ml-16" : "ml-0"
      )}>
        {/* Top Bar */}
        <TopBar 
          onMenuClick={handleMobileMenuClick}
          showMenuButton={isMobile}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 