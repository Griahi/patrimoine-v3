"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Building2, Eye, EyeOff, Info, User, Key } from "lucide-react"
import { signIn } from "@/hooks/useAuth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Récupérer l'URL de retour depuis les paramètres
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  // Debug pour vérifier l'URL de retour
  useEffect(() => {
    console.log('🔗 CallbackUrl récupérée:', callbackUrl)
  }, [callbackUrl])

  // COMPTES DE SECOURS PRÉDÉFINIS
  const DEMO_ACCOUNTS = [
    { email: 'test@example.com', password: 'password123', name: 'Compte Test Principal' },
    { email: 'demo@patrimoine.com', password: 'demo123', name: 'Compte Démo' },
    { email: 'admin@patrimoine.com', password: 'admin123', name: 'Compte Admin' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const result = await signIn(email, password, router, callbackUrl)
    
    if (!result.success) {
      setError(result.error || "Échec de la connexion")
    }
    
    setIsLoading(false)
  }

  const quickLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email)
    setPassword(account.password)
    setError("")
    
    // Connexion automatique avec l'URL de retour
    setIsLoading(true)
    const result = await signIn(account.email, account.password, router, callbackUrl)
    
    if (!result.success) {
      setError(result.error || "Échec de la connexion")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Patrimoine Manager</h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
          {callbackUrl !== '/dashboard' && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                📍 Vous serez redirigé vers : <span className="font-medium">{callbackUrl}</span>
              </p>
            </div>
          )}
        </div>

        {/* Comptes de démo - TRÈS VISIBLE */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              🚀 Comptes de Démonstration
            </CardTitle>
            <CardDescription className="text-blue-700">
              Cliquez sur un compte pour vous connecter instantanément
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_ACCOUNTS.map((account, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start gap-2 h-auto p-3 bg-white hover:bg-blue-100 border-blue-200"
                onClick={() => quickLogin(account)}
              >
                <User className="h-4 w-4 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-blue-800">{account.name}</div>
                  <div className="text-sm text-blue-600">{account.email}</div>
                  <div className="text-xs text-blue-500 flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    {account.password}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Formulaire de connexion */}
        <Card>
          <CardHeader>
            <CardTitle>Connexion Manuelle</CardTitle>
            <CardDescription>
              Ou saisissez vos identifiants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Accès développeur */}
        <div className="text-center">
          <Link href="/dev-access">
            <Button variant="ghost" size="sm" className="text-xs">
              🔧 Accès Développeur
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 