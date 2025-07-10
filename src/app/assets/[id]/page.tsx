"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Calendar, 
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  Settings,
  BarChart3
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import ValuationManager from '@/components/ValuationManager';
import { formatCurrency } from '@/utils/dashboard-calculations';
import { safePercentageWithSign, safeToFixed, safeSum } from '@/utils/number-formatting';

interface AssetDetail {
  id: string;
  name: string;
  description?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  assetType: {
    id: string;
    name: string;
    code: string;
    category: string;
    color?: string;
    icon?: string;
  };
  ownerships: Array<{
    id: string;
    percentage: number;
    ownerEntity: {
      id: string;
      name: string;
      type: 'INDIVIDUAL' | 'LEGAL_ENTITY';
    };
  }>;
  valuations: Array<{
    id: string;
    value: number;
    valuationDate: string;
    source: string;
    currency: string;
    notes?: string;
  }>;
  debts?: Array<{
    id: string;
    name: string;
    currentAmount: number;
    monthlyPayment: number;
    currency: string;
  }>;
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'valuations' | 'ownership' | 'settings'>('overview');

  useEffect(() => {
    if (assetId) {
      loadAssetDetails();
    }
  }, [assetId]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'valuations', 'ownership', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl as 'overview' | 'valuations' | 'ownership' | 'settings');
    }
  }, [searchParams]);

  const loadAssetDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/assets/${assetId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Actif introuvable');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const assetData = await response.json();
      setAsset(assetData);
    } catch (error) {
      console.error('Error loading asset details:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleValuationUpdate = () => {
    // Recharger les détails de l'actif pour mettre à jour les valorisations
    loadAssetDetails();
  };

  const handleDeleteAsset = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'actif "${asset?.name}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Rediriger vers la liste des actifs
      router.push('/assets');
    } catch (error) {
      console.error('Error deleting asset:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const getEntityTypeBadge = (type: string) => {
    return type === 'INDIVIDUAL' ? (
      <Badge className="bg-blue-100 text-blue-800">Personne physique</Badge>
    ) : (
      <Badge className="bg-green-100 text-green-800">Personne morale</Badge>
    );
  };

  const getCurrentValue = () => {
    if (!asset?.valuations || asset.valuations.length === 0) return 0;
    return asset.valuations[0].value;
  };

  const getValueEvolution = () => {
    if (!asset?.valuations || asset.valuations.length < 2) return null;
    
    const current = asset.valuations[0].value;
    const previous = asset.valuations[1].value;
    const change = current - previous;
    const changePercent = (change / previous) * 100;
    
    return {
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des détails de l'actif...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={() => router.push('/assets')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour aux actifs
            </Button>
            <Button onClick={loadAssetDetails}>
              Réessayer
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!asset) return null;

  const evolution = getValueEvolution();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/assets')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                className="text-xs"
                style={{ 
                  backgroundColor: asset.assetType.color + '20', 
                  color: asset.assetType.color || '#6B7280' 
                }}
              >
                {asset.assetType.name}
              </Badge>
              <span className="text-sm text-gray-500">
                {asset.assetType.category}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={handleDeleteAsset}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { id: 'valuations', label: 'Valorisations', icon: Building2 },
            { id: 'ownership', label: 'Propriété', icon: Users },
            { id: 'settings', label: 'Paramètres', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
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
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Valeur actuelle</h3>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(getCurrentValue())}
              </div>
              {evolution && (
                <div className={`text-sm mt-1 ${
                  evolution.trend === 'up' ? 'text-green-600' : 
                  evolution.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {evolution.change >= 0 ? '+' : ''}{formatCurrency(evolution.change)} 
                  ({safeToFixed(evolution.changePercent, 1)}%)
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Propriétaires</h3>
              <div className="text-2xl font-bold text-gray-900">
                {asset.ownerships.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {safeToFixed(safeSum(asset.ownerships || [], 'percentage'), 1)}% total
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Valorisations</h3>
              <div className="text-2xl font-bold text-gray-900">
                {asset.valuations.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Depuis {asset.valuations.length > 0 ? 
                  new Date(asset.valuations[asset.valuations.length - 1].valuationDate).toLocaleDateString('fr-FR') : 
                  'jamais'
                }
              </div>
            </Card>
          </div>

          {/* Description et métadonnées */}
          {(asset.description || asset.metadata) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
              
              {asset.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">{asset.description}</p>
                </div>
              )}

              {asset.metadata && Object.keys(asset.metadata).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Métadonnées</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(asset.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-sm text-gray-900 font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Dettes associées */}
          {asset.debts && asset.debts.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dettes associées</h3>
              <div className="space-y-3">
                {asset.debts.map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{debt.name}</div>
                      <div className="text-sm text-gray-600">
                        Mensualité: {formatCurrency(debt.monthlyPayment, debt.currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {formatCurrency(debt.currentAmount, debt.currency)}
                      </div>
                      <div className="text-xs text-gray-500">Restant dû</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'valuations' && (
        <ValuationManager 
          assetId={assetId} 
          onValuationUpdate={handleValuationUpdate}
        />
      )}

      {activeTab === 'ownership' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Structure de propriété</h3>
          
          <div className="space-y-4">
            {asset.ownerships.map((ownership) => (
              <div key={ownership.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {ownership.ownerEntity.name}
                    </div>
                    {getEntityTypeBadge(ownership.ownerEntity.type)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {safeToFixed(ownership.percentage, 1)}%
                  </div>
                  <div className="text-sm text-gray-600">de propriété</div>
                </div>
              </div>
            ))}
          </div>

          {/* Total check */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total:</span>
              <span className={`font-medium ${
                Math.abs(safeSum(asset.ownerships || [], 'percentage') - 100) < 0.01
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {safeToFixed(safeSum(asset.ownerships || [], 'percentage'), 1)}%
              </span>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de l'actif</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Informations générales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">ID:</span>
                  <span className="ml-2 text-gray-900 font-mono">{asset.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 text-gray-900">{asset.assetType.code}</span>
                </div>
                <div>
                  <span className="text-gray-500">Créé le:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(asset.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Modifié le:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(asset.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Actions</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Exporter les données
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programmer une valorisation automatique
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleDeleteAsset}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 