import React, { useState, useEffect, useRef, memo } from 'react';
import { useLazyReportComponent, useChartData } from '@/hooks/useOptimizedReports';
import { logger } from '@/lib/logger';

// Types
interface LazyChartProps {
  chartType: 'AssetDistributionChart' | 'AssetsByEntityChart' | 'PortfolioEvolutionChart' | 'PatrimoineChart' | 'ValuationTrendsChart';
  data: any;
  className?: string;
  rootMargin?: string;
  threshold?: number;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

// Placeholder par défaut
const DefaultPlaceholder = ({ height = 300 }: { height?: number }) => (
  <div 
    className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
    style={{ height }}
  >
    <div className="text-center">
      <div className="w-8 h-8 mx-auto mb-2 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      <p className="text-sm text-gray-500">Chargement du graphique...</p>
    </div>
  </div>
);

// Fallback d'erreur par défaut
const DefaultFallback = ({ error, height = 300 }: { error: string; height?: number }) => (
  <div 
    className="flex items-center justify-center bg-red-50 rounded-lg border-2 border-dashed border-red-200"
    style={{ height }}
  >
    <div className="text-center">
      <div className="w-8 h-8 mx-auto mb-2 text-red-500">
        ⚠️
      </div>
      <p className="text-sm text-red-600">Erreur de chargement</p>
      <p className="text-xs text-red-500 mt-1">{error}</p>
    </div>
  </div>
);

// Composant LazyChart principal
const LazyChart: React.FC<LazyChartProps> = memo(({
  chartType,
  data,
  className = '',
  rootMargin = '100px',
  threshold = 0.1,
  placeholder,
  fallback,
  onLoad,
  onError
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook pour charger le composant paresseusement
  const { Component, isLoading, error, loadComponent } = useLazyReportComponent(chartType);

  // Optimiser les données du graphique
  const optimizedData = useChartData(data, [data]);

  // Intersection Observer pour détecter la visibilité
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasBeenVisible) {
          setIsVisible(true);
          setHasBeenVisible(true);
          logger.debug(`Chart ${chartType} devient visible, démarrage du chargement`, undefined, 'LazyChart');
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [chartType, hasBeenVisible, rootMargin, threshold]);

  // Charger le composant quand il devient visible
  useEffect(() => {
    if (isVisible && !Component && !isLoading && !error) {
      loadComponent();
    }
  }, [isVisible, Component, isLoading, error, loadComponent]);

  // Callbacks
  useEffect(() => {
    if (Component && onLoad) {
      onLoad();
    }
  }, [Component, onLoad]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Rendu conditionnel
  const renderContent = () => {
    // Erreur de chargement
    if (error) {
      return fallback || <DefaultFallback error={error} />;
    }

    // Chargement en cours
    if (isLoading || !Component) {
      return placeholder || <DefaultPlaceholder />;
    }

    // Composant chargé avec succès
    return <Component data={optimizedData} />;
  };

  return (
    <div 
      ref={containerRef}
      className={`lazy-chart ${className}`}
      data-chart-type={chartType}
      data-visible={isVisible}
      data-loaded={!!Component}
    >
      {renderContent()}
    </div>
  );
});

LazyChart.displayName = 'LazyChart';

// Composant optimisé pour les graphiques de distribution
export const LazyAssetDistributionChart = memo(({ data, ...props }: Omit<LazyChartProps, 'chartType'>) => (
  <LazyChart chartType="AssetDistributionChart" data={data} {...props} />
));

// Composant optimisé pour les graphiques par entité
export const LazyAssetsByEntityChart = memo(({ data, ...props }: Omit<LazyChartProps, 'chartType'>) => (
  <LazyChart chartType="AssetsByEntityChart" data={data} {...props} />
));

// Composant optimisé pour l'évolution du portfolio
export const LazyPortfolioEvolutionChart = memo(({ data, ...props }: Omit<LazyChartProps, 'chartType'>) => (
  <LazyChart chartType="PortfolioEvolutionChart" data={data} {...props} />
));

// Composant optimisé pour le graphique patrimoine
export const LazyPatrimoineChart = memo(({ data, ...props }: Omit<LazyChartProps, 'chartType'>) => (
  <LazyChart chartType="PatrimoineChart" data={data} {...props} />
));

// Composant optimisé pour les tendances de valorisation
export const LazyValuationTrendsChart = memo(({ data, ...props }: Omit<LazyChartProps, 'chartType'>) => (
  <LazyChart chartType="ValuationTrendsChart" data={data} {...props} />
));

// Hook pour précharger les composants
export function usePreloadCharts(chartTypes: string[]) {
  const [preloadStatus, setPreloadStatus] = useState<Record<string, 'idle' | 'loading' | 'loaded' | 'error'>>({});

  const preloadChart = async (chartType: string) => {
    if (preloadStatus[chartType] === 'loading' || preloadStatus[chartType] === 'loaded') {
      return;
    }

    setPreloadStatus(prev => ({ ...prev, [chartType]: 'loading' }));

    try {
      switch (chartType) {
        case 'AssetDistributionChart':
          await import('@/components/charts/ReportsCharts');
          break;
        case 'AssetsByEntityChart':
          await import('@/components/charts/ReportsCharts');
          break;
        case 'PortfolioEvolutionChart':
          await import('@/components/charts/ReportsCharts');
          break;
        case 'PatrimoineChart':
          await import('@/components/charts/PatrimoineChart');
          break;
        case 'ValuationTrendsChart':
          await import('@/components/charts/ValuationTrendsChart');
          break;
        default:
          throw new Error(`Type de graphique inconnu: ${chartType}`);
      }

      setPreloadStatus(prev => ({ ...prev, [chartType]: 'loaded' }));
      logger.debug(`Chart ${chartType} préchargé avec succès`, undefined, 'usePreloadCharts');
    } catch (error) {
      setPreloadStatus(prev => ({ ...prev, [chartType]: 'error' }));
      logger.error(`Erreur lors du préchargement de ${chartType}`, error, 'usePreloadCharts');
    }
  };

  const preloadAll = async () => {
    await Promise.all(chartTypes.map(preloadChart));
  };

  return {
    preloadStatus,
    preloadChart,
    preloadAll
  };
}

// Composant pour les statistiques de performance des graphiques
export const ChartPerformanceStats = memo(() => {
  const [stats, setStats] = useState({
    totalCharts: 0,
    loadedCharts: 0,
    visibleCharts: 0,
    averageLoadTime: 0
  });

  useEffect(() => {
    const updateStats = () => {
      const lazyCharts = document.querySelectorAll('[data-chart-type]');
      const loadedCharts = document.querySelectorAll('[data-loaded="true"]');
      const visibleCharts = document.querySelectorAll('[data-visible="true"]');

      setStats({
        totalCharts: lazyCharts.length,
        loadedCharts: loadedCharts.length,
        visibleCharts: visibleCharts.length,
        averageLoadTime: 0 // Calculé côté cache
      });
    };

    // Mise à jour initiale
    updateStats();

    // Observer les changements DOM
    const observer = new MutationObserver(updateStats);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-loaded', 'data-visible']
    });

    return () => observer.disconnect();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // N'afficher qu'en développement
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
      <div className="font-medium mb-1">📊 Charts Performance</div>
      <div>Total: {stats.totalCharts}</div>
      <div>Loaded: {stats.loadedCharts}</div>
      <div>Visible: {stats.visibleCharts}</div>
      <div>Ratio: {stats.totalCharts > 0 ? ((stats.loadedCharts / stats.totalCharts) * 100).toFixed(1) : 0}%</div>
    </div>
  );
});

ChartPerformanceStats.displayName = 'ChartPerformanceStats';

// HOC pour optimiser automatiquement les graphiques
export function withLazyLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    rootMargin?: string;
    threshold?: number;
    placeholder?: React.ReactNode;
  } = {}
) {
  const LazyWrapper: React.FC<P> = (props) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && !hasBeenVisible) {
            setIsVisible(true);
            setHasBeenVisible(true);
          }
        },
        {
          rootMargin: options.rootMargin || '100px',
          threshold: options.threshold || 0.1
        }
      );

      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }, [hasBeenVisible]);

    return (
      <div ref={containerRef}>
        {isVisible ? (
          <WrappedComponent {...props} />
        ) : (
          options.placeholder || <DefaultPlaceholder />
        )}
      </div>
    );
  };

  LazyWrapper.displayName = `withLazyLoading(${WrappedComponent.displayName || WrappedComponent.name})`;

  return LazyWrapper;
}

export default LazyChart; 