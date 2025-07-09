import {
  AdvancedPromptTemplate,
  TemplateComposer,
  TemplateInheritanceManager,
  createTemplateComposer,
  createInheritanceManager,
  createCommonRules
} from '../src/index';

/**
 * Advanced Template Features Example (v2.5.0)
 * Demonstrates conditional logic, loops, inheritance, and dynamic composition
 */

async function demonstrateAdvancedTemplates() {
  console.log('🚀 Advanced Template Features Demo (v2.5.0)\n');

  // Example 1: Conditional Logic and Branching
  console.log('1️⃣ Conditional Logic and Branching:');
  
  const conditionalTemplate = new AdvancedPromptTemplate({
    template: `
You are a {{#if user_level == "expert"}}senior{{#else}}helpful{{/if}} AI assistant.

{{#if task_complexity > 5}}
This is a complex task that requires careful analysis.
Please break down your approach into steps:
{{#each steps as step}}
{step_index}. {step}
{{/each}}
{{#else}}
This is a straightforward task. Please provide a direct response.
{{/if}}

Task: {task_description}

{{#if include_examples}}
Here are some examples to guide your response:
{{#each examples as example}}
- {example}
{{/each}}
{{/if}}

{{#if user_level == "beginner"}}
Please explain your reasoning in simple terms.
{{#else}}
You may use technical terminology as appropriate.
{{/if}}
    `.trim(),
    variables: {
      user_level: 'expert',
      task_complexity: 7,
      include_examples: true,
      task_description: 'Optimize database query performance',
      steps: [
        'Analyze current query structure',
        'Identify bottlenecks',
        'Propose optimization strategies',
        'Implement changes',
        'Test and validate improvements'
      ],
      examples: [
        'Add appropriate indexes',
        'Optimize JOIN operations',
        'Use query caching'
      ]
    }
  });

  const conditionalResult = conditionalTemplate.render();
  console.log('✅ Conditional template rendered:');
  console.log(conditionalResult);
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 2: Template Inheritance
  console.log('2️⃣ Template Inheritance:');
  
  const inheritanceManager = createInheritanceManager();
  
  // Create a specialized analysis template that inherits from the base
  const specializedAnalysis = inheritanceManager.createChildTemplate('analysis_prompt', {
    name: 'financial_analysis',
    blocks: {
      analysis_task: {
        content: 'Please perform a comprehensive financial analysis of the following data:'
      },
      analysis_requirements: {
        content: `Focus on:
- Revenue trends and growth patterns
- Profitability metrics (gross margin, operating margin, net margin)
- Cash flow analysis
- Key financial ratios
- Risk assessment
- Investment recommendations`
      },
      output_format: {
        content: `Provide your analysis in the following format:
1. Executive Summary
2. Financial Performance Overview
3. Trend Analysis
4. Risk Assessment
5. Strategic Recommendations
6. Appendix (detailed calculations)`
      }
    },
    variables: {
      domain: 'financial analysis',
      content_type: 'financial data',
      context: 'Q4 2024 financial statements and market data'
    }
  });

  const inheritanceResult = specializedAnalysis.render({
    content: 'Revenue: $2.5M (up 15% YoY), Operating Expenses: $1.8M, Net Income: $0.7M'
  });
  
  console.log('✅ Inherited template rendered:');
  console.log(inheritanceResult.substring(0, 500) + '...');
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 3: Dynamic Template Composition
  console.log('3️⃣ Dynamic Template Composition:');
  
  const composer = createTemplateComposer({
    variables: {},
    functions: {},
    metadata: {}
  });

  // Register different templates for different scenarios
  composer.registerTemplate('simple_task', new AdvancedPromptTemplate({
    template: 'You are a helpful assistant. Please {task}: {content}',
    variables: { task: 'help with' }
  }));

  composer.registerTemplate('complex_analysis', new AdvancedPromptTemplate({
    template: `
You are an expert analyst. Please perform a detailed analysis of the following:

{content}

Requirements:
{{#each requirements as req}}
- {req}
{{/each}}

Please provide:
1. Detailed analysis
2. Key insights
3. Actionable recommendations
    `.trim(),
    variables: {
      requirements: ['thorough investigation', 'data-driven insights', 'strategic recommendations']
    }
  }));

  composer.registerTemplate('creative_brainstorm', new AdvancedPromptTemplate({
    template: `
You are a creative strategist. Let's brainstorm innovative solutions for:

{content}

Think outside the box and consider:
{{#each perspectives as perspective}}
- {perspective}
{{/each}}

Generate at least 5 creative ideas with brief explanations.
    `.trim(),
    variables: {
      perspectives: ['user experience', 'technology trends', 'market opportunities', 'sustainability']
    }
  }));

  // Add composition rules
  composer.addCompositionRule({
    name: 'complex_task_rule',
    conditions: [
      { field: 'task.complexity', operator: 'greater_than', value: 7 }
    ],
    templatePattern: 'complex_analysis',
    priority: 10
  });

  composer.addCompositionRule({
    name: 'creative_task_rule',
    conditions: [
      { field: 'task.type', operator: 'equals', value: 'creative' }
    ],
    templatePattern: 'creative_brainstorm',
    priority: 8
  });

  composer.addCompositionRule({
    name: 'simple_task_rule',
    conditions: [
      { field: 'task.complexity', operator: 'less_than', value: 5 }
    ],
    templatePattern: 'simple_task',
    priority: 5
  });

  // Test composition with different contexts
  const contexts = [
    {
      task: { complexity: 8, type: 'analysis' },
      content: 'Market research data for new product launch',
      userBehavior: { usageCount: 25, successfulPrompts: 20, totalPrompts: 25 }
    },
    {
      task: { complexity: 3, type: 'simple' },
      content: 'Summarize this article',
      userBehavior: { usageCount: 5, successfulPrompts: 4, totalPrompts: 5 }
    },
    {
      task: { complexity: 6, type: 'creative' },
      content: 'New marketing campaign for eco-friendly products',
      userBehavior: { usageCount: 15, successfulPrompts: 12, totalPrompts: 15 }
    }
  ];

  contexts.forEach((context, index) => {
    console.log(`\n📋 Context ${index + 1}: ${context.task.type} task (complexity: ${context.task.complexity})`);
    
    try {
      const compositionResult = composer.compose(context);
      console.log(`✅ Selected template: ${compositionResult.templateName}`);
      console.log(`📊 Applied rules: ${compositionResult.appliedRules.join(', ')}`);
      console.log(`🎯 Priority: ${compositionResult.metadata.selectedPriority}`);
      console.log('📝 Generated prompt:');
      console.log(compositionResult.prompt.substring(0, 200) + '...\n');
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  });

  console.log('='.repeat(80) + '\n');

  // Example 4: Advanced Functions and Utilities
  console.log('4️⃣ Advanced Functions and Utilities:');
  
  const functionalTemplate = new AdvancedPromptTemplate({
    template: `
Analysis Report for {{upper(company_name)}}

Generated on: {{format("Report Date: {0}", current_date)}}

{{#if length(key_metrics) > 0}}
Key Metrics:
{{#each key_metrics as metric}}
- {{capitalize(metric.name)}}: {{default(metric.value, "N/A")}}
{{/each}}
{{/if}}

Summary: {{capitalize(summary)}}

{{#if show_calculations}}
Calculations:
- Total Revenue: {{add(q1_revenue, q2_revenue, q3_revenue, q4_revenue)}}
- Average Quarterly Revenue: {{divide(add(q1_revenue, q2_revenue, q3_revenue, q4_revenue), 4)}}
{{/if}}

Team Members: {{join(team_members, " | ")}}
    `.trim(),
    variables: {
      company_name: 'acme corp',
      current_date: '2025-07-09',
      summary: 'strong performance across all quarters',
      show_calculations: true,
      q1_revenue: 250000,
      q2_revenue: 275000,
      q3_revenue: 290000,
      q4_revenue: 310000,
      key_metrics: [
        { name: 'growth rate', value: '15%' },
        { name: 'customer satisfaction', value: '4.8/5' },
        { name: 'market share', value: null }
      ],
      team_members: ['Alice Johnson', 'Bob Smith', 'Carol Davis']
    },
    customFunctions: {
      // Custom function to format currency
      currency: (amount: number) => `$${amount.toLocaleString()}`,
      // Custom function to calculate percentage
      percentage: (value: number, total: number) => `${((value / total) * 100).toFixed(1)}%`
    }
  });

  const functionalResult = functionalTemplate.render();
  console.log('✅ Functional template with custom functions:');
  console.log(functionalResult);
  console.log('\n' + '='.repeat(80) + '\n');

  // Example 5: Template Analysis
  console.log('5️⃣ Template Analysis:');
  
  const analysis = conditionalTemplate.analyze();
  console.log('📊 Template Analysis Results:');
  console.log(`Variables: ${analysis.variables.join(', ')}`);
  console.log(`Conditionals: ${analysis.conditionals.length} found`);
  analysis.conditionals.forEach((cond, index) => {
    console.log(`  ${index + 1}. "${cond.condition}" → ${cond.result}`);
  });
  console.log(`Loops: ${analysis.loops.length} found`);
  analysis.loops.forEach((loop, index) => {
    console.log(`  ${index + 1}. "${loop.variable}" (${loop.iterations} iterations)`);
  });
  console.log(`Functions: ${analysis.functions.join(', ')}`);

  console.log('\n🎉 Advanced Template Features Demo Complete!');
  console.log('\n📚 Features Demonstrated:');
  console.log('✅ Conditional logic with if/else statements');
  console.log('✅ Loop processing with #each');
  console.log('✅ Template inheritance with base templates');
  console.log('✅ Dynamic template composition with rules');
  console.log('✅ Custom functions and utilities');
  console.log('✅ Template analysis and introspection');
}

// Run the demo
if (require.main === module) {
  demonstrateAdvancedTemplates().catch(console.error);
}

export { demonstrateAdvancedTemplates };
