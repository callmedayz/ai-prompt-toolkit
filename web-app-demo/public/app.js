// AI Prompt Toolkit Web Demo - Frontend Application

class PromptToolkitDemo {
    constructor() {
        this.currentPrompt = '';
        this.loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMetrics();
        this.startMetricsPolling();
        this.checkHealth();
    }

    setupEventListeners() {
        // Template type toggle
        document.querySelectorAll('input[name="templateType"]').forEach(radio => {
            radio.addEventListener('change', this.handleTemplateTypeChange.bind(this));
        });

        // Generate prompt button
        document.getElementById('generate-btn').addEventListener('click', this.generatePrompt.bind(this));

        // AI complete button
        document.getElementById('ai-complete-btn').addEventListener('click', this.getAIResponse.bind(this));

        // Auto-resize textareas
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', this.autoResize);
        });
    }

    handleTemplateTypeChange(event) {
        const isManual = event.target.value === 'manual';
        document.getElementById('manual-section').style.display = isManual ? 'block' : 'none';
        document.getElementById('composed-section').style.display = isManual ? 'none' : 'block';
    }

    async generatePrompt() {
        const generateBtn = document.getElementById('generate-btn');
        const originalText = generateBtn.innerHTML;
        
        try {
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            generateBtn.disabled = true;

            const templateType = document.querySelector('input[name="templateType"]:checked').value;
            let result;

            if (templateType === 'manual') {
                result = await this.generateManualTemplate();
            } else {
                result = await this.generateComposedTemplate();
            }

            this.displayGeneratedPrompt(result);
            document.getElementById('ai-complete-btn').disabled = false;

        } catch (error) {
            this.showError('Failed to generate prompt: ' + error.message);
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }

    async generateManualTemplate() {
        const template = document.getElementById('template-input').value;
        const variablesText = document.getElementById('variables-input').value;

        if (!template.trim()) {
            throw new Error('Please enter a template');
        }

        let variables;
        try {
            variables = JSON.parse(variablesText);
        } catch (e) {
            throw new Error('Invalid JSON in variables field');
        }

        const response = await fetch('/api/generate-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template, variables })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }

        return {
            prompt: data.prompt,
            info: `Manual template with ${data.variables.length} variables`,
            type: 'manual'
        };
    }

    async generateComposedTemplate() {
        const contextText = document.getElementById('context-input').value;

        if (!contextText.trim()) {
            throw new Error('Please enter context for template composition');
        }

        let context;
        try {
            context = JSON.parse(contextText);
        } catch (e) {
            throw new Error('Invalid JSON in context field');
        }

        const response = await fetch('/api/compose-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }

        return {
            prompt: data.prompt,
            info: `Smart composition: ${data.templateName} (Rules: ${data.appliedRules.join(', ')}, Score: ${data.score})`,
            type: 'composed'
        };
    }

    displayGeneratedPrompt(result) {
        const promptDiv = document.getElementById('generated-prompt');
        const infoDiv = document.getElementById('template-info');

        promptDiv.textContent = result.prompt;
        promptDiv.classList.add('has-content', 'success-glow');
        
        infoDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${result.info}`;
        
        this.currentPrompt = result.prompt;

        // Remove glow effect after animation
        setTimeout(() => {
            promptDiv.classList.remove('success-glow');
        }, 2000);
    }

    async getAIResponse() {
        if (!this.currentPrompt) {
            this.showError('Please generate a prompt first');
            return;
        }

        const aiBtn = document.getElementById('ai-complete-btn');
        const originalText = aiBtn.innerHTML;
        
        try {
            aiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
            aiBtn.disabled = true;

            const response = await fetch('/api/ai-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: this.currentPrompt,
                    maxTokens: 400,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error);
            }

            this.displayAIResponse(data);
            this.loadMetrics(); // Refresh metrics after AI call

        } catch (error) {
            this.showError('AI request failed: ' + error.message);
        } finally {
            aiBtn.innerHTML = originalText;
            aiBtn.disabled = false;
        }
    }

    displayAIResponse(data) {
        const responseDiv = document.getElementById('ai-response');
        const infoDiv = document.getElementById('response-info');

        responseDiv.innerHTML = this.formatAIResponse(data.content);
        responseDiv.classList.add('has-content');
        
        infoDiv.innerHTML = `
            <i class="fas fa-robot"></i> Model: ${data.model} | 
            <i class="fas fa-clock"></i> ${data.responseTime}ms | 
            <i class="fas fa-coins"></i> ${data.usage.total_tokens} tokens
        `;
    }

    formatAIResponse(content) {
        // Basic formatting for better readability
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    async loadMetrics() {
        try {
            const response = await fetch('/api/metrics');
            const data = await response.json();
            
            if (data.success) {
                this.updateMetricsDisplay(data.metrics);
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
        }
    }

    updateMetricsDisplay(metrics) {
        metrics.forEach(metric => {
            const element = document.getElementById(this.getMetricElementId(metric.id));
            if (element) {
                element.textContent = this.formatMetricValue(metric);
                element.className = `metric-value status-${metric.status}`;
            }
        });
    }

    getMetricElementId(metricId) {
        const mapping = {
            'success_rate': 'success-rate',
            'average_response_time': 'response-time',
            'total_executions_5m': 'total-requests',
            'error_rate': 'error-rate'
        };
        return mapping[metricId] || metricId.replace(/_/g, '-');
    }

    formatMetricValue(metric) {
        switch (metric.format) {
            case 'percentage':
                return `${metric.value.toFixed(1)}%`;
            case 'duration':
                return `${metric.value.toFixed(0)}ms`;
            case 'currency':
                return `$${metric.value.toFixed(4)}`;
            default:
                return metric.value.toFixed(0);
        }
    }

    async loadEvents() {
        try {
            const response = await fetch('/api/events?limit=5');
            const data = await response.json();
            
            if (data.success) {
                this.updateEventsDisplay(data.events);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    }

    updateEventsDisplay(events) {
        const eventsContainer = document.getElementById('events-list');
        
        if (events.length === 0) {
            eventsContainer.innerHTML = '<div class="text-muted">No events yet...</div>';
            return;
        }

        eventsContainer.innerHTML = events.map(event => `
            <div class="event-item event-${event.severity}">
                <div class="d-flex justify-content-between">
                    <span><strong>${event.title}</strong></span>
                    <small>${this.formatTime(event.timestamp)}</small>
                </div>
                <div class="text-muted small">${event.description}</div>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    startMetricsPolling() {
        // Poll metrics every 5 seconds
        setInterval(() => {
            this.loadMetrics();
            this.loadEvents();
        }, 5000);
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('status-badge').innerHTML = 
                    '<i class="fas fa-circle"></i> Online';
                document.getElementById('status-badge').className = 'badge bg-success me-2';
            }
        } catch (error) {
            document.getElementById('status-badge').innerHTML = 
                '<i class="fas fa-circle"></i> Offline';
            document.getElementById('status-badge').className = 'badge bg-danger me-2';
        }
    }

    autoResize(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    showError(message) {
        // Create a temporary alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create a temporary success alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PromptToolkitDemo();
});
