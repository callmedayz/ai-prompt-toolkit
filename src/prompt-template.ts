import { PromptTemplateOptions } from './types';

/**
 * A flexible prompt template system for AI applications
 */
export class PromptTemplate {
  private template: string;
  private variables: Record<string, any>;
  private escapeHtml: boolean;
  private preserveWhitespace: boolean;

  constructor(options: PromptTemplateOptions) {
    this.template = options.template;
    this.variables = options.variables || {};
    this.escapeHtml = options.escapeHtml || false;
    this.preserveWhitespace = options.preserveWhitespace || true;
  }

  /**
   * Render the template with provided variables
   */
  render(variables?: Record<string, any>): string {
    const allVariables = { ...this.variables, ...variables };
    let result = this.template;

    // Replace variables in the format {{variable}} or {variable}
    result = result.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (match, p1, p2) => {
      const key = p1 || p2;
      const value = allVariables[key];
      
      if (value === undefined) {
        throw new Error(`Variable '${key}' not found in template variables`);
      }

      let stringValue = String(value);
      
      if (this.escapeHtml) {
        stringValue = this.escapeHtmlChars(stringValue);
      }

      return stringValue;
    });

    // Handle whitespace preservation
    if (!this.preserveWhitespace) {
      result = result.replace(/\s+/g, ' ').trim();
    }

    return result;
  }

  /**
   * Get all variable names used in the template
   */
  getVariables(): string[] {
    const matches = this.template.match(/\{\{(\w+)\}\}|\{(\w+)\}/g) || [];
    const uniqueVars = new Set<string>();
    matches.forEach(match => {
      const cleaned = match.replace(/[{}]/g, '');
      uniqueVars.add(cleaned);
    });
    return Array.from(uniqueVars);
  }

  /**
   * Validate that all required variables are provided
   */
  validate(variables?: Record<string, any>): { isValid: boolean; missing: string[] } {
    const allVariables = { ...this.variables, ...variables };
    const requiredVars = this.getVariables();
    const missing = requiredVars.filter(varName => allVariables[varName] === undefined);
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }

  /**
   * Create a new template with updated variables
   */
  withVariables(variables: Record<string, any>): PromptTemplate {
    return new PromptTemplate({
      template: this.template,
      variables: { ...this.variables, ...variables },
      escapeHtml: this.escapeHtml,
      preserveWhitespace: this.preserveWhitespace
    });
  }

  private escapeHtmlChars(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    
    return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
  }
}
