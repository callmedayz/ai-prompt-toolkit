import {
  PromptVersionManager,
  PromptAnalytics,
  AnalyticsConfig,
  TestExecution,
  OpenRouterClient
} from '../src/index';

/**
 * Example: Prompt Performance Analytics
 * 
 * This example demonstrates how to:
 * 1. Set up analytics tracking for prompt performance
 * 2. Record test executions and generate metrics
 * 3. Analyze trends and generate insights
 * 4. Set up alerts and monitoring
 * 5. Export/import analytics data
 */

async function promptAnalyticsExample() {
  console.log('📊 Prompt Performance Analytics Example\n');

  // Initialize analytics with custom configuration
  const analyticsConfig: Partial<AnalyticsConfig> = {
    enableRealTimeMonitoring: true,
    aggregationIntervals: ['hour', 'day', 'week'],
    alertThresholds: {
      successRate: { warning: 90, critical: 80 },
      responseTime: { warning: 3000, critical: 5000 },
      errorRate: { warning: 5, critical: 10 },
      cost: { warning: 0.005, critical: 0.01 }
    },
    retentionPeriod: 30, // 30 days
    enableTrendAnalysis: true,
    enableAnomalyDetection: true
  };

  // For real API analytics, uncomment the next line
  // const client = OpenRouterClient.fromEnv();
  // const analytics = new PromptAnalytics(analyticsConfig, client);
  const analytics = new PromptAnalytics(analyticsConfig);

  console.log('⚙️ Example 1: Setting Up Analytics Tracking');
  console.log('✅ Analytics system initialized with custom thresholds');
  console.log(`📈 Monitoring intervals: ${analyticsConfig.aggregationIntervals?.join(', ')}`);
  console.log(`⚠️ Success rate alerts: Warning <${analyticsConfig.alertThresholds?.successRate.warning}%, Critical <${analyticsConfig.alertThresholds?.successRate.critical}%`);
  console.log(`⏱️ Response time alerts: Warning >${analyticsConfig.alertThresholds?.responseTime.warning}ms, Critical >${analyticsConfig.alertThresholds?.responseTime.critical}ms\n`);

  console.log('📝 Example 2: Recording Test Executions');
  
  // Create some sample prompt versions for tracking
  const versionManager = new PromptVersionManager();
  const promptV1 = versionManager.createVersion(
    'customer-support',
    'Help the customer with: {issue}',
    {},
    { description: 'Basic customer support prompt' }
  );

  const promptV2 = versionManager.createVersion(
    'customer-support',
    'As a helpful customer support specialist, please provide a detailed and empathetic response to: {issue}',
    {},
    { description: 'Enhanced customer support prompt' }
  );

  // Simulate test executions with different performance characteristics
  const simulateExecution = (
    promptVersionId: string,
    baseResponseTime: number,
    baseSuccessRate: number,
    baseCost: number
  ): TestExecution => {
    const variance = 0.2; // 20% variance
    const responseTime = baseResponseTime * (1 + (Math.random() - 0.5) * variance);
    const success = Math.random() < baseSuccessRate;
    const cost = baseCost * (1 + (Math.random() - 0.5) * variance);
    
    return {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      promptVersionId,
      input: 'Sample customer issue',
      output: success ? 'Helpful response' : '',
      responseTime: Math.round(responseTime),
      tokenUsage: Math.round(cost * 1000), // Approximate tokens from cost
      cost: parseFloat(cost.toFixed(6)),
      success,
      timestamp: new Date()
    };
  };

  // Record executions for both versions
  console.log('🔄 Simulating test executions...');
  
  // V1: Faster but less reliable
  for (let i = 0; i < 50; i++) {
    const execution = simulateExecution(promptV1.id, 1500, 0.85, 0.003);
    analytics.recordExecution(execution, 'openai/gpt-3.5-turbo');
    
    // Add some time variance
    execution.timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
  }

  // V2: Slower but more reliable
  for (let i = 0; i < 50; i++) {
    const execution = simulateExecution(promptV2.id, 2500, 0.95, 0.005);
    analytics.recordExecution(execution, 'openai/gpt-3.5-turbo');
    
    // Add some time variance
    execution.timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
  }

  console.log(`✅ Recorded 100 test executions (50 per version)\n`);

  console.log('📈 Example 3: Generating Analytics Aggregations');
  
  // Generate daily aggregations for both versions
  const v1DailyAggregation = analytics.generateAggregation(promptV1.id, 'day');
  const v2DailyAggregation = analytics.generateAggregation(promptV2.id, 'day');

  console.log('📊 Version 1 (Basic) - Daily Metrics:');
  console.log(`  • Total Executions: ${v1DailyAggregation.metrics.totalExecutions}`);
  console.log(`  • Success Rate: ${v1DailyAggregation.metrics.successRate.toFixed(1)}%`);
  console.log(`  • Avg Response Time: ${v1DailyAggregation.metrics.averageResponseTime.toFixed(0)}ms`);
  console.log(`  • Avg Cost: $${v1DailyAggregation.metrics.averageCost.toFixed(6)}`);
  console.log(`  • Throughput: ${v1DailyAggregation.metrics.throughput.toFixed(1)} exec/hour`);
  console.log(`  • Trends: Response Time ${v1DailyAggregation.trends.responseTimeTrend}, Success Rate ${v1DailyAggregation.trends.successRateTrend}`);

  console.log('\n📊 Version 2 (Enhanced) - Daily Metrics:');
  console.log(`  • Total Executions: ${v2DailyAggregation.metrics.totalExecutions}`);
  console.log(`  • Success Rate: ${v2DailyAggregation.metrics.successRate.toFixed(1)}%`);
  console.log(`  • Avg Response Time: ${v2DailyAggregation.metrics.averageResponseTime.toFixed(0)}ms`);
  console.log(`  • Avg Cost: $${v2DailyAggregation.metrics.averageCost.toFixed(6)}`);
  console.log(`  • Throughput: ${v2DailyAggregation.metrics.throughput.toFixed(1)} exec/hour`);
  console.log(`  • Trends: Response Time ${v2DailyAggregation.trends.responseTimeTrend}, Success Rate ${v2DailyAggregation.trends.successRateTrend}\n`);

  console.log('🔍 Example 4: Performance Insights and Recommendations');
  
  // Generate insights for both versions
  const v1Insights = analytics.generateInsights(promptV1.id);
  const v2Insights = analytics.generateInsights(promptV2.id);

  console.log('💡 Version 1 Insights:');
  v1Insights.insights.forEach(insight => {
    const severityIcon = insight.severity === 'high' ? '🔴' : insight.severity === 'medium' ? '🟡' : '🟢';
    console.log(`  ${severityIcon} ${insight.title}: ${insight.description}`);
    console.log(`     💡 Recommendation: ${insight.recommendation}`);
    console.log(`     📊 Confidence: ${(insight.confidence * 100).toFixed(0)}%`);
  });

  console.log('\n💡 Version 2 Insights:');
  v2Insights.insights.forEach(insight => {
    const severityIcon = insight.severity === 'high' ? '🔴' : insight.severity === 'medium' ? '🟡' : '🟢';
    console.log(`  ${severityIcon} ${insight.title}: ${insight.description}`);
    console.log(`     💡 Recommendation: ${insight.recommendation}`);
    console.log(`     📊 Confidence: ${(insight.confidence * 100).toFixed(0)}%`);
  });

  // Check for alerts
  const allAlerts = [...v1Insights.alerts, ...v2Insights.alerts];
  if (allAlerts.length > 0) {
    console.log('\n🚨 Active Alerts:');
    allAlerts.forEach(alert => {
      const severityIcon = alert.severity === 'critical' ? '🔴' : '🟡';
      console.log(`  ${severityIcon} ${alert.type.toUpperCase()}: ${alert.message}`);
      console.log(`     📊 Metric: ${alert.metric}, Value: ${alert.value}`);
      if (alert.threshold) {
        console.log(`     🎯 Threshold: ${alert.threshold}`);
      }
    });
  } else {
    console.log('\n✅ No active alerts - all metrics within acceptable ranges');
  }

  console.log('\n📊 Example 5: Time-Series Analytics');
  
  // Get analytics data for specific time ranges
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now = new Date();
  
  const v1TimeSeriesData = analytics.getAnalyticsData(promptV1.id, last24Hours, now, ['response_time', 'success']);
  const v2TimeSeriesData = analytics.getAnalyticsData(promptV2.id, last24Hours, now, ['response_time', 'success']);

  console.log(`📈 Version 1 - Data Points (Last 24h): ${v1TimeSeriesData.length}`);
  console.log(`📈 Version 2 - Data Points (Last 24h): ${v2TimeSeriesData.length}`);

  // Calculate average response times
  const v1ResponseTimes = v1TimeSeriesData.filter(dp => dp.metric === 'response_time').map(dp => dp.value);
  const v2ResponseTimes = v2TimeSeriesData.filter(dp => dp.metric === 'response_time').map(dp => dp.value);

  if (v1ResponseTimes.length > 0 && v2ResponseTimes.length > 0) {
    const v1AvgResponseTime = v1ResponseTimes.reduce((sum, time) => sum + time, 0) / v1ResponseTimes.length;
    const v2AvgResponseTime = v2ResponseTimes.reduce((sum, time) => sum + time, 0) / v2ResponseTimes.length;
    
    console.log(`⏱️ Version 1 Avg Response Time: ${v1AvgResponseTime.toFixed(0)}ms`);
    console.log(`⏱️ Version 2 Avg Response Time: ${v2AvgResponseTime.toFixed(0)}ms`);
    
    const improvement = ((v1AvgResponseTime - v2AvgResponseTime) / v1AvgResponseTime * 100);
    if (improvement > 0) {
      console.log(`📉 Version 2 is ${improvement.toFixed(1)}% slower than Version 1`);
    } else {
      console.log(`📈 Version 2 is ${Math.abs(improvement).toFixed(1)}% faster than Version 1`);
    }
  }

  console.log('\n💾 Example 6: Export/Import Analytics Data');
  
  // Export analytics data
  const exportedData = analytics.exportAnalytics();
  console.log('✅ Analytics data exported to JSON');
  console.log(`📦 Export size: ${(exportedData.length / 1024).toFixed(1)}KB`);

  // Create new analytics instance and import data
  const newAnalytics = new PromptAnalytics();
  newAnalytics.importAnalytics(exportedData);
  console.log('✅ Analytics data imported to new instance');

  // Verify import by generating aggregation
  const importedAggregation = newAnalytics.generateAggregation(promptV1.id, 'day');
  console.log(`📊 Imported data verification: ${importedAggregation.metrics.totalExecutions} executions found\n`);

  console.log('🎯 Example 7: Performance Comparison Summary');
  
  console.log('📋 Version Comparison:');
  console.log('┌─────────────────────┬─────────────┬─────────────┐');
  console.log('│ Metric              │ Version 1   │ Version 2   │');
  console.log('├─────────────────────┼─────────────┼─────────────┤');
  console.log(`│ Success Rate        │ ${v1DailyAggregation.metrics.successRate.toFixed(1)}%        │ ${v2DailyAggregation.metrics.successRate.toFixed(1)}%        │`);
  console.log(`│ Avg Response Time   │ ${v1DailyAggregation.metrics.averageResponseTime.toFixed(0)}ms       │ ${v2DailyAggregation.metrics.averageResponseTime.toFixed(0)}ms       │`);
  console.log(`│ Avg Cost           │ $${v1DailyAggregation.metrics.averageCost.toFixed(6)}  │ $${v2DailyAggregation.metrics.averageCost.toFixed(6)}  │`);
  console.log(`│ Error Rate         │ ${v1DailyAggregation.metrics.errorRate.toFixed(1)}%        │ ${v2DailyAggregation.metrics.errorRate.toFixed(1)}%        │`);
  console.log('└─────────────────────┴─────────────┴─────────────┘');

  // Determine winner
  const v1Score = (v1DailyAggregation.metrics.successRate * 0.4) + 
                  ((5000 - v1DailyAggregation.metrics.averageResponseTime) / 50) + 
                  ((0.01 - v1DailyAggregation.metrics.averageCost) * 1000);
  
  const v2Score = (v2DailyAggregation.metrics.successRate * 0.4) + 
                  ((5000 - v2DailyAggregation.metrics.averageResponseTime) / 50) + 
                  ((0.01 - v2DailyAggregation.metrics.averageCost) * 1000);

  const winner = v2Score > v1Score ? 'Version 2 (Enhanced)' : 'Version 1 (Basic)';
  const confidence = Math.abs(v2Score - v1Score) / Math.max(v1Score, v2Score) * 100;

  console.log(`\n🏆 Recommended Version: ${winner}`);
  console.log(`📊 Confidence: ${confidence.toFixed(1)}%`);
  console.log(`💡 Reason: ${v2Score > v1Score ? 'Higher success rate outweighs slower response time' : 'Faster response time compensates for lower success rate'}`);

  console.log('\n✨ Prompt Performance Analytics Example Complete!');
  console.log('\n🔗 Next Steps:');
  console.log('1. Set up real-time monitoring dashboards');
  console.log('2. Configure automated alerts for performance degradation');
  console.log('3. Implement A/B testing with analytics integration');
  console.log('4. Use insights to continuously optimize prompts');
  console.log('5. Set up regular performance reviews and reports');
}

// Run the example
if (require.main === module) {
  promptAnalyticsExample().catch(console.error);
}

export { promptAnalyticsExample };
