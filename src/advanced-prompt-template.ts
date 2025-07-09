import { PromptTemplate } from './prompt-template';
import { 
  AdvancedTemplateOptions, 
  TemplateContext, 
  ConditionalBlock, 
  LoopBlock,
  ConditionalResult,
  LoopResult
} from './types';

/**
 * Advanced Prompt Template System with Conditional Logic and Branching
 * Extends the basic PromptTemplate with support for:
 * - Conditional blocks (if/else)
 * - Loops (for each)
 * - Template inheritance
 * - Custom functions
 * - Dynamic composition
 */
export class AdvancedPromptTemplate extends PromptTemplate {
  private advancedOptions: AdvancedTemplateOptions;
  private context: TemplateContext;
  private baseTemplate?: AdvancedPromptTemplate;

  constructor(options: AdvancedTemplateOptions) {
    super(options);
    this.advancedOptions = {
      enableConditionals: true,
      enableLoops: true,
      enableInheritance: true,
      customFunctions: {},
      ...options
    };
    
    this.context = {
      variables: options.variables || {},
      functions: this.buildDefaultFunctions(),
      metadata: {}
    };

    // Merge custom functions
    if (options.customFunctions) {
      this.context.functions = { ...this.context.functions, ...options.customFunctions };
    }

    // Set up inheritance if base template is provided
    if (options.baseTemplate) {
      this.setupInheritance(options.baseTemplate);
    }
  }

  /**
   * Render the advanced template with conditional logic and loops
   */
  render(variables?: Record<string, any>): string {
    const allVariables = { ...this.context.variables, ...variables };
    this.context.variables = allVariables;

    let template = this.getEffectiveTemplate();
    
    // Process inheritance blocks first
    if (this.advancedOptions.enableInheritance) {
      template = this.processInheritance(template);
    }

    // Process loop blocks first (they may contain conditionals and functions)
    if (this.advancedOptions.enableLoops) {
      template = this.processLoops(template);
    }

    // Process function calls (for functions outside of loops)
    template = this.processFunctions(template);

    // Process conditional blocks (for conditionals outside of loops)
    if (this.advancedOptions.enableConditionals) {
      template = this.processConditionals(template);
    }

    // Use parent render for basic variable substitution
    const basicTemplate = new PromptTemplate({
      template,
      variables: allVariables,
      escapeHtml: this.advancedOptions.escapeHtml,
      preserveWhitespace: this.advancedOptions.preserveWhitespace
    });

    return basicTemplate.render();
  }

