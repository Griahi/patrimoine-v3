import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  DashboardLayout, 
  UserBehavior, 
  Suggestion,
  WidgetConfig 
} from '@/types/dashboard';

// GET /api/dashboard/adaptive - Get user dashboard configuration
export async function GET(request: NextRequest) {
  try {
    // Check for fallback session first
    const fallbackSession = request.cookies.get('auth-session')?.value
    let userId: string | null = null;
    
    if (fallbackSession) {
      try {
        const sessionData = JSON.parse(fallbackSession)
        // Check if session hasn't expired
        const expiresAt = new Date(sessionData.expires)
        if (expiresAt > new Date()) {
          userId = sessionData.userId;
        }
      } catch (parseError) {
        console.warn('Failed to parse fallback session:', parseError)
      }
    }

    // If no fallback session, try regular session
    if (!userId) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = session.user.id;
    }

    // Get user behavior with fallback
    let userBehavior: UserBehavior;
    try {
      const behavior = await prisma.userBehavior.findFirst({
        where: { userId }
      });
      
      if (behavior) {
        userBehavior = {
          userId: behavior.userId,
          widgetInteractions: behavior.widgetInteractions ? 
            (typeof behavior.widgetInteractions === 'string' ? 
              JSON.parse(behavior.widgetInteractions) : 
              behavior.widgetInteractions) : {},
          sessionDuration: Number(behavior.sessionDuration) || 0,
          mostViewedWidgets: behavior.mostViewedWidgets ? 
            (typeof behavior.mostViewedWidgets === 'string' ? 
              JSON.parse(behavior.mostViewedWidgets) : 
              behavior.mostViewedWidgets) : [],
          leastViewedWidgets: behavior.leastViewedWidgets ? 
            (typeof behavior.leastViewedWidgets === 'string' ? 
              JSON.parse(behavior.leastViewedWidgets) : 
              behavior.leastViewedWidgets) : [],
          preferredLayout: (behavior.preferredLayout as 'extended' | 'compact' | 'custom') || 'extended',
          lastActiveDate: behavior.lastActiveDate || new Date(),
          totalSessions: behavior.totalSessions || 0,
          averageSessionTime: Number(behavior.averageSessionTime) || 0
        };
      } else {
        userBehavior = getDefaultBehavior(userId);
      }
    } catch (error) {
      console.warn('Failed to load user behavior, using defaults:', error);
      userBehavior = getDefaultBehavior(userId);
    }

    // Get active dashboard layout with fallback
    let layout: DashboardLayout;
    try {
      const activeLayout = await prisma.dashboardLayout.findFirst({
        where: { 
          userId, 
          isActive: true 
        }
      });

      if (activeLayout) {
        layout = {
          ...activeLayout,
          widgets: activeLayout.widgets ? 
            (typeof activeLayout.widgets === 'string' ? 
              JSON.parse(activeLayout.widgets) : 
              activeLayout.widgets) : [],
          breakpoints: activeLayout.breakpoints ? 
            (typeof activeLayout.breakpoints === 'string' ? 
              JSON.parse(activeLayout.breakpoints) : 
              activeLayout.breakpoints) : { lg: 1200, md: 996, sm: 768, xs: 480 },
          createdAt: activeLayout.createdAt,
          updatedAt: activeLayout.updatedAt
        };
      } else {
        layout = getDefaultLayout(userId);
      }
    } catch (error) {
      console.warn('Failed to load dashboard layout, using defaults:', error);
      layout = getDefaultLayout(userId);
    }

    // Get suggestions with fallback
    let suggestions: any[] = [];
    try {
      const dbSuggestions = await prisma.dashboardSuggestion.findMany({
        where: {
          userId,
          isDismissed: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      suggestions = dbSuggestions.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        description: s.description,
        impact: s.impact,
        confidence: s.confidence,
        data: s.data ? 
          (typeof s.data === 'string' ? 
            JSON.parse(s.data) : 
            s.data) : {},
        actions: s.actions ? 
          (typeof s.actions === 'string' ? 
            JSON.parse(s.actions) : 
            s.actions) : [],
        createdAt: s.createdAt,
        isRead: s.isRead,
        isDismissed: s.isDismissed
      }));
    } catch (error) {
      console.warn('Failed to load suggestions, using empty array:', error);
      suggestions = [];
    }

    return NextResponse.json({
      layout,
      behavior: userBehavior,
      suggestions
    });
  } catch (error) {
    console.error('Error getting adaptive dashboard:', error);
    // Return defaults even on error to prevent crashes
    return NextResponse.json({
      layout: getDefaultLayout('anonymous'),
      behavior: getDefaultBehavior('anonymous'),
      suggestions: []
    }, { status: 200 }); // 200 instead of 500 to prevent crashes
  }
}

