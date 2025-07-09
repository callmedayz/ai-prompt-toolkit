import { PromptAnalytics, AnalyticsDataPoint, AnalyticsAggregation } from './prompt-analytics';
import { RealTimeDashboard } from './real-time-dashboard';
import { RealTimeMetric, LiveMonitoringEvent } from './types';

/**
 * Enhanced Analytics System with Real-time Monitoring
 * Extends the base PromptAnalytics with real-time capabilities
 */
export class EnhancedAnalytics extends PromptAnalytics {
  private dashboard: RealTimeDashboard;
  private anomalyDetector: AnomalyDetector;
  private alertManager: AlertManager;
  private isRealTimeEnabled: boolean = false;

  constructor(config?: any, client?: any) {
    super(config, client);
    this.dashboard = new RealTimeDashboard(this);
    this.anomalyDetector = new AnomalyDetector();
    this.alertManager = new AlertManager();
  }

  /**
   * Enable real-time monitoring
   */
  enableRealTimeMonitoring(): void {
    this.isRealTimeEnabled = true;
    this.dashboard.startMonitoring();
    console.log('🔴 Enhanced real-time monitoring enabled');
  }

  /**
   * Disable real-time monitoring
   */
  disableRealTimeMonitoring(): void {
    this.isRealTimeEnabled = false;
    this.dashboard.stopMonitoring();
    console.log('⏹️ Enhanced real-time monitoring disabled');
  }

  /**
   * Override recordExecution to add real-time features
   */
  recordExecution(execution: any, model: any): void {
    // Call parent method
    super.recordExecution(execution, model);

    if (!this.isRealTimeEnabled) return;

    // Update real-time metrics
    this.updateRealTimeMetrics(execution, model);

    // Check for anomalies
    this.checkForAnomalies(execution, model);

    // Update dashboard
    this.updateDashboardMetrics(execution, model);
  }

  /**
   * Get the dashboard instance
   */
  getDashboard(): RealTimeDashboard {
    return this.dashboard;
  }

  /**
   * Get real-time metrics summary
   */
  getRealTimeMetrics(): RealTimeMetric[] {
    return Array.from(this.dashboard['metrics'].values());
  }

  /**
   * Get live monitoring events
   */
  getLiveEvents(limit?: number, severity?: string): LiveMonitoringEvent[] {
    return this.dashboard.getEvents(limit, severity);
  }

  /**
   * Add custom monitoring event
   */
  addMonitoringEvent(event: Omit<LiveMonitoringEvent, 'id' | 'timestamp'>): void {
    this.dashboard.addEvent(event);
  }

  /**
   * Update real-time metrics based on execution
   */
  private updateRealTimeMetrics(execution: any, model: any): void {
    const now = new Date();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const recentExecutions = this.getRecentExecutions(execution.promptVersionId, timeWindow);

    // Calculate real-time metrics
    const totalExecutions = recentExecutions.length;
    const successfulExecutions = recentExecutions.filter(e => e.success).length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    
    const avgResponseTime = totalExecutions > 0 
      ? recentExecutions.reduce((sum, e) => sum + e.responseTime, 0) / totalExecutions 
      : 0;
    
    const avgCost = totalExecutions > 0 
      ? recentExecutions.reduce((sum, e) => sum + e.cost, 0) / totalExecutions 
      : 0;

    const errorRate = totalExecutions > 0 ? ((totalExecutions - successfulExecutions) / totalExecutions) * 100 : 0;

    // Update dashboard metrics
    this.dashboard.updateMetric('success_rate', successRate, { 
      unit: '%', 
      format: 'percentage',
      name: 'Success Rate'
    });

    this.dashboard.updateMetric('avg_response_time', avgResponseTime, { 
      unit: 'ms', 
      format: 'duration',
      name: 'Average Response Time'
    });

    this.dashboard.updateMetric('total_executions', totalExecutions, { 
      format: 'number',
      name: 'Total Executions (5m)'
    });

    this.dashboard.updateMetric('avg_cost', avgCost, { 
      unit: '$', 
      format: 'currency',
      name: 'Average Cost'
    });

    this.dashboard.updateMetric('error_rate', errorRate, { 
      unit: '%', 
      format: 'percentage',
      name: 'Error Rate'
    });

    // Calculate throughput (executions per hour)
    const throughput = (totalExecutions / 5) * 60; // Convert 5-minute window to hourly rate
    this.dashboard.updateMetric('throughput', throughput, { 
      unit: '/hr', 
      format: 'number',
      name: 'Throughput'
    });
  }