  /**
   * Process conditional blocks in the template
   * Syntax: {{#if condition}}content{{#else}}alternative{{/if}}
   */
  private processConditionals(template: string): string {
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{#else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

    return template.replace(conditionalRegex, (match, condition, trueContent, falseContent = '') => {
      // Process any function calls in the condition first
      let processedCondition = condition.trim();

      // Handle function calls within the condition expression
      const functionCallRegex = /(\w+)\((.*?)\)/g;
      processedCondition = processedCondition.replace(functionCallRegex, (funcMatch: string, functionName: string, argsString: string) => {
        const func = this.context.functions[functionName];
        if (func) {
          const args = this.parseArguments(argsString);
          const result = func(...args);
          return String(result);
        }
        return funcMatch; // Return unchanged if function not found
      });

      const result = this.evaluateCondition(processedCondition);
      return result ? trueContent : falseContent;
    });
  }

  /**
   * Process loop blocks in the template
   * Syntax: {{#each items as item}}{{item.name}}{{/each}}
   */
  private processLoops(template: string): string {
    const loopRegex = /\{\{#each\s+(\w+)\s+as\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(loopRegex, (match, arrayName, itemName, loopTemplate) => {
      const array = this.context.variables[arrayName];
      if (!Array.isArray(array)) {
        throw new Error(`Variable '${arrayName}' is not an array for loop`);
      }

      return array.map((item, index) => {
        const loopContext = {
          ...this.context.variables,
          [itemName]: item,
          [`${itemName}_index`]: index,
          [`${itemName}_first`]: index === 0,
          [`${itemName}_last`]: index === array.length - 1
        };

        // Handle object property access in loop template
        let processedLoopTemplate = loopTemplate;

        // Replace object property access like {item.name} and {{item.name}} with actual values
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => {
            // Handle both {item.property} and {{item.property}} patterns
            const singleBraceRegex = new RegExp(`\\{${itemName}\\.${key}\\}`, 'g');
            const doubleBraceRegex = new RegExp(`\\{\\{${itemName}\\.${key}\\}\\}`, 'g');

            processedLoopTemplate = processedLoopTemplate.replace(singleBraceRegex, String(item[key]));
            processedLoopTemplate = processedLoopTemplate.replace(doubleBraceRegex, String(item[key]));
          });
        }

        // Also handle property access within function calls like {{upper(task.priority)}}
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => {
            const functionPropertyRegex = new RegExp(`${itemName}\\.${key}`, 'g');
            processedLoopTemplate = processedLoopTemplate.replace(functionPropertyRegex, String(item[key]));
          });
        }

        // Handle conditionals that reference the loop item properties
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => {
            const conditionalPropertyRegex = new RegExp(`${itemName}\\.${key}`, 'g');
            const value = item[key];
            // For boolean values, don't use JSON.stringify as it adds quotes
            const replacement = typeof value === 'boolean' ? String(value) : JSON.stringify(value);
            processedLoopTemplate = processedLoopTemplate.replace(conditionalPropertyRegex, replacement);
          });
        }

        // Create a new instance with the loop context to process conditionals and functions
        const loopProcessor = new AdvancedPromptTemplate({
          template: processedLoopTemplate,
          variables: loopContext,
          escapeHtml: this.advancedOptions.escapeHtml,
          preserveWhitespace: this.advancedOptions.preserveWhitespace,
          enableConditionals: true,
          enableLoops: false, // Prevent infinite recursion
          enableInheritance: false
        });

