// Test Chamber Panel Component
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
        this.runTestBtn = null;
        this.responseOutput = null;
        this.yamlOutput = null;
        this.copyYamlBtn = null;
    }
    
    init() {
        this.container = document.querySelector('.test-chamber-panel');
        this.testMessageInput = document.getElementById('test-message-input');
        this.modelSelect = document.getElementById('model-select');
        this.temperatureSlider = document.getElementById('temperature-slider');
        this.temperatureValue = document.getElementById('temperature-value');
        this.runTestBtn = document.getElementById('run-test-btn');
        this.responseOutput = document.getElementById('test-response');
        this.yamlOutput = document.getElementById('yaml-output');
        this.copyYamlBtn = document.getElementById('copy-yaml-btn');
        
        this.setupEventListeners();
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
        
        // Copy YAML button
        if (this.copyYamlBtn) {
            this.copyYamlBtn.addEventListener('click', () => {
                this.handleCopyYaml();
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
            const modelDisplay = typeof model === 'string' ? model : `${model.name} (${model.size || 'unknown size'})`;
            
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
            temperature: parseFloat(this.temperatureSlider.value)
        };
        
        console.log('TestChamberPanel: Running test with data:', testData);
        this.eventBus.emit('test:run-requested', testData);
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
        
        // Enable copy button if YAML is available
        if (this.copyYamlBtn) {
            this.copyYamlBtn.disabled = !result.yaml_config;
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
        
        // Disable copy button
        if (this.copyYamlBtn) {
            this.copyYamlBtn.disabled = true;
        }
    }
    
    setLoadingState(isLoading) {
        if (this.runTestBtn) {
            this.runTestBtn.disabled = isLoading;
            const spinner = this.runTestBtn.querySelector('.loading-spinner');
            const text = this.runTestBtn.querySelector('.btn-text');
            
            if (spinner && text) {
                if (isLoading) {
                    spinner.style.display = 'inline-block';
                    text.textContent = 'Running Test...';
                } else {
                    spinner.style.display = 'none';
                    text.textContent = 'Run Test';
                }
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
}