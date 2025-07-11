"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { 
  Building2, 
  PieChart, 
  Users, 
  TrendingUp, 
  Settings, 
  CreditCard, 
  Zap, 
  Rocket, 
  Calculator, 
  LineChart,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Database,
  FileText,
  Sparkles
} from "lucide-react"

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const navigationGroups: NavigationGroup[] = [
  {
    title: "Tableau de bord",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: PieChart,
        description: "Vue d'ensemble"
      },
      {
        name: "Dashboard IA",
        href: "/dashboard/adaptive",
        icon: Zap,
        description: "Intelligence adaptative"
      }
    ]
  },
  {
    title: "Gestion",
    items: [
      {
        name: "Entités",
        href: "/entities",
        icon: Users,
        description: "Gestion des entités"
      },
      {
        name: "Actifs",
        href: "/assets",
        icon: TrendingUp,
        description: "Portefeuille d'actifs"
      },
      {
        name: "Comptes",
        href: "/accounts",
        icon: CreditCard,
        description: "Comptes bancaires"
      },
      {
        name: "Prêts",
        href: "/loans",
        icon: Building2,
        description: "Gestion des prêts"
      }
    ]
  },
  {
    title: "Analyse",
    items: [
      {
        name: "Projections",
        href: "/projections",
        icon: BarChart3,
        description: "Scénarios What-If"
      },
      {
        name: "Prédictions",
        href: "/predictions",
        icon: LineChart,
        description: "Analyses prédictives"
      },
      {
        name: "Optimiseur Fiscal",
        href: "/tax",
        icon: Calculator,
        description: "Optimisation fiscale"
      },
      {
        name: "Rapports",
        href: "/reports",
        icon: FileText,
        description: "Rapports détaillés"
      }
    ]
  },
  {
    title: "Outils",
    items: [
      {
        name: "Intégrations",
        href: "/integrations",
        icon: Sparkles,
        description: "Connecteurs externes"
      },
      {
        name: "Onboarding",
        href: "/onboarding",
        icon: Rocket,
        description: "Configuration initiale"
      },
      {
        name: "Sauvegardes",
        href: "/backup",
        icon: Database,
        description: "Gestion des sauvegardes"
      }
    ]
  }
]

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleCollapse = () => {
    onCollapsedChange?.(!collapsed)
  }

  if (!session) {
    return null
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo et Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary flex-shrink-0" />
            {!collapsed && (
              <span className="font-bold text-lg text-gray-900 truncate">
                Patrimoine Manager
              </span>
            )}
          </Link>
          
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapse}
              className="p-1 h-8 w-8 flex-shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn(
                        "flex-shrink-0 h-5 w-5",
                        isActive ? "text-primary" : "text-gray-500 group-hover:text-gray-900"
                      )} />
                      {!collapsed && (
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="truncate">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer avec Settings */}
      <div className="p-3 border-t border-gray-200">
        <Link
          href="/settings"
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
            pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Settings className={cn(
            "flex-shrink-0 h-5 w-5",
            pathname === "/settings" ? "text-primary" : "text-gray-500 group-hover:text-gray-900"
          )} />
          {!collapsed && (
            <div className="ml-3 flex-1 min-w-0">
              <div className="truncate">Paramètres</div>
              <div className="text-xs text-gray-500 truncate">
                Configuration
              </div>
            </div>
          )}
        </Link>
      </div>
    </div>
  )
} 