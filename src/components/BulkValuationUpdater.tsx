"use client";

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Check, 
  X, 
  AlertCircle,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  PlayCircle,
  Pause,
  Settings
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/dashboard-calculations';

interface AssetSummary {
  id: string;
  name: string;
  assetType: {
    name: string;
    color?: string;
  };
  currentValue: number;
  lastValuationDate: string;
  currency: string;
}

interface ValuationUpdate {
  assetId: string;
  assetName: string;
  currentValue: number;
  newValue: number;
  valuationDate: string;
  notes?: string;
  source: 'MANUAL' | 'BULK_IMPORT' | 'API_SYNC';
  currency: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface BulkValuationUpdaterProps {
  entityIds?: string[];
  onUpdateComplete?: (results: ValuationUpdate[]) => void;
}

export default function BulkValuationUpdater({ entityIds, onUpdateComplete }: BulkValuationUpdaterProps) {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [updates, setUpdates] = useState<ValuationUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalSource, setGlobalSource] = useState<'MANUAL' | 'BULK_IMPORT' | 'API_SYNC'>('BULK_IMPORT');

  useEffect(() => {
    loadAssets();
  }, [entityIds]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = entityIds ? `?entityIds=${entityIds.join(',')}` : '';
      const response = await fetch(`/api/assets${params}`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const assetsData = await response.json();
      
      // Transformer les données pour l'affichage
      const transformedAssets: AssetSummary[] = assetsData.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        assetType: asset.assetType,
        currentValue: asset.valuations?.[0]?.value || 0,
        lastValuationDate: asset.valuations?.[0]?.valuationDate || asset.createdAt,
        currency: asset.valuations?.[0]?.currency || 'EUR'
      }));

      setAssets(transformedAssets);
      
      // Initialiser les updates avec les valeurs actuelles
      const initialUpdates: ValuationUpdate[] = transformedAssets.map(asset => ({
        assetId: asset.id,
        assetName: asset.name,
        currentValue: asset.currentValue,
        newValue: asset.currentValue,
        valuationDate: globalDate,
        source: globalSource,
        currency: asset.currency,
        status: 'pending'
      }));
      
      setUpdates(initialUpdates);
      
    } catch (error) {
      console.error('Error loading assets:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (assetId: string, field: keyof ValuationUpdate, value: any) => {
    setUpdates(prev => prev.map(update => 
      update.assetId === assetId 
        ? { ...update, [field]: value, status: 'pending' }
        : update
    ));
  };

  const handleGlobalDateChange = (date: string) => {
    setGlobalDate(date);
    setUpdates(prev => prev.map(update => ({ ...update, valuationDate: date })));
  };

  const handleGlobalSourceChange = (source: 'MANUAL' | 'BULK_IMPORT' | 'API_SYNC') => {
    setGlobalSource(source);
    setUpdates(prev => prev.map(update => ({ ...update, source })));
  };

  const processUpdates = async () => {
    if (processing) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      const validUpdates = updates.filter(update => 
        update.newValue !== update.currentValue && update.newValue > 0
      );
      
      if (validUpdates.length === 0) {
        setError('Aucune mise à jour détectée');
        return;
      }

      console.log(`📊 Traitement de ${validUpdates.length} mises à jour...`);
      
      // Traiter les mises à jour une par une
      const results: ValuationUpdate[] = [];
      
      for (const update of validUpdates) {
        try {
          const response = await fetch(`/api/assets/${update.assetId}/valuations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              value: update.newValue,
              valuationDate: update.valuationDate,
              notes: update.notes || `Mise à jour en lot - ${new Date().toLocaleString('fr-FR')}`,
              source: update.source,
              currency: update.currency
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
          }

          results.push({ ...update, status: 'success' });
          
          // Mettre à jour le statut en temps réel
          setUpdates(prev => prev.map(u => 
            u.assetId === update.assetId 
              ? { ...u, status: 'success' }
              : u
          ));
          
        } catch (error) {
          console.error(`Erreur pour ${update.assetName}:`, error);
          
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          results.push({ ...update, status: 'error', error: errorMessage });
          
          // Mettre à jour le statut d'erreur
          setUpdates(prev => prev.map(u => 
            u.assetId === update.assetId 
              ? { ...u, status: 'error', error: errorMessage }
              : u
          ));
        }
        
        // Petite pause entre chaque requête
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`✅ Traitement terminé: ${results.filter(r => r.status === 'success').length} succès, ${results.filter(r => r.status === 'error').length} erreurs`);
      
      // Notifier le parent
      onUpdateComplete?.(results);
      
      // Recharger les données
      await loadAssets();
      
    } catch (error) {
      console.error('Error processing updates:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du traitement');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileImport = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/assets/bulk-import-valuations', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'import');
      }
      
      const importData = await response.json();
      
      // Fusionner les données importées avec les updates existants
      setUpdates(prev => prev.map(update => {
        const importedData = importData.find((item: any) => item.assetId === update.assetId);
        return importedData ? { ...update, ...importedData } : update;
      }));
      
      setShowImportDialog(false);
      setImportFile(null);
      
    } catch (error) {
      console.error('Error importing file:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    }
  };

  const exportTemplate = () => {
    const csvContent = [
      ['ID Actif', 'Nom Actif', 'Valeur Actuelle', 'Nouvelle Valeur', 'Date Valorisation', 'Notes', 'Devise'],
      ...assets.map(asset => [
        asset.id,
        asset.name,
        asset.currentValue,
        asset.currentValue,
        globalDate,
        '',
        asset.currency
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valorisations-template-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <Check className="h-4 w-4 text-green-600" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-gray-400" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: { label: 'Succès', className: 'bg-green-100 text-green-800' },
      error: { label: 'Erreur', className: 'bg-red-100 text-red-800' },
      pending: { label: 'En attente', className: 'bg-gray-100 text-gray-800' }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge className={`text-xs ${statusConfig.className}`}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span>Chargement des actifs...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Mise à jour en lot des valorisations
            </h2>
            <p className="text-sm text-gray-600">
              {assets.length} actifs sélectionnés
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={exportTemplate}
            >
              <Download className="h-4 w-4 mr-1" />
              Télécharger template
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Importer
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={processUpdates}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Traitement...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Appliquer les mises à jour
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Paramètres globaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de valorisation
            </label>
            <input
              type="date"
              value={globalDate}
              onChange={(e) => handleGlobalDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <select
              value={globalSource}
              onChange={(e) => handleGlobalSourceChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MANUAL">Manuel</option>
              <option value="BULK_IMPORT">Import en lot</option>
              <option value="API_SYNC">Synchronisation API</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAssets}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Erreur */}
      {error && (
        <Card className="p-4">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Liste des actifs */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2">Actif</th>
                <th className="text-right py-3 px-2">Valeur actuelle</th>
                <th className="text-right py-3 px-2">Nouvelle valeur</th>
                <th className="text-left py-3 px-2">Notes</th>
                <th className="text-center py-3 px-2">Statut</th>
                <th className="text-center py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((update) => (
                <tr key={update.assetId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" 
                           style={{ backgroundColor: assets.find(a => a.id === update.assetId)?.assetType.color || '#6B7280' }}></div>
                      <div>
                        <div className="font-medium text-gray-900">{update.assetName}</div>
                        <div className="text-xs text-gray-500">
                          {assets.find(a => a.id === update.assetId)?.assetType.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3 px-2 text-right">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(update.currentValue, update.currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(assets.find(a => a.id === update.assetId)?.lastValuationDate || '').toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  
                  <td className="py-3 px-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={update.newValue}
                      onChange={(e) => handleValueChange(update.assetId, 'newValue', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={processing}
                    />
                    {update.newValue !== update.currentValue && (
                      <div className={`text-xs mt-1 ${
                        update.newValue > update.currentValue ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {update.newValue > update.currentValue ? '+' : ''}
                        {formatCurrency(update.newValue - update.currentValue, update.currency)}
                      </div>
                    )}
                  </td>
                  
                  <td className="py-3 px-2">
                    <input
                      type="text"
                      value={update.notes || ''}
                      onChange={(e) => handleValueChange(update.assetId, 'notes', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Notes optionnelles..."
                      disabled={processing}
                    />
                  </td>
                  
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getStatusIcon(update.status)}
                      {getStatusBadge(update.status)}
                    </div>
                    {update.error && (
                      <div className="text-xs text-red-600 mt-1" title={update.error}>
                        {update.error.substring(0, 30)}...
                      </div>
                    )}
                  </td>
                  
                  <td className="py-3 px-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleValueChange(update.assetId, 'newValue', update.currentValue)}
                      title="Réinitialiser"
                      disabled={processing}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Résumé */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {updates.filter(u => u.newValue !== u.currentValue).length}
            </div>
            <div className="text-sm text-gray-600">Modifications</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {updates.filter(u => u.status === 'success').length}
            </div>
            <div className="text-sm text-gray-600">Succès</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {updates.filter(u => u.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Erreurs</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {updates.filter(u => u.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
        </div>
      </Card>

      {/* Dialog d'import */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Importer des valorisations
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier CSV
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Le fichier doit contenir les colonnes :</p>
                <ul className="list-disc list-inside mt-1 text-xs">
                  <li>ID Actif</li>
                  <li>Nouvelle Valeur</li>
                  <li>Date Valorisation (optionnel)</li>
                  <li>Notes (optionnel)</li>
                </ul>
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportFile(null);
                  }}
                >
                  Annuler
                </Button>
                
                <Button
                  variant="default"
                  onClick={() => importFile && handleFileImport(importFile)}
                  disabled={!importFile}
                >
                  Importer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 