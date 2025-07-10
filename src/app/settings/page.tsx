import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Settings, User, Shield, Bell, Database } from "lucide-react"
import { getServerSession } from "@/lib/auth"

export default async function SettingsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/login?callbackUrl=/settings")
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profil Utilisateur
            </CardTitle>
            <CardDescription>
              Informations personnelles et préférences de compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  defaultValue={session.user.name || ''}
                  placeholder="Votre nom complet"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={session.user.email || ''}
                  placeholder="votre@email.com"
                  disabled
                />
              </div>
            </div>
            <div>
              <Label htmlFor="language">Langue</Label>
              <select className="w-full p-2 border rounded-md">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex justify-end">
              <Button>Sauvegarder les modifications</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Paramètres de sécurité et authentification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Mot de passe</h4>
                  <p className="text-sm text-muted-foreground">
                    Dernière modification il y a 30 jours
                  </p>
                </div>
                <Button variant="outline">Modifier</Button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Authentification à deux facteurs</h4>
                  <p className="text-sm text-muted-foreground">
                    Sécurisez votre compte avec 2FA
                  </p>
                </div>
                <Button variant="outline">Configurer</Button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Sessions actives</h4>
                  <p className="text-sm text-muted-foreground">
                    Gérez vos sessions de connexion
                  </p>
                </div>
                <Button variant="outline">Voir les sessions</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Préférences de notification et alertes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Alertes de valorisation</h4>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des alertes lors de changements importants
                  </p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Rapport mensuel</h4>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un résumé mensuel de votre patrimoine
                  </p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notifications de sécurité</h4>
                  <p className="text-sm text-muted-foreground">
                    Alertes importantes de sécurité
                  </p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Sauvegarder les préférences</Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Gestion des Données
            </CardTitle>
            <CardDescription>
              Export, import et gestion de vos données patrimoniales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Exporter mes données</h4>
                  <p className="text-sm text-muted-foreground">
                    Télécharger toutes vos données en format JSON
                  </p>
                </div>
                <Button variant="outline">Exporter</Button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Sauvegarder automatiquement</h4>
                  <p className="text-sm text-muted-foreground">
                    Sauvegardes automatiques quotidiennes
                  </p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Zone de Danger</CardTitle>
            <CardDescription>
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-red-600">Supprimer mon compte</h4>
                  <p className="text-sm text-muted-foreground">
                    Suppression définitive de votre compte et de toutes vos données
                  </p>
                </div>
                <Button variant="destructive">Supprimer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 