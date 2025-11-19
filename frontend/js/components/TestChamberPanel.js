// Test Chamber Panel Component
import { KiroweenEffect } from '../utils/KiroweenEffect.js';

export class TestChamberPanel {
    constructor({ eventBus, apiClient, config }) {
        this.eventBus = eventBus;
        this.apiClient = apiClient;
        this.config = config;
        this.availableModels = [];
        this.currentPromptContext = null;
        
        // DOM elements
        this.container = null;
        this.testMessageInput = null;
        this.modelSelect = null;
        this.temperatureSlider = null;
        this.temperatureValue = null;
        this.timeoutSlider = null;
        this.timeoutValue = null;
        this.runTestBtn = null;
        this.responseOutput = null;
        this.yamlOutput = null;
        this.copyResponseBtn = null;
        this.saveResponseBtn = null;
        this.copyYamlBtn = null;
        this.kiroweenCheckbox = null;
        
        // Kiroween effect instance
        this.kiroweenEffect = null;
    }
    
    init() {
        this.container = document.querySelector('.test-chamber-panel');
        this.testMessageInput = document.getElementById('test-message-input');
        this.modelSelect = document.getElementById('model-select');
        this.temperatureSlider = document.getElementById('temperature-slider');
        this.temperatureValue = document.getElementById('temperature-value');
        this.timeoutSlider = document.getElementById('timeout-slider');
        this.timeoutValue = document.getElementById('timeout-value');
        this.runTestBtn = document.getElementById('run-test-btn');
        this.responseOutput = document.getElementById('test-response');
        this.yamlOutput = document.getElementById('yaml-output');
        this.copyResponseBtn = document.getElementById('copy-response-btn');
        this.saveResponseBtn = document.getElementById('save-response-btn');
        this.copyYamlBtn = document.getElementById('copy-yaml-btn');
        this.kiroweenCheckbox = document.getElementById('kiroween-checkbox');
        
        // Initialize Kiroween effect
        this.kiroweenEffect = new KiroweenEffect();
        this.kiroweenEffect.init().then(() => {
            console.log('KiroweenEffect initialized, ghostAvailable:', this.kiroweenEffect.ghostAvailable);
        });
        
        this.setupEventListeners();
        this.initKiroweenCheckbox();
        console.log('TestChamberPanel initialized');
    }
    