  /**
   * Check for anomalies in the execution
   */
  private checkForAnomalies(execution: any, model: any): void {
    const anomalies = this.anomalyDetector.detectAnomalies(execution, this.getHistoricalData(execution.promptVersionId));

    anomalies.forEach(anomaly => {
      this.dashboard.addEvent({
        type: 'anomaly',
        severity: anomaly.severity,
        title: `Anomaly Detected: ${anomaly.type}`,
        description: anomaly.description,
        promptVersionId: execution.promptVersionId,
        model: model,
        metadata: { anomaly }
      });
    });
  }

  /**
   * Update dashboard metrics
   */
  private updateDashboardMetrics(execution: any, model: any): void {
    // Check alert thresholds
    const alerts = this.alertManager.checkThresholds(execution, this.getRealTimeMetrics());
    
    alerts.forEach(alert => {
      this.dashboard.addEvent({
        type: 'alert',
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        promptVersionId: execution.promptVersionId,
        model: model,
        metadata: { alert }
      });
    });
  }

  /**
   * Get recent executions for real-time calculations
   */
  private getRecentExecutions(promptVersionId: string, timeWindow: number): any[] {
    const cutoff = new Date(Date.now() - timeWindow);
    
    // This would typically query a database or cache
    // For now, simulate with recent data points
    const recentDataPoints = this.getAnalyticsData(promptVersionId, cutoff, new Date());
    
    // Group data points by execution (simplified)
    const executionMap = new Map();
    
    recentDataPoints.forEach(dp => {
      const key = `${dp.timestamp.getTime()}_${dp.promptVersionId}`;
      if (!executionMap.has(key)) {
        executionMap.set(key, {
          promptVersionId: dp.promptVersionId,
          timestamp: dp.timestamp,
          responseTime: 0,
          cost: 0,
          success: false
        });
      }
      
      const execution = executionMap.get(key);
      if (dp.metric === 'response_time') execution.responseTime = dp.value;
      if (dp.metric === 'cost') execution.cost = dp.value;
      if (dp.metric === 'success') execution.success = dp.value === 1;
    });
    
    return Array.from(executionMap.values());
  }

  /**
   * Get historical data for anomaly detection
   */
  private getHistoricalData(promptVersionId: string): any[] {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.getAnalyticsData(promptVersionId, last24Hours, new Date());
  }
}

/**
 * Anomaly Detection System
 */
export class AnomalyDetector {
  private thresholds = {
    responseTime: { multiplier: 3, minSamples: 10 },
    cost: { multiplier: 2.5, minSamples: 10 },
    successRate: { threshold: 0.2, minSamples: 5 } // 20% drop
  };

  /**
   * Detect anomalies in execution data
   */
  detectAnomalies(execution: any, historicalData: any[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Response time anomaly detection
    const responseTimeAnomaly = this.detectResponseTimeAnomaly(execution, historicalData);
    if (responseTimeAnomaly) anomalies.push(responseTimeAnomaly);

    // Cost anomaly detection
    const costAnomaly = this.detectCostAnomaly(execution, historicalData);
    if (costAnomaly) anomalies.push(costAnomaly);

    // Success rate anomaly detection (requires multiple recent executions)
    const successRateAnomaly = this.detectSuccessRateAnomaly(execution, historicalData);
    if (successRateAnomaly) anomalies.push(successRateAnomaly);

    return anomalies;
  }

  private detectResponseTimeAnomaly(execution: any, historicalData: any[]): Anomaly | null {
    const responseTimes = historicalData
      .filter(dp => dp.metric === 'response_time')
      .map(dp => dp.value);

    if (responseTimes.length < this.thresholds.responseTime.minSamples) return null;

    const mean = responseTimes.reduce((sum, val) => sum + val, 0) / responseTimes.length;
    const variance = responseTimes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);

    const threshold = mean + (this.thresholds.responseTime.multiplier * stdDev);

    if (execution.responseTime > threshold) {
      return {
        type: 'response_time',
        severity: execution.responseTime > threshold * 1.5 ? 'high' : 'medium',
        description: `Response time ${execution.responseTime}ms is ${((execution.responseTime / mean - 1) * 100).toFixed(1)}% above average`,
        value: execution.responseTime,
        threshold,
        confidence: Math.min(0.95, (execution.responseTime - threshold) / threshold)
      };
    }

    return null;
  }

