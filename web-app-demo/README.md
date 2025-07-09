# AI Prompt Toolkit v2.6.0 - Web Demo

A comprehensive web application demonstrating the advanced features of AI Prompt Toolkit v2.6.0, including advanced templates, smart composition, and real-time analytics.

## Features Demonstrated

### 🔀 Advanced Template Features
- **Conditional Logic**: If/else statements with complex expressions
- **Loop Processing**: Array iteration with #each syntax
- **Function Calls**: Built-in functions like `upper()`, `capitalize()`, `length()`
- **Variable Substitution**: Dynamic content generation

### 🎯 Smart Template Composition
- **Rule-based Selection**: Automatic template selection based on context
- **Expert/Beginner Templates**: Different templates for different user levels
- **Creative Templates**: Specialized templates for creative tasks
- **Priority System**: Intelligent rule prioritization

### 📊 Real-time Analytics
- **Live Metrics**: Success rate, response time, throughput tracking
- **Event Monitoring**: Real-time event stream with severity levels
- **Performance Insights**: Instant feedback on AI performance
- **Dashboard Widgets**: Visual representation of key metrics

### 🤖 AI Integration
- **Google Gemini 2.0 Flash**: Free model integration for testing
- **Real API Calls**: Actual AI responses with performance tracking
- **Token Usage**: Detailed usage and cost tracking
- **Error Handling**: Comprehensive error management

## Installation & Setup

### Prerequisites
- Node.js 16+ installed
- OpenRouter API key (free tier available)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/callmedayz/ai-prompt-toolkit.git
   cd ai-prompt-toolkit/web-app-demo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your OpenRouter API key
   # OPENROUTER_API_KEY=your-api-key-here
   ```

   **Get a free API key**: Visit [OpenRouter.ai](https://openrouter.ai) to get a free API key

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

### Environment Setup
- **Required**: OpenRouter API key (free tier available)
- **Default Model**: `google/gemini-2.0-flash-exp:free` (no cost)
- **Port**: 3000 (configurable via PORT environment variable)

## Usage Guide

### Manual Template Mode

1. **Enter Template**: Use advanced syntax with conditionals and loops
   ```handlebars
   You are a {{#if user_type == "expert"}}senior{{#else}}junior{{/if}} developer.
   
   {{#if length(tasks) > 0}}
   Your tasks:
   {{#each tasks as task}}
   {task_index}. {{capitalize(task.name)}}
   {{/each}}
   {{/if}}
   ```

2. **Set Variables**: Provide JSON variables
   ```json
   {
     "user_type": "expert",
     "tasks": [
       {"name": "fix bug"},
       {"name": "write tests"}
     ]
   }
   ```

3. **Generate**: Click "Generate Prompt" to see the rendered result

### Smart Composition Mode

1. **Enter Context**: Provide context for automatic template selection
   ```json
   {
     "user_level": 8,
     "task_type": "analysis",
     "topic": "machine learning"
   }
   ```

2. **Auto-Select**: System automatically chooses the best template based on rules:
   - **Expert (level > 7)**: Technical analysis template
   - **Beginner (level < 4)**: Simple explanation template
   - **Creative task**: Creative exploration template

### AI Response

1. **Generate Prompt**: First create a prompt using either mode
2. **Get AI Response**: Click "Get AI Response" for actual AI completion
3. **View Results**: See formatted response with performance metrics

### Real-time Analytics

- **Metrics**: Monitor success rate, response time, and error rate
- **Events**: View real-time events and alerts
- **Performance**: Track AI performance over time

## API Endpoints

### Template Generation
- `POST /api/generate-prompt` - Generate prompt from template
- `POST /api/compose-template` - Smart template composition

### AI Integration
- `POST /api/ai-complete` - Get AI completion

### Analytics
- `GET /api/metrics` - Get real-time metrics
- `GET /api/events` - Get recent events
- `GET /api/dashboard/layouts` - Get dashboard layouts

### System
- `GET /api/health` - Health check

## Template Syntax Reference

### Conditionals
```handlebars
{{#if condition}}true content{{/if}}
{{#if condition}}true{{#else}}false{{/if}}
{{#if user_level > 5}}expert{{/if}}
```

### Loops
```handlebars
{{#each items as item}}
{item_index}. {item.name}
{{/each}}
```

### Functions
```handlebars
{{upper(text)}}           // UPPERCASE
{{lower(text)}}           // lowercase
{{capitalize(text)}}      // Capitalize
{{length(array)}}         // Array length
{{join(array, ", ")}}     // Join elements
{{add(a, b)}}            // Addition
{{default(value, "fallback")}} // Default value
```

## Example Templates

### Expert Analysis Template
```handlebars
You are a senior AI researcher with expertise in {domain}.

This is a complex analysis requiring systematic approach:
{{#each analysis_steps as step}}
{step_index}. {{capitalize(step)}}
{{/each}}

Context:
- Expertise Level: {{upper(user_type)}}
- Domain: {{capitalize(domain)}}
- Complexity: {complexity}/10

{{#if include_code}}
Please include practical code examples.
{{/if}}

Task: {main_task}
```

### Beginner Explanation Template
```handlebars
Explain {topic} in simple terms that anyone can understand.

{{#if use_analogies}}
Use analogies and real-world examples to make it clear.
{{/if}}

{{#if avoid_jargon}}
Avoid technical jargon and complex terminology.
{{/if}}

Focus on practical understanding and applications.
```

## Troubleshooting

### Common Issues

1. **"API Key not found"**: Check `.env` file has correct `OPENROUTER_API_KEY`
2. **"Rate limit exceeded"**: Wait a moment between requests (free tier limits)
3. **"Template parsing error"**: Check template syntax for proper `{{}}` brackets
4. **"Invalid JSON"**: Validate JSON format in variables/context fields

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in `.env`

## Performance Tips

1. **Use Free Models**: Stick to free models for development and testing
2. **Optimize Templates**: Keep templates concise for faster processing
3. **Monitor Metrics**: Use real-time analytics to track performance
4. **Handle Errors**: Implement proper error handling for production use

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, Bootstrap 5
- **AI Integration**: OpenRouter API with Google Gemini 2.0 Flash
- **Analytics**: AI Prompt Toolkit v2.6.0 real-time monitoring
- **Styling**: Custom CSS with responsive design

## License

MIT License - See main project for details

## Bug Tracking

This project maintains detailed bug tracking and resolution documentation:
- **Bug Reports**: See [docs/bug-tracking.md](./docs/bug-tracking.md) for all tracked issues
- **Known Issues**: Check common issues and solutions in bug tracking docs
- **Report Bugs**: Use the bug report template in the tracking documentation

## Support

For issues and questions:
- Check [bug tracking documentation](./docs/bug-tracking.md) for known issues
- Review the main [AI Prompt Toolkit documentation](https://github.com/callmedayz/ai-prompt-toolkit)
- Check the [v2.6.0 user guide](../docs/v2.6.0-user-guide.md)
- Open an issue on GitHub

---

**Built with AI Prompt Toolkit v2.6.0** 🚀