    setupEventListeners() {
        // Temperature slider with validation
        if (this.temperatureSlider && this.temperatureValue) {
            this.temperatureSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.temperatureValue.textContent = value.toFixed(1);
                this.validateTemperature(value);
            });
        }
        
        // Timeout slider
        if (this.timeoutSlider && this.timeoutValue) {
            this.timeoutSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.timeoutValue.textContent = value;
            });
        }
        
        // Test message input validation
        if (this.testMessageInput) {
            this.testMessageInput.addEventListener('input', (e) => {
                this.validateTestMessage(e.target.value);
            });
            
            this.testMessageInput.addEventListener('blur', (e) => {
                this.validateTestMessage(e.target.value);
            });
        }
        
        // Model selection validation
        if (this.modelSelect) {
            this.modelSelect.addEventListener('change', (e) => {
                this.validateModelSelection(e.target.value);
            });
        }
        
        // Run test button
        if (this.runTestBtn) {
            this.runTestBtn.addEventListener('click', () => {
                this.handleRunTest();
            });
        }
        
        // Copy response button
        if (this.copyResponseBtn) {
            this.copyResponseBtn.addEventListener('click', () => {
                this.handleCopyResponse();
            });
        }
        
        // Save response button
        if (this.saveResponseBtn) {
            this.saveResponseBtn.addEventListener('click', () => {
                this.handleSaveResponse();
            });
        }
        
        // Copy YAML button
        if (this.copyYamlBtn) {
            this.copyYamlBtn.addEventListener('click', () => {
                this.handleCopyYaml();
            });
        }
        
        // Kiroween checkbox
        if (this.kiroweenCheckbox) {
            this.kiroweenCheckbox.addEventListener('change', (e) => {
                this.handleKiroweenToggle(e.target.checked);
            });
        }
    }
    
    async loadModels() {
        try {
            const response = await this.apiClient.getModels();
            this.availableModels = response.models || [];
            this.populateModelSelect();
            console.log('TestChamberPanel: Models loaded successfully', this.availableModels);
        } catch (error) {
            console.warn('Failed to load models:', error);
            // Set default model as fallback
            this.availableModels = [{ name: 'llama2', size: 'unknown' }];
            this.populateModelSelect();
        }
    }
    
    populateModelSelect() {
        if (!this.modelSelect) return;
        
        this.modelSelect.innerHTML = '';
        
        if (this.availableModels.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models available';
            option.disabled = true;
            this.modelSelect.appendChild(option);
            return;
        }
        
        this.availableModels.forEach(model => {
            const option = document.createElement('option');
            // Handle both string models and object models with name property
            const modelName = typeof model === 'string' ? model : model.name;
            // Display only the clean model name without size information
            const modelDisplay = modelName;
            
            option.value = modelName;
            option.textContent = modelDisplay;
            this.modelSelect.appendChild(option);
        });
        
        // Set default model
        if (this.config?.default_model) {
            this.modelSelect.value = this.config.default_model;
        } else if (this.availableModels.length > 0) {
            // Set first available model as default
            const firstModel = typeof this.availableModels[0] === 'string' ? this.availableModels[0] : this.availableModels[0].name;
            this.modelSelect.value = firstModel;
        }
    }
    
    updatePromptContext(prompt) {
        console.log('TestChamberPanel: updatePromptContext()', prompt);
        this.currentPromptContext = prompt;
        
        // Clear previous test results when prompt context changes
        this.clearTestResults();
        
        // Enable/disable run test button based on prompt availability
        if (this.runTestBtn) {
            this.runTestBtn.disabled = !prompt?.system_prompt?.trim();
        }
    }
    
    clearPromptContext() {
        console.log('TestChamberPanel: clearPromptContext()');
        this.currentPromptContext = null;
        
        // Clear test results
        this.clearTestResults();
        
        // Disable run test button
        if (this.runTestBtn) {
            this.runTestBtn.disabled = true;
        }
    }
    
    handleRunTest() {
        // Clear previous validation errors
        this.clearAllValidationErrors();
        
        // Validate all inputs
        if (!this.validateAllInputs()) {
            return;
        }
        
        const testMessage = this.testMessageInput.value.trim();
        const testData = {
            system_prompt: this.currentPromptContext.system_prompt,
            user_input: testMessage,
            model: this.modelSelect.value,
            temperature: parseFloat(this.temperatureSlider.value),
            timeout: parseInt(this.timeoutSlider.value)
        };
        
        console.log('TestChamberPanel: Running test with data:', testData);
        this.eventBus.emit('test:run-requested', testData);
    }
    
    handleCopyResponse() {
        const responseContent = this.responseOutput?.textContent?.trim();
        if (!responseContent) {
            this.eventBus.emit('toast:show', 'No response to copy', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(responseContent).then(() => {
            this.eventBus.emit('toast:show', 'Response copied to clipboard', 'success');
            console.log('TestChamberPanel: Response copied to clipboard');
        }).catch(error => {
            console.error('Failed to copy response:', error);
            this.eventBus.emit('toast:show', 'Failed to copy response', 'error');
        });
    }
    
    handleSaveResponse() {
        const responseContent = this.responseOutput?.textContent?.trim();
        if (!responseContent) {
            this.eventBus.emit('toast:show', 'No response to save', 'warning');
            return;
        }
        
        try {
            // Create a blob with the response content
            const blob = new Blob([responseContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            // Create a temporary download link
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            link.download = `response-${timestamp}.txt`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.eventBus.emit('toast:show', 'Response saved to file', 'success');
            console.log('TestChamberPanel: Response saved to file');
        } catch (error) {
            console.error('Failed to save response:', error);
            this.eventBus.emit('toast:show', 'Failed to save response', 'error');
        }
    }
    
    handleCopyYaml() {
        const yamlContent = this.yamlOutput?.textContent?.trim();
        if (!yamlContent) {
            this.eventBus.emit('toast:show', 'No YAML configuration to copy', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(yamlContent).then(() => {
            this.eventBus.emit('toast:show', 'YAML configuration copied to clipboard', 'success');
            console.log('TestChamberPanel: YAML copied to clipboard');
        }).catch(error => {
            console.error('Failed to copy YAML:', error);
            this.eventBus.emit('toast:show', 'Failed to copy YAML configuration', 'error');
            
            // Fallback: try to select the text for manual copying
            try {
                const range = document.createRange();
                range.selectNodeContents(this.yamlOutput);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                this.eventBus.emit('toast:show', 'YAML text selected - use Ctrl+C to copy', 'info');
            } catch (fallbackError) {
                console.error('Fallback copy method also failed:', fallbackError);
            }
        });
    }
    
    displayTestResult(result) {
        console.log('TestChamberPanel: displayTestResult()', result);
        
        // Display AI response
        if (this.responseOutput && result.response) {
            this.responseOutput.textContent = result.response;
            this.responseOutput.scrollTop = 0; // Scroll to top
        }
        
        // Display YAML configuration
        if (this.yamlOutput && result.yaml_config) {
            this.yamlOutput.textContent = result.yaml_config;
            this.yamlOutput.scrollTop = 0; // Scroll to top
        }
        
        // Show execution metadata if available
        if (result.execution_time) {
            const executionTime = parseFloat(result.execution_time).toFixed(2);
            this.eventBus.emit('toast:show', `Test completed in ${executionTime}s`, 'success');
        }
        
        // Enable response action buttons if response is available
        if (this.copyResponseBtn) {
            this.copyResponseBtn.disabled = !result.response;
        }
        if (this.saveResponseBtn) {
            this.saveResponseBtn.disabled = !result.response;
        }
        
        // Enable copy button if YAML is available
        if (this.copyYamlBtn) {
            this.copyYamlBtn.disabled = !result.yaml_config;
        }
        
        // Trigger Kiroween effect if test was successful and effect is enabled
        if (this.kiroweenEffect && this.isTestSuccessful(result)) {
            console.log('Triggering Kiroween effect - enabled:', this.kiroweenEffect.isEnabled(), 
                       'ghostAvailable:', this.kiroweenEffect.ghostAvailable);
            this.kiroweenEffect.trigger();
        } else {
            console.log('Kiroween effect NOT triggered - hasEffect:', !!this.kiroweenEffect, 
                       'isSuccessful:', this.isTestSuccessful(result));
        }
        
        this.eventBus.emit('test:completed', result);
    }
    
    updateConfig(newConfig) {
        this.config = newConfig;
        
        // Update temperature slider if config changed
        if (this.temperatureSlider && newConfig.default_temperature !== undefined) {
            this.temperatureSlider.value = newConfig.default_temperature;
            if (this.temperatureValue) {
                this.temperatureValue.textContent = parseFloat(newConfig.default_temperature).toFixed(1);
            }
        }
        
        // Update model selection if config changed
        if (this.modelSelect && newConfig.default_model) {
            this.modelSelect.value = newConfig.default_model;
        }
        
        console.log('TestChamberPanel: config updated', newConfig);
    }
    
    // Validation Methods
    
    validateTestMessage(message) {
        const trimmed = message.trim();
        const maxLength = 10000; // Match backend validation
        
        // Remove any existing error styling
        this.testMessageInput.classList.remove('error');
        this.removeValidationError('test-message-input');
        
        if (trimmed.length === 0) {
            this.showValidationError('test-message-input', 'Test message is required');
            return false;
        }
        
        if (trimmed.length > maxLength) {
            this.showValidationError('test-message-input', `Test message cannot exceed ${maxLength} characters`);
            return false;
        }
        
        return true;
    }
    
    validateTemperature(temperature) {
        const min = 0.0;
        const max = 2.0;
        
        // Remove any existing error styling
        this.temperatureSlider.classList.remove('error');
        this.removeValidationError('temperature-slider');
        
        if (temperature < min || temperature > max) {
            this.showValidationError('temperature-slider', `Temperature must be between ${min} and ${max}`);
            return false;
        }
        
        return true;
    }
    
    validateModelSelection(model) {
        // Remove any existing error styling
        this.modelSelect.classList.remove('error');
        this.removeValidationError('model-select');
        
        if (!model || model.trim() === '') {
            this.showValidationError('model-select', 'Please select a model');
            return false;
        }
        
        return true;
    }
    
    validateAllInputs() {
        const testMessage = this.testMessageInput?.value || '';
        const temperature = parseFloat(this.temperatureSlider?.value || 0.7);
        const model = this.modelSelect?.value || '';
        
        const isTestMessageValid = this.validateTestMessage(testMessage);
        const isTemperatureValid = this.validateTemperature(temperature);
        const isModelValid = this.validateModelSelection(model);
        
        // Check if system prompt is available
        if (!this.currentPromptContext?.system_prompt?.trim()) {
            this.eventBus.emit('toast:show', 'Please load or create a system prompt first', 'warning');
            return false;
        }
        
        return isTestMessageValid && isTemperatureValid && isModelValid;
    }
    
    showValidationError(elementId, message) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.classList.add('error');
        
        // Remove existing error message
        this.removeValidationError(elementId);
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.id = `${elementId}-error`;
        errorElement.textContent = message;
        
        // Insert error message after the element
        element.parentNode.insertBefore(errorElement, element.nextSibling);
        
        // Expand parameters section if error is in a parameter field
        if (elementId === 'model-select' || elementId === 'temperature-slider') {
            this.expandParametersSection();
        }
    }
    
    expandParametersSection() {
        // Import and use the collapsibleManager to expand the parameters section
        import('../utils/CollapsibleManager.js').then(module => {
            const collapsibleManager = module.collapsibleManager;
            if (collapsibleManager && !collapsibleManager.isExpanded('test-parameters')) {
                collapsibleManager.expand('test-parameters');
                console.log('TestChamberPanel: Parameters section expanded due to validation error');
            }
        }).catch(error => {
            console.error('Failed to expand parameters section:', error);
        });
    }
    
    removeValidationError(elementId) {
        const errorElement = document.getElementById(`${elementId}-error`);
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    clearAllValidationErrors() {
        // Remove error classes
        this.testMessageInput?.classList.remove('error');
        this.temperatureSlider?.classList.remove('error');
        this.modelSelect?.classList.remove('error');
        
        // Remove error messages
        this.removeValidationError('test-message-input');
        this.removeValidationError('temperature-slider');
        this.removeValidationError('model-select');
    }
    
    clearTestResults() {
        // Clear response output
        if (this.responseOutput) {
            this.responseOutput.textContent = '';
        }
        
        // Clear YAML output
        if (this.yamlOutput) {
            this.yamlOutput.textContent = '';
        }
        
        // Disable response action buttons
        if (this.copyResponseBtn) {
            this.copyResponseBtn.disabled = true;
        }
        if (this.saveResponseBtn) {
            this.saveResponseBtn.disabled = true;
        }
        
        // Disable copy button
        if (this.copyYamlBtn) {
            this.copyYamlBtn.disabled = true;
        }
    }
    
    setLoadingState(isLoading) {
        if (this.runTestBtn) {
            this.runTestBtn.disabled = isLoading;
            
            if (isLoading) {
                this.runTestBtn.classList.add('loading');
            } else {
                this.runTestBtn.classList.remove('loading');
            }
        }
        
        // Disable inputs during test execution
        if (this.testMessageInput) {
            this.testMessageInput.disabled = isLoading;
        }
        if (this.modelSelect) {
            this.modelSelect.disabled = isLoading;
        }
        if (this.temperatureSlider) {
            this.temperatureSlider.disabled = isLoading;
        }
        if (this.timeoutSlider) {
            this.timeoutSlider.disabled = isLoading;
        }
    }
    
    displayTestError(error) {
        console.error('TestChamberPanel: Test error:', error);
        
        // Clear previous results
        this.clearTestResults();
        
        // Display error in response output
        if (this.responseOutput) {
            this.responseOutput.textContent = `Error: ${error.message || 'Test execution failed'}`;
            this.responseOutput.style.color = 'var(--danger-color)';
        }
        
        // Show error toast
        this.eventBus.emit('toast:show', error.message || 'Test execution failed', 'error');
    }
    
    resetResponseStyling() {
        if (this.responseOutput) {
            this.responseOutput.style.color = '';
        }
    }
    
    // Kiroween Effect Methods
    
    initKiroweenCheckbox() {
        if (!this.kiroweenCheckbox || !this.kiroweenEffect) return;
        
        // Sync checkbox with stored preference
        this.kiroweenCheckbox.checked = this.kiroweenEffect.isEnabled();
        console.log('TestChamberPanel: Kiroween checkbox initialized, enabled:', this.kiroweenEffect.isEnabled());
    }
    
    handleKiroweenToggle(enabled) {
        if (!this.kiroweenEffect) return;
        
        this.kiroweenEffect.setEnabled(enabled);
        console.log('TestChamberPanel: Kiroween effect toggled:', enabled);
    }
    
    isTestSuccessful(result) {
        // Test is successful if:
        // 1. Response is present and non-empty
        // 2. No error property exists
        // 3. Status is not 'error' or 'timeout' (if status exists)
        
        if (!result) return false;
        
        // Check for error property
        if (result.error) return false;
        
        // Check status if it exists
        if (result.status && (result.status === 'error' || result.status === 'timeout')) {
            return false;
        }
        
        // Check for valid response
        if (!result.response || result.response.trim() === '') {
            return false;
        }
        
        return true;
    }
}