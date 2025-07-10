import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Filter, 
  Search, 
  Calendar, 
  Users, 
  TrendingUp, 
  PieChart, 
  Calculator, 
  Droplets, 
  Shield, 
  Target, 
  Building,
  X,
  ChevronDown,
  Settings,
  BarChart3,
  FileText,
  Download,
  Printer
} from 'lucide-react';

// Types
interface FilterState {
  period: string;
  entities: string[];
  assets: string[];
  currency: string;
  reportType: string;
  includeProjections: boolean;
  liquidityFilter: string;
  fiscalOptimization: boolean;
}

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface Asset {
  id: string;
  name: string;
  assetType: {
    name: string;
    color?: string;
  };
}

interface ReportNavigationProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  entities: Entity[];
  assets: Asset[];
  isLoading?: boolean;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onExportCSV?: () => void;
  onPrint?: () => void;
}

// Configuration des types de rapports
const REPORT_TYPES = [
  {
    id: 'bilan_complet',
    name: 'Bilan Complet',
    description: 'Vue d\'ensemble détaillée du patrimoine',
    icon: BarChart3,
    color: 'bg-blue-100 text-blue-700',
    category: 'synthèse'
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Analyse des performances et rendements',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-700',
    category: 'analyse'
  },
  {
    id: 'diversification',
    name: 'Diversification',
    description: 'Répartition et équilibre du portefeuille',
    icon: PieChart,
    color: 'bg-purple-100 text-purple-700',
    category: 'analyse'
  },
  {
    id: 'liquidite',
    name: 'Liquidité',
    description: 'Analyse de la liquidité des actifs',
    icon: Droplets,
    color: 'bg-cyan-100 text-cyan-700',
    category: 'analyse'
  },
  {
    id: 'stress_test',
    name: 'Tests de Résistance',
    description: 'Simulation de scénarios de stress',
    icon: Shield,
    color: 'bg-orange-100 text-orange-700',
    category: 'risque'
  },
  {
    id: 'projection',
    name: 'Projections',
    description: 'Projections patrimoniales futures',
    icon: Target,
    color: 'bg-indigo-100 text-indigo-700',
    category: 'prospectif'
  },
  {
    id: 'fiscal',
    name: 'Fiscal',
    description: 'Optimisation et obligations fiscales',
    icon: Calculator,
    color: 'bg-yellow-100 text-yellow-700',
    category: 'fiscal'
  },
  {
    id: 'consolidation',
    name: 'Consolidation',
    description: 'Vue consolidée multi-entités',
    icon: Building,
    color: 'bg-gray-100 text-gray-700',
    category: 'consolidation'
  }
];

const PERIODS = [
  { value: '1M', label: '1 mois' },
  { value: '3M', label: '3 mois' },
  { value: '6M', label: '6 mois' },
  { value: '1Y', label: '1 an' },
  { value: '2Y', label: '2 ans' },
  { value: '5Y', label: '5 ans' },
  { value: 'ALL', label: 'Tout' }
];

const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'USD', label: 'Dollar ($)', symbol: '$' },
  { value: 'GBP', label: 'Livre (£)', symbol: '£' },
  { value: 'CHF', label: 'Franc suisse', symbol: 'CHF' }
];

const LIQUIDITY_FILTERS = [
  { value: 'all', label: 'Tous les actifs' },
  { value: 'immediate', label: 'Liquidité immédiate' },
  { value: 'short_term', label: 'Court terme' },
  { value: 'medium_term', label: 'Moyen terme' },
  { value: 'long_term', label: 'Long terme' }
];

const ReportNavigation: React.FC<ReportNavigationProps> = ({
  filters,
  onFiltersChange,
  entities,
  assets,
  isLoading = false,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  onPrint
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'filters' | 'export'>('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtrer les types de rapports par recherche
  const filteredReportTypes = REPORT_TYPES.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouper les rapports par catégorie
  const groupedReports = filteredReportTypes.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, typeof REPORT_TYPES>);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleEntityToggle = (entityId: string) => {
    const newEntities = filters.entities.includes(entityId)
      ? filters.entities.filter(id => id !== entityId)
      : [...filters.entities, entityId];
    
    handleFilterChange('entities', newEntities);
  };

  const handleAssetToggle = (assetId: string) => {
    const newAssets = filters.assets.includes(assetId)
      ? filters.assets.filter(id => id !== assetId)
      : [...filters.assets, assetId];
    
    handleFilterChange('assets', newAssets);
  };

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      entities: [],
      assets: [],
      period: '1Y',
      liquidityFilter: 'all',
      includeProjections: false,
      fiscalOptimization: false
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.entities.length > 0) count++;
    if (filters.assets.length > 0) count++;
    if (filters.period !== '1Y') count++;
    if (filters.liquidityFilter !== 'all') count++;
    if (filters.includeProjections) count++;
    if (filters.fiscalOptimization) count++;
    return count;
  };

  const currentReportType = REPORT_TYPES.find(r => r.id === filters.reportType);
  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* Header avec titre et actions */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {currentReportType && (
                <>
                  <div className={`p-2 rounded-lg ${currentReportType.color}`}>
                    <currentReportType.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {currentReportType.name}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {currentReportType.description}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Actions d'export */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="px-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Rapports</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('filters')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'filters'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('export')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Options</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="px-6 py-4">
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un type de rapport..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Grille des rapports */}
            <div className="space-y-4">
              {Object.entries(groupedReports).map(([category, reports]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {reports.map(report => (
                      <button
                        key={report.id}
                        onClick={() => handleFilterChange('reportType', report.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          filters.reportType === report.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${report.color}`}>
                            <report.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {report.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {report.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="space-y-6">
            {/* Filtres de base */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Période */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Période
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {PERIODS.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Devise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise
                </label>
                <select
                  value={filters.currency}
                  onChange={(e) => handleFilterChange('currency', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Liquidité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplets className="h-4 w-4 inline mr-1" />
                  Liquidité
                </label>
                <select
                  value={filters.liquidityFilter}
                  onChange={(e) => handleFilterChange('liquidityFilter', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {LIQUIDITY_FILTERS.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Entités */}
            {entities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Entités ({filters.entities.length > 0 ? `${filters.entities.length} sélectionnée${filters.entities.length > 1 ? 's' : ''}` : 'Toutes'})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {entities.map(entity => (
                    <label key={entity.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.entities.includes(entity.id)}
                        onChange={() => handleEntityToggle(entity.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {entity.type === 'PHYSICAL_PERSON' ? '👤' : '🏢'} {entity.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Filtres avancés */}
            <div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                <span>Filtres avancés</span>
              </button>

              {showAdvancedFilters && (
                <div className="mt-4 space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="includeProjections"
                      checked={filters.includeProjections}
                      onChange={(e) => handleFilterChange('includeProjections', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeProjections" className="text-sm text-gray-700">
                      Inclure les projections
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="fiscalOptimization"
                      checked={filters.fiscalOptimization}
                      onChange={(e) => handleFilterChange('fiscalOptimization', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="fiscalOptimization" className="text-sm text-gray-700">
                      Optimisation fiscale
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Réinitialiser</span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Format d'export</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={onExportPDF}
                    disabled={isLoading}
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter en PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onExportExcel}
                    disabled={isLoading}
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exporter en Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onExportCSV}
                    disabled={isLoading}
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exporter en CSV
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={onPrint}
                    disabled={isLoading}
                    className="w-full justify-start"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer le rapport
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportNavigation; 