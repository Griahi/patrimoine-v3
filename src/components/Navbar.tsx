"use client"

import Link from "next/link"
import { useSession, signOut } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Building2, PieChart, Users, TrendingUp, Settings, CreditCard, Zap, Rocket, Calculator, LineChart } from "lucide-react"
import AlertCenter from "@/components/alerts/AlertCenter"

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">Patrimoine Manager</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {session && (
              <div className="hidden md:flex items-center space-x-1">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <PieChart className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Link href="/dashboard/adaptive">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>Dashboard IA</span>
                  </Button>
                </Link>
                <Link href="/entities">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>Entités</span>
                  </Button>
                </Link>
                <Link href="/assets">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Actifs</span>
                  </Button>
                </Link>
                <Link href="/predictions">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <LineChart className="h-4 w-4" />
                    <span>Prédictions</span>
                  </Button>
                </Link>
                <Link href="/tax">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Calculator className="h-4 w-4" />
                    <span>Optimiseur Fiscal</span>
                  </Button>
                </Link>
                <Link href="/loans">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <CreditCard className="h-4 w-4" />
                    <span>Prêts</span>
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Building2 className="h-4 w-4" />
                    <span>Rapports</span>
                  </Button>
                </Link>
                <Link href="/integrations">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>Intégrations</span>
                  </Button>
                </Link>
                <Link href="/onboarding">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Rocket className="h-4 w-4" />
                    <span>Onboarding</span>
                  </Button>
                </Link>
                <Link href="/backup">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h8a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span>Sauvegardes</span>
                  </Button>
                </Link>
              </div>
            )}
            
            {status === "loading" ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            ) : session ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <AlertCenter />
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 