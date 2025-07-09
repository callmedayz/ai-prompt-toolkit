import { PromptTemplate } from './prompt-template';
import { OpenRouterClient } from './openrouter-client';
import { OpenRouterCompletion, CompletionConfig, CompletionResult } from './openrouter-completion';
import { estimateTokens } from './utils';
import { SupportedModel } from './types';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Represents a versioned prompt with metadata
 */
export interface PromptVersion {
  id: string;
  version: string;
  name: string;
  description?: string;
  template: string;
  variables: Record<string, any>;
  metadata: {
    createdAt: Date;
    createdBy?: string;
    tags?: string[];
    parentVersion?: string;
    isActive: boolean;
  };
  performance?: PromptPerformanceMetrics;
}

/**
 * Performance metrics for a prompt version
 */
export interface PromptPerformanceMetrics {
  totalTests: number;
  successRate: number;
  averageResponseTime: number;
  averageTokenUsage: number;
  averageCost: number;
  qualityScore?: number;
  lastTested: Date;
}

/**
 * Configuration for A/B testing
 */
export interface ABTestConfig {
  name: string;
  description?: string;
  variants: PromptVersion[];
  trafficSplit: number[]; // Percentage split for each variant (should sum to 100)
  testDuration?: number; // Duration in milliseconds
  successCriteria: {
    metric: 'response_time' | 'token_usage' | 'cost' | 'quality_score' | 'success_rate';
    target: number;
    operator: 'greater_than' | 'less_than' | 'equals';
  }[];
  sampleSize?: number; // Minimum number of tests per variant
}

/**
 * Result of an A/B test
 */
export interface ABTestResult {
  testId: string;
  config: ABTestConfig;
  variants: {
    version: PromptVersion;
    metrics: PromptPerformanceMetrics;
    testCount: number;
    isWinner?: boolean;
  }[];
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'stopped';
  winner?: PromptVersion;
  confidence: number; // Statistical confidence level (0-1)
  summary: string;
}

/**
 * Individual test execution result
 */
export interface TestExecution {
  id: string;
  promptVersionId: string;
  input: string;
  output: string;
  responseTime: number;
  tokenUsage: number;
  cost: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Prompt Versioning and A/B Testing System
 */
export class PromptVersionManager {
  private versions: Map<string, PromptVersion> = new Map();
  private activeTests: Map<string, ABTestResult> = new Map();
  private testExecutions: Map<string, TestExecution[]> = new Map();
  private client?: OpenRouterClient;
  private completion?: OpenRouterCompletion;

  constructor(client?: OpenRouterClient) {
    this.client = client;
    if (client) {
      this.completion = new OpenRouterCompletion(client);
    }
  }

  /**
   * Create a new prompt version
   */
  createVersion(
    name: string,
    template: string,
    variables: Record<string, any> = {},
    options: {
      description?: string;
      tags?: string[];
      parentVersion?: string;
      createdBy?: string;
    } = {}
  ): PromptVersion {
    const id = this.generateId();
    const version = this.generateVersionNumber(options.parentVersion);
    
    const promptVersion: PromptVersion = {
      id,
      version,
      name,
      description: options.description,
      template,
      variables,
      metadata: {
        createdAt: new Date(),
        createdBy: options.createdBy,
        tags: options.tags || [],
        parentVersion: options.parentVersion,
        isActive: true
      }
    };

    this.versions.set(id, promptVersion);
    return promptVersion;
  }

  /**
   * Get a prompt version by ID
   */
  getVersion(id: string): PromptVersion | undefined {
    return this.versions.get(id);
  }

  /**
   * List all versions of a prompt by name
   */
  getVersionsByName(name: string): PromptVersion[] {
    return Array.from(this.versions.values())
      .filter(v => v.name === name)
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
  }

  /**
   * Get the latest active version of a prompt
   */
  getLatestVersion(name: string): PromptVersion | undefined {
    const versions = this.getVersionsByName(name)
      .filter(v => v.metadata.isActive);
    return versions.length > 0 ? versions[0] : undefined;
  }

  /**
   * Update a prompt version (creates a new version)
   */
  updateVersion(
    parentId: string,
    updates: {
      template?: string;
      variables?: Record<string, any>;
      description?: string;
      tags?: string[];
    }
  ): PromptVersion {
    const parent = this.getVersion(parentId);
    if (!parent) {
      throw new Error(`Parent version ${parentId} not found`);
    }

    return this.createVersion(
      parent.name,
      updates.template || parent.template,
      { ...parent.variables, ...updates.variables },
      {
        description: updates.description || parent.description,
        tags: updates.tags || parent.metadata.tags,
        parentVersion: parentId
      }
    );
  }

  /**
   * Deactivate a prompt version
   */
  deactivateVersion(id: string): void {
    const version = this.getVersion(id);
    if (version) {
      version.metadata.isActive = false;
    }
  }

  private generateId(): string {
    return `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVersionNumber(parentVersion?: string): string {
    if (!parentVersion) {
      return '1.0.0';
    }

    const parent = this.getVersion(parentVersion);
    if (!parent) {
      return '1.0.0';
    }

    const [major, minor, patch] = parent.version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Start an A/B test with multiple prompt versions
   */
  async startABTest(config: ABTestConfig): Promise<ABTestResult> {
    // Validate config
    this.validateABTestConfig(config);

    const testId = this.generateId();
    const testResult: ABTestResult = {
      testId,
      config,
      variants: config.variants.map(version => ({
        version,
        metrics: {
          totalTests: 0,
          successRate: 0,
          averageResponseTime: 0,
          averageTokenUsage: 0,
          averageCost: 0,
          lastTested: new Date()
        },
        testCount: 0
      })),
      startTime: new Date(),
      status: 'running',
      confidence: 0,
      summary: 'Test started'
    };

    this.activeTests.set(testId, testResult);
    this.testExecutions.set(testId, []);

    return testResult;
  }

  /**
   * Execute a test for a specific variant in an A/B test
   */
  async executeTest(
    testId: string,
    input: string,
    model: SupportedModel = DEFAULT_FREE_MODEL,
    config: CompletionConfig = {}
  ): Promise<TestExecution> {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') {
      throw new Error(`Test ${testId} is not running`);
    }

    if (!this.completion) {
      throw new Error('OpenRouter client not configured for testing');
    }

    // Select variant based on traffic split
    const variant = this.selectVariant(test);
    const promptTemplate = new PromptTemplate({
      template: variant.version.template,
      variables: variant.version.variables
    });

    const prompt = promptTemplate.render({ input });
    const startTime = Date.now();

    try {
      const result = await this.completion.complete(prompt, {
        model,
        ...config
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Estimate token usage and cost
      const tokenInfo = estimateTokens(prompt + result.text, model);

      const execution: TestExecution = {
        id: this.generateId(),
        promptVersionId: variant.version.id,
        input,
        output: result.text,
        responseTime,
        tokenUsage: tokenInfo.tokens,
        cost: tokenInfo.estimatedCost || 0,
        success: true,
        timestamp: new Date()
      };

      // Record the execution
      this.recordTestExecution(testId, execution);

      return execution;
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const execution: TestExecution = {
        id: this.generateId(),
        promptVersionId: variant.version.id,
        input,
        output: '',
        responseTime,
        tokenUsage: 0,
        cost: 0,
        success: false,
        timestamp: new Date(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      };

      this.recordTestExecution(testId, execution);
      throw error;
    }
  }

  /**
   * Get the current status of an A/B test
   */
  getTestStatus(testId: string): ABTestResult | undefined {
    return this.activeTests.get(testId);
  }

  /**
   * Stop an A/B test and analyze results
   */
  stopABTest(testId: string): ABTestResult {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = 'stopped';
    test.endTime = new Date();

    // Analyze results and determine winner
    this.analyzeTestResults(test);

    return test;
  }

  /**
   * Complete an A/B test and analyze results
   */
  completeABTest(testId: string): ABTestResult {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = 'completed';
    test.endTime = new Date();

    // Analyze results and determine winner
    this.analyzeTestResults(test);

    return test;
  }

  /**
   * Get test executions for a specific test
   */
  getTestExecutions(testId: string): TestExecution[] {
    return this.testExecutions.get(testId) || [];
  }

  /**
   * Export prompt versions to JSON
   */
  exportVersions(): string {
    const data = {
      versions: Array.from(this.versions.values()),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import prompt versions from JSON
   */
  importVersions(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.versions && Array.isArray(data.versions)) {
        data.versions.forEach((version: PromptVersion) => {
          // Convert date strings back to Date objects
          version.metadata.createdAt = new Date(version.metadata.createdAt);
          if (version.performance?.lastTested) {
            version.performance.lastTested = new Date(version.performance.lastTested);
          }
          this.versions.set(version.id, version);
        });
      }
    } catch (error) {
      throw new Error(`Failed to import versions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private validateABTestConfig(config: ABTestConfig): void {
    if (config.variants.length < 2) {
      throw new Error('A/B test requires at least 2 variants');
    }

    if (config.trafficSplit.length !== config.variants.length) {
      throw new Error('Traffic split array must match number of variants');
    }

    const totalSplit = config.trafficSplit.reduce((sum, split) => sum + split, 0);
    if (Math.abs(totalSplit - 100) > 0.01) {
      throw new Error('Traffic split must sum to 100%');
    }

    config.trafficSplit.forEach(split => {
      if (split < 0 || split > 100) {
        throw new Error('Traffic split values must be between 0 and 100');
      }
    });
  }

  private selectVariant(test: ABTestResult): { version: PromptVersion; metrics: PromptPerformanceMetrics; testCount: number } {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (let i = 0; i < test.config.trafficSplit.length; i++) {
      cumulative += test.config.trafficSplit[i];
      if (random <= cumulative) {
        return test.variants[i];
      }
    }

    // Fallback to first variant
    return test.variants[0];
  }

  private recordTestExecution(testId: string, execution: TestExecution): void {
    const executions = this.testExecutions.get(testId) || [];
    executions.push(execution);
    this.testExecutions.set(testId, executions);

    // Update test metrics
    const test = this.activeTests.get(testId);
    if (test) {
      const variant = test.variants.find(v => v.version.id === execution.promptVersionId);
      if (variant) {
        variant.testCount++;
        this.updateVariantMetrics(variant, executions.filter(e => e.promptVersionId === execution.promptVersionId));
      }
    }
  }

  private updateVariantMetrics(
    variant: { version: PromptVersion; metrics: PromptPerformanceMetrics; testCount: number },
    executions: TestExecution[]
  ): void {
    const successfulExecutions = executions.filter(e => e.success);

    variant.metrics.totalTests = executions.length;
    variant.metrics.successRate = executions.length > 0 ? (successfulExecutions.length / executions.length) * 100 : 0;
    variant.metrics.averageResponseTime = executions.length > 0
      ? executions.reduce((sum, e) => sum + e.responseTime, 0) / executions.length
      : 0;
    variant.metrics.averageTokenUsage = executions.length > 0
      ? executions.reduce((sum, e) => sum + e.tokenUsage, 0) / executions.length
      : 0;
    variant.metrics.averageCost = executions.length > 0
      ? executions.reduce((sum, e) => sum + e.cost, 0) / executions.length
      : 0;
    variant.metrics.lastTested = new Date();

    // Update the version's performance metrics
    variant.version.performance = { ...variant.metrics };
  }

  private analyzeTestResults(test: ABTestResult): void {
    if (test.variants.length === 0) {
      test.summary = 'No variants to analyze';
      return;
    }

    // Determine winner based on success criteria
    let winner: typeof test.variants[0] | undefined;
    let bestScore = -Infinity;

    for (const variant of test.variants) {
      let score = 0;
      let criteriaMetCount = 0;

      for (const criteria of test.config.successCriteria) {
        const metricValue = this.getMetricValue(variant.metrics, criteria.metric);
        const meetsCriteria = this.evaluateCriteria(metricValue, criteria.target, criteria.operator);

        if (meetsCriteria) {
          criteriaMetCount++;
          // Weight the score based on the metric type
          switch (criteria.metric) {
            case 'success_rate':
              score += metricValue * 2; // Higher weight for success rate
              break;
            case 'response_time':
              score += criteria.operator === 'less_than' ? (1000 - metricValue) : metricValue;
              break;
            case 'cost':
              score += criteria.operator === 'less_than' ? (1 - metricValue) * 1000 : metricValue;
              break;
            default:
              score += metricValue;
          }
        }
      }

      // Bonus for meeting more criteria
      score += criteriaMetCount * 100;

      if (score > bestScore && variant.testCount > 0) {
        bestScore = score;
        winner = variant;
      }
    }

    if (winner) {
      winner.isWinner = true;
      test.winner = winner.version;
      test.confidence = this.calculateConfidence(test);
      test.summary = `Winner: ${winner.version.name} (v${winner.version.version}) with ${winner.testCount} tests and ${winner.metrics.successRate.toFixed(1)}% success rate`;
    } else {
      test.summary = 'No clear winner based on success criteria';
      test.confidence = 0;
    }
  }

  private getMetricValue(metrics: PromptPerformanceMetrics, metric: string): number {
    switch (metric) {
      case 'response_time':
        return metrics.averageResponseTime;
      case 'token_usage':
        return metrics.averageTokenUsage;
      case 'cost':
        return metrics.averageCost;
      case 'quality_score':
        return metrics.qualityScore || 0;
      case 'success_rate':
        return metrics.successRate;
      default:
        return 0;
    }
  }

  private evaluateCriteria(value: number, target: number, operator: string): boolean {
    switch (operator) {
      case 'greater_than':
        return value > target;
      case 'less_than':
        return value < target;
      case 'equals':
        return Math.abs(value - target) < 0.01;
      default:
        return false;
    }
  }

  private calculateConfidence(test: ABTestResult): number {
    // Simple confidence calculation based on sample size and variance
    const totalTests = test.variants.reduce((sum, v) => sum + v.testCount, 0);
    const minSampleSize = test.config.sampleSize || 30;

    if (totalTests < minSampleSize) {
      return 0;
    }

    // Basic confidence calculation (simplified)
    const sampleSizeConfidence = Math.min(totalTests / (minSampleSize * 2), 1);
    const varianceConfidence = test.variants.length > 1 ? 0.8 : 0.5; // More variants = more confidence in winner

    return sampleSizeConfidence * varianceConfidence;
  }
}

/**
 * Utility functions for prompt versioning
 */

/**
 * Create a quick A/B test between two prompt templates
 */
export function createQuickABTest(
  name: string,
  templateA: string,
  templateB: string,
  variables: Record<string, any> = {},
  options: {
    description?: string;
    trafficSplit?: [number, number];
    successCriteria?: ABTestConfig['successCriteria'];
  } = {}
): { manager: PromptVersionManager; testConfig: ABTestConfig } {
  const manager = new PromptVersionManager();

  const versionA = manager.createVersion(`${name}_A`, templateA, variables, {
    description: `${options.description || name} - Variant A`,
    tags: ['ab-test', 'variant-a']
  });

  const versionB = manager.createVersion(`${name}_B`, templateB, variables, {
    description: `${options.description || name} - Variant B`,
    tags: ['ab-test', 'variant-b']
  });

  const testConfig: ABTestConfig = {
    name,
    description: options.description,
    variants: [versionA, versionB],
    trafficSplit: options.trafficSplit || [50, 50],
    successCriteria: options.successCriteria || [
      { metric: 'success_rate', target: 90, operator: 'greater_than' }
    ]
  };

  return { manager, testConfig };
}
