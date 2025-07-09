import { PromptAnalytics, AnalyticsDataPoint, AnalyticsAggregation } from './prompt-analytics';
import { 
  DashboardWidget, 
  DashboardLayout, 
  DashboardFilter, 
  RealTimeMetric, 
  LiveMonitoringEvent 
} from './types';

/**
 * Real-time Dashboard System for Prompt Performance Monitoring
 * Provides live dashboards, real-time metrics, and monitoring capabilities
 */
export class RealTimeDashboard {
  private analytics: PromptAnalytics;
  private layouts: Map<string, DashboardLayout> = new Map();
  private metrics: Map<string, RealTimeMetric> = new Map();
  private events: LiveMonitoringEvent[] = [];
  private subscribers: Map<string, Function[]> = new Map();
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isMonitoring: boolean = false;

  constructor(analytics: PromptAnalytics) {
    this.analytics = analytics;
    this.initializeDefaultLayouts();
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Start monitoring for all active layouts
    this.layouts.forEach((layout, layoutId) => {
      if (layout.autoRefresh) {
        this.startLayoutRefresh(layoutId);
      }
    });

    console.log('🔴 Real-time dashboard monitoring started');
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Clear all refresh intervals
    this.refreshIntervals.forEach(interval => clearInterval(interval));
    this.refreshIntervals.clear();

    console.log('⏹️ Real-time dashboard monitoring stopped');
  }

  /**
   * Create a new dashboard layout
   */
  createLayout(layout: Omit<DashboardLayout, 'id'>): string {
    const id = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullLayout: DashboardLayout = { id, ...layout };
    
    this.layouts.set(id, fullLayout);
    
    if (fullLayout.autoRefresh && this.isMonitoring) {
      this.startLayoutRefresh(id);
    }
    
    return id;
  }

  /**
   * Get dashboard layout by ID
   */
  getLayout(layoutId: string): DashboardLayout | undefined {
    return this.layouts.get(layoutId);
  }

  /**
   * Update dashboard layout
   */
  updateLayout(layoutId: string, updates: Partial<DashboardLayout>): void {
    const layout = this.layouts.get(layoutId);
    if (!layout) throw new Error(`Layout ${layoutId} not found`);
    
    const updatedLayout = { ...layout, ...updates };
    this.layouts.set(layoutId, updatedLayout);
    
    // Restart refresh if needed
    if (this.isMonitoring) {
      this.stopLayoutRefresh(layoutId);
      if (updatedLayout.autoRefresh) {
        this.startLayoutRefresh(layoutId);
      }
    }
    
    this.notifySubscribers(`layout:${layoutId}`, updatedLayout);
  }

  /**
   * Get real-time metrics for a widget
   */
  getWidgetData(widget: DashboardWidget, filters: DashboardFilter[] = []): any {
    switch (widget.type) {
      case 'metric':
        return this.getMetricData(widget, filters);
      case 'chart':
        return this.getChartData(widget, filters);
      case 'table':
        return this.getTableData(widget, filters);
      case 'alert':
        return this.getAlertData(widget, filters);
      case 'trend':
        return this.getTrendData(widget, filters);
      default:
        return null;
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(channel: string, callback: Function): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    
    this.subscribers.get(channel)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(channel);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Add a live monitoring event
   */
  addEvent(event: Omit<LiveMonitoringEvent, 'id' | 'timestamp'>): void {
    const fullEvent: LiveMonitoringEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };
    
    this.events.unshift(fullEvent);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }
    
    this.notifySubscribers('events', fullEvent);
    
    // Trigger alerts if critical
    if (fullEvent.severity === 'critical') {
      this.notifySubscribers('alerts', fullEvent);
    }
  }

  /**
   * Get recent events
   */
  getEvents(limit: number = 50, severity?: string): LiveMonitoringEvent[] {
    let filteredEvents = this.events;
    
    if (severity) {
      filteredEvents = this.events.filter(event => event.severity === severity);
    }
    
    return filteredEvents.slice(0, limit);
  }

  /**
   * Update a real-time metric
   */
  updateMetric(metricId: string, value: number, metadata?: Record<string, any>): void {
    const existing = this.metrics.get(metricId);
    const previousValue = existing?.value;
    
    let change = 0;
    let changePercent = 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    
    if (previousValue !== undefined) {
      change = value - previousValue;
      changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
      
      if (Math.abs(changePercent) < 1) {
        trend = 'stable';
      } else {
        trend = change > 0 ? 'up' : 'down';
      }
    }
    
    const metric: RealTimeMetric = {
      id: metricId,
      name: existing?.name || metricId,
      value,
      previousValue,
      change,
      changePercent,
      trend,
      status: this.calculateMetricStatus(metricId, value),
      timestamp: new Date(),
      unit: existing?.unit,
      format: existing?.format,
      ...metadata
    };
    
    this.metrics.set(metricId, metric);
    this.notifySubscribers(`metric:${metricId}`, metric);
  }

