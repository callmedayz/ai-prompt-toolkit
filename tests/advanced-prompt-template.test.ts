import { AdvancedPromptTemplate } from '../src/advanced-prompt-template';
import { TemplateComposer } from '../src/template-composition';
import { TemplateInheritanceManager } from '../src/template-inheritance';

describe('AdvancedPromptTemplate', () => {
  describe('conditional logic', () => {
    it('should process if/else conditionals correctly', () => {
      const template = new AdvancedPromptTemplate({
        template: '{{#if user_type == "admin"}}Admin access granted{{#else}}Regular user access{{/if}}',
        variables: { user_type: 'admin' }
      });

      const result = template.render();
      expect(result).toBe('Admin access granted');
    });

    it('should handle false conditions', () => {
      const template = new AdvancedPromptTemplate({
        template: '{{#if user_type == "admin"}}Admin access{{#else}}Regular access{{/if}}',
        variables: { user_type: 'user' }
      });

      const result = template.render();
      expect(result).toBe('Regular access');
    });

    it('should handle numeric comparisons', () => {
      const template = new AdvancedPromptTemplate({
        template: '{{#if score > 80}}Excellent{{#else}}Good effort{{/if}}',
        variables: { score: 85 }
      });

      const result = template.render();
      expect(result).toBe('Excellent');
    });

    it('should handle nested conditionals', () => {
      const template = new AdvancedPromptTemplate({
        template: `{{#if level == "expert"}}
{{#if task_type == "complex"}}
Expert complex task
{{#else}}
Expert simple task
{{/if}}
{{#else}}
Beginner task
{{/if}}`,
        variables: { level: 'expert', task_type: 'complex' }
      });

      const result = template.render();
      expect(result.trim()).toContain('Expert complex task');
    });
  });

  describe('loop processing', () => {
    it('should process each loops correctly', () => {
      const template = new AdvancedPromptTemplate({
        template: 'Items: {{#each items as item}}{item}{{/each}}',
        variables: { items: ['apple', 'banana', 'cherry'] }
      });

      const result = template.render();
      expect(result).toBe('Items: applebananacherry');
    });

    it('should provide loop context variables', () => {
      const template = new AdvancedPromptTemplate({
        template: '{{#each items as item}}{item_index}: {item}{{#if !item_last}}, {{/if}}{{/each}}',
        variables: { items: ['first', 'second', 'third'] }
      });

      const result = template.render();
      expect(result).toContain('0: first');
      expect(result).toContain('1: second');
      expect(result).toContain('2: third');
    });

    it('should handle empty arrays', () => {
      const template = new AdvancedPromptTemplate({
        template: 'Items: {{#each items as item}}{item}{{/each}}Done',
        variables: { items: [] }
      });

      const result = template.render();
      expect(result).toBe('Items: Done');
    });

    it('should throw error for non-array variables', () => {
      const template = new AdvancedPromptTemplate({
        template: '{{#each items as item}}{item}{{/each}}',
        variables: { items: 'not an array' }
      });

      expect(() => template.render()).toThrow("Variable 'items' is not an array for loop");
    });
  });

  describe('custom functions', () => {
    it('should use built-in functions', () => {
      const template = new AdvancedPromptTemplate({
        template: 'Hello {{upper(name)}}! You have {{length(items)}} items.',
        variables: { name: 'alice', items: ['a', 'b', 'c'] }
      });

      const result = template.render();
      expect(result).toBe('Hello ALICE! You have 3 items.');
    });

    it('should use custom functions', () => {
      const template = new AdvancedPromptTemplate({
        template: 'Price: {{currency(amount)}}',
        variables: { amount: 1234.56 },
        customFunctions: {
          currency: (amount: number) => `$${amount.toFixed(2)}`
        }
      });

      const result = template.render();
      expect(result).toBe('Price: $1234.56');
    });

    it('should handle function arguments', () => {
      const template = new AdvancedPromptTemplate({
        template: 'Result: {{add(a, b)}}',
        variables: { a: 5, b: 3 }
      });

      const result = template.render();
      expect(result).toBe('Result: 8');
    });

    it('should throw error for unknown functions', () => {
      const template = new AdvancedPromptTemplate({
        template: '{{unknown_function(value)}}',
        variables: { value: 'test' }
      });

      expect(() => template.render()).toThrow("Function 'unknown_function' not found");
    });
  });

  describe('template analysis', () => {
    it('should analyze template structure', () => {
      const template = new AdvancedPromptTemplate({
        template: `
{{#if condition}}
{{#each items as item}}
{item} - {{upper(item)}}
{{/each}}
{{/if}}
        `.trim(),
        variables: { condition: true, items: ['test'] }
      });

      const analysis = template.analyze();
      
      expect(analysis.variables).toContain('condition');
      expect(analysis.variables).toContain('items');
      expect(analysis.conditionals).toHaveLength(1);
      expect(analysis.loops).toHaveLength(1);
      expect(analysis.functions).toContain('upper');
    });
  });

  describe('complex scenarios', () => {
    it('should handle simple conditional in loop', () => {
      const template = new AdvancedPromptTemplate({
        template: '{{#each items as item}}{{#if item.active}}Active: {item.name}{{/if}}{{/each}}',
        variables: {
          items: [
            { name: 'test1', active: true },
            { name: 'test2', active: false }
          ]
        }
      });

      const result = template.render();
      expect(result).toContain('Active: test1');
      expect(result).not.toContain('test2');
    });

    it('should handle function calls', () => {
      const template = new AdvancedPromptTemplate({
        template: 'Team: {{join(team_members, ", ")}}',
        variables: {
          team_members: ['Alice', 'Bob', 'Carol']
        }
      });

      const result = template.render();
      expect(result).toContain('Team: Alice, Bob, Carol');
    });

    it('should handle function calls in conditionals', () => {
      const template = new AdvancedPromptTemplate({
        template: '{{#if length(team_members) > 0}}Team: {{join(team_members, ", ")}}{{/if}}',
        variables: {
          team_members: ['Alice', 'Bob', 'Carol']
        }
      });

      const result = template.render();
      expect(result).toContain('Team: Alice, Bob, Carol');
    });

    it('should handle complex template with all features', () => {
      const template = new AdvancedPromptTemplate({
        template: `
You are a {{#if user_level == "expert"}}senior{{#else}}junior{{/if}} developer.

{{#if show_tasks}}
Your tasks:
{{#each tasks as task}}
{task_index}. {{capitalize(task.name)}} - Priority: {{upper(task.priority)}}
{{#if task.urgent}}⚠️ URGENT{{/if}}
{{/each}}
{{/if}}

{{#if length(team_members) > 0}}
Team: {{join(team_members, ", ")}}
{{/if}}

Total tasks: {{length(tasks)}}
        `.trim(),
        variables: {
          user_level: 'expert',
          show_tasks: true,
          tasks: [
            { name: 'fix bug', priority: 'high', urgent: true },
            { name: 'write tests', priority: 'medium', urgent: false }
          ],
          team_members: ['Alice', 'Bob', 'Carol']
        }
      });

      const result = template.render();

      expect(result).toContain('senior developer');
      expect(result).toContain('0. Fix bug - Priority: HIGH');
      expect(result).toContain('⚠️ URGENT');
      expect(result).toContain('1. Write tests - Priority: MEDIUM');
      expect(result).toContain('Team: Alice, Bob, Carol');
      expect(result).toContain('Total tasks: 2');
    });
  });
});

