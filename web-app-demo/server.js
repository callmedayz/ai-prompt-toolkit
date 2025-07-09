const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const {
  AdvancedPromptTemplate,
  EnhancedAnalytics,
  OpenRouterClient,
  createTemplateComposer
} = require('@callmedayz/ai-prompt-toolkit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize AI Prompt Toolkit components
const client = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultModel: process.env.DEFAULT_MODEL || 'google/gemini-2.0-flash-exp:free'
});

const analytics = new EnhancedAnalytics({
  enableRealTimeMonitoring: true,
  alertThresholds: {
    successRate: { warning: 90, critical: 80 },
    responseTime: { warning: 3000, critical: 8000 },
    errorRate: { warning: 10, critical: 25 }
  }
});

analytics.enableRealTimeMonitoring();
const dashboard = analytics.getDashboard();

// Template composer setup
const composer = createTemplateComposer();

// Register templates
composer.registerTemplate('simple_explanation', new AdvancedPromptTemplate({
  template: `Explain {topic} in simple, easy-to-understand terms.
Use examples and avoid technical jargon.
Make it accessible for beginners.

Topic: {topic}`,
  variables: {}
}));

composer.registerTemplate('technical_analysis', new AdvancedPromptTemplate({
  template: `Provide a comprehensive technical analysis of {topic}.
Include implementation details, best practices, and code examples where applicable.
Assume expert-level knowledge.

{{#if include_code}}
Please include practical code examples.
{{/if}}

{{#if focus_areas && length(focus_areas) > 0}}
Focus on these specific areas:
{{#each focus_areas as area}}
• {area}
{{/each}}
{{/if}}

Topic: {topic}`,
  variables: {}
}));

composer.registerTemplate('creative_exploration', new AdvancedPromptTemplate({
  template: `Explore {topic} from creative and innovative perspectives.
Think outside the box and consider:
• Interdisciplinary connections
• Unexpected use cases
• Future possibilities
• Novel applications

Generate unique insights and unconventional ideas.

Topic: {topic}`,
  variables: {}
}));

// Add composition rules
composer.addCompositionRule({
  name: 'expert_rule',
  conditions: [{ field: 'user_level', operator: 'greater_than', value: 7 }],
  templatePattern: 'technical_analysis',
  priority: 10
});

composer.addCompositionRule({
  name: 'beginner_rule',
  conditions: [{ field: 'user_level', operator: 'less_than', value: 4 }],
  templatePattern: 'simple_explanation',
  priority: 8
});

composer.addCompositionRule({
  name: 'creative_rule',
  conditions: [{ field: 'task_type', operator: 'equals', value: 'creative' }],
  templatePattern: 'creative_exploration',
  priority: 9
});

// Routes

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Generate prompt with advanced template
app.post('/api/generate-prompt', async (req, res) => {
  try {
    const { template, variables } = req.body;
    
    const promptTemplate = new AdvancedPromptTemplate({
      template,
      variables
    });
    
    const generatedPrompt = promptTemplate.render();
    
    res.json({
      success: true,
      prompt: generatedPrompt,
      variables: Object.keys(variables)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// API: Compose template based on context
app.post('/api/compose-template', async (req, res) => {
  try {
    const { context } = req.body;
    
    const result = composer.compose(context);
    
    res.json({
      success: true,
      templateName: result.templateName,
      prompt: result.prompt,
      appliedRules: result.appliedRules,
      score: result.score
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// API: Make AI completion
app.post('/api/ai-complete', async (req, res) => {
  const startTime = Date.now();

  try {
    const { prompt, maxTokens = 300, temperature = 0.7 } = req.body;
    
    const response = await client.completion({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.DEFAULT_MODEL,
      max_tokens: maxTokens,
      temperature: temperature
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Record execution for analytics
    const execution = {
      id: `web_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      promptVersionId: 'web_demo_v1',
      input: prompt,
      output: response.choices[0].message.content,
      responseTime: responseTime,
      tokenUsage: response.usage.total_tokens,
      cost: 0, // Free model
      success: true,
      timestamp: new Date()
    };
    
    analytics.recordExecution(execution, process.env.DEFAULT_MODEL);
    
    res.json({
      success: true,
      content: response.choices[0].message.content,
      usage: response.usage,
      responseTime: responseTime,
      model: process.env.DEFAULT_MODEL
    });
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Record failed execution
    const execution = {
      id: `web_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      promptVersionId: 'web_demo_v1',
      input: req.body.prompt || '',
      output: '',
      responseTime: responseTime,
      tokenUsage: 0,
      cost: 0,
      success: false,
      timestamp: new Date(),
      error: error.message
    };
    
    analytics.recordExecution(execution, process.env.DEFAULT_MODEL);
    
    res.status(500).json({
      success: false,
      error: error.message,
      responseTime: responseTime
    });
  }
});

// API: Get real-time metrics
app.get('/api/metrics', (req, res) => {
  try {
    const metrics = analytics.getRealTimeMetrics();
    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: Get dashboard layouts
app.get('/api/dashboard/layouts', (req, res) => {
  try {
    const layouts = dashboard.getLayouts();
    res.json({
      success: true,
      layouts: layouts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: Get recent events
app.get('/api/events', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const severity = req.query.severity;
    
    const events = analytics.getLiveEvents(limit, severity);
    res.json({
      success: true,
      events: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    analytics: {
      realTimeEnabled: analytics.isRealTimeEnabled,
      dashboardLayouts: dashboard.getLayouts().length
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Prompt Toolkit Web Demo running on http://localhost:${PORT}`);
  console.log(`📊 Real-time analytics: ${analytics.isRealTimeEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`🤖 Default model: ${process.env.DEFAULT_MODEL}`);
  console.log(`📋 Dashboard layouts: ${dashboard.getLayouts().length}`);
});
