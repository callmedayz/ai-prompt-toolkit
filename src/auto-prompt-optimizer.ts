import { PromptVersion, PromptVersionManager, TestExecution } from './prompt-versioning';
import { PromptAnalytics, PerformanceInsights, AnalyticsAggregation } from './prompt-analytics';
import { OpenRouterClient } from './openrouter-client';
import { OpenRouterCompletion } from './openrouter-completion';
import { SupportedModel } from './types';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Configuration for auto-optimization
 */
export interface AutoOptimizationConfig {
  optimizationModel: SupportedModel; // Model to use for generating optimizations
  targetMetrics: {
    successRate?: { target: number; weight: number };
    responseTime?: { target: number; weight: number };
    cost?: { target: number; weight: number };
    tokenUsage?: { target: number; weight: number };
  };
  optimizationStrategies: OptimizationStrategy[];
  maxIterations: number;
  minSampleSize: number; // Minimum tests before optimization
  confidenceThreshold: number; // Minimum confidence to apply optimization
  enableContinuousOptimization: boolean;
  optimizationInterval: number; // Hours between optimization runs
}

/**
 * Different optimization strategies
 */
export type OptimizationStrategy = 
  | 'clarity_improvement'
  | 'conciseness_optimization'
  | 'specificity_enhancement'
  | 'instruction_refinement'
  | 'context_optimization'
  | 'format_standardization'
  | 'error_reduction'
  | 'performance_tuning';

/**
 * Result of an optimization attempt
 */
export interface OptimizationResult {
  originalVersion: PromptVersion;
  optimizedVersion: PromptVersion;
  strategy: OptimizationStrategy;
  changes: {
    description: string;
    reasoning: string;
    expectedImpact: string;
  };
  confidence: number;
  estimatedImprovement: {
    successRate?: number;
    responseTime?: number;
    cost?: number;
    tokenUsage?: number;
  };
  testPlan: {
    sampleSize: number;
    duration: number; // hours
    successCriteria: string[];
  };
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  promptVersionId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  strategy: OptimizationStrategy;
  description: string;
  reasoning: string;
  expectedBenefit: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  confidence: number;
  suggestedChanges: string[];
}

/**
 * Auto-Prompt Optimization System
 */
export class AutoPromptOptimizer {
  private config: AutoOptimizationConfig;
  private versionManager: PromptVersionManager;
  private analytics: PromptAnalytics;
  private client?: OpenRouterClient;
  private completion?: OpenRouterCompletion;
  private optimizationHistory: Map<string, OptimizationResult[]> = new Map();

  constructor(
    versionManager: PromptVersionManager,
    analytics: PromptAnalytics,
    config?: Partial<AutoOptimizationConfig>,
    client?: OpenRouterClient
  ) {
    this.versionManager = versionManager;
    this.analytics = analytics;
    this.client = client;
    
    if (client) {
      this.completion = new OpenRouterCompletion(client);
    }

    this.config = {
      optimizationModel: DEFAULT_FREE_MODEL,
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
      maxIterations: 5,
      minSampleSize: 20,
      confidenceThreshold: 0.7,
      enableContinuousOptimization: false,
      optimizationInterval: 24,
      ...config
    };
  }

  /**
   * Analyze a prompt version and generate optimization recommendations
   */
  async analyzeForOptimization(promptVersionId: string): Promise<OptimizationRecommendation[]> {
    const version = this.versionManager.getVersion(promptVersionId);
    if (!version) {
      throw new Error(`Prompt version ${promptVersionId} not found`);
    }

    const insights = this.analytics.generateInsights(promptVersionId);
    const aggregation = this.analytics.generateAggregation(promptVersionId, 'day');
    
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze performance issues and generate recommendations
    for (const insight of insights.insights) {
      const recommendation = await this.generateRecommendationFromInsight(
        version,
        insight,
        aggregation
      );
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Check for general optimization opportunities
    const generalRecommendations = await this.generateGeneralRecommendations(
      version,
      aggregation
    );
    recommendations.push(...generalRecommendations);

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Automatically optimize a prompt version using AI
   */
  async optimizePrompt(
    promptVersionId: string,
    strategy: OptimizationStrategy,
    customInstructions?: string
  ): Promise<OptimizationResult> {
    if (!this.completion) {
      throw new Error('OpenRouter client not configured for optimization');
    }

    const version = this.versionManager.getVersion(promptVersionId);
    if (!version) {
      throw new Error(`Prompt version ${promptVersionId} not found`);
    }

    const insights = this.analytics.generateInsights(promptVersionId);
    const aggregation = this.analytics.generateAggregation(promptVersionId, 'day');

    // Generate optimization prompt
    const optimizationPrompt = this.buildOptimizationPrompt(
      version,
      strategy,
      insights,
      aggregation,
      customInstructions
    );

    // Get optimization suggestions from AI
    const result = await this.completion.complete(optimizationPrompt, {
      model: this.config.optimizationModel,
      maxTokens: 1000,
      temperature: 0.3 // Lower temperature for more consistent optimization
    });

    // Parse the optimization response
    const optimization = this.parseOptimizationResponse(result.text);
    
    // Create optimized version
    const optimizedVersion = this.versionManager.updateVersion(promptVersionId, {
      template: optimization.optimizedTemplate,
      description: `Auto-optimized using ${strategy} strategy: ${optimization.description}`
    });

    const optimizationResult: OptimizationResult = {
      originalVersion: version,
      optimizedVersion,
      strategy,
      changes: {
        description: optimization.description,
        reasoning: optimization.reasoning,
        expectedImpact: optimization.expectedImpact
      },
      confidence: optimization.confidence,
      estimatedImprovement: optimization.estimatedImprovement,
      testPlan: {
        sampleSize: Math.max(this.config.minSampleSize, 30),
        duration: 24,
        successCriteria: this.generateSuccessCriteria(strategy)
      }
    };

    // Record optimization history
    const history = this.optimizationHistory.get(promptVersionId) || [];
    history.push(optimizationResult);
    this.optimizationHistory.set(promptVersionId, history);

    return optimizationResult;
  }

  /**
   * Run continuous optimization for all active prompt versions
   */
  async runContinuousOptimization(): Promise<OptimizationResult[]> {
    if (!this.config.enableContinuousOptimization) {
      throw new Error('Continuous optimization is not enabled');
    }

    const results: OptimizationResult[] = [];
    
    // Get all active versions
    const allVersions = Array.from(this.versionManager['versions'].values())
      .filter(v => v.metadata.isActive);

    for (const version of allVersions) {
      try {
        // Check if version has enough data for optimization
        const aggregation = this.analytics.generateAggregation(version.id, 'day');
        if (aggregation.metrics.totalExecutions < this.config.minSampleSize) {
          continue;
        }

        // Get recommendations
        const recommendations = await this.analyzeForOptimization(version.id);
        const highPriorityRecommendations = recommendations.filter(
          r => (r.priority === 'high' || r.priority === 'critical') && 
               r.confidence >= this.config.confidenceThreshold
        );

        // Apply top recommendation
        if (highPriorityRecommendations.length > 0) {
          const topRecommendation = highPriorityRecommendations[0];
          const result = await this.optimizePrompt(version.id, topRecommendation.strategy);
          results.push(result);
        }
      } catch (error) {
        console.warn(`Failed to optimize version ${version.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get optimization history for a prompt version
   */
  getOptimizationHistory(promptVersionId: string): OptimizationResult[] {
    return this.optimizationHistory.get(promptVersionId) || [];
  }

  /**
   * Evaluate the success of an optimization
   */
  async evaluateOptimization(
    optimizationResult: OptimizationResult,
    testExecutions: TestExecution[]
  ): Promise<{
    success: boolean;
    actualImprovement: {
      successRate: number;
      responseTime: number;
      cost: number;
      tokenUsage: number;
    };
    confidence: number;
    recommendation: 'adopt' | 'reject' | 'continue_testing';
  }> {
    if (testExecutions.length < optimizationResult.testPlan.sampleSize) {
      return {
        success: false,
        actualImprovement: { successRate: 0, responseTime: 0, cost: 0, tokenUsage: 0 },
        confidence: 0,
        recommendation: 'continue_testing'
      };
    }

    // Calculate actual performance metrics
    const successfulTests = testExecutions.filter(e => e.success).length;
    const actualSuccessRate = (successfulTests / testExecutions.length) * 100;
    const actualAvgResponseTime = testExecutions.reduce((sum, e) => sum + e.responseTime, 0) / testExecutions.length;
    const actualAvgCost = testExecutions.reduce((sum, e) => sum + e.cost, 0) / testExecutions.length;
    const actualAvgTokenUsage = testExecutions.reduce((sum, e) => sum + e.tokenUsage, 0) / testExecutions.length;

    // Get baseline metrics from original version
    const baselineAggregation = this.analytics.generateAggregation(
      optimizationResult.originalVersion.id,
      'day'
    );

    // Calculate improvements
    const successRateImprovement = actualSuccessRate - baselineAggregation.metrics.successRate;
    const responseTimeImprovement = ((baselineAggregation.metrics.averageResponseTime - actualAvgResponseTime) / baselineAggregation.metrics.averageResponseTime) * 100;
    const costImprovement = ((baselineAggregation.metrics.averageCost - actualAvgCost) / baselineAggregation.metrics.averageCost) * 100;
    const tokenUsageImprovement = ((baselineAggregation.metrics.averageTokenUsage - actualAvgTokenUsage) / baselineAggregation.metrics.averageTokenUsage) * 100;

    // Calculate overall success score
    const targetMetrics = this.config.targetMetrics;
    let score = 0;
    let totalWeight = 0;

    if (targetMetrics.successRate) {
      score += (successRateImprovement > 0 ? 1 : 0) * targetMetrics.successRate.weight;
      totalWeight += targetMetrics.successRate.weight;
    }
    if (targetMetrics.responseTime) {
      score += (responseTimeImprovement > 0 ? 1 : 0) * targetMetrics.responseTime.weight;
      totalWeight += targetMetrics.responseTime.weight;
    }
    if (targetMetrics.cost) {
      score += (costImprovement > 0 ? 1 : 0) * targetMetrics.cost.weight;
      totalWeight += targetMetrics.cost.weight;
    }
    if (targetMetrics.tokenUsage) {
      score += (tokenUsageImprovement > 0 ? 1 : 0) * targetMetrics.tokenUsage.weight;
      totalWeight += targetMetrics.tokenUsage.weight;
    }

    const successScore = totalWeight > 0 ? score / totalWeight : 0;
    const success = successScore >= 0.6; // 60% of weighted metrics improved
    const confidence = Math.min(testExecutions.length / optimizationResult.testPlan.sampleSize, 1);

    return {
      success,
      actualImprovement: {
        successRate: successRateImprovement,
        responseTime: responseTimeImprovement,
        cost: costImprovement,
        tokenUsage: tokenUsageImprovement
      },
      confidence,
      recommendation: success && confidence >= 0.8 ? 'adopt' : 
                     !success && confidence >= 0.8 ? 'reject' : 'continue_testing'
    };
  }

  private async generateRecommendationFromInsight(
    version: PromptVersion,
    insight: PerformanceInsights['insights'][0],
    aggregation: AnalyticsAggregation
  ): Promise<OptimizationRecommendation | null> {
    const strategies: Record<string, OptimizationStrategy> = {
      'High Response Time': 'conciseness_optimization',
      'Low Success Rate': 'clarity_improvement',
      'High Error Rate': 'error_reduction',
      'High Cost': 'conciseness_optimization'
    };

    const strategy = strategies[insight.title];
    if (!strategy) return null;

    const priority = insight.severity === 'high' ? 'critical' : 
                    insight.severity === 'medium' ? 'high' : 'medium';

    return {
      promptVersionId: version.id,
      priority,
      strategy,
      description: insight.description,
      reasoning: insight.recommendation,
      expectedBenefit: insight.impact,
      estimatedEffort: 'medium',
      confidence: insight.confidence,
      suggestedChanges: [insight.recommendation]
    };
  }

  private async generateGeneralRecommendations(
    version: PromptVersion,
    aggregation: AnalyticsAggregation
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Check for general optimization opportunities
    if (aggregation.metrics.averageTokenUsage > 1000) {
      recommendations.push({
        promptVersionId: version.id,
        priority: 'medium',
        strategy: 'conciseness_optimization',
        description: 'High token usage detected',
        reasoning: 'Reducing prompt length can improve response time and reduce costs',
        expectedBenefit: 'Faster responses and lower costs',
        estimatedEffort: 'low',
        confidence: 0.8,
        suggestedChanges: ['Remove unnecessary words', 'Use more concise instructions']
      });
    }

    if (aggregation.metrics.successRate < 90 && aggregation.metrics.successRate > 0) {
      recommendations.push({
        promptVersionId: version.id,
        priority: 'high',
        strategy: 'clarity_improvement',
        description: 'Success rate below optimal threshold',
        reasoning: 'Improving prompt clarity can increase success rate',
        expectedBenefit: 'Higher success rate and better user experience',
        estimatedEffort: 'medium',
        confidence: 0.7,
        suggestedChanges: ['Add more specific instructions', 'Clarify expected output format']
      });
    }

    return recommendations;
  }

  private buildOptimizationPrompt(
    version: PromptVersion,
    strategy: OptimizationStrategy,
    insights: PerformanceInsights,
    aggregation: AnalyticsAggregation,
    customInstructions?: string
  ): string {
    const strategyDescriptions = {
      clarity_improvement: 'Make the prompt clearer and more understandable',
      conciseness_optimization: 'Make the prompt more concise while maintaining effectiveness',
      specificity_enhancement: 'Add more specific instructions and examples',
      instruction_refinement: 'Improve the quality and precision of instructions',
      context_optimization: 'Optimize context and background information',
      format_standardization: 'Standardize output format requirements',
      error_reduction: 'Reduce potential for errors and misunderstandings',
      performance_tuning: 'Optimize for better performance metrics'
    };

    return `You are an expert prompt engineer. Your task is to optimize the following prompt using the "${strategy}" strategy.

CURRENT PROMPT:
"${version.template}"

STRATEGY: ${strategyDescriptions[strategy]}

PERFORMANCE DATA:
- Success Rate: ${aggregation.metrics.successRate.toFixed(1)}%
- Average Response Time: ${aggregation.metrics.averageResponseTime.toFixed(0)}ms
- Average Token Usage: ${aggregation.metrics.averageTokenUsage.toFixed(0)} tokens
- Average Cost: $${aggregation.metrics.averageCost.toFixed(6)}

PERFORMANCE ISSUES:
${insights.insights.map(i => `- ${i.title}: ${i.description}`).join('\n')}

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}\n` : ''}

Please provide an optimized version of the prompt following this JSON format:
{
  "optimizedTemplate": "The improved prompt template",
  "description": "Brief description of changes made",
  "reasoning": "Explanation of why these changes will improve performance",
  "expectedImpact": "Expected impact on performance metrics",
  "confidence": 0.8,
  "estimatedImprovement": {
    "successRate": 5.0,
    "responseTime": -10.0,
    "cost": -5.0,
    "tokenUsage": -15.0
  }
}

Focus on the specific strategy while maintaining the prompt's core functionality. Provide realistic improvement estimates as percentages.`;
  }

  private parseOptimizationResponse(response: string): {
    optimizedTemplate: string;
    description: string;
    reasoning: string;
    expectedImpact: string;
    confidence: number;
    estimatedImprovement: {
      successRate?: number;
      responseTime?: number;
      cost?: number;
      tokenUsage?: number;
    };
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          optimizedTemplate: parsed.optimizedTemplate || '',
          description: parsed.description || 'AI-generated optimization',
          reasoning: parsed.reasoning || 'Optimized for better performance',
          expectedImpact: parsed.expectedImpact || 'Improved performance metrics',
          confidence: parsed.confidence || 0.5,
          estimatedImprovement: parsed.estimatedImprovement || {}
        };
      }
    } catch (error) {
      console.warn('Failed to parse optimization response as JSON:', error);
    }

    // Fallback parsing
    return {
      optimizedTemplate: response.trim(),
      description: 'AI-generated optimization',
      reasoning: 'Optimized for better performance',
      expectedImpact: 'Improved performance metrics',
      confidence: 0.5,
      estimatedImprovement: {}
    };
  }

  private generateSuccessCriteria(strategy: OptimizationStrategy): string[] {
    const criteria: Record<OptimizationStrategy, string[]> = {
      clarity_improvement: ['Success rate improvement > 5%', 'Error rate reduction > 10%'],
      conciseness_optimization: ['Token usage reduction > 10%', 'Response time improvement > 5%'],
      specificity_enhancement: ['Success rate improvement > 8%', 'Output quality improvement'],
      instruction_refinement: ['Success rate improvement > 5%', 'Consistency improvement'],
      context_optimization: ['Response relevance improvement', 'Success rate improvement > 3%'],
      format_standardization: ['Output format consistency > 95%', 'Error rate reduction > 5%'],
      error_reduction: ['Error rate reduction > 15%', 'Success rate improvement > 10%'],
      performance_tuning: ['Overall performance score improvement > 10%']
    };

    return criteria[strategy] || ['Performance improvement > 5%'];
  }
}
