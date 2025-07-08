import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Shield, 
  BarChart3, 
  Globe,
  CheckCircle,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const features = [
    {
      icon: Building2,
      title: "Gestion Complète",
      description: "Centralisez tous vos actifs : immobilier, actions, comptes bancaires, objets de valeur."
    },
    {
      icon: Users,
      title: "Multi-Entités",
      description: "Gérez le patrimoine de personnes physiques et morales avec les liens de détention."
    },
    {
      icon: TrendingUp,
      title: "Suivi Performance",
      description: "Visualisez l'évolution de votre patrimoine avec des graphiques interactifs."
    },
    {
      icon: BarChart3,
      title: "Rapports Détaillés",
      description: "Générez des analyses approfondies et exportez vos données en PDF/Excel."
    },
    {
      icon: Shield,
      title: "Sécurisé",
      description: "Vos données patrimoniales sont protégées avec les plus hauts standards de sécurité."
    },
    {
      icon: Globe,
      title: "Accessible",
      description: "Accédez à votre patrimoine depuis n'importe où, sur tous vos appareils."
    }
  ]

  const benefits = [
    "Vue consolidée de votre patrimoine",
    "Suivi des performances en temps réel",
    "Analyses et recommandations personnalisées",
    "Gestion des structures complexes",
    "Export de rapports professionnels",
    "Interface intuitive et moderne"
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex justify-center mb-6">
            <Building2 className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Gérez votre <span className="text-primary">Patrimoine</span> <br />
            en toute simplicité
        </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Une solution complète pour centraliser, analyser et optimiser votre patrimoine. 
            Parfait pour les particuliers et les professionnels du conseil patrimonial.
        </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Commencer Gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Se Connecter
            </Button>
          </Link>
        </div>
            </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités Principales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour une gestion patrimoniale professionnelle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Pourquoi choisir Patrimoine Manager ?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Notre plateforme vous offre une vision claire et complète de votre patrimoine, 
                vous permettant de prendre des décisions éclairées pour votre avenir financier.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Patrimoine Total</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">1 250 000 €</div>
                  <div className="text-sm text-green-600">+12.5% cette année</div>
                  
                  <div className="pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Immobilier</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Actions</span>
                      <span className="text-sm font-medium">30%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Autres</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à optimiser votre patrimoine ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez des milliers d'utilisateurs qui font confiance à notre plateforme 
            pour gérer et faire fructifier leur patrimoine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Créer mon compte gratuit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-4 opacity-75">
            Aucune carte de crédit requise • Configuration en 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Patrimoine Manager</span>
              </div>
              <p className="text-gray-400 mb-4">
                La solution moderne pour la gestion de patrimoine privé. 
                Sécurisée, intuitive et complète.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Sécurité</Link></li>
              </ul>
          </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Centre d'aide</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Patrimoine Manager. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
