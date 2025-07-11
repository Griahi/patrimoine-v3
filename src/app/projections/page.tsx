'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import { Plus, FileText, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ConfirmationDialog
} from '@/components/ui/Dialog';

interface Scenario {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  actions: any[];
  results: any[];
  createdAt: string;
  updatedAt: string;
}

export default function ProjectionsPage() {
  const { data: session, status } = useSession();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      redirect("/login?callbackUrl=/projections");
      return;
    }
    fetchScenarios();
  }, [session, status]);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projections/scenarios');
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      toast.error('Impossible de charger les scénarios');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/projections/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const response = await fetch(`/api/projections/scenarios/${deleteId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete scenario');
      
      toast.success('Scénario supprimé avec succès');
      setDeleteId(null);
      fetchScenarios();
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Impossible de supprimer le scénario');
    }
  };

  const handleToggle = async (id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    try {
      const response = await fetch(`/api/projections/scenarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !scenario.isActive
        })
      });
      
      if (!response.ok) throw new Error('Failed to toggle scenario');
      
      toast.success(`Scénario ${scenario.isActive ? 'désactivé' : 'activé'}`);
      fetchScenarios();
    } catch (error) {
      console.error('Error toggling scenario:', error);
      toast.error('Impossible de modifier le scénario');
    }
  };

  const handleCalculate = (id: string) => {
    router.push(`/projections/${id}`);
  };

  const getActionIcon = (type: string) => {
    const icons: Record<string, string> = {
      SELL: '🏷️',
      BUY: '🛒',
      INVEST: '💰',
      YIELD: '📈',
      EXPENSE: '💸',
      TAX: '🏛️'
    };
    return icons[type] || '📌';
  };

  const getActionTypes = (actions: any[]) => {
    const types: Record<string, number> = {};
    actions.forEach(action => {
      types[action.type] = (types[action.type] || 0) + 1;
    });
    return types;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projections & Scénarios</h1>
          <p className="text-muted-foreground mt-2">
            Simulez l'évolution de votre patrimoine selon différents scénarios
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/projections/templates')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button onClick={() => router.push('/projections/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau scénario
          </Button>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucun scénario créé</h3>
            <p className="text-muted-foreground mt-2">
              Créez votre premier scénario pour projeter l'évolution de votre patrimoine
            </p>
            <Button 
              className="mt-6"
              onClick={() => router.push('/projections/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer un scénario
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const actionTypes = getActionTypes(scenario.actions);
            const hasResults = scenario.results.length > 0;
            
            return (
              <Card 
                key={scenario.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/projections/${scenario.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {scenario.name}
                      {scenario.type === 'COMPLEX' && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          Complexe
                        </span>
                      )}
                    </CardTitle>
                    {scenario.description && (
                      <CardDescription className="text-sm line-clamp-2">
                        {scenario.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(scenario.id);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(scenario.id);
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        scenario.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {scenario.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {scenario.actions.length} action{scenario.actions.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCalculate(scenario.id);
                      }}
                      disabled={!scenario.isActive}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Calculer
                    </Button>
                  </div>

                  {/* Actions summary */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(actionTypes).map(([type, count]) => (
                      <div 
                        key={type}
                        className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded-md"
                      >
                        <span>{getActionIcon(type)}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                  
                  {hasResults && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Projections disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Êtes-vous sûr ?"
        description="Cette action est irréversible. Le scénario et toutes ses projections seront définitivement supprimés."
        onConfirm={handleDelete}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  );
} 