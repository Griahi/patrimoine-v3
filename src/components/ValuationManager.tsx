"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  History, 
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/dashboard-calculations';
import { safePercentageWithSign, safeToFixed } from '@/utils/number-formatting';

interface Valuation {
  id: string;
  value: number;
  valuationDate: string;
  source: 'MANUAL' | 'API_BANK' | 'API_STOCK' | 'SYSTEM';
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ValuationData {
  asset: {
    id: string;
    name: string;
    assetType: {
      name: string;
      color?: string;
    };
  };
  valuations: Valuation[];
  statistics: {
    totalCount: number;
    hasMore: boolean;
    currentValue: number;
    oldestDate: string | null;
    newestDate: string | null;
  };
  evolution: {
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  } | null;
}

interface ValuationManagerProps {
  assetId: string;
  onValuationUpdate?: () => void;
}

export default function ValuationManager({ assetId, onValuationUpdate }: ValuationManagerProps) {
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [editingValuation, setEditingValuation] = useState<Valuation | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    value: '',
    valuationDate: new Date().toISOString().split('T')[0],
    notes: '',
    source: 'MANUAL' as const,
    currency: 'EUR'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadValuations();
  }, [assetId]);

  const loadValuations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/assets/${assetId}/valuations?limit=50`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const valuationData = await response.json();
      setData(valuationData);
    } catch (error) {
      console.error('Error loading valuations:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        value: parseFloat(formData.value),
        valuationDate: formData.valuationDate,
        notes: formData.notes || undefined,
        source: formData.source,
        currency: formData.currency
      };

      const response = await fetch(`/api/assets/${assetId}/valuations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      console.log('Valorisation sauvegardée:', result.message);

      // Reset form
      setFormData({
        value: '',
        valuationDate: new Date().toISOString().split('T')[0],
        notes: '',
        source: 'MANUAL',
        currency: 'EUR'
      });
      setShowForm(false);
      setEditingValuation(null);

      // Reload data
      await loadValuations();
      
      // Notify parent
      onValuationUpdate?.();

    } catch (error) {
      console.error('Error saving valuation:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (valuation: Valuation) => {
    setEditingValuation(valuation);
    setFormData({
      value: valuation.value.toString(),
      valuationDate: valuation.valuationDate.split('T')[0],
      notes: valuation.notes || '',
      source: valuation.source,
      currency: valuation.currency
    });
    setShowForm(true);
  };

  const handleDelete = async (valuationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette valorisation ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/${assetId}/valuations?valuationId=${valuationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      await loadValuations();
      onValuationUpdate?.();
    } catch (error) {
      console.error('Error deleting valuation:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const getSourceBadge = (source: string) => {
    const config = {
      MANUAL: { label: 'Manuel', color: 'bg-blue-100 text-blue-800' },
      API_BANK: { label: 'Banque', color: 'bg-green-100 text-green-800' },
      API_STOCK: { label: 'Bourse', color: 'bg-purple-100 text-purple-800' },
      SYSTEM: { label: 'Système', color: 'bg-gray-100 text-gray-800' }
    };
    
    const sourceConfig = config[source as keyof typeof config] || config.MANUAL;
    
    return (
      <Badge className={`text-xs ${sourceConfig.color}`}>
        {sourceConfig.label}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span>Chargement des valorisations...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between text-red-600">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadValuations}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Valorisations - {data.asset.name}
            </h3>
            <p className="text-sm text-gray-600">{data.asset.assetType.name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-1" />
              {showHistory ? 'Masquer' : 'Afficher'} l'historique
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle valorisation
            </Button>
          </div>
        </div>

        {/* Valeur actuelle et évolution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.statistics.currentValue)}
            </div>
            <div className="text-sm text-gray-600">Valeur actuelle</div>
          </div>
          
          {data.evolution && (
            <div className="text-center">
              <div className={`flex items-center justify-center text-lg font-semibold ${
                data.evolution.trend === 'up' ? 'text-green-600' : 
                data.evolution.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {getTrendIcon(data.evolution.trend)}
                <span className="ml-1">
                  {data.evolution.change >= 0 ? '+' : ''}{formatCurrency(data.evolution.change)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {safePercentageWithSign(data.evolution.changePercent, 2)}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {data.statistics.totalCount}
            </div>
            <div className="text-sm text-gray-600">Valorisations</div>
          </div>
        </div>
      </Card>

      {/* Formulaire de nouvelle valorisation */}
      {showForm && (
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {editingValuation ? 'Modifier la valorisation' : 'Nouvelle valorisation'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 150000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de valorisation *
                </label>
                <input
                  type="date"
                  required
                  value={formData.valuationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, valuationDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MANUAL">Manuel</option>
                  <option value="API_BANK">API Bancaire</option>
                  <option value="API_STOCK">API Bourse</option>
                  <option value="SYSTEM">Système</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Devise
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Informations complémentaires..."
              />
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditingValuation(null);
                  setFormData({
                    value: '',
                    valuationDate: new Date().toISOString().split('T')[0],
                    notes: '',
                    source: 'MANUAL',
                    currency: 'EUR'
                  });
                }}
              >
                Annuler
              </Button>
              
              <Button
                type="submit"
                disabled={submitting || !formData.value}
              >
                {submitting ? 'Enregistrement...' : editingValuation ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Historique des valorisations */}
      {showHistory && data.valuations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">
              Historique des valorisations
            </h4>
            
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-right py-3 px-2">Valeur</th>
                  <th className="text-center py-3 px-2">Source</th>
                  <th className="text-left py-3 px-2">Notes</th>
                  <th className="text-center py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.valuations.map((valuation, index) => (
                  <tr key={valuation.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(valuation.valuationDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    
                    <td className="py-3 px-2 text-right font-medium">
                      {formatCurrency(valuation.value, valuation.currency)}
                      {index > 0 && data.valuations[index - 1] && (
                        <div className="text-xs text-gray-500">
                                                     {safePercentageWithSign(((valuation.value - data.valuations[index - 1].value) / data.valuations[index - 1].value * 100), 1)}
                        </div>
                      )}
                    </td>
                    
                    <td className="py-3 px-2 text-center">
                      {getSourceBadge(valuation.source)}
                    </td>
                    
                    <td className="py-3 px-2">
                      <div className="max-w-48 truncate" title={valuation.notes}>
                        {valuation.notes || '-'}
                      </div>
                    </td>
                    
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(valuation)}
                          title="Modifier"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        {data.statistics.totalCount > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(valuation.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data.statistics.hasMore && (
            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Voir plus de valorisations
              </Button>
            </div>
          )}
        </Card>
      )}
      
      {/* Message si aucune valorisation */}
      {data.valuations.length === 0 && (
        <Card className="p-6 text-center">
          <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucune valorisation
          </h4>
          <p className="text-gray-600 mb-4">
            Commencez par ajouter une première valorisation pour cet actif.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une valorisation
          </Button>
        </Card>
      )}
    </div>
  );
} 