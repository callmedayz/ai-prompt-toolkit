import {
  PromptVersionManager,
  PromptAnalytics,
  AutoPromptOptimizer,
  AutoOptimizationConfig,
  OptimizationStrategy,
  TestExecution,
  OpenRouterClient
} from '../src/index';

/**
 * Example: Auto-Prompt Optimization
 * 
 * This example demonstrates how to:
 * 1. Set up automatic prompt optimization
 * 2. Analyze prompts for optimization opportunities
 * 3. Generate AI-powered optimization recommendations
 * 4. Apply optimizations and evaluate results
 * 5. Run continuous optimization workflows
 */

async function autoOptimizationExample() {
  console.log('🤖 Auto-Prompt Optimization Example\n');

  // Initialize the system components
  const versionManager = new PromptVersionManager();
  const analytics = new PromptAnalytics();
  
  // For real API optimization, uncomment the next line
  // const client = OpenRouterClient.fromEnv();
  // const optimizer = new AutoPromptOptimizer(versionManager, analytics, config, client);

  // Configure optimization settings
  const optimizationConfig: Partial<AutoOptimizationConfig> = {
    optimizationModel: 'tencent/hunyuan-a13b-instruct:free',
    targetMetrics: {
      successRate: { target: 95, weight: 0.4 },
      responseTime: { target: 2000, weight: 0.3 },
      cost: { target: 0.005, weight: 0.2 },
      tokenUsage: { target: 500, weight: 0.1 }
    },
    optimizationStrategies: [
      'clarity_improvement',
      'conciseness_optimization',
      'specificity_enhancement',
      'instruction_refinement'
    ],
    maxIterations: 3,
    minSampleSize: 25,
    confidenceThreshold: 0.75,
    enableContinuousOptimization: true,
    optimizationInterval: 12 // Every 12 hours
  };

  const optimizer = new AutoPromptOptimizer(versionManager, analytics, optimizationConfig);

  console.log('⚙️ Example 1: Setting Up Auto-Optimization');
  console.log('✅ Auto-optimizer initialized with configuration:');
  console.log(`📊 Target Metrics: Success Rate ${optimizationConfig.targetMetrics?.successRate?.target}%, Response Time <${optimizationConfig.targetMetrics?.responseTime?.target}ms`);
  console.log(`🎯 Strategies: ${optimizationConfig.optimizationStrategies?.join(', ')}`);
  console.log(`🔄 Continuous Optimization: ${optimizationConfig.enableContinuousOptimization ? 'Enabled' : 'Disabled'}`);
  console.log(`⏰ Optimization Interval: ${optimizationConfig.optimizationInterval} hours\n`);

  console.log('📝 Example 2: Creating Prompt Versions with Performance Issues');
  
  // Create a prompt version with potential optimization opportunities
  const problematicPrompt = versionManager.createVersion(
    'email-responder',
    'Please write an email response to the customer inquiry about their order status. Make sure to be professional and helpful. The customer wrote: {customer_message}. Please provide a detailed response that addresses their concerns and provides relevant information about their order.',
    { customer_message: 'Where is my order?' },
    {
      description: 'Basic email response prompt - potentially verbose',
      tags: ['email', 'customer-service', 'needs-optimization']
    }
  );

  console.log(`✅ Created prompt version: ${problematicPrompt.name} v${problematicPrompt.version}`);
  console.log(`📝 Template: "${problematicPrompt.template}"`);
  console.log(`📊 Template length: ${problematicPrompt.template.length} characters\n`);

  console.log('📊 Example 3: Simulating Performance Data');
  
  // Simulate poor performance data for the prompt
  const simulateTestExecution = (success: boolean, responseTime: number, cost: number): TestExecution => ({
    id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    promptVersionId: problematicPrompt.id,
    input: 'Where is my order?',
    output: success ? 'Professional email response' : '',
    responseTime,
    tokenUsage: Math.round(cost * 1000),
    cost,
    success,
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
  });

  // Simulate 30 test executions with suboptimal performance
  console.log('🔄 Simulating 30 test executions with performance issues...');
  for (let i = 0; i < 30; i++) {
    const execution = simulateTestExecution(
      Math.random() < 0.82, // 82% success rate (below target)
      1800 + Math.random() * 1400, // 1800-3200ms response time (some above target)
      0.006 + Math.random() * 0.004 // $0.006-0.010 cost (above target)
    );
    analytics.recordExecution(execution, 'openai/gpt-3.5-turbo');
  }

  // Generate performance aggregation
  const aggregation = analytics.generateAggregation(problematicPrompt.id, 'day');
  console.log('📈 Performance Summary:');
  console.log(`  • Success Rate: ${aggregation.metrics.successRate.toFixed(1)}% (Target: 95%)`);
  console.log(`  • Avg Response Time: ${aggregation.metrics.averageResponseTime.toFixed(0)}ms (Target: <2000ms)`);
  console.log(`  • Avg Cost: $${aggregation.metrics.averageCost.toFixed(6)} (Target: <$0.005)`);
  console.log(`  • Total Executions: ${aggregation.metrics.totalExecutions}\n`);

  console.log('🔍 Example 4: Analyzing for Optimization Opportunities');
  
  // Analyze the prompt for optimization opportunities
  const recommendations = await optimizer.analyzeForOptimization(problematicPrompt.id);
  
  console.log(`💡 Found ${recommendations.length} optimization recommendations:`);
  recommendations.forEach((rec, index) => {
    const priorityIcon = rec.priority === 'critical' ? '🔴' : rec.priority === 'high' ? '🟡' : '🟢';
    console.log(`\n${index + 1}. ${priorityIcon} ${rec.strategy.replace(/_/g, ' ').toUpperCase()}`);
    console.log(`   Priority: ${rec.priority}`);
    console.log(`   Description: ${rec.description}`);
    console.log(`   Reasoning: ${rec.reasoning}`);
    console.log(`   Expected Benefit: ${rec.expectedBenefit}`);
    console.log(`   Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
    console.log(`   Estimated Effort: ${rec.estimatedEffort}`);
  });

  if (recommendations.length === 0) {
    console.log('ℹ️ No specific recommendations generated (would require real AI analysis)');
    console.log('📝 Simulating optimization recommendations...');
    
    // Simulate recommendations for demonstration
    const simulatedRecommendations = [
      {
        strategy: 'conciseness_optimization' as OptimizationStrategy,
        priority: 'high' as const,
        description: 'Prompt is verbose and may be causing longer response times',
        reasoning: 'Reducing prompt length can improve response time and reduce token usage',
        expectedBenefit: 'Faster responses and lower costs'
      },
      {
        strategy: 'clarity_improvement' as OptimizationStrategy,
        priority: 'medium' as const,
        description: 'Success rate below target suggests clarity issues',
        reasoning: 'More specific instructions can improve success rate',
        expectedBenefit: 'Higher success rate and more consistent outputs'
      }
    ];

    console.log('\n🎯 Simulated Recommendations:');
    simulatedRecommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'high' ? '🟡' : '🟢';
      console.log(`\n${index + 1}. ${priorityIcon} ${rec.strategy.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`   Priority: ${rec.priority}`);
      console.log(`   Description: ${rec.description}`);
      console.log(`   Reasoning: ${rec.reasoning}`);
      console.log(`   Expected Benefit: ${rec.expectedBenefit}`);
    });
  }

  console.log('\n🤖 Example 5: AI-Powered Optimization (Simulation)');
  
  // In a real scenario with OpenRouter client, you would do:
  // const optimizationResult = await optimizer.optimizePrompt(
  //   problematicPrompt.id,
  //   'conciseness_optimization',
  //   'Focus on reducing token usage while maintaining professionalism'
  // );

  // For this example, we'll simulate the optimization result
  console.log('🔄 Simulating AI-powered optimization...');
  console.log('📝 Strategy: Conciseness Optimization');
  console.log('🎯 Goal: Reduce token usage while maintaining effectiveness');
  
  // Create a manually optimized version for demonstration
  const optimizedVersion = versionManager.updateVersion(problematicPrompt.id, {
    template: 'Write a professional email response to: {customer_message}. Address their order status inquiry with relevant details.',
    description: 'Optimized for conciseness - reduced from 234 to 108 characters'
  });

  console.log('\n✅ Optimization Complete!');
  console.log('📊 Changes Made:');
  console.log(`  • Original length: ${problematicPrompt.template.length} characters`);
  console.log(`  • Optimized length: ${optimizedVersion.template.length} characters`);
  console.log(`  • Reduction: ${((problematicPrompt.template.length - optimizedVersion.template.length) / problematicPrompt.template.length * 100).toFixed(1)}%`);
  console.log('\n📝 Original Template:');
  console.log(`"${problematicPrompt.template}"`);
  console.log('\n📝 Optimized Template:');
  console.log(`"${optimizedVersion.template}"`);

  console.log('\n🧪 Example 6: Testing Optimized Version');
  
  // Simulate testing the optimized version
  console.log('🔄 Simulating A/B test between original and optimized versions...');
  
  // Simulate improved performance for optimized version
  for (let i = 0; i < 30; i++) {
    const execution = simulateTestExecution(
      Math.random() < 0.94, // 94% success rate (improved)
      1200 + Math.random() * 800, // 1200-2000ms response time (improved)
      0.003 + Math.random() * 0.002 // $0.003-0.005 cost (improved)
    );
    execution.promptVersionId = optimizedVersion.id;
    analytics.recordExecution(execution, 'openai/gpt-3.5-turbo');
  }

  const optimizedAggregation = analytics.generateAggregation(optimizedVersion.id, 'day');
  
  console.log('\n📊 Performance Comparison:');
  console.log('┌─────────────────────┬─────────────┬─────────────┬─────────────┐');
  console.log('│ Metric              │ Original    │ Optimized   │ Improvement │');
  console.log('├─────────────────────┼─────────────┼─────────────┼─────────────┤');
  console.log(`│ Success Rate        │ ${aggregation.metrics.successRate.toFixed(1)}%        │ ${optimizedAggregation.metrics.successRate.toFixed(1)}%        │ +${(optimizedAggregation.metrics.successRate - aggregation.metrics.successRate).toFixed(1)}%        │`);
  console.log(`│ Avg Response Time   │ ${aggregation.metrics.averageResponseTime.toFixed(0)}ms       │ ${optimizedAggregation.metrics.averageResponseTime.toFixed(0)}ms       │ -${(aggregation.metrics.averageResponseTime - optimizedAggregation.metrics.averageResponseTime).toFixed(0)}ms       │`);
  console.log(`│ Avg Cost           │ $${aggregation.metrics.averageCost.toFixed(6)}  │ $${optimizedAggregation.metrics.averageCost.toFixed(6)}  │ -$${(aggregation.metrics.averageCost - optimizedAggregation.metrics.averageCost).toFixed(6)} │`);
  console.log('└─────────────────────┴─────────────┴─────────────┴─────────────┘');

  // Calculate overall improvement
  const successImprovement = optimizedAggregation.metrics.successRate - aggregation.metrics.successRate;
  const responseTimeImprovement = ((aggregation.metrics.averageResponseTime - optimizedAggregation.metrics.averageResponseTime) / aggregation.metrics.averageResponseTime) * 100;
  const costImprovement = ((aggregation.metrics.averageCost - optimizedAggregation.metrics.averageCost) / aggregation.metrics.averageCost) * 100;

  console.log('\n🎯 Optimization Results:');
  console.log(`✅ Success Rate: +${successImprovement.toFixed(1)}% improvement`);
  console.log(`⚡ Response Time: ${responseTimeImprovement.toFixed(1)}% faster`);
  console.log(`💰 Cost: ${costImprovement.toFixed(1)}% reduction`);

  const overallScore = (successImprovement * 0.4) + (responseTimeImprovement * 0.3) + (costImprovement * 0.3);
  console.log(`📊 Overall Performance Score: +${overallScore.toFixed(1)}% improvement`);

  if (overallScore > 5) {
    console.log('🏆 Recommendation: ADOPT optimized version');
  } else if (overallScore > 0) {
    console.log('🤔 Recommendation: CONTINUE TESTING');
  } else {
    console.log('❌ Recommendation: REJECT optimization');
  }

  console.log('\n✨ Auto-Prompt Optimization Example Complete!');
  console.log('\n🔗 Next Steps:');
  console.log('1. Set up OpenRouter client for real AI-powered optimization');
  console.log('2. Configure optimization strategies for your use case');
  console.log('3. Set up monitoring and alerting for performance issues');
  console.log('4. Enable continuous optimization for production prompts');
  console.log('5. Review and approve optimization recommendations');
  console.log('6. Track optimization success rates and ROI');
}

// Run the example
if (require.main === module) {
  autoOptimizationExample().catch(console.error);
}

export { autoOptimizationExample };
