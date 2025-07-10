import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  Layout, 
  Smartphone, 
  Tablet, 
  Monitor,
  Grid3X3,
  Rows3,
  Columns3,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

// Types
interface ResponsiveReportLayoutProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
  onLayoutChange?: (layout: LayoutMode) => void;
}

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
  isVisible: boolean;
  order: number;
  size?: 'small' | 'medium' | 'large' | 'full';
  breakpoint?: 'mobile' | 'tablet' | 'desktop';
}

type LayoutMode = 'grid' | 'column' | 'row' | 'masonry' | 'auto';
type ViewMode = 'desktop' | 'tablet' | 'mobile';

const ResponsiveReportLayout: React.FC<ResponsiveReportLayoutProps> = ({
  children,
  navigation,
  sidebar,
  className = '',
  onLayoutChange
}) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('auto');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Détection automatique de la taille d'écran
  useEffect(() => {
    const detectViewMode = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewMode('mobile');
        setSidebarVisible(false);
        setLayoutMode('column');
      } else if (width < 1024) {
        setViewMode('tablet');
        setSidebarVisible(false);
        setLayoutMode('grid');
      } else {
        setViewMode('desktop');
        setSidebarVisible(true);
        setLayoutMode('auto');
      }
    };

    detectViewMode();
    window.addEventListener('resize', detectViewMode);
    return () => window.removeEventListener('resize', detectViewMode);
  }, []);

  // Adaptation du layout selon le mode
  const getLayoutClasses = () => {
    const base = 'transition-all duration-300 ease-in-out';
    
    switch (layoutMode) {
      case 'grid':
        return `${base} grid gap-6 ${viewMode === 'mobile' ? 'grid-cols-1' : viewMode === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'}`;
      case 'column':
        return `${base} flex flex-col gap-6`;
      case 'row':
        return `${base} flex flex-row gap-6 overflow-x-auto`;
      case 'masonry':
        return `${base} columns-1 md:columns-2 lg:columns-3 gap-6`;
      default: // auto
        return `${base} grid gap-6 ${viewMode === 'mobile' ? 'grid-cols-1' : viewMode === 'tablet' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`;
    }
  };

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    onLayoutChange?.(mode);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Toolbar de contrôle du layout
  const LayoutControls = () => (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center space-x-1">
        <span className="text-xs font-medium text-gray-600">Layout:</span>
        
        <Button
          variant={layoutMode === 'auto' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('auto')}
          className="p-1"
        >
          <Layout className="h-3 w-3" />
        </Button>
        
        <Button
          variant={layoutMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('grid')}
          className="p-1"
        >
          <Grid3X3 className="h-3 w-3" />
        </Button>
        
        <Button
          variant={layoutMode === 'column' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('column')}
          className="p-1"
        >
          <Rows3 className="h-3 w-3" />
        </Button>
        
        <Button
          variant={layoutMode === 'row' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('row')}
          className="p-1"
        >
          <Columns3 className="h-3 w-3" />
        </Button>
      </div>

      <div className="h-4 w-px bg-gray-300" />

      <div className="flex items-center space-x-1">
        <span className="text-xs font-medium text-gray-600">Vue:</span>
        
        <Button
          variant={viewMode === 'desktop' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('desktop')}
          className="p-1"
        >
          <Monitor className="h-3 w-3" />
        </Button>
        
        <Button
          variant={viewMode === 'tablet' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('tablet')}
          className="p-1"
        >
          <Tablet className="h-3 w-3" />
        </Button>
        
        <Button
          variant={viewMode === 'mobile' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('mobile')}
          className="p-1"
        >
          <Smartphone className="h-3 w-3" />
        </Button>
      </div>

      <div className="h-4 w-px bg-gray-300" />

      <div className="flex items-center space-x-1">
        {sidebar && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="p-1"
          >
            {sidebarVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="p-1"
        >
          {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );

  // Composant pour une section de contenu responsive
  const ResponsiveSection = ({ 
    title, 
    children, 
    size = 'medium',
    className: sectionClassName = '' 
  }: {
    title: string;
    children: React.ReactNode;
    size?: 'small' | 'medium' | 'large' | 'full';
    className?: string;
  }) => {
    const getSizeClasses = () => {
      const baseClasses = 'break-inside-avoid';
      
      switch (size) {
        case 'small':
          return `${baseClasses} ${viewMode === 'mobile' ? 'col-span-1' : 'col-span-1'}`;
        case 'large':
          return `${baseClasses} ${viewMode === 'mobile' ? 'col-span-1' : viewMode === 'tablet' ? 'col-span-2' : 'col-span-2'}`;
        case 'full':
          return `${baseClasses} col-span-full`;
        default: // medium
          return `${baseClasses} ${viewMode === 'mobile' ? 'col-span-1' : 'col-span-1'}`;
      }
    };

    return (
      <Card className={`${getSizeClasses()} ${sectionClassName} transition-all duration-300`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-900 flex items-center justify-between">
            <span>{title}</span>
            <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
    );
  };

  return (
    <div ref={containerRef} className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Navigation sticky */}
      {navigation && (
        <div className="sticky top-0 z-50">
          {navigation}
        </div>
      )}

      {/* Contrôles de layout (uniquement en développement) */}
      {process.env.NODE_ENV === 'development' && <LayoutControls />}

      {/* Container principal avec sidebar conditionnel */}
      <div className="flex">
        {/* Sidebar */}
        {sidebar && sidebarVisible && (
          <aside className={`${
            viewMode === 'mobile' 
              ? 'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform'
              : 'w-64 flex-shrink-0'
          } transition-all duration-300`}>
            <div className="h-full overflow-y-auto border-r border-gray-200">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Contenu principal */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarVisible && sidebar && viewMode !== 'mobile' ? 'ml-0' : ''
        }`}>
          <div className="p-6">
            <div className={getLayoutClasses()}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Overlay pour mobile sidebar */}
      {viewMode === 'mobile' && sidebar && sidebarVisible && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      {/* Indicateur de mode responsive */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 px-3 py-1 bg-black text-white text-xs rounded-lg opacity-75">
          {viewMode} • {layoutMode}
        </div>
      )}
    </div>
  );
};

// Hook pour la gestion responsive
export function useResponsiveLayout() {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const updateViewMode = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      if (mobile) {
        setViewMode('mobile');
      } else if (tablet) {
        setViewMode('tablet');
      } else {
        setViewMode('desktop');
      }
    };

    updateViewMode();
    window.addEventListener('resize', updateViewMode);
    return () => window.removeEventListener('resize', updateViewMode);
  }, []);

  return {
    viewMode,
    isMobile,
    isTablet,
    isDesktop: viewMode === 'desktop'
  };
}

// Composants prêts à l'emploi pour les rapports

export const ReportSection = ({ 
  title, 
  children, 
  size = 'medium',
  className = '',
  icon,
  actions
}: {
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  className?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const { isMobile } = useResponsiveLayout();

  return (
    <Card className={`${className} transition-all duration-300 hover:shadow-md`}>
      <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
        <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            {icon && <span className="text-blue-600">{icon}</span>}
            <span>{title}</span>
          </div>
          {actions && <div className="flex items-center space-x-1">{actions}</div>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

export const ReportGrid = ({ 
  children, 
  columns = 'auto',
  gap = 6 
}: {
  children: React.ReactNode;
  columns?: 'auto' | 1 | 2 | 3 | 4;
  gap?: number;
}) => {
  const { viewMode } = useResponsiveLayout();
  
  const getGridClasses = () => {
    if (columns === 'auto') {
      switch (viewMode) {
        case 'mobile':
          return 'grid-cols-1';
        case 'tablet':
          return 'grid-cols-1 md:grid-cols-2';
        default:
          return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      }
    }
    
    const maxCols = viewMode === 'mobile' ? 1 : viewMode === 'tablet' ? Math.min(columns, 2) : columns;
    return `grid-cols-${maxCols}`;
  };

  return (
    <div className={`grid ${getGridClasses()} gap-${gap} transition-all duration-300`}>
      {children}
    </div>
  );
};

export const ReportMetrics = ({ 
  metrics 
}: {
  metrics: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
  }>;
}) => {
  const { isMobile } = useResponsiveLayout();

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
      {metrics.map((metric, index) => (
        <div 
          key={index}
          className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {metric.icon && <span className="text-gray-500">{metric.icon}</span>}
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                {metric.label}
              </span>
            </div>
            {metric.change && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                metric.trend === 'up' ? 'bg-green-100 text-green-700' :
                metric.trend === 'down' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {metric.change}
              </span>
            )}
          </div>
          <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 mt-1`}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResponsiveReportLayout; 