// POST /api/dashboard/adaptive - Update dashboard configuration
export async function POST(request: NextRequest) {
  try {
    // Check for fallback session first
    const fallbackSession = request.cookies.get('auth-session')?.value
    let userId: string | null = null;
    
    if (fallbackSession) {
      try {
        const sessionData = JSON.parse(fallbackSession)
        // Check if session hasn't expired
        const expiresAt = new Date(sessionData.expires)
        if (expiresAt > new Date()) {
          userId = sessionData.userId;
        }
      } catch (parseError) {
        console.warn('Failed to parse fallback session:', parseError)
      }
    }

    // If no fallback session, try regular session
    if (!userId) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = session.user.id;
    }

    const body = await request.json();
    const { layout, behavior, action } = body;

    switch (action) {
      case 'save_layout':
        try {
          // Save or update layout
          const savedLayout = await prisma.dashboardLayout.upsert({
            where: {
              userId_name: {
                userId,
                name: layout.name || 'Mon Dashboard'
              }
            },
            update: {
              widgets: JSON.stringify(layout.widgets),
              breakpoints: JSON.stringify(layout.breakpoints),
              updatedAt: new Date()
            },
            create: {
              userId,
              name: layout.name || 'Mon Dashboard',
              widgets: JSON.stringify(layout.widgets),
              breakpoints: JSON.stringify(layout.breakpoints),
              isActive: true,
              isDefault: false
            }
          });

          return NextResponse.json({ success: true, layout: savedLayout });
        } catch (error) {
          console.warn('Failed to save layout:', error);
          return NextResponse.json({ success: false, error: 'Failed to save layout' });
        }

      case 'update_behavior':
        try {
          // Update user behavior directly
          await prisma.userBehavior.upsert({
            where: { userId },
            update: {
              widgetInteractions: JSON.stringify(behavior.widgetInteractions || {}),
              sessionDuration: behavior.sessionDuration || 0,
              mostViewedWidgets: JSON.stringify(behavior.mostViewedWidgets || []),
              leastViewedWidgets: JSON.stringify(behavior.leastViewedWidgets || []),
              preferredLayout: behavior.preferredLayout || 'extended',
              lastActiveDate: new Date(),
              totalSessions: behavior.totalSessions || 0,
              averageSessionTime: behavior.averageSessionTime || 0,
              updatedAt: new Date()
            },
            create: {
              userId,
              widgetInteractions: JSON.stringify(behavior.widgetInteractions || {}),
              sessionDuration: behavior.sessionDuration || 0,
              mostViewedWidgets: JSON.stringify(behavior.mostViewedWidgets || []),
              leastViewedWidgets: JSON.stringify(behavior.leastViewedWidgets || []),
              preferredLayout: behavior.preferredLayout || 'extended',
              lastActiveDate: new Date(),
              totalSessions: behavior.totalSessions || 0,
              averageSessionTime: behavior.averageSessionTime || 0,
              preferences: JSON.stringify({})
            }
          });
        
          return NextResponse.json({ success: true });
        } catch (error) {
          console.warn('Failed to update behavior:', error);
          return NextResponse.json({ success: false, error: 'Failed to update behavior' });
        }

      case 'track_interaction':
        try {
          // Track widget interaction
          const { widgetId, actionType, params } = behavior;
          if (widgetId && actionType) {
            await prisma.widgetInteraction.create({
              data: {
                userId,
                widgetId,
                action: actionType,
                metadata: JSON.stringify(params || {}),
                timestamp: new Date()
              }
            });
          }

          return NextResponse.json({ success: true });
        } catch (error) {
          console.warn('Failed to track interaction:', error);
          return NextResponse.json({ success: false, error: 'Failed to track interaction' });
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating adaptive dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Request failed' },
      { status: 200 } // Return 200 to prevent crashes
    );
  }
}

// Helper function to get default behavior
function getDefaultBehavior(userId: string): UserBehavior {
  return {
    userId,
    widgetInteractions: {},
    sessionDuration: 0,
    mostViewedWidgets: [],
    leastViewedWidgets: [],
    preferredLayout: 'extended',
    lastActiveDate: new Date(),
    totalSessions: 0,
    averageSessionTime: 0
  };
}

// Helper function to get default layout
function getDefaultLayout(userId: string): DashboardLayout {
  return {
    id: 'default',
    userId,
    name: 'Layout par défaut',
    widgets: [
      {
        id: 'patrimony-overview',
        type: 'patrimony-overview',
        title: 'Vue d\'ensemble du patrimoine',
        description: 'Aperçu global de votre patrimoine',
        position: { x: 0, y: 0, w: 6, h: 4 },
        priority: 1,
        isVisible: true,
        config: { showChart: true, showMetrics: true, period: '1Y' },
        minSize: { w: 4, h: 3 },
        maxSize: { w: 12, h: 8 },
        resizable: true,
        draggable: true
      },
      {
        id: 'performance-chart',
        type: 'performance-chart',
        title: 'Performance',
        description: 'Graphique de performance de vos actifs',
        position: { x: 6, y: 0, w: 6, h: 4 },
        priority: 2,
        isVisible: true,
        config: { period: '6M', showBenchmark: true, chartType: 'line' },
        minSize: { w: 4, h: 3 },
        maxSize: { w: 12, h: 8 },
        resizable: true,
        draggable: true
      },
      {
        id: 'quick-actions',
        type: 'quick-actions',
        title: 'Actions rapides',
        description: 'Raccourcis vers les actions fréquentes',
        position: { x: 0, y: 4, w: 4, h: 3 },
        priority: 3,
        isVisible: true,
        config: { maxActions: 6, showRecent: true },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 6, h: 4 },
        resizable: true,
        draggable: true
      },
      {
        id: 'recent-activity',
        type: 'recent-activity',
        title: 'Activité récente',
        description: 'Dernières transactions et modifications',
        position: { x: 4, y: 4, w: 4, h: 3 },
        priority: 4,
        isVisible: true,
        config: { maxItems: 5, showDates: true },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 6, h: 4 },
        resizable: true,
        draggable: true
      },
      {
        id: 'alerts',
        type: 'alerts',
        title: 'Alertes',
        description: 'Notifications et alertes importantes',
        position: { x: 8, y: 4, w: 4, h: 3 },
        priority: 5,
        isVisible: true,
        config: { maxAlerts: 5, showSeverity: true },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 8, h: 6 },
        resizable: true,
        draggable: true
      }
    ],
    breakpoints: {
      lg: 1200,
      md: 996,
      sm: 768,
      xs: 480
    },
    isActive: true,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
} 