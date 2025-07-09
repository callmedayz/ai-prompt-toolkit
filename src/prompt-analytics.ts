import { PromptVersion, TestExecution, PromptPerformanceMetrics } from './prompt-versioning';
import { OpenRouterClient } from './openrouter-client';
import { OpenRouterCompletion } from './openrouter-completion';
import { SupportedModel } from './types';

/**
 * Analytics data point for tracking prompt performance over time
 */
export interface AnalyticsDataPoint {
  timestamp: Date;
  promptVersionId: string;
  model: SupportedModel;
  metric: string;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Aggregated analytics for a specific time period
 */
export interface AnalyticsAggregation {
  period: 'hour' | 'day' | 'week' | 'month';
  startTime: Date;
  endTime: Date;
  promptVersionId: string;
  metrics: {
    totalExecutions: number;
    successRate: number;
    averageResponseTime: number;
    averageTokenUsage: number;
    averageCost: number;
    qualityScore?: number;
    errorRate: number;
    throughput: number; // executions per hour
  };
  trends: {
    responseTimeTrend: 'improving' | 'degrading' | 'stable';
    successRateTrend: 'improving' | 'degrading' | 'stable';
    costTrend: 'improving' | 'degrading' | 'stable';
  };
}

/**
 * Comparison analysis between different prompt versions
 */
export interface PromptComparison {
  baselineVersion: PromptVersion;
  comparisonVersions: PromptVersion[];
  metrics: {
    [versionId: string]: {
      version: PromptVersion;
      performance: PromptPerformanceMetrics;
      improvement: {
        responseTime: number; // percentage change
        successRate: number;
        cost: number;
        tokenUsage: number;
      };
      significance: number; // statistical significance (0-1)
    };
  };
  recommendation: {
    bestVersion: PromptVersion;
    reason: string;
    confidence: number;
  };
}

/**
 * Performance insights and recommendations
 */
export interface PerformanceInsights {
  promptVersionId: string;
  insights: {
    type: 'performance' | 'cost' | 'reliability' | 'optimization';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    recommendation: string;
    impact: string;
    confidence: number;
  }[];
  trends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    timeframe: string;
  }[];
  alerts: {
    type: 'threshold' | 'anomaly' | 'degradation';
    severity: 'warning' | 'critical';
    message: string;
    triggeredAt: Date;
    metric: string;
    value: number;
    threshold?: number;
  }[];
}

/**
 * Analytics configuration for monitoring and alerting
 */
export interface AnalyticsConfig {
  enableRealTimeMonitoring: boolean;
  aggregationIntervals: ('hour' | 'day' | 'week' | 'month')[];
  alertThresholds: {
    successRate: { warning: number; critical: number };
    responseTime: { warning: number; critical: number };
    errorRate: { warning: number; critical: number };
    cost: { warning: number; critical: number };
  };
  retentionPeriod: number; // days to keep analytics data
  enableTrendAnalysis: boolean;
  enableAnomalyDetection: boolean;
}

/**
 * Prompt Performance Analytics System
 */
export class PromptAnalytics {
  private dataPoints: AnalyticsDataPoint[] = [];
  private aggregations: Map<string, AnalyticsAggregation[]> = new Map();
  private config: AnalyticsConfig;
  private client?: OpenRouterClient;

  constructor(config?: Partial<AnalyticsConfig>, client?: OpenRouterClient) {
    this.config = {
      enableRealTimeMonitoring: true,
      aggregationIntervals: ['hour', 'day', 'week'],
      alertThresholds: {
        successRate: { warning: 85, critical: 70 },
        responseTime: { warning: 5000, critical: 10000 },
        errorRate: { warning: 10, critical: 20 },
        cost: { warning: 0.01, critical: 0.05 }
      },
      retentionPeriod: 90,
      enableTrendAnalysis: true,
      enableAnomalyDetection: true,
      ...config
    };
    this.client = client;
  }

  /**
   * Record a test execution for analytics
   */
  recordExecution(execution: TestExecution, model: SupportedModel): void {
    const timestamp = execution.timestamp;

    // Record individual metrics as data points
    this.addDataPoint({
      timestamp,
      promptVersionId: execution.promptVersionId,
      model,
      metric: 'response_time',
      value: execution.responseTime
    });

    this.addDataPoint({
      timestamp,
      promptVersionId: execution.promptVersionId,
      model,
      metric: 'token_usage',
      value: execution.tokenUsage
    });

    this.addDataPoint({
      timestamp,
      promptVersionId: execution.promptVersionId,
      model,
      metric: 'cost',
      value: execution.cost
    });

    this.addDataPoint({
      timestamp,
      promptVersionId: execution.promptVersionId,
      model,
      metric: 'success',
      value: execution.success ? 1 : 0
    });

    // Trigger real-time analysis if enabled
    if (this.config.enableRealTimeMonitoring) {
      this.performRealTimeAnalysis(execution.promptVersionId);
    }
  }

  /**
   * Add a custom analytics data point
   */
  addDataPoint(dataPoint: AnalyticsDataPoint): void {
    this.dataPoints.push(dataPoint);

    // Clean up old data points based on retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);

    this.dataPoints = this.dataPoints.filter(dp => dp.timestamp >= cutoffDate);
  }

  /**
   * Generate aggregated analytics for a prompt version
   */
  generateAggregation(
    promptVersionId: string,
    period: 'hour' | 'day' | 'week' | 'month',
    startTime?: Date,
    endTime?: Date
  ): AnalyticsAggregation {
    const now = new Date();
    const defaultEndTime = endTime || now;
    const defaultStartTime = startTime || this.getStartTimeForPeriod(period, defaultEndTime);

    const relevantDataPoints = this.dataPoints.filter(dp => 
      dp.promptVersionId === promptVersionId &&
      dp.timestamp >= defaultStartTime &&
      dp.timestamp <= defaultEndTime
    );

    const executions = this.groupExecutions(relevantDataPoints);
    const totalExecutions = executions.length;

    if (totalExecutions === 0) {
      return this.createEmptyAggregation(promptVersionId, period, defaultStartTime, defaultEndTime);
    }

    const successfulExecutions = executions.filter(e => e.success).length;
    const successRate = (successfulExecutions / totalExecutions) * 100;
    const errorRate = ((totalExecutions - successfulExecutions) / totalExecutions) * 100;

    const responseTimeSum = executions.reduce((sum, e) => sum + e.responseTime, 0);
    const tokenUsageSum = executions.reduce((sum, e) => sum + e.tokenUsage, 0);
    const costSum = executions.reduce((sum, e) => sum + e.cost, 0);

    const averageResponseTime = responseTimeSum / totalExecutions;
    const averageTokenUsage = tokenUsageSum / totalExecutions;
    const averageCost = costSum / totalExecutions;

    const periodHours = this.getPeriodHours(period);
    const throughput = totalExecutions / periodHours;

    // Calculate trends
    const trends = this.calculateTrends(promptVersionId, period, defaultStartTime);

    const aggregation: AnalyticsAggregation = {
      period,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      promptVersionId,
      metrics: {
        totalExecutions,
        successRate,
        averageResponseTime,
        averageTokenUsage,
        averageCost,
        errorRate,
        throughput
      },
      trends
    };

    // Store aggregation
    const key = `${promptVersionId}_${period}`;
    const existing = this.aggregations.get(key) || [];
    existing.push(aggregation);
    this.aggregations.set(key, existing);

    return aggregation;
  }

  /**
   * Compare performance between multiple prompt versions
   */
  compareVersions(
    baselineVersionId: string,
    comparisonVersionIds: string[],
    timeframe?: { start: Date; end: Date }
  ): PromptComparison {
    // This would be implemented with actual version data
    // For now, returning a placeholder structure
    throw new Error('compareVersions method needs to be implemented with actual version data');
  }

  /**
   * Generate performance insights and recommendations
   */
  generateInsights(promptVersionId: string): PerformanceInsights {
    const recentAggregations = this.getRecentAggregations(promptVersionId, 'day', 7);
    const insights: PerformanceInsights['insights'] = [];
    const trends: PerformanceInsights['trends'] = [];
    const alerts: PerformanceInsights['alerts'] = [];

    if (recentAggregations.length === 0) {
      return {
        promptVersionId,
        insights: [{
          type: 'performance',
          severity: 'low',
          title: 'Insufficient Data',
          description: 'Not enough data to generate meaningful insights',
          recommendation: 'Run more tests to gather performance data',
          impact: 'Cannot optimize without sufficient data',
          confidence: 0
        }],
        trends: [],
        alerts: []
      };
    }

    // Analyze performance trends
    const latestAggregation = recentAggregations[recentAggregations.length - 1];
    
    // Check for performance issues
    if (latestAggregation.metrics.successRate < this.config.alertThresholds.successRate.critical) {
      alerts.push({
        type: 'threshold',
        severity: 'critical',
        message: `Success rate (${latestAggregation.metrics.successRate.toFixed(1)}%) is below critical threshold`,
        triggeredAt: new Date(),
        metric: 'success_rate',
        value: latestAggregation.metrics.successRate,
        threshold: this.config.alertThresholds.successRate.critical
      });
    }

    if (latestAggregation.metrics.averageResponseTime > this.config.alertThresholds.responseTime.warning) {
      insights.push({
        type: 'performance',
        severity: latestAggregation.metrics.averageResponseTime > this.config.alertThresholds.responseTime.critical ? 'high' : 'medium',
        title: 'High Response Time',
        description: `Average response time is ${latestAggregation.metrics.averageResponseTime.toFixed(0)}ms`,
        recommendation: 'Consider optimizing prompt length or switching to a faster model',
        impact: 'Slower response times affect user experience',
        confidence: 0.8
      });
    }

    return {
      promptVersionId,
      insights,
      trends,
      alerts
    };
  }

  /**
   * Get analytics data for a specific time range
   */
  getAnalyticsData(
    promptVersionId: string,
    startTime: Date,
    endTime: Date,
    metrics?: string[]
  ): AnalyticsDataPoint[] {
    return this.dataPoints.filter(dp => 
      dp.promptVersionId === promptVersionId &&
      dp.timestamp >= startTime &&
      dp.timestamp <= endTime &&
      (!metrics || metrics.includes(dp.metric))
    );
  }

