import { RealTimeDashboard } from '../src/real-time-dashboard';
import { EnhancedAnalytics } from '../src/enhanced-analytics';
import { PromptAnalytics } from '../src/prompt-analytics';
import { DashboardLayout, DashboardWidget } from '../src/types';

describe('RealTimeDashboard', () => {
  let analytics: PromptAnalytics;
  let dashboard: RealTimeDashboard;

  beforeEach(() => {
    analytics = new PromptAnalytics();
    dashboard = new RealTimeDashboard(analytics);
  });

  afterEach(() => {
    dashboard.stopMonitoring();
  });

  describe('dashboard layout management', () => {
    it('should create a new dashboard layout', () => {
      const layoutData = {
        name: 'Test Dashboard',
        description: 'Test dashboard for unit tests',
        autoRefresh: true,
        refreshInterval: 30,
        filters: [],
        widgets: []
      };

      const layoutId = dashboard.createLayout(layoutData);
      
      expect(layoutId).toBeDefined();
      expect(layoutId).toMatch(/^layout_/);
      
      const layout = dashboard.getLayout(layoutId);
      expect(layout).toBeDefined();
      expect(layout?.name).toBe('Test Dashboard');
      expect(layout?.autoRefresh).toBe(true);
    });

    it('should update existing dashboard layout', () => {
      const layoutId = dashboard.createLayout({
        name: 'Original Name',
        description: 'Original description',
        autoRefresh: false,
        refreshInterval: 60,
        filters: [],
        widgets: []
      });

      dashboard.updateLayout(layoutId, {
        name: 'Updated Name',
        autoRefresh: true,
        refreshInterval: 30
      });

      const layout = dashboard.getLayout(layoutId);
      expect(layout?.name).toBe('Updated Name');
      expect(layout?.autoRefresh).toBe(true);
      expect(layout?.refreshInterval).toBe(30);
      expect(layout?.description).toBe('Original description'); // Should remain unchanged
    });

    it('should get all available layouts', () => {
      const layouts = dashboard.getLayouts();
      
      // Should include default layouts
      expect(layouts.length).toBeGreaterThan(0);
      
      const performanceLayout = layouts.find(l => l.id === 'performance_overview');
      expect(performanceLayout).toBeDefined();
      expect(performanceLayout?.name).toBe('Performance Overview');
    });

    it('should throw error when updating non-existent layout', () => {
      expect(() => {
        dashboard.updateLayout('non-existent', { name: 'Test' });
      }).toThrow('Layout non-existent not found');
    });
  });

  describe('real-time monitoring', () => {
    it('should start and stop monitoring', () => {
      expect(dashboard['isMonitoring']).toBe(false);
      
      dashboard.startMonitoring();
      expect(dashboard['isMonitoring']).toBe(true);
      
      dashboard.stopMonitoring();
      expect(dashboard['isMonitoring']).toBe(false);
    });

    it('should handle multiple start/stop calls gracefully', () => {
      dashboard.startMonitoring();
      dashboard.startMonitoring(); // Should not cause issues
      expect(dashboard['isMonitoring']).toBe(true);
      
      dashboard.stopMonitoring();
      dashboard.stopMonitoring(); // Should not cause issues
      expect(dashboard['isMonitoring']).toBe(false);
    });
  });

  describe('widget data retrieval', () => {
    it('should get metric widget data', () => {
      const widget: DashboardWidget = {
        id: 'test_metric',
        type: 'metric',
        title: 'Test Metric',
        position: { x: 0, y: 0, width: 3, height: 2 },
        dataSource: 'analytics',
        config: { metric: 'successRate', format: 'percentage' }
      };

      const data = dashboard.getWidgetData(widget);
      
      expect(data).toBeDefined();
      expect(typeof data.value).toBe('number');
      expect(typeof data.change).toBe('number');
      expect(['up', 'down', 'stable']).toContain(data.trend);
      expect(['good', 'warning', 'critical']).toContain(data.status);
    });

    it('should get chart widget data', () => {
      const widget: DashboardWidget = {
        id: 'test_chart',
        type: 'chart',
        title: 'Test Chart',
        position: { x: 0, y: 0, width: 6, height: 4 },
        dataSource: 'analytics',
        config: { chartType: 'line', metric: 'response_time' }
      };

      const data = dashboard.getWidgetData(widget);
      
      expect(data).toBeDefined();
      expect(data.points).toBeDefined();
      expect(Array.isArray(data.points)).toBe(true);
      expect(data.points.length).toBeGreaterThan(0);
      
      // Check data point structure
      const point = data.points[0];
      expect(point.timestamp).toBeDefined();
      expect(typeof point.value).toBe('number');
    });

    it('should get table widget data', () => {
      const widget: DashboardWidget = {
        id: 'test_table',
        type: 'table',
        title: 'Test Table',
        position: { x: 0, y: 0, width: 6, height: 4 },
        dataSource: 'analytics',
        config: { columns: ['Version', 'Success Rate', 'Response Time'] }
      };

      const data = dashboard.getWidgetData(widget);
      
      expect(data).toBeDefined();
      expect(data.headers).toBeDefined();
      expect(data.rows).toBeDefined();
      expect(Array.isArray(data.headers)).toBe(true);
      expect(Array.isArray(data.rows)).toBe(true);
    });

    it('should return null for unknown widget type', () => {
      const widget: DashboardWidget = {
        id: 'test_unknown',
        type: 'unknown' as any,
        title: 'Unknown Widget',
        position: { x: 0, y: 0, width: 3, height: 2 },
        dataSource: 'analytics',
        config: {}
      };

      const data = dashboard.getWidgetData(widget);
      expect(data).toBeNull();
    });
  });

  describe('event management', () => {
    it('should add and retrieve events', () => {
      const event = {
        type: 'alert' as const,
        severity: 'medium' as const,
        title: 'Test Alert',
        description: 'This is a test alert',
        promptVersionId: 'test_prompt_v1'
      };

      dashboard.addEvent(event);
      
      const events = dashboard.getEvents(10);
      expect(events.length).toBe(1);
      
      const retrievedEvent = events[0];
      expect(retrievedEvent.title).toBe('Test Alert');
      expect(retrievedEvent.severity).toBe('medium');
      expect(retrievedEvent.id).toBeDefined();
      expect(retrievedEvent.timestamp).toBeDefined();
    });

    it('should filter events by severity', () => {
      dashboard.addEvent({
        type: 'alert',
        severity: 'low',
        title: 'Low Alert',
        description: 'Low severity alert'
      });

      dashboard.addEvent({
        type: 'alert',
        severity: 'critical',
        title: 'Critical Alert',
        description: 'Critical severity alert'
      });

      const criticalEvents = dashboard.getEvents(10, 'critical');
      expect(criticalEvents.length).toBe(1);
      expect(criticalEvents[0].title).toBe('Critical Alert');

      const lowEvents = dashboard.getEvents(10, 'low');
      expect(lowEvents.length).toBe(1);
      expect(lowEvents[0].title).toBe('Low Alert');
    });

    it('should limit number of stored events', () => {
      // Add more than 1000 events
      for (let i = 0; i < 1100; i++) {
        dashboard.addEvent({
          type: 'execution',
          severity: 'low',
          title: `Event ${i}`,
          description: `Test event ${i}`
        });
      }

      const events = dashboard.getEvents(2000); // Request more than stored
      expect(events.length).toBe(1000); // Should be limited to 1000
    });
  });

  describe('subscription system', () => {
    it('should subscribe and receive notifications', (done) => {
      const testData = { test: 'data' };
      
      const unsubscribe = dashboard.subscribe('test_channel', (data: any) => {
        expect(data).toEqual(testData);
        unsubscribe();
        done();
      });

      // Trigger notification
      dashboard['notifySubscribers']('test_channel', testData);
    });

    it('should handle multiple subscribers', () => {
      let callCount = 0;
      const testData = { test: 'data' };

      const unsubscribe1 = dashboard.subscribe('test_channel', () => callCount++);
      const unsubscribe2 = dashboard.subscribe('test_channel', () => callCount++);

      dashboard['notifySubscribers']('test_channel', testData);
      
      expect(callCount).toBe(2);
      
      unsubscribe1();
      unsubscribe2();
    });

    it('should unsubscribe correctly', () => {
      let callCount = 0;
      const testData = { test: 'data' };

      const unsubscribe = dashboard.subscribe('test_channel', () => callCount++);
      
      dashboard['notifySubscribers']('test_channel', testData);
      expect(callCount).toBe(1);
      
      unsubscribe();
      
      dashboard['notifySubscribers']('test_channel', testData);
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe('dashboard export/import', () => {
    it('should export dashboard configuration', () => {
      const layoutId = dashboard.createLayout({
        name: 'Export Test',
        description: 'Test layout for export',
        autoRefresh: true,
        refreshInterval: 30,
        filters: [],
        widgets: []
      });

      const exported = dashboard.exportDashboard(layoutId);
      const config = JSON.parse(exported);
      
      expect(config.layout).toBeDefined();
      expect(config.layout.name).toBe('Export Test');
      expect(config.layout.id).toBe(layoutId);
    });

    it('should export all layouts when no ID specified', () => {
      const exported = dashboard.exportDashboard();
      const config = JSON.parse(exported);
      
      expect(config.layouts).toBeDefined();
      expect(Array.isArray(config.layouts)).toBe(true);
      expect(config.layouts.length).toBeGreaterThan(0);
    });

    it('should import dashboard configuration', () => {
      const testLayout = {
        id: 'imported_layout',
        name: 'Imported Layout',
        description: 'Layout imported from config',
        autoRefresh: false,
        refreshInterval: 60,
        filters: [],
        widgets: []
      };

      const config = JSON.stringify({ layout: testLayout });
      dashboard.importDashboard(config);
      
      const imported = dashboard.getLayout('imported_layout');
      expect(imported).toBeDefined();
      expect(imported?.name).toBe('Imported Layout');
    });
  });
});

describe('EnhancedAnalytics', () => {
  let analytics: EnhancedAnalytics;

  beforeEach(() => {
    analytics = new EnhancedAnalytics();
  });

  afterEach(() => {
    analytics.disableRealTimeMonitoring();
  });

  describe('real-time monitoring', () => {
    it('should enable and disable real-time monitoring', () => {
      expect(analytics['isRealTimeEnabled']).toBe(false);
      
      analytics.enableRealTimeMonitoring();
      expect(analytics['isRealTimeEnabled']).toBe(true);
      
      analytics.disableRealTimeMonitoring();
      expect(analytics['isRealTimeEnabled']).toBe(false);
    });

    it('should get dashboard instance', () => {
      const dashboard = analytics.getDashboard();
      expect(dashboard).toBeDefined();
      expect(dashboard).toBeInstanceOf(RealTimeDashboard);
    });

    it('should record execution and update real-time metrics', () => {
      analytics.enableRealTimeMonitoring();
      
      const execution = {
        id: 'test_exec_1',
        promptVersionId: 'test_prompt_v1',
        input: 'Test input',
        output: 'Test output',
        responseTime: 1500,
        tokenUsage: 100,
        cost: 0.005,
        success: true,
        timestamp: new Date()
      };

      analytics.recordExecution(execution, 'openai/gpt-3.5-turbo');
      
      const metrics = analytics.getRealTimeMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      
      const successRateMetric = metrics.find(m => m.id === 'success_rate');
      expect(successRateMetric).toBeDefined();
      expect(successRateMetric?.value).toBeGreaterThanOrEqual(0);
    });

    it('should add custom monitoring events', () => {
      const event = {
        type: 'alert' as const,
        severity: 'medium' as const,
        title: 'Custom Event',
        description: 'This is a custom monitoring event'
      };

      analytics.addMonitoringEvent(event);
      
      const events = analytics.getLiveEvents(10);
      expect(events.length).toBe(1);
      expect(events[0].title).toBe('Custom Event');
    });
  });
});
