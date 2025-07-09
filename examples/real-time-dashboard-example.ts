import {
  EnhancedAnalytics,
  RealTimeDashboard,
  DashboardLayout,
  DashboardWidget,
  OpenRouterClient
} from '../src/index';

/**
 * Real-time Dashboard Example (v2.6.0)
 * Demonstrates real-time prompt performance monitoring with live dashboards
 */

async function realTimeDashboardExample() {
  console.log('📊 Real-time Dashboard Example (v2.6.0)\n');

  // Example 1: Initialize Enhanced Analytics with Real-time Monitoring
  console.log('1️⃣ Setting up Enhanced Analytics with Real-time Monitoring:');
  
  const analytics = new EnhancedAnalytics({
    enableRealTimeMonitoring: true,
    aggregationIntervals: ['hour', 'day'],
    alertThresholds: {
      successRate: { warning: 90, critical: 80 },
      responseTime: { warning: 2000, critical: 5000 },
      errorRate: { warning: 5, critical: 15 },
      cost: { warning: 0.005, critical: 0.015 }
    },
    retentionPeriod: 30,
    enableTrendAnalysis: true,
    enableAnomalyDetection: true
  });

  // Enable real-time monitoring
  analytics.enableRealTimeMonitoring();
  
  const dashboard = analytics.getDashboard();
  console.log('✅ Enhanced analytics and real-time dashboard initialized');
  console.log(`📋 Available layouts: ${dashboard.getLayouts().length}`);
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 2: Create Custom Dashboard Layout
  console.log('2️⃣ Creating Custom Dashboard Layout:');
  
  const customLayoutId = dashboard.createLayout({
    name: 'AI Model Performance Monitor',
    description: 'Custom dashboard for monitoring AI model performance across different prompts',
    autoRefresh: true,
    refreshInterval: 15, // 15 seconds
    filters: [
      {
        id: 'timeRange',
        type: 'timeRange',
        label: 'Time Range',
        value: '1h',
        options: ['15m', '1h', '6h', '24h']
      },
      {
        id: 'promptVersion',
        type: 'promptVersion',
        label: 'Prompt Version',
        value: 'all',
        options: ['all', 'v1.0', 'v1.1', 'v2.0']
      }
    ],
    widgets: [
      {
        id: 'live_success_rate',
        type: 'metric',
        title: 'Live Success Rate',
        position: { x: 0, y: 0, width: 3, height: 2 },
        dataSource: 'analytics',
        refreshInterval: 5,
        config: { 
          metric: 'successRate', 
          format: 'percentage',
          thresholds: { warning: 90, critical: 80 }
        }
      },
      {
        id: 'response_time_gauge',
        type: 'metric',
        title: 'Response Time',
        position: { x: 3, y: 0, width: 3, height: 2 },
        dataSource: 'analytics',
        refreshInterval: 5,
        config: { 
          metric: 'averageResponseTime', 
          format: 'duration',
          unit: 'ms',
          thresholds: { warning: 2000, critical: 5000 }
        }
      },
      {
        id: 'throughput_meter',
        type: 'metric',
        title: 'Throughput',
        position: { x: 6, y: 0, width: 3, height: 2 },
        dataSource: 'analytics',
        refreshInterval: 10,
        config: { 
          metric: 'throughput', 
          format: 'number',
          unit: '/hr'
        }
      },
      {
        id: 'cost_tracker',
        type: 'metric',
        title: 'Cost per Hour',
        position: { x: 9, y: 0, width: 3, height: 2 },
        dataSource: 'analytics',
        refreshInterval: 30,
        config: { 
          metric: 'hourlyCost', 
          format: 'currency'
        }
      },
      {
        id: 'performance_timeline',
        type: 'chart',
        title: 'Performance Timeline',
        position: { x: 0, y: 2, width: 8, height: 4 },
        dataSource: 'analytics',
        refreshInterval: 30,
        config: { 
          chartType: 'multi-line',
          metrics: ['response_time', 'success_rate'],
          timeWindow: '1h',
          showTrend: true
        }
      },
      {
        id: 'model_comparison',
        type: 'table',
        title: 'Model Comparison',
        position: { x: 8, y: 2, width: 4, height: 4 },
        dataSource: 'analytics',
        refreshInterval: 60,
        config: { 
          columns: ['Model', 'Success Rate', 'Avg Time', 'Cost'],
          sortBy: 'Success Rate',
          maxRows: 10
        }
      },
      {
        id: 'live_alerts',
        type: 'alert',
        title: 'Live Alerts & Anomalies',
        position: { x: 0, y: 6, width: 12, height: 3 },
        dataSource: 'events',
        refreshInterval: 5,
        config: { 
          maxItems: 8,
          severityFilter: ['medium', 'high', 'critical'],
          showAnomalies: true,
          autoScroll: true
        }
      }
    ]
  });

  console.log(`✅ Custom dashboard layout created: ${customLayoutId}`);
  console.log('📊 Dashboard widgets configured:');
  const customLayout = dashboard.getLayout(customLayoutId);
  customLayout?.widgets.forEach(widget => {
    console.log(`   - ${widget.title} (${widget.type})`);
  });
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 3: Simulate Real-time Data and Monitor Dashboard
  console.log('3️⃣ Simulating Real-time Data and Monitoring:');
  
  // Subscribe to real-time updates
  const unsubscribeMetrics = dashboard.subscribe('metric:success_rate', (metric) => {
    console.log(`📈 Success Rate Update: ${metric.value.toFixed(1)}% (${metric.trend})`);
  });

  const unsubscribeAlerts = dashboard.subscribe('alerts', (event) => {
    console.log(`🚨 ALERT: ${event.title} - ${event.description}`);
  });

  const unsubscribeAnomalies = dashboard.subscribe('events', (event) => {
    if (event.type === 'anomaly') {
      console.log(`⚠️ ANOMALY: ${event.title} - ${event.description}`);
    }
  });

  // Simulate prompt executions with varying performance
  console.log('🔄 Starting real-time simulation...');
  
  const promptVersionId = 'prompt_v2_realtime';
  let executionCount = 0;

  const simulationInterval = setInterval(() => {
    executionCount++;
    
    // Simulate different performance scenarios
    let responseTime, success, cost;
    
    if (executionCount % 20 === 0) {
      // Simulate performance degradation every 20 executions
      responseTime = 4000 + Math.random() * 2000; // High response time
      success = Math.random() > 0.3; // Lower success rate
      cost = 0.008 + Math.random() * 0.005; // Higher cost
    } else if (executionCount % 15 === 0) {
      // Simulate anomaly
      responseTime = 8000 + Math.random() * 2000; // Very high response time
      success = Math.random() > 0.1; // Much lower success rate
      cost = 0.015 + Math.random() * 0.01; // Very high cost
    } else {
      // Normal performance
      responseTime = 1000 + Math.random() * 1000;
      success = Math.random() > 0.05; // 95% success rate
      cost = 0.003 + Math.random() * 0.002;
    }

    const execution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      promptVersionId,
      input: `Test input ${executionCount}`,
      output: success ? `Response ${executionCount}` : '',
      responseTime: Math.round(responseTime),
      tokenUsage: Math.round(cost * 1000),
      cost: parseFloat(cost.toFixed(6)),
      success,
      timestamp: new Date()
    };

    // Record execution (this will trigger real-time updates)
    analytics.recordExecution(execution, 'openai/gpt-3.5-turbo');

    if (executionCount >= 50) {
      clearInterval(simulationInterval);
      console.log('\n✅ Real-time simulation completed');
      
      // Clean up subscriptions
      unsubscribeMetrics();
      unsubscribeAlerts();
      unsubscribeAnomalies();
      
      showDashboardSummary();
    }
  }, 1000); // Execute every second

  function showDashboardSummary() {
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('4️⃣ Dashboard Summary and Analytics:');
    
    // Get real-time metrics
    const metrics = analytics.getRealTimeMetrics();
    console.log('📊 Current Real-time Metrics:');
    metrics.forEach(metric => {
      const changeIndicator = metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️';
      const statusIndicator = metric.status === 'good' ? '✅' : metric.status === 'warning' ? '⚠️' : '🚨';
      console.log(`   ${statusIndicator} ${metric.name}: ${formatMetricValue(metric)} ${changeIndicator}`);
    });

    // Get recent events
    const events = analytics.getLiveEvents(10);
    console.log(`\n🔔 Recent Events (${events.length}):`);
    events.slice(0, 5).forEach(event => {
      const severityIcon = event.severity === 'critical' ? '🚨' : event.severity === 'high' ? '⚠️' : event.severity === 'medium' ? '🟡' : 'ℹ️';
      console.log(`   ${severityIcon} [${event.type.toUpperCase()}] ${event.title}`);
    });

    // Dashboard statistics
    const layouts = dashboard.getLayouts();
    console.log(`\n📋 Dashboard Statistics:`);
    console.log(`   - Total Layouts: ${layouts.length}`);
    console.log(`   - Total Widgets: ${layouts.reduce((sum, layout) => sum + layout.widgets.length, 0)}`);
    console.log(`   - Active Monitoring: ${analytics['isRealTimeEnabled'] ? 'Enabled' : 'Disabled'}`);

    console.log('\n' + '='.repeat(80) + '\n');
    console.log('5️⃣ Export Dashboard Configuration:');
    
    // Export dashboard configuration
    const dashboardConfig = dashboard.exportDashboard();
    console.log('✅ Dashboard configuration exported');
    console.log(`📦 Config size: ${(dashboardConfig.length / 1024).toFixed(1)}KB`);
    
    // Show sample of exported config
    const configPreview = JSON.parse(dashboardConfig);
    console.log(`📊 Exported ${configPreview.layouts.length} dashboard layouts`);
    
    console.log('\n🎉 Real-time Dashboard Example Complete!');
    console.log('\n📚 Features Demonstrated:');
    console.log('✅ Real-time performance monitoring');
    console.log('✅ Custom dashboard layouts and widgets');
    console.log('✅ Live metric updates and subscriptions');
    console.log('✅ Anomaly detection and alerting');
    console.log('✅ Performance threshold monitoring');
    console.log('✅ Dashboard configuration export/import');
    console.log('✅ Multi-widget dashboard composition');
    
    // Stop monitoring
    analytics.disableRealTimeMonitoring();
  }

  function formatMetricValue(metric: any): string {
    switch (metric.format) {
      case 'percentage':
        return `${metric.value.toFixed(1)}%`;
      case 'currency':
        return `$${metric.value.toFixed(4)}`;
      case 'duration':
        return `${metric.value.toFixed(0)}ms`;
      default:
        return metric.value.toFixed(2);
    }
  }
}

// Run the example
if (require.main === module) {
  realTimeDashboardExample().catch(console.error);
}

export { realTimeDashboardExample };