  /**
   * Export analytics data to JSON
   */
  exportAnalytics(): string {
    const data = {
      dataPoints: this.dataPoints,
      aggregations: Object.fromEntries(this.aggregations),
      config: this.config,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import analytics data from JSON
   */
  importAnalytics(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.dataPoints && Array.isArray(data.dataPoints)) {
        this.dataPoints = data.dataPoints.map((dp: any) => ({
          ...dp,
          timestamp: new Date(dp.timestamp)
        }));
      }

      if (data.aggregations) {
        this.aggregations = new Map(Object.entries(data.aggregations));
      }

      if (data.config) {
        this.config = { ...this.config, ...data.config };
      }
    } catch (error) {
      throw new Error(`Failed to import analytics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }



  private groupExecutions(dataPoints: AnalyticsDataPoint[]): Array<{
    responseTime: number;
    tokenUsage: number;
    cost: number;
    success: boolean;
  }> {
    const executionMap = new Map<string, any>();

    dataPoints.forEach(dp => {
      const key = `${dp.timestamp.getTime()}_${dp.promptVersionId}`;
      if (!executionMap.has(key)) {
        executionMap.set(key, {});
      }
      const execution = executionMap.get(key);
      
      switch (dp.metric) {
        case 'response_time':
          execution.responseTime = dp.value;
          break;
        case 'token_usage':
          execution.tokenUsage = dp.value;
          break;
        case 'cost':
          execution.cost = dp.value;
          break;
        case 'success':
          execution.success = dp.value === 1;
          break;
      }
    });

    return Array.from(executionMap.values()).filter(e => 
      e.responseTime !== undefined && 
      e.tokenUsage !== undefined && 
      e.cost !== undefined && 
      e.success !== undefined
    );
  }

  private getStartTimeForPeriod(period: string, endTime: Date): Date {
    const start = new Date(endTime);
    switch (period) {
      case 'hour':
        start.setHours(start.getHours() - 1);
        break;
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    return start;
  }

  private getPeriodHours(period: string): number {
    switch (period) {
      case 'hour': return 1;
      case 'day': return 24;
      case 'week': return 168;
      case 'month': return 720; // approximate
      default: return 24;
    }
  }

  private createEmptyAggregation(
    promptVersionId: string,
    period: 'hour' | 'day' | 'week' | 'month',
    startTime: Date,
    endTime: Date
  ): AnalyticsAggregation {
    return {
      period,
      startTime,
      endTime,
      promptVersionId,
      metrics: {
        totalExecutions: 0,
        successRate: 0,
        averageResponseTime: 0,
        averageTokenUsage: 0,
        averageCost: 0,
        errorRate: 0,
        throughput: 0
      },
      trends: {
        responseTimeTrend: 'stable',
        successRateTrend: 'stable',
        costTrend: 'stable'
      }
    };
  }

  private calculateTrends(
    promptVersionId: string,
    period: 'hour' | 'day' | 'week' | 'month',
    currentStartTime: Date
  ): AnalyticsAggregation['trends'] {
    // Get previous period for comparison
    const previousEndTime = new Date(currentStartTime);
    const previousStartTime = this.getStartTimeForPeriod(period, previousEndTime);
    
    const previousAggregation = this.generateAggregation(
      promptVersionId,
      period,
      previousStartTime,
      previousEndTime
    );

    const currentAggregation = this.generateAggregation(
      promptVersionId,
      period,
      currentStartTime
    );

    return {
      responseTimeTrend: this.getTrend(
        previousAggregation.metrics.averageResponseTime,
        currentAggregation.metrics.averageResponseTime,
        'lower_is_better'
      ),
      successRateTrend: this.getTrend(
        previousAggregation.metrics.successRate,
        currentAggregation.metrics.successRate,
        'higher_is_better'
      ),
      costTrend: this.getTrend(
        previousAggregation.metrics.averageCost,
        currentAggregation.metrics.averageCost,
        'lower_is_better'
      )
    };
  }

  private getTrend(
    previousValue: number,
    currentValue: number,
    direction: 'higher_is_better' | 'lower_is_better'
  ): 'improving' | 'degrading' | 'stable' {
    const threshold = 0.05; // 5% change threshold
    const change = (currentValue - previousValue) / previousValue;

    if (Math.abs(change) < threshold) {
      return 'stable';
    }

    if (direction === 'higher_is_better') {
      return change > 0 ? 'improving' : 'degrading';
    } else {
      return change < 0 ? 'improving' : 'degrading';
    }
  }

  private getRecentAggregations(
    promptVersionId: string,
    period: 'hour' | 'day' | 'week' | 'month',
    count: number
  ): AnalyticsAggregation[] {
    const key = `${promptVersionId}_${period}`;
    const aggregations = this.aggregations.get(key) || [];
    return aggregations.slice(-count);
  }

  private performRealTimeAnalysis(promptVersionId: string): void {
    // Generate insights and check for alerts
    const insights = this.generateInsights(promptVersionId);
    
    // In a real implementation, this would trigger notifications
    // or update dashboards in real-time
    if (insights.alerts.length > 0) {
      console.warn(`Analytics Alert for ${promptVersionId}:`, insights.alerts);
    }
  }
}