        return loopProcessor.render();
      }).join('');
    });
  }

  /**
   * Process function calls in the template
   * Syntax: {{function_name(arg1, arg2)}}
   */
  private processFunctions(template: string): string {
    const functionRegex = /\{\{(\w+)\((.*?)\)\}\}/g;
    
    return template.replace(functionRegex, (match, functionName, argsString) => {
      const func = this.context.functions[functionName];
      if (!func) {
        throw new Error(`Function '${functionName}' not found`);
      }

      const args = this.parseArguments(argsString);
      const result = func(...args);
      return String(result);
    });
  }

  /**
   * Evaluate a conditional expression
   */
  private evaluateCondition(condition: string): boolean {
    try {
      // Simple condition evaluation - supports basic comparisons
      // Security note: In production, use a proper expression parser
      const context = this.context.variables;
      
      // Replace variable names with their values
      let expression = condition;
      Object.keys(context).forEach(key => {
        const value = context[key];
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        if (typeof value === 'string') {
          expression = expression.replace(regex, `"${value}"`);
        } else {
          expression = expression.replace(regex, String(value));
        }
      });

      // Evaluate the expression (basic implementation)
      return this.safeEvaluate(expression);
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Safe evaluation of simple expressions
   */
  private safeEvaluate(expression: string): boolean {
    const trimmed = expression.trim();

    // Handle direct boolean values first
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === '"true"') return true;
    if (trimmed === '"false"') return false;

    // Only allow safe operations for complex expressions
    const safeExpression = expression.replace(/[^a-zA-Z0-9\s"'<>=!&|()]/g, '');

    // Basic comparison operators
    if (safeExpression.includes('==')) {
      const [left, right] = safeExpression.split('==').map(s => s.trim());
      return this.parseValue(left) == this.parseValue(right);
    }
    if (safeExpression.includes('!=')) {
      const [left, right] = safeExpression.split('!=').map(s => s.trim());
      return this.parseValue(left) != this.parseValue(right);
    }
    if (safeExpression.includes('>=')) {
      const [left, right] = safeExpression.split('>=').map(s => s.trim());
      return Number(this.parseValue(left)) >= Number(this.parseValue(right));
    }
    if (safeExpression.includes('<=')) {
      const [left, right] = safeExpression.split('<=').map(s => s.trim());
      return Number(this.parseValue(left)) <= Number(this.parseValue(right));
    }
    if (safeExpression.includes('>')) {
      const [left, right] = safeExpression.split('>').map(s => s.trim());
      return Number(this.parseValue(left)) > Number(this.parseValue(right));
    }
    if (safeExpression.includes('<')) {
      const [left, right] = safeExpression.split('<').map(s => s.trim());
      return Number(this.parseValue(left)) < Number(this.parseValue(right));
    }

    // Boolean values
    const value = this.parseValue(safeExpression);
    return Boolean(value);
  }

  /**
   * Parse a value from string representation
   */
  private parseValue(value: string): any {
    const trimmed = value.trim();
    
    // String literals
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    
    // Numbers
    if (!isNaN(Number(trimmed))) {
      return Number(trimmed);
    }
    
    // Booleans
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    return trimmed;
  }

  /**
   * Parse function arguments
   */
  private parseArguments(argsString: string): any[] {
    if (!argsString.trim()) return [];

    // Split arguments while respecting quoted strings
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (char === ',' && !inQuotes) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args.map(arg => {
      // Check if it's a variable reference
      if (this.context.variables.hasOwnProperty(arg)) {
        return this.context.variables[arg];
      }

      return this.parseValue(arg);
    });
  }

  /**
   * Build default functions available in templates
   */
  private buildDefaultFunctions(): Record<string, Function> {
    return {
      // String functions
      upper: (str: string) => String(str).toUpperCase(),
      lower: (str: string) => String(str).toLowerCase(),
      capitalize: (str: string) => String(str).charAt(0).toUpperCase() + String(str).slice(1),
      length: (str: string | any[]) => str.length,
      
      // Array functions
      join: (arr: any[], separator = ', ') => Array.isArray(arr) ? arr.join(separator) : String(arr),
      first: (arr: any[]) => Array.isArray(arr) ? arr[0] : arr,
      last: (arr: any[]) => Array.isArray(arr) ? arr[arr.length - 1] : arr,
      
      // Math functions
      add: (a: number, b: number) => Number(a) + Number(b),
      subtract: (a: number, b: number) => Number(a) - Number(b),
      multiply: (a: number, b: number) => Number(a) * Number(b),
      divide: (a: number, b: number) => Number(a) / Number(b),
      
      // Utility functions
      default: (value: any, defaultValue: any) => value || defaultValue,
      format: (template: string, ...args: any[]) => {
        return template.replace(/{(\d+)}/g, (match, index) => args[index] || match);
      }
    };
  }

  /**
   * Set up template inheritance
   */
  private setupInheritance(baseTemplateString: string): void {
    this.baseTemplate = new AdvancedPromptTemplate({
      template: baseTemplateString,
      variables: this.context.variables,
      enableConditionals: this.advancedOptions.enableConditionals,
      enableLoops: this.advancedOptions.enableLoops,
      enableInheritance: false // Prevent infinite recursion
    });
  }

  /**
   * Process template inheritance
   * Syntax: {{#extends base}}...{{#block name}}content{{/block}}...{{/extends}}
   */
  private processInheritance(template: string): string {
    if (!this.baseTemplate) {
      return template;
    }

    // Extract blocks from child template
    const blockRegex = /\{\{#block\s+(\w+)\}\}([\s\S]*?)\{\{\/block\}\}/g;
    const blocks: Record<string, string> = {};
    
    let match;
    while ((match = blockRegex.exec(template)) !== null) {
      blocks[match[1]] = match[2];
    }

    // Render base template with block replacements
    let baseContent = this.baseTemplate.render(this.context.variables);
    
    // Replace block placeholders in base template
    Object.keys(blocks).forEach(blockName => {
      const blockPlaceholder = new RegExp(`\\{\\{#block\\s+${blockName}\\}\\}[\\s\\S]*?\\{\\{\\/block\\}\\}`, 'g');
      baseContent = baseContent.replace(blockPlaceholder, blocks[blockName]);
    });

    return baseContent;
  }

  /**
   * Get the effective template (considering inheritance)
   */
  private getEffectiveTemplate(): string {
    return this.advancedOptions.template;
  }

  /**
   * Add custom function to the template context
   */
  addFunction(name: string, func: Function): void {
    this.context.functions[name] = func;
  }

  /**
   * Get all variable names used in the template (overrides parent method)
   */
  getVariables(): string[] {
    const template = this.advancedOptions.template;
    const variables = new Set<string>();

    // Basic variable patterns {var} and {{var}}
    const basicVarRegex = /\{\{?(\w+)\}?\}/g;
    let match;
    while ((match = basicVarRegex.exec(template)) !== null) {
      // Skip control structures and functions
      if (!['if', 'else', 'each', 'block', 'section', 'extends'].includes(match[1]) &&
          !match[0].includes('(')) {
        variables.add(match[1]);
      }
    }

    // Variables in conditionals
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}/g;
    while ((match = conditionalRegex.exec(template)) !== null) {
      const condition = match[1].trim();
      const varMatches = condition.match(/\b(\w+)\b/g);
      if (varMatches) {
        varMatches.forEach(varName => {
          if (!['true', 'false', 'null', 'undefined'].includes(varName) &&
              isNaN(Number(varName))) {
            variables.add(varName);
          }
        });
      }
    }

    // Variables in loops
    const loopRegex = /\{\{#each\s+(\w+)\s+as\s+(\w+)\}\}/g;
    while ((match = loopRegex.exec(template)) !== null) {
      variables.add(match[1]); // array variable
    }

    // Variables in function calls
    const functionRegex = /\{\{(\w+)\(([^)]*)\)\}\}/g;
    while ((match = functionRegex.exec(template)) !== null) {
      const args = match[2].split(',').map(arg => arg.trim());
      args.forEach(arg => {
        if (this.context.variables.hasOwnProperty(arg)) {
          variables.add(arg);
        }
      });
    }

    return Array.from(variables);
  }

  /**
   * Get template analysis including conditional and loop blocks
   */
  analyze(): {
    variables: string[];
    conditionals: ConditionalResult[];
    loops: LoopResult[];
    functions: string[];
  } {
    const variables = this.getVariables();
    const template = this.advancedOptions.template;

    // Analyze conditionals
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}/g;
    const conditionals: ConditionalResult[] = [];
    let match;
    while ((match = conditionalRegex.exec(template)) !== null) {
      conditionals.push({
        condition: match[1].trim(),
        result: this.evaluateCondition(match[1].trim()),
        evaluatedContent: ''
      });
    }

    // Analyze loops
    const loopRegex = /\{\{#each\s+(\w+)\s+as\s+(\w+)\}\}/g;
    const loops: LoopResult[] = [];
    while ((match = loopRegex.exec(template)) !== null) {
      const array = this.context.variables[match[1]];
      loops.push({
        variable: match[1],
        iterations: Array.isArray(array) ? array.length : 0,
        content: ''
      });
    }

    // Analyze functions
    const functionRegex = /\{\{(\w+)\(/g;
    const functions: string[] = [];
    while ((match = functionRegex.exec(template)) !== null) {
      if (!functions.includes(match[1])) {
        functions.push(match[1]);
      }
    }

    return { variables, conditionals, loops, functions };
  }
}
