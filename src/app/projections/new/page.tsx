'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useAuth';
import { redirect, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { toast } from 'sonner';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { ScenarioAction } from '@/types/projections';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function NewProjectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'SIMPLE' as 'SIMPLE' | 'COMPLEX'
  });
  
  const [actions, setActions] = useState<ScenarioAction[]>([]);
  const [showActionForm, setShowActionForm] = useState(false);
  const [currentAction, setCurrentAction] = useState<Partial<ScenarioAction>>({
    type: 'SELL',
    name: '',
    executionDate: new Date(),
    amount: 0,
    parameters: {}
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      redirect("/login?callbackUrl=/projections/new");
      return;
    }
    fetchAssets();
  }, [session, status]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleAddAction = () => {
    if (!currentAction.name || !currentAction.amount) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    const newAction: ScenarioAction = {
      id: Date.now().toString(),
      type: currentAction.type!,
      name: currentAction.name,
      executionDate: currentAction.executionDate!,
      amount: currentAction.amount,
      parameters: currentAction.parameters || {},
      order: actions.length
    };

    setActions([...actions, newAction]);
    setCurrentAction({
      type: 'SELL',
      name: '',
      executionDate: new Date(),
      amount: 0,
      parameters: {}
    });
    setShowActionForm(false);
    toast.success('Action ajoutée avec succès');
  };

  const handleDeleteAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
    toast.success('Action supprimée');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (actions.length === 0) {
      toast.error('Ajoutez au moins une action au scénario');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/projections/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          actions: actions.map((a, index) => ({ 
            ...a, 
            order: index,
            executionDate: a.executionDate.toISOString() // Forcer la sérialisation ISO
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
      }
      
      const responseData = await response.json();
      toast.success('Scénario créé avec succès');
      router.push(`/projections`);
    } catch (error) {
      console.error('Erreur lors de la création du scénario:', error);
      toast.error(`Impossible de créer le scénario: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const getActionEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      SELL: '🏷️',
      BUY: '🛒',
      INVEST: '💰',
      YIELD: '📈',
      EXPENSE: '💸',
      TAX: '🏛️'
    };
    return emojis[type] || '📌';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouveau scénario</h1>
          <p className="text-muted-foreground">
            Créez un scénario pour projeter l'évolution de votre patrimoine
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations du scénario</CardTitle>
            <CardDescription>
              Donnez un nom et une description à votre scénario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du scénario *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Achat résidence secondaire"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez l'objectif de ce scénario..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de scénario</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as 'SIMPLE' | 'COMPLEX' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMPLE">Simple</SelectItem>
                  <SelectItem value="COMPLEX">Complexe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions du scénario ({actions.length})</CardTitle>
            <CardDescription>
              Ajoutez et organisez les actions qui composent votre scénario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actions.length === 0 && !showActionForm ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Aucune action ajoutée pour le moment
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowActionForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une action
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {!showActionForm && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowActionForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une action
                  </Button>
                )}

                {showActionForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Nouvelle action</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="type">Type d'action</Label>
                          <Select
                            value={currentAction.type}
                            onValueChange={(value) => setCurrentAction(prev => ({ ...prev, type: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SELL">🏷️ Vendre</SelectItem>
                              <SelectItem value="BUY">🛒 Acheter</SelectItem>
                              <SelectItem value="INVEST">💰 Investir</SelectItem>
                              <SelectItem value="YIELD">📈 Rendement</SelectItem>
                              <SelectItem value="EXPENSE">💸 Dépense</SelectItem>
                              <SelectItem value="TAX">🏛️ Impôt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="name">Nom de l'action</Label>
                          <Input
                            id="name"
                            value={currentAction.name}
                            onChange={(e) => setCurrentAction(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Vente appartement Paris"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Montant (€)</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={currentAction.amount}
                            onChange={(e) => setCurrentAction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date">Date d'exécution</Label>
                          <Input
                            id="date"
                            type="date"
                            value={currentAction.executionDate ? format(currentAction.executionDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => setCurrentAction(prev => ({ ...prev, executionDate: new Date(e.target.value) }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => setShowActionForm(false)}>
                          Annuler
                        </Button>
                        <Button type="button" onClick={handleAddAction}>
                          Ajouter l'action
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {actions.length > 0 && (
                  <div className="space-y-4">
                    {actions.map((action) => (
                      <Card key={action.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{getActionEmoji(action.type)}</span>
                              <h4 className="font-semibold">{action.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(action.executionDate, 'dd MMMM yyyy', { locale: fr })} • 
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                maximumFractionDigits: 0
                              }).format(action.amount)}
                            </p>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteAction(action.id!)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading || !formData.name || actions.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Création...' : 'Créer le scénario'}
          </Button>
        </div>
      </form>
    </div>
  );
} 