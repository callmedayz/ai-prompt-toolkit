import { AdvancedPromptTemplate } from './advanced-prompt-template';
import { AdvancedTemplateOptions } from './types';

/**
 * Template Inheritance System
 * Enables hierarchical template structures with base templates and child templates
 */
export class TemplateInheritanceManager {
  private baseTemplates: Map<string, BaseTemplate> = new Map();
  private templateHierarchy: Map<string, string[]> = new Map(); // parent -> children

  /**
   * Register a base template
   */
  registerBaseTemplate(name: string, template: BaseTemplate): void {
    this.baseTemplates.set(name, template);
    if (!this.templateHierarchy.has(name)) {
      this.templateHierarchy.set(name, []);
    }
  }

  /**
   * Create a child template that inherits from a base template
   */
  createChildTemplate(
    baseName: string, 
    childOptions: ChildTemplateOptions
  ): AdvancedPromptTemplate {
    const baseTemplate = this.baseTemplates.get(baseName);
    if (!baseTemplate) {
      throw new Error(`Base template '${baseName}' not found`);
    }

    // Build the child template with inheritance
    const childTemplate = this.buildInheritedTemplate(baseTemplate, childOptions);
    
    // Track the inheritance relationship
    const children = this.templateHierarchy.get(baseName) || [];
    children.push(childOptions.name);
    this.templateHierarchy.set(baseName, children);

    return childTemplate;
  }

  /**
   * Build an inherited template by combining base and child specifications
   */
  private buildInheritedTemplate(
    baseTemplate: BaseTemplate, 
    childOptions: ChildTemplateOptions
  ): AdvancedPromptTemplate {
    // Start with base template structure
    let templateString = baseTemplate.template;

    // Replace or extend blocks defined in child
    if (childOptions.blocks) {
      Object.entries(childOptions.blocks).forEach(([blockName, blockContent]) => {
        const blockRegex = new RegExp(
          `\\{\\{#block\\s+${blockName}\\}\\}[\\s\\S]*?\\{\\{\\/block\\}\\}`, 
          'g'
        );
        
        if (blockRegex.test(templateString)) {
          // Replace existing block
          templateString = templateString.replace(
            blockRegex, 
            `{{#block ${blockName}}}${blockContent.content}{{/block}}`
          );
        } else {
          // Add new block at the end
          templateString += `\n{{#block ${blockName}}}${blockContent.content}{{/block}}`;
        }
      });
    }

    // Handle section extensions
    if (childOptions.sections) {
      Object.entries(childOptions.sections).forEach(([sectionName, sectionOptions]) => {
        const sectionRegex = new RegExp(
          `\\{\\{#section\\s+${sectionName}\\}\\}([\\s\\S]*?)\\{\\{\\/section\\}\\}`, 
          'g'
        );
        
        templateString = templateString.replace(sectionRegex, (match, existingContent) => {
          let newContent = existingContent;
          
          switch (sectionOptions.mode) {
            case 'replace':
              newContent = sectionOptions.content;
              break;
            case 'prepend':
              newContent = sectionOptions.content + '\n' + existingContent;
              break;
            case 'append':
              newContent = existingContent + '\n' + sectionOptions.content;
              break;
            default:
              newContent = sectionOptions.content;
          }
          
          return `{{#section ${sectionName}}}${newContent}{{/section}}`;
        });
      });
    }

    // Merge variables (child overrides base)
    const mergedVariables = {
      ...baseTemplate.defaultVariables,
      ...childOptions.variables
    };

    // Merge custom functions
    const mergedFunctions: Record<string, (value: any, ...args: any[]) => any> = {
      ...(baseTemplate.customFunctions || {}),
      ...(childOptions.customFunctions || {})
    };

    return new AdvancedPromptTemplate({
      template: templateString,
      variables: mergedVariables,
      customFunctions: mergedFunctions,
      enableConditionals: true,
      enableLoops: true,
      enableInheritance: true,
      escapeHtml: childOptions.escapeHtml ?? baseTemplate.escapeHtml,
      preserveWhitespace: childOptions.preserveWhitespace ?? baseTemplate.preserveWhitespace
    });
  }

  /**
   * Get the inheritance hierarchy for a base template
   */
  getHierarchy(baseName: string): TemplateHierarchy {
    const children = this.templateHierarchy.get(baseName) || [];
    const baseTemplate = this.baseTemplates.get(baseName);
    
    return {
      baseName,
      baseTemplate: baseTemplate || null,
      children: children.map(childName => ({
        name: childName,
        // In a real implementation, you'd store child template metadata
        blocks: [],
        sections: []
      }))
    };
  }

