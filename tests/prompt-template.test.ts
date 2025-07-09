import { PromptTemplate } from '../src/prompt-template';

describe('PromptTemplate', () => {
  describe('constructor', () => {
    it('should create a template with basic options', () => {
      const template = new PromptTemplate({
        template: 'Hello {name}!',
        variables: { name: 'World' }
      });
      
      expect(template).toBeInstanceOf(PromptTemplate);
    });
  });

  describe('render', () => {
    it('should render template with curly braces', () => {
      const template = new PromptTemplate({
        template: 'Hello {name}!',
        variables: { name: 'World' }
      });
      
      const result = template.render();
      expect(result).toBe('Hello World!');
    });

    it('should render template with double curly braces', () => {
      const template = new PromptTemplate({
        template: 'Hello {{name}}!',
        variables: { name: 'World' }
      });
      
      const result = template.render();
      expect(result).toBe('Hello World!');
    });

    it('should override variables in render', () => {
      const template = new PromptTemplate({
        template: 'Hello {name}!',
        variables: { name: 'World' }
      });
      
      const result = template.render({ name: 'Alice' });
      expect(result).toBe('Hello Alice!');
    });

    it('should throw error for missing variables', () => {
      const template = new PromptTemplate({
        template: 'Hello {name}!'
      });
      
      expect(() => template.render()).toThrow("Variable 'name' not found in template variables");
    });

    it('should handle HTML escaping when enabled', () => {
      const template = new PromptTemplate({
        template: 'Content: {content}',
        escapeHtml: true
      });
      
      const result = template.render({ content: '<script>alert("xss")</script>' });
      expect(result).toBe('Content: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should preserve whitespace by default', () => {
      const template = new PromptTemplate({
        template: 'Line 1\n  Line 2\n    Line 3'
      });
      
      const result = template.render();
      expect(result).toBe('Line 1\n  Line 2\n    Line 3');
    });

    it.skip('should compress whitespace when disabled', () => {
      const template = new PromptTemplate({
        template: 'Hello   there    how    are     you?',
        preserveWhitespace: false
      });

      const result = template.render();
      // Whitespace compression should work
      expect(result.length).toBeLessThan('Hello   there    how    are     you?'.length);
    });
  });

  describe('getVariables', () => {
    it('should extract variables from template', () => {
      const template = new PromptTemplate({
        template: 'Hello {name}, you are {age} years old!'
      });
      
      const variables = template.getVariables();
      expect(variables).toEqual(['name', 'age']);
    });

    it('should handle mixed bracket styles', () => {
      const template = new PromptTemplate({
        template: 'Hello {{name}}, you are {age} years old!'
      });
      
      const variables = template.getVariables();
      expect(variables).toEqual(['name', 'age']);
    });

    it('should return unique variables', () => {
      const template = new PromptTemplate({
        template: 'Hello {name}, {name} is {age} years old!'
      });
      
      const variables = template.getVariables();
      expect(variables).toEqual(['name', 'age']);
    });
  });

  describe('validate', () => {
    it('should validate when all variables are provided', () => {
      const template = new PromptTemplate({
        template: 'Hello {name}!'
      });
      
      const result = template.validate({ name: 'World' });
      expect(result.isValid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should identify missing variables', () => {
      const template = new PromptTemplate({
        template: 'Hello {name}, you are {age} years old!'
      });
      
      const result = template.validate({ name: 'Alice' });
      expect(result.isValid).toBe(false);
      expect(result.missing).toEqual(['age']);
    });
  });

  describe('withVariables', () => {
    it('should create new template with additional variables', () => {
      const template = new PromptTemplate({
        template: 'Hello {name}!',
        variables: { name: 'World' }
      });
      
      const newTemplate = template.withVariables({ name: 'Alice', greeting: 'Hi' });
      
      // Original template unchanged
      expect(template.render()).toBe('Hello World!');
      
      // New template has updated variables
      expect(newTemplate.render()).toBe('Hello Alice!');
    });
  });
});
