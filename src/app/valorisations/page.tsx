"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Settings,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import BulkValuationUpdater from '@/components/BulkValuationUpdater';
import { formatCurrency } from '@/utils/dashboard-calculations';

interface ValuationSummary {
  totalAssets: number;
  totalValuations: number;
  totalValue: number;
  lastUpdate: string;
  averageAssetValue: number;
  entitiesCount: number;
}

interface RecentValuation {
  id: string;
  assetId: string;
  assetName: string;
  assetType: string;
  value: number;
  currency: string;
  valuationDate: string;
  source: string;
  notes?: string;
  ownerEntity: string;
}

export default function ValorisationsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bulk' | 'history' | 'settings'>('overview');
  const [summary, setSummary] = useState<ValuationSummary | null>(null);
  const [recentValuations, setRecentValuations] = useState<RecentValuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [entities, setEntities] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les entités
      const entitiesResponse = await fetch('/api/entities');
      if (entitiesResponse.ok) {
        const entitiesData = await entitiesResponse.json();
        setEntities(entitiesData);
      }
      
      // Charger les actifs pour le résumé
      const assetsResponse = await fetch('/api/assets');
      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json();
        
        // Calculer le résumé
        const totalAssets = assetsData.length;
        const totalValuations = assetsData.reduce((sum: number, asset: any) => 
          sum + (asset.valuations?.length || 0), 0);
        const totalValue = assetsData.reduce((sum: number, asset: any) => 
          sum + (asset.valuations?.[0]?.value || 0), 0);
        const lastUpdate = assetsData.reduce((latest: string, asset: any) => {
          const assetDate = asset.valuations?.[0]?.valuationDate || asset.createdAt;
          return !latest || assetDate > latest ? assetDate : latest;
        }, '');
        
        setSummary({
          totalAssets,
          totalValuations,
          totalValue,
          lastUpdate,
          averageAssetValue: totalAssets > 0 ? totalValue / totalAssets : 0,
          entitiesCount: entitiesData.length
        });
        
        // Créer la liste des valorisations récentes
        const recentVals: RecentValuation[] = [];
        assetsData.forEach((asset: any) => {
          if (asset.valuations && asset.valuations.length > 0) {
            const latestValuation = asset.valuations[0];
            const ownerEntity = asset.ownerships?.[0]?.ownerEntity?.name || 'Non défini';
            
            recentVals.push({
              id: latestValuation.id,
              assetId: asset.id,
              assetName: asset.name,
              assetType: asset.assetType.name,
              value: latestValuation.value,
              currency: latestValuation.currency,
              valuationDate: latestValuation.valuationDate,
              source: latestValuation.source,
              notes: latestValuation.notes,
              ownerEntity
            });
          }
        });
        
        // Trier par date de valorisation (plus récent en premier)
        recentVals.sort((a, b) => new Date(b.valuationDate).getTime() - new Date(a.valuationDate).getTime());
        setRecentValuations(recentVals);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdateComplete = (results: any[]) => {
    console.log('Bulk update completed:', results);
    // Recharger les données après mise à jour
    loadData();
    
    // Optionnel: afficher un message de succès
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    if (successCount > 0) {
      console.log(`✅ ${successCount} valorisations mises à jour avec succès`);
    }
    if (errorCount > 0) {
      console.log(`❌ ${errorCount} erreurs lors de la mise à jour`);
    }
  };

  const getSourceBadge = (source: string) => {
    const config = {
      MANUAL: { label: 'Manuel', color: 'bg-blue-100 text-blue-800' },
      API_BANK: { label: 'Banque', color: 'bg-green-100 text-green-800' },
      API_STOCK: { label: 'Bourse', color: 'bg-purple-100 text-purple-800' },
      BULK_IMPORT: { label: 'Import', color: 'bg-orange-100 text-orange-800' },
      SYSTEM: { label: 'Système', color: 'bg-gray-100 text-gray-800' }
    };
    
    const sourceConfig = config[source as keyof typeof config] || config.MANUAL;
    
    return (
      <Badge className={`text-xs ${sourceConfig.color}`}>
        {sourceConfig.label}
      </Badge>
    );
  };

  const filteredValuations = recentValuations.filter(valuation => {
    const matchesSearch = valuation.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         valuation.ownerEntity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'all' || valuation.source === sourceFilter;
    const matchesDate = dateFilter === 'all' || (() => {
      const valuationDate = new Date(valuation.valuationDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - valuationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'week': return daysDiff <= 7;
        case 'month': return daysDiff <= 30;
        case 'year': return daysDiff <= 365;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesSource && matchesDate;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des valorisations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Valorisations</h1>
          <p className="text-gray-600">Gérez les valorisations de vos actifs</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
          
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle valorisation
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
            { id: 'bulk', label: 'Mise à jour en lot', icon: Upload },
            { id: 'history', label: 'Historique', icon: FileText },
            { id: 'settings', label: 'Paramètres', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Résumé */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valeur totale</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.totalValue)}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalAssets}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valorisations</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalValuations}</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Entités</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.entitiesCount}</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Filtres */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Valorisations récentes</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Toutes sources</option>
                  <option value="MANUAL">Manuel</option>
                  <option value="API_BANK">API Bancaire</option>
                  <option value="API_STOCK">API Bourse</option>
                  <option value="BULK_IMPORT">Import</option>
                  <option value="SYSTEM">Système</option>
                </select>
                
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Toutes dates</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="year">Cette année</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2">Actif</th>
                    <th className="text-left py-3 px-2">Propriétaire</th>
                    <th className="text-right py-3 px-2">Valeur</th>
                    <th className="text-center py-3 px-2">Source</th>
                    <th className="text-center py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredValuations.map((valuation) => (
                    <tr key={valuation.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium text-gray-900">{valuation.assetName}</div>
                          <div className="text-xs text-gray-500">{valuation.assetType}</div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-2">
                        <div className="text-sm text-gray-900">{valuation.ownerEntity}</div>
                      </td>
                      
                      <td className="py-3 px-2 text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(valuation.value, valuation.currency)}
                        </div>
                      </td>
                      
                      <td className="py-3 px-2 text-center">
                        {getSourceBadge(valuation.source)}
                      </td>
                      
                      <td className="py-3 px-2 text-center">
                        <div className="text-sm text-gray-900">
                          {new Date(valuation.valuationDate).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      
                      <td className="py-3 px-2">
                        <div className="text-sm text-gray-600 max-w-40 truncate" title={valuation.notes}>
                          {valuation.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredValuations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune valorisation trouvée
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'bulk' && (
        <BulkValuationUpdater 
          entityIds={selectedEntities.length > 0 ? selectedEntities : undefined}
          onUpdateComplete={handleBulkUpdateComplete}
        />
      )}

      {activeTab === 'history' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique complet</h3>
          <p className="text-gray-600">Fonctionnalité d'historique détaillé à venir...</p>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Entités sélectionnées</h4>
              <div className="space-y-2">
                {entities.map((entity) => (
                  <label key={entity.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedEntities.includes(entity.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEntities(prev => [...prev, entity.id]);
                        } else {
                          setSelectedEntities(prev => prev.filter(id => id !== entity.id));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">{entity.name}</span>
                    <Badge className="ml-2 text-xs bg-gray-100 text-gray-700">
                      {entity.type === 'INDIVIDUAL' ? 'Personne physique' : 'Personne morale'}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter toutes les valorisations
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programmer des valorisations automatiques
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 