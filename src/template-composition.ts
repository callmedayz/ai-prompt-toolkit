import { AdvancedPromptTemplate } from './advanced-prompt-template';
import { AdvancedTemplateOptions, TemplateContext } from './types';

/**
 * Template Composition System for Dynamic Prompt Building
 * Enables combining multiple templates based on context and user behavior
 */
export class TemplateComposer {
  private templates: Map<string, AdvancedPromptTemplate> = new Map();
  private compositionRules: CompositionRule[] = [];
  private context: TemplateContext;

  constructor(context: TemplateContext = { variables: {}, functions: {}, metadata: {} }) {
    this.context = context;
  }

  /**
   * Register a template with a unique name
   */
  registerTemplate(name: string, template: AdvancedPromptTemplate): void {
    this.templates.set(name, template);
  }

  /**
   * Add a composition rule for dynamic template selection
   */
  addCompositionRule(rule: CompositionRule): void {
    this.compositionRules.push(rule);
  }

  /**
   * Compose a prompt based on context and rules
   */
  compose(context: Record<string, any> = {}): CompositionResult {
    const mergedContext = { ...this.context.variables, ...context };
    
    // Find applicable templates based on rules
    const applicableTemplates = this.findApplicableTemplates(mergedContext);
    
    if (applicableTemplates.length === 0) {
      throw new Error('No applicable templates found for the given context');
    }

    // Select the best template based on priority and conditions
    const selectedTemplate = this.selectBestTemplate(applicableTemplates, mergedContext);
    
    // Render the selected template
    const renderedPrompt = selectedTemplate.template.render(mergedContext);
    
    return {
      prompt: renderedPrompt,
      templateName: selectedTemplate.name,
      appliedRules: selectedTemplate.appliedRules,
      context: mergedContext,
      metadata: {
        compositionTime: new Date().toISOString(),
        templateCount: applicableTemplates.length,
        selectedPriority: selectedTemplate.priority
      }
    };
  }

  /**
   * Create a composite template by combining multiple templates
   */
  createComposite(templateNames: string[], separator: string = '\n\n'): AdvancedPromptTemplate {
    const templates = templateNames.map(name => {
      const template = this.templates.get(name);
      if (!template) {
        throw new Error(`Template '${name}' not found`);
      }
      return template;
    });

    // Combine template strings
    const combinedTemplate = templates
      .map(template => `{{#block ${templateNames[templates.indexOf(template)]}}}${template['advancedOptions'].template}{{/block}}`)
      .join(separator);

    return new AdvancedPromptTemplate({
      template: combinedTemplate,
      variables: this.context.variables,
      enableConditionals: true,
      enableLoops: true,
      enableInheritance: true
    });
  }

  /**
   * Find templates that match the current context
   */
  private findApplicableTemplates(context: Record<string, any>): ApplicableTemplate[] {
    const applicable: ApplicableTemplate[] = [];

    for (const [name, template] of this.templates) {
      const matchingRules = this.compositionRules.filter(rule => 
        this.evaluateRule(rule, context, name)
      );

      if (matchingRules.length > 0) {
        const priority = Math.max(...matchingRules.map(rule => rule.priority || 0));
        applicable.push({
          name,
          template,
          priority,
          appliedRules: matchingRules.map(rule => rule.name)
        });
      }
    }

    return applicable.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Select the best template from applicable ones
   */
  private selectBestTemplate(templates: ApplicableTemplate[], context: Record<string, any>): ApplicableTemplate {
    // For now, select the highest priority template
    // In the future, this could include ML-based selection
    return templates[0];
  }

  /**
   * Evaluate if a composition rule applies to the current context
   */
  private evaluateRule(rule: CompositionRule, context: Record<string, any>, templateName: string): boolean {
    // Check template name match
    if (rule.templatePattern && !new RegExp(rule.templatePattern).test(templateName)) {
      return false;
    }

    // Check context conditions
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return false;
        }
      }
    }

    // Check user behavior patterns
    if (rule.behaviorPatterns) {
      for (const pattern of rule.behaviorPatterns) {
        if (!this.evaluateBehaviorPattern(pattern, context)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: ContextCondition, context: Record<string, any>): boolean {
    const value = this.getNestedValue(context, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'exists':
        return value !== undefined && value !== null;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Evaluate user behavior patterns
   */
  private evaluateBehaviorPattern(pattern: BehaviorPattern, context: Record<string, any>): boolean {
    const behaviorData = context.userBehavior || {};
    
    switch (pattern.type) {
      case 'usage_frequency':
        return (behaviorData.usageCount || 0) >= (pattern.threshold || 0);
      case 'success_rate':
        const successRate = (behaviorData.successfulPrompts || 0) / (behaviorData.totalPrompts || 1);
        return successRate >= (pattern.threshold || 0);
      case 'time_of_day':
        const hour = new Date().getHours();
        return pattern.timeRange ? 
          hour >= pattern.timeRange[0] && hour <= pattern.timeRange[1] : true;
      case 'domain_expertise':
        return (behaviorData.domainExpertise || {})[pattern.domain || ''] >= (pattern.threshold || 0);
      default:
        return true;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get all registered template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get composition statistics
   */
  getStats(): CompositionStats {
    return {
      templateCount: this.templates.size,
      ruleCount: this.compositionRules.length,
      averagePriority: this.compositionRules.reduce((sum, rule) => sum + (rule.priority || 0), 0) / this.compositionRules.length
    };
  }
}

// Types for template composition
export interface CompositionRule {
  name: string;
  templatePattern?: string;
  conditions?: ContextCondition[];
  behaviorPatterns?: BehaviorPattern[];
  priority?: number;
  description?: string;
}

export interface ContextCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'in';
  value: any;
}

export interface BehaviorPattern {
  type: 'usage_frequency' | 'success_rate' | 'time_of_day' | 'domain_expertise';
  threshold?: number;
  timeRange?: [number, number]; // [start_hour, end_hour]
  domain?: string;
}

export interface ApplicableTemplate {
  name: string;
  template: AdvancedPromptTemplate;
  priority: number;
  appliedRules: string[];
}

export interface CompositionResult {
  prompt: string;
  templateName: string;
  appliedRules: string[];
  context: Record<string, any>;
  metadata: {
    compositionTime: string;
    templateCount: number;
    selectedPriority: number;
  };
}

export interface CompositionStats {
  templateCount: number;
  ruleCount: number;
  averagePriority: number;
}

/**
 * Helper function to create common composition rules
 */
export function createCommonRules(): CompositionRule[] {
  return [
    {
      name: 'high_complexity_task',
      conditions: [
        { field: 'task.complexity', operator: 'greater_than', value: 7 }
      ],
      templatePattern: '.*complex.*|.*detailed.*',
      priority: 10,
      description: 'Use detailed templates for complex tasks'
    },
    {
      name: 'beginner_user',
      behaviorPatterns: [
        { type: 'usage_frequency', threshold: 5 }
      ],
      templatePattern: '.*simple.*|.*basic.*',
      priority: 8,
      description: 'Use simple templates for new users'
    },
    {
      name: 'expert_user',
      behaviorPatterns: [
        { type: 'success_rate', threshold: 0.8 },
        { type: 'usage_frequency', threshold: 50 }
      ],
      templatePattern: '.*advanced.*|.*expert.*',
      priority: 9,
      description: 'Use advanced templates for expert users'
    },
    {
      name: 'morning_productivity',
      behaviorPatterns: [
        { type: 'time_of_day', timeRange: [6, 12] }
      ],
      templatePattern: '.*focused.*|.*productive.*',
      priority: 6,
      description: 'Use focused templates during morning hours'
    },
    {
      name: 'creative_task',
      conditions: [
        { field: 'task.type', operator: 'in', value: ['creative', 'brainstorming', 'ideation'] }
      ],
      templatePattern: '.*creative.*|.*brainstorm.*',
      priority: 7,
      description: 'Use creative templates for creative tasks'
    }
  ];
}

/**
 * Helper function to create a template composer with common rules
 */
export function createTemplateComposer(context?: TemplateContext): TemplateComposer {
  const composer = new TemplateComposer(context);
  
  // Add common composition rules
  createCommonRules().forEach(rule => composer.addCompositionRule(rule));
  
  return composer;
}