  /**
   * Validate template inheritance structure
   */
  validateInheritance(baseName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const baseTemplate = this.baseTemplates.get(baseName);
    if (!baseTemplate) {
      errors.push(`Base template '${baseName}' not found`);
      return { isValid: false, errors, warnings };
    }

    // Check for required blocks
    if (baseTemplate.requiredBlocks) {
      baseTemplate.requiredBlocks.forEach(blockName => {
        const blockRegex = new RegExp(`\\{\\{#block\\s+${blockName}\\}\\}`);
        if (!blockRegex.test(baseTemplate.template)) {
          warnings.push(`Required block '${blockName}' not found in base template`);
        }
      });
    }

    // Check for circular dependencies (simplified check)
    const children = this.templateHierarchy.get(baseName) || [];
    if (children.includes(baseName)) {
      errors.push(`Circular dependency detected in template '${baseName}'`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get all base template names
   */
  getBaseTemplateNames(): string[] {
    return Array.from(this.baseTemplates.keys());
  }

  /**
   * Export template hierarchy as JSON
   */
  exportHierarchy(): Record<string, any> {
    const hierarchy: Record<string, any> = {};
    
    this.baseTemplates.forEach((template, name) => {
      hierarchy[name] = {
        template: template.template,
        defaultVariables: template.defaultVariables,
        children: this.templateHierarchy.get(name) || []
      };
    });
    
    return hierarchy;
  }
}

// Types for template inheritance
export interface BaseTemplate {
  name: string;
  template: string;
  description?: string;
  defaultVariables?: Record<string, any>;
  customFunctions?: Record<string, (value: any, ...args: any[]) => any>;
  requiredBlocks?: string[];
  optionalBlocks?: string[];
  escapeHtml?: boolean;
  preserveWhitespace?: boolean;
  metadata?: Record<string, any>;
}

export interface ChildTemplateOptions {
  name: string;
  blocks?: Record<string, BlockDefinition>;
  sections?: Record<string, SectionDefinition>;
  variables?: Record<string, any>;
  customFunctions?: Record<string, (value: any, ...args: any[]) => any>;
  escapeHtml?: boolean;
  preserveWhitespace?: boolean;
}

export interface BlockDefinition {
  content: string;
  mode?: 'replace' | 'extend';
  priority?: number;
}

export interface SectionDefinition {
  content: string;
  mode: 'replace' | 'prepend' | 'append';
}

export interface TemplateHierarchy {
  baseName: string;
  baseTemplate: BaseTemplate | null;
  children: {
    name: string;
    blocks: string[];
    sections: string[];
  }[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Helper function to create common base templates
 */
export function createCommonBaseTemplates(): BaseTemplate[] {
  return [
    {
      name: 'basic_prompt',
      template: `{{#section header}}
You are a helpful AI assistant.
{{/section}}

{{#section task}}
{{#block task_description}}
Please help with the following task:
{{/block}}
{{/section}}

{{#section content}}
{{#block main_content}}
{content}
{{/block}}
{{/section}}

{{#section instructions}}
{{#block instructions}}
Please provide a clear and helpful response.
{{/block}}
{{/section}}

{{#section footer}}
{{#block footer}}
Thank you for using our AI assistant.
{{/block}}
{{/section}}`,
      description: 'Basic prompt template with standard sections',
      defaultVariables: {
        content: 'Please specify the content to process'
      },
      requiredBlocks: ['main_content'],
      optionalBlocks: ['task_description', 'instructions', 'footer']
    },
    
    {
      name: 'analysis_prompt',
      template: `{{#section header}}
You are an expert analyst with deep knowledge in {domain}.
{{/section}}

{{#section context}}
{{#block context}}
{{#if context}}
Context: {context}
{{/if}}
{{/block}}
{{/section}}

{{#section task}}
{{#block analysis_task}}
Please analyze the following {content_type}:
{{/block}}
{{/section}}

{{#section content}}
{{#block main_content}}
{content}
{{/block}}
{{/section}}

{{#section requirements}}
{{#block analysis_requirements}}
Focus on:
{{#each focus_areas as area}}
- {area}
{{/each}}
{{/block}}
{{/section}}

{{#section output}}
{{#block output_format}}
Provide your analysis in the following format:
1. Summary
2. Key findings
3. Recommendations
{{/block}}
{{/section}}`,
      description: 'Template for analytical tasks',
      defaultVariables: {
        domain: 'general analysis',
        content_type: 'data',
        focus_areas: ['key insights', 'patterns', 'recommendations']
      },
      requiredBlocks: ['main_content', 'analysis_task'],
      optionalBlocks: ['context', 'analysis_requirements', 'output_format']
    },

    {
      name: 'creative_prompt',
      template: `{{#section header}}
You are a creative AI assistant specializing in {creative_domain}.
{{/section}}

{{#section inspiration}}
{{#block inspiration}}
{{#if inspiration_sources}}
Draw inspiration from: {inspiration_sources}
{{/if}}
{{/block}}
{{/section}}

{{#section task}}
{{#block creative_task}}
Create {creative_output_type} based on the following:
{{/block}}
{{/section}}

{{#section content}}
{{#block main_content}}
{content}
{{/block}}
{{/section}}

{{#section style}}
{{#block style_guide}}
Style requirements:
- Tone: {tone}
- Style: {style}
{{#if constraints}}
- Constraints: {constraints}
{{/if}}
{{/block}}
{{/section}}

{{#section output}}
{{#block creative_output}}
Please provide your creative response below:
{{/block}}
{{/section}}`,
      description: 'Template for creative tasks',
      defaultVariables: {
        creative_domain: 'content creation',
        creative_output_type: 'content',
        tone: 'engaging',
        style: 'creative'
      },
      requiredBlocks: ['main_content', 'creative_task'],
      optionalBlocks: ['inspiration', 'style_guide', 'creative_output']
    }
  ];
}

/**
 * Helper function to create a template inheritance manager with common base templates
 */
export function createInheritanceManager(): TemplateInheritanceManager {
  const manager = new TemplateInheritanceManager();
  
  // Register common base templates
  createCommonBaseTemplates().forEach(template => {
    manager.registerBaseTemplate(template.name, template);
  });
  
  return manager;
}