  /**
   * Get all available layouts
   */
  getLayouts(): DashboardLayout[] {
    return Array.from(this.layouts.values());
  }

  /**
   * Export dashboard configuration
   */
  exportDashboard(layoutId?: string): string {
    const data = layoutId 
      ? { layout: this.layouts.get(layoutId) }
      : { layouts: Array.from(this.layouts.values()) };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import dashboard configuration
   */
  importDashboard(configJson: string): void {
    const config = JSON.parse(configJson);
    
    if (config.layout) {
      this.layouts.set(config.layout.id, config.layout);
    } else if (config.layouts) {
      config.layouts.forEach((layout: DashboardLayout) => {
        this.layouts.set(layout.id, layout);
      });
    }
  }

  /**
   * Initialize default dashboard layouts
   */
  private initializeDefaultLayouts(): void {
    // Performance Overview Dashboard
    const performanceLayout: DashboardLayout = {
      id: 'performance_overview',
      name: 'Performance Overview',
      description: 'Real-time overview of prompt performance metrics',
      autoRefresh: true,
      refreshInterval: 30, // 30 seconds
      filters: [
        {
          id: 'timeRange',
          type: 'timeRange',
          label: 'Time Range',
          value: '1h',
          options: ['15m', '1h', '6h', '24h', '7d']
        }
      ],
      widgets: [
        {
          id: 'success_rate',
          type: 'metric',
          title: 'Success Rate',
          position: { x: 0, y: 0, width: 3, height: 2 },
          dataSource: 'analytics',
          config: { metric: 'successRate', format: 'percentage' }
        },
        {
          id: 'avg_response_time',
          type: 'metric',
          title: 'Avg Response Time',
          position: { x: 3, y: 0, width: 3, height: 2 },
          dataSource: 'analytics',
          config: { metric: 'averageResponseTime', format: 'duration', unit: 'ms' }
        },
        {
          id: 'total_executions',
          type: 'metric',
          title: 'Total Executions',
          position: { x: 6, y: 0, width: 3, height: 2 },
          dataSource: 'analytics',
          config: { metric: 'totalExecutions', format: 'number' }
        },
        {
          id: 'avg_cost',
          type: 'metric',
          title: 'Avg Cost',
          position: { x: 9, y: 0, width: 3, height: 2 },
          dataSource: 'analytics',
          config: { metric: 'averageCost', format: 'currency' }
        },
        {
          id: 'response_time_chart',
          type: 'chart',
          title: 'Response Time Trend',
          position: { x: 0, y: 2, width: 6, height: 4 },
          dataSource: 'analytics',
          config: { 
            chartType: 'line',
            metric: 'response_time',
            timeWindow: '1h'
          }
        },
        {
          id: 'success_rate_chart',
          type: 'chart',
          title: 'Success Rate Trend',
          position: { x: 6, y: 2, width: 6, height: 4 },
          dataSource: 'analytics',
          config: { 
            chartType: 'line',
            metric: 'success',
            timeWindow: '1h'
          }
        },
        {
          id: 'recent_alerts',
          type: 'alert',
          title: 'Recent Alerts',
          position: { x: 0, y: 6, width: 12, height: 3 },
          dataSource: 'events',
          config: { 
            maxItems: 10,
            severityFilter: ['medium', 'high', 'critical']
          }
        }
      ]
    };

    this.layouts.set(performanceLayout.id, performanceLayout);

    // Cost Analysis Dashboard
    const costLayout: DashboardLayout = {
      id: 'cost_analysis',
      name: 'Cost Analysis',
      description: 'Monitor and analyze prompt execution costs',
      autoRefresh: true,
      refreshInterval: 60, // 1 minute
      filters: [
        {
          id: 'timeRange',
          type: 'timeRange',
          label: 'Time Range',
          value: '24h',
          options: ['1h', '6h', '24h', '7d', '30d']
        },
        {
          id: 'model',
          type: 'model',
          label: 'Model',
          value: 'all',
          options: ['all', 'gpt-4', 'gpt-3.5-turbo', 'claude-3']
        }
      ],
      widgets: [
        {
          id: 'total_cost',
          type: 'metric',
          title: 'Total Cost',
          position: { x: 0, y: 0, width: 4, height: 2 },
          dataSource: 'analytics',
          config: { metric: 'totalCost', format: 'currency' }
        },
        {
          id: 'cost_per_execution',
          type: 'metric',
          title: 'Cost per Execution',
          position: { x: 4, y: 0, width: 4, height: 2 },
          dataSource: 'analytics',
          config: { metric: 'averageCost', format: 'currency' }
        },
        {
          id: 'cost_trend',
          type: 'trend',
          title: 'Cost Trend',
          position: { x: 8, y: 0, width: 4, height: 2 },
          dataSource: 'analytics',
          config: { metric: 'cost', period: '24h' }
        }
      ]
    };

    this.layouts.set(costLayout.id, costLayout);
  }

  /**
   * Start refresh interval for a layout
   */
  private startLayoutRefresh(layoutId: string): void {
    const layout = this.layouts.get(layoutId);
    if (!layout) return;
    
    const interval = setInterval(() => {
      this.refreshLayout(layoutId);
    }, layout.refreshInterval * 1000);
    
    this.refreshIntervals.set(layoutId, interval);
  }

  /**
   * Stop refresh interval for a layout
   */
  private stopLayoutRefresh(layoutId: string): void {
    const interval = this.refreshIntervals.get(layoutId);
    if (interval) {
      clearInterval(interval);
      this.refreshIntervals.delete(layoutId);
    }
  }

  /**
   * Refresh data for a layout
   */
  private refreshLayout(layoutId: string): void {
    const layout = this.layouts.get(layoutId);
    if (!layout) return;
    
    // Update metrics for each widget
    layout.widgets.forEach(widget => {
      const data = this.getWidgetData(widget, layout.filters);
      this.notifySubscribers(`widget:${widget.id}`, data);
    });
    
    this.notifySubscribers(`layout:${layoutId}:refresh`, { layoutId, timestamp: new Date() });
  }

  /**
   * Get metric data for a widget
   */
  private getMetricData(widget: DashboardWidget, filters: DashboardFilter[]): any {
    // Implementation would fetch real data from analytics
    // For now, return mock data structure
    return {
      value: Math.random() * 100,
      change: (Math.random() - 0.5) * 10,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      status: Math.random() > 0.7 ? 'good' : Math.random() > 0.3 ? 'warning' : 'critical'
    };
  }

  /**
   * Get chart data for a widget
   */
  private getChartData(widget: DashboardWidget, filters: DashboardFilter[]): any {
    // Implementation would fetch time-series data from analytics
    const points = [];
    const now = Date.now();
    
    for (let i = 0; i < 24; i++) {
      points.push({
        timestamp: new Date(now - (23 - i) * 60 * 60 * 1000),
        value: Math.random() * 100
      });
    }
    
    return { points };
  }

  /**
   * Get table data for a widget
   */
  private getTableData(widget: DashboardWidget, filters: DashboardFilter[]): any {
    // Implementation would fetch tabular data from analytics
    return {
      headers: ['Prompt Version', 'Success Rate', 'Avg Response Time', 'Cost'],
      rows: [
        ['v1.0', '95%', '1.2s', '$0.003'],
        ['v1.1', '97%', '1.1s', '$0.004'],
        ['v2.0', '93%', '1.5s', '$0.002']
      ]
    };
  }

  /**
   * Get alert data for a widget
   */
  private getAlertData(widget: DashboardWidget, filters: DashboardFilter[]): any {
    const severityFilter = widget.config.severityFilter || [];
    const maxItems = widget.config.maxItems || 10;
    
    return this.getEvents(maxItems).filter(event => 
      severityFilter.length === 0 || severityFilter.includes(event.severity)
    );
  }

  /**
   * Get trend data for a widget
   */
  private getTrendData(widget: DashboardWidget, filters: DashboardFilter[]): any {
    // Implementation would calculate trends from analytics data
    return {
      current: Math.random() * 100,
      previous: Math.random() * 100,
      change: (Math.random() - 0.5) * 20,
      trend: Math.random() > 0.5 ? 'improving' : 'degrading'
    };
  }

  /**
   * Calculate metric status based on thresholds
   */
  private calculateMetricStatus(metricId: string, value: number): 'good' | 'warning' | 'critical' {
    // This would use configurable thresholds
    // For now, use simple logic
    if (metricId.includes('success') || metricId.includes('rate')) {
      return value > 90 ? 'good' : value > 70 ? 'warning' : 'critical';
    } else if (metricId.includes('time') || metricId.includes('cost')) {
      return value < 1000 ? 'good' : value < 3000 ? 'warning' : 'critical';
    }
    
    return 'good';
  }

  /**
   * Notify subscribers of updates
   */
  private notifySubscribers(channel: string, data: any): void {
    const callbacks = this.subscribers.get(channel);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber callback for ${channel}:`, error);
        }
      });
    }
  }
}