describe('TemplateComposer', () => {
  let composer: TemplateComposer;

  beforeEach(() => {
    composer = new TemplateComposer();
  });

  describe('template registration', () => {
    it('should register templates', () => {
      const template = new AdvancedPromptTemplate({
        template: 'Test template: {content}',
        variables: {}
      });

      composer.registerTemplate('test', template);
      expect(composer.getTemplateNames()).toContain('test');
    });
  });

  describe('composition rules', () => {
    it('should apply composition rules', () => {
      const simpleTemplate = new AdvancedPromptTemplate({
        template: 'Simple: {content}',
        variables: {}
      });

      const complexTemplate = new AdvancedPromptTemplate({
        template: 'Complex analysis: {content}',
        variables: {}
      });

      composer.registerTemplate('simple', simpleTemplate);
      composer.registerTemplate('complex', complexTemplate);

      composer.addCompositionRule({
        name: 'complexity_rule',
        conditions: [
          { field: 'complexity', operator: 'greater_than', value: 5 }
        ],
        templatePattern: 'complex',
        priority: 10
      });

      composer.addCompositionRule({
        name: 'simple_rule',
        conditions: [
          { field: 'complexity', operator: 'less_than', value: 5 }
        ],
        templatePattern: 'simple',
        priority: 5
      });

      const result = composer.compose({
        complexity: 8,
        content: 'Test content'
      });

      expect(result.templateName).toBe('complex');
      expect(result.prompt).toContain('Complex analysis');
    });
  });
});

describe('TemplateInheritanceManager', () => {
  let manager: TemplateInheritanceManager;

  beforeEach(() => {
    manager = new TemplateInheritanceManager();
  });

  describe('base template registration', () => {
    it('should register base templates', () => {
      const baseTemplate = {
        name: 'base',
        template: 'Base: {{#block content}}Default content{{/block}}',
        defaultVariables: { test: 'value' }
      };

      manager.registerBaseTemplate('base', baseTemplate);
      expect(manager.getBaseTemplateNames()).toContain('base');
    });
  });

  describe('child template creation', () => {
    it('should create child templates with block overrides', () => {
      const baseTemplate = {
        name: 'base',
        template: 'Header\n{{#block content}}Default content{{/block}}\nFooter',
        defaultVariables: {}
      };

      manager.registerBaseTemplate('base', baseTemplate);

      const childTemplate = manager.createChildTemplate('base', {
        name: 'child',
        blocks: {
          content: {
            content: 'Custom content from child'
          }
        }
      });

      const result = childTemplate.render();
      expect(result).toContain('Custom content from child');
      expect(result).toContain('Header');
      expect(result).toContain('Footer');
    });

    it('should throw error for non-existent base template', () => {
      expect(() => {
        manager.createChildTemplate('nonexistent', {
          name: 'child',
          blocks: {}
        });
      }).toThrow("Base template 'nonexistent' not found");
    });
  });

  describe('template validation', () => {
    it('should validate template inheritance', () => {
      const baseTemplate = {
        name: 'base',
        template: '{{#block required}}{{/block}}',
        requiredBlocks: ['required']
      };

      manager.registerBaseTemplate('base', baseTemplate);

      const validation = manager.validateInheritance('base');
      expect(validation.isValid).toBe(true);
    });

    it('should detect missing base template', () => {
      const validation = manager.validateInheritance('nonexistent');
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Base template 'nonexistent' not found");
    });
  });
});