  private detectCostAnomaly(execution: any, historicalData: any[]): Anomaly | null {
    const costs = historicalData
      .filter(dp => dp.metric === 'cost')
      .map(dp => dp.value);

    if (costs.length < this.thresholds.cost.minSamples) return null;

    const mean = costs.reduce((sum, val) => sum + val, 0) / costs.length;
    const variance = costs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / costs.length;
    const stdDev = Math.sqrt(variance);

    const threshold = mean + (this.thresholds.cost.multiplier * stdDev);

    if (execution.cost > threshold) {
      return {
        type: 'cost',
        severity: execution.cost > threshold * 1.5 ? 'high' : 'medium',
        description: `Cost $${execution.cost.toFixed(4)} is ${((execution.cost / mean - 1) * 100).toFixed(1)}% above average`,
        value: execution.cost,
        threshold,
        confidence: Math.min(0.95, (execution.cost - threshold) / threshold)
      };
    }

    return null;
  }

  private detectSuccessRateAnomaly(execution: any, historicalData: any[]): Anomaly | null {
    // This would require analyzing recent success rate trends
    // For now, return null as it requires more complex logic
    return null;
  }
}

/**
 * Alert Management System
 */
export class AlertManager {
  private alertRules = [
    {
      id: 'high_response_time',
      metric: 'avg_response_time',
      threshold: 3000,
      severity: 'medium' as const,
      title: 'High Response Time',
      description: 'Average response time exceeds 3 seconds'
    },
    {
      id: 'low_success_rate',
      metric: 'success_rate',
      threshold: 85,
      operator: 'less_than' as const,
      severity: 'high' as const,
      title: 'Low Success Rate',
      description: 'Success rate has dropped below 85%'
    },
    {
      id: 'high_cost',
      metric: 'avg_cost',
      threshold: 0.01,
      severity: 'medium' as const,
      title: 'High Cost',
      description: 'Average cost per execution exceeds $0.01'
    }
  ];

  /**
   * Check alert thresholds
   */
  checkThresholds(execution: any, metrics: RealTimeMetric[]): Alert[] {
    const alerts: Alert[] = [];

    this.alertRules.forEach(rule => {
      const metric = metrics.find(m => m.id === rule.metric);
      if (!metric) return;

      const operator = rule.operator || 'greater_than';
      let triggered = false;

      if (operator === 'greater_than' && metric.value > rule.threshold) {
        triggered = true;
      } else if (operator === 'less_than' && metric.value < rule.threshold) {
        triggered = true;
      }

      if (triggered) {
        alerts.push({
          id: rule.id,
          severity: rule.severity,
          title: rule.title,
          description: `${rule.description} (Current: ${this.formatMetricValue(metric)})`,
          metric: rule.metric,
          threshold: rule.threshold,
          currentValue: metric.value
        });
      }
    });

    return alerts;
  }

  private formatMetricValue(metric: RealTimeMetric): string {
    switch (metric.format) {
      case 'percentage':
        return `${metric.value.toFixed(1)}%`;
      case 'currency':
        return `$${metric.value.toFixed(4)}`;
      case 'duration':
        return `${metric.value.toFixed(0)}ms`;
      default:
        return metric.value.toString();
    }
  }
}

// Supporting interfaces
interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  value: number;
  threshold: number;
  confidence: number;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
}
