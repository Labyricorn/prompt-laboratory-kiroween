// Settings Modal Component
export class SettingsModal {
    constructor({ eventBus, configService, config }) {
        this.eventBus = eventBus;
        this.configService = configService;
        this.config = config;
        this.isVisible = false;
        
        // DOM elements
        this.modal = null;
        this.overlay = null;
        this.closeBtn = null;
        this.form = null;
        this.saveBtn = null;
        this.cancelBtn = null;
        this.testConnectionBtn = null;
    }
    
    init() {
        this.createModal();
        this.setupEventListeners();
        this.initializeDarkMode();
        console.log('SettingsModal initialized');
    }
    
    createModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div class="settings-modal-overlay" id="settings-modal-overlay">
                <div class="settings-modal" role="dialog" aria-labelledby="settings-title" aria-modal="true">
                    <div class="modal-header">
                        <h2 id="settings-title">Settings</h2>
                        <button class="modal-close" id="settings-close" aria-label="Close settings">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form id="settings-form">
                            <div class="form-group">
                                <label for="ollama-endpoint">Ollama Endpoint</label>
                                <input type="url" id="ollama-endpoint" name="ollama_endpoint" 
                                       placeholder="http://localhost:11434" required>
                                <div class="form-help">URL of your Ollama instance</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="default-model">Default Model</label>
                                <select id="default-model" name="default_model">
                                    <option value="">Loading models...</option>
                                </select>
                                <div class="form-help">Default AI model for new prompts</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="default-temperature">
                                    Default Temperature: <span id="temp-display">0.7</span>
                                </label>
                                <input type="range" id="default-temperature" name="default_temperature" 
                                       min="0" max="2" step="0.1" value="0.7">
                                <div class="form-help">Default creativity level (0 = deterministic, 2 = very creative)</div>
                            </div>
                            
                            <div class="form-group">
                                <label class="toggle-label">
                                    <span class="toggle-text">Dark Mode</span>
                                    <div class="toggle-container">
                                        <input type="checkbox" id="dark-mode-toggle" class="toggle-input">
                                        <span class="toggle-slider">
                                            <span class="toggle-icon-light">☀️</span>
                                            <span class="toggle-icon-dark">🌙</span>
                                        </span>
                                    </div>
                                </label>
                                <div class="form-help">Switch between light and dark themes</div>
                            </div>
                            
                            <div class="form-group">
                                <button type="button" id="test-connection" class="btn btn-secondary">
                                    <span class="btn-text">Test Connection</span>
                                    <span class="loading-spinner"></span>
                                </button>
                                <div id="connection-status" class="connection-status"></div>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" id="settings-cancel" class="btn btn-secondary">Cancel</button>
                        <button type="button" id="settings-save" class="btn btn-primary">Save</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Get references to elements
        this.overlay = document.getElementById('settings-modal-overlay');
        this.modal = this.overlay.querySelector('.settings-modal');
        this.closeBtn = document.getElementById('settings-close');
        this.form = document.getElementById('settings-form');
        this.saveBtn = document.getElementById('settings-save');
        this.cancelBtn = document.getElementById('settings-cancel');
        this.testConnectionBtn = document.getElementById('test-connection');
        
        // Add CSS styles
        this.addStyles();
    }
    
    addStyles() {
        const styles = `
            <style>
                .settings-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .settings-modal-overlay.show {
                    opacity: 1;
                    visibility: visible;
                }
                
                .settings-modal {
                    background: var(--bg-primary);
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                
                .settings-modal-overlay.show .settings-modal {
                    transform: scale(1);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .modal-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: var(--text-primary);
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    color: var(--text-secondary);
                }
                
                .modal-close:hover {
                    color: var(--text-primary);
                }
                
                .modal-body {
                    padding: 1.5rem;
                }
                
                .form-group {
                    margin-bottom: 1.5rem;
                }
                
                .form-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: var(--text-primary);
                }
                
                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius);
                    font-size: 0.875rem;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }
                
                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
                }
                
                .form-help {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-top: 0.25rem;
                }
                
                .connection-status {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    border-radius: var(--border-radius);
                    font-size: 0.875rem;
                }
                
                .connection-status.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .connection-status.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                    padding: 1.5rem;
                    border-top: 1px solid var(--border-color);
                }
                
                .btn.loading {
                    position: relative;
                    color: transparent;
                }
                
                .btn.loading .loading-spinner {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    color: white;
                }
                
                .btn:not(.loading) .loading-spinner {
                    display: none;
                }
                
                @keyframes spin {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                
                /* Dark mode toggle styles */
                .toggle-label {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    font-weight: 500;
                    margin-bottom: 0;
                    width: 100%;
                }
                
                .toggle-container {
                    position: relative;
                }
                
                .toggle-input {
                    display: none;
                }
                
                .toggle-slider {
                    position: relative;
                    width: 60px;
                    height: 32px;
                    background-color: #e0e0e0;
                    border-radius: 16px;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 4px;
                }
                
                .toggle-slider::before {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 24px;
                    height: 24px;
                    background-color: white;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    z-index: 2;
                }
                
                .toggle-icon-light,
                .toggle-icon-dark {
                    font-size: 12px;
                    z-index: 1;
                    transition: opacity 0.3s ease;
                }
                
                .toggle-icon-light {
                    opacity: 1;
                }
                
                .toggle-icon-dark {
                    opacity: 0.3;
                }
                
                .toggle-input:checked + .toggle-slider {
                    background-color: var(--primary-color);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .toggle-input:checked + .toggle-slider::before {
                    transform: translateX(28px);
                }
                
                .toggle-input:checked + .toggle-slider .toggle-icon-light {
                    opacity: 0.3;
                }
                
                .toggle-input:checked + .toggle-slider .toggle-icon-dark {
                    opacity: 1;
                }
                
                .toggle-slider:hover {
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.15), 0 0 0 2px rgba(0, 122, 204, 0.2);
                }
                
                .toggle-text {
                    color: var(--text-primary);
                    font-size: 0.875rem;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    setupEventListeners() {
        // Close modal handlers
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }
        
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.hide());
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });
        }
        
        // Save button
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.handleSave());
        }
        
        // Test connection button
        if (this.testConnectionBtn) {
            this.testConnectionBtn.addEventListener('click', () => this.handleTestConnection());
        }
        
        // Temperature slider
        const tempSlider = document.getElementById('default-temperature');
        const tempDisplay = document.getElementById('temp-display');
        if (tempSlider && tempDisplay) {
            tempSlider.addEventListener('input', (e) => {
                tempDisplay.textContent = e.target.value;
            });
        }
        
        // Dark mode toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                this.handleDarkModeToggle(e.target.checked);
            });
        }
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    async show() {
        this.isVisible = true;
        
        // Load current config first (this ensures endpoint is populated)
        await this.loadCurrentConfig();
        
        // Then load available models
        this.loadAvailableModels();
        
        if (this.overlay) {
            this.overlay.classList.add('show');
            this.overlay.setAttribute('aria-hidden', 'false');
        }
        
        // Apply current theme to modal
        this.updateModalTheme();
        
        // Focus first input
        const firstInput = this.form?.querySelector('input, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    hide() {
        this.isVisible = false;
        
        if (this.overlay) {
            this.overlay.classList.remove('show');
            this.overlay.setAttribute('aria-hidden', 'true');
        }
    }
    
    async loadCurrentConfig() {
        if (!this.form) return;
        
        // Get the latest config from the service
        let currentConfig = this.config;
        try {
            // Try to get fresh config from the service
            const freshConfig = await this.configService.getConfig();
            if (freshConfig) {
                currentConfig = freshConfig;
                this.config = freshConfig; // Update our local copy
            }
        } catch (error) {
            console.warn('Failed to load fresh config, using cached config:', error);
        }
        
        // Ensure we have a config object with defaults
        const config = currentConfig || {};
        
        // Populate form with current config, always providing fallback values
        const endpointInput = document.getElementById('ollama-endpoint');
        if (endpointInput) {
            const endpoint = config.ollama_endpoint || 'http://localhost:11434';
            endpointInput.value = endpoint;
            console.log('Settings modal: Set endpoint to', endpoint);
        }
        
        const modelSelect = document.getElementById('default-model');
        if (modelSelect) {
            modelSelect.value = config.default_model || 'llama2';
        }
        
        const tempSlider = document.getElementById('default-temperature');
        const tempDisplay = document.getElementById('temp-display');
        if (tempSlider && tempDisplay) {
            const temp = config.default_temperature || 0.7;
            tempSlider.value = temp;
            tempDisplay.textContent = temp;
        }
        
        // Load dark mode setting
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            const isDarkMode = this.getDarkModeSetting();
            darkModeToggle.checked = isDarkMode;
        }
    }
    
    async loadAvailableModels() {
        const modelSelect = document.getElementById('default-model');
        if (!modelSelect) return;
        
        // Show loading state
        modelSelect.innerHTML = '<option value="">Loading models...</option>';
        modelSelect.disabled = true;
        
        try {
            const response = await this.configService.getAvailableModels();
            
            modelSelect.innerHTML = '';
            modelSelect.disabled = false;
            
            // Handle different response formats
            let models = [];
            if (Array.isArray(response)) {
                models = response;
            } else if (response && Array.isArray(response.models)) {
                models = response.models;
            } else if (response && response.success && Array.isArray(response.models)) {
                models = response.models;
            } else {
                console.warn('Unexpected models response format:', response);
                models = [];
            }
            
            if (models.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No models available - check Ollama connection';
                option.disabled = true;
                modelSelect.appendChild(option);
                return;
            }
            
            // Add models to dropdown
            models.forEach(model => {
                const option = document.createElement('option');
                // Handle both string and object model formats
                const modelName = typeof model === 'string' ? model : (model.name || model.model || model);
                option.value = modelName;
                option.textContent = modelName;
                modelSelect.appendChild(option);
            });
            
            // Set current value
            if (this.config?.default_model) {
                modelSelect.value = this.config.default_model;
            }
            
        } catch (error) {
            console.warn('Failed to load models for settings:', error);
            
            modelSelect.disabled = false;
            modelSelect.innerHTML = '';
            
            // Add fallback options
            const fallbackModels = ['llama2', 'llama3', 'mistral', 'codellama'];
            fallbackModels.forEach(modelName => {
                const option = document.createElement('option');
                option.value = modelName;
                option.textContent = modelName;
                modelSelect.appendChild(option);
            });
            
            // Set current value or default
            if (this.config?.default_model) {
                modelSelect.value = this.config.default_model;
            } else {
                modelSelect.value = 'llama2';
            }
            
            // Show error message
            this.eventBus.emit('toast:show', 'Failed to load models from Ollama. Using fallback options.', 'warning');
        }
    }
    
    async handleTestConnection() {
        const statusEl = document.getElementById('connection-status');
        const btn = this.testConnectionBtn;
        const endpointInput = document.getElementById('ollama-endpoint');
        
        if (!statusEl || !btn) return;
        
        // Get endpoint to test (current input value or config value)
        const endpoint = endpointInput?.value?.trim() || this.config?.ollama_endpoint || 'http://localhost:11434';
        
        // Show loading state
        btn.classList.add('loading');
        btn.disabled = true;
        statusEl.textContent = `Testing connection to ${endpoint}...`;
        statusEl.className = 'connection-status';
        
        try {
            // Test connection with the specified endpoint
            const result = await this.configService.testOllamaConnection(endpoint);
            
            if (result.success && result.connected) {
                let message = `✓ Connection successful to ${endpoint}`;
                if (result.models_available !== undefined) {
                    message += ` (${result.models_available} models available)`;
                }
                statusEl.textContent = message;
                statusEl.className = 'connection-status success';
                
                // Refresh models dropdown if connection is successful
                await this.loadAvailableModels();
                
            } else {
                statusEl.textContent = `✗ Connection failed: ${result.error || 'Unable to connect to Ollama'}`;
                statusEl.className = 'connection-status error';
            }
            
        } catch (error) {
            console.error('Connection test error:', error);
            statusEl.textContent = `✗ Connection failed: ${error.message || 'Network error'}`;
            statusEl.className = 'connection-status error';
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }
    
    async handleSave() {
        if (!this.form) return;
        
        const saveBtn = this.saveBtn;
        const originalText = saveBtn?.textContent || 'Save';
        
        try {
            // Show loading state
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
            }
            
            // Collect form data
            const formData = new FormData(this.form);
            const updates = {};
            
            for (const [key, value] of formData.entries()) {
                if (key === 'default_temperature') {
                    updates[key] = parseFloat(value);
                } else if (value.trim()) {  // Only include non-empty values
                    updates[key] = value.trim();
                }
            }
            
            // Validate required fields
            if (!updates.ollama_endpoint) {
                throw new Error('Ollama endpoint is required');
            }
            
            if (!updates.default_model) {
                throw new Error('Default model is required');
            }
            
            // Validate endpoint format
            try {
                new URL(updates.ollama_endpoint);
            } catch {
                throw new Error('Invalid Ollama endpoint URL format');
            }
            
            // Validate temperature range
            if (updates.default_temperature < 0 || updates.default_temperature > 2) {
                throw new Error('Temperature must be between 0 and 2');
            }
            
            // Update configuration
            const updatedConfig = await this.configService.updateConfig(updates);
            this.config = updatedConfig;
            
            // Notify other components of config change
            this.eventBus.emit('config:updated', updatedConfig);
            
            // Hide modal
            this.hide();
            
            // Show success message
            this.eventBus.emit('toast:show', 'Settings saved successfully', 'success');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            
            // Show error message
            const errorMessage = error.message || 'Failed to save settings. Please try again.';
            this.eventBus.emit('toast:show', errorMessage, 'error');
            
            // Clear connection status on validation errors
            const statusEl = document.getElementById('connection-status');
            if (statusEl && error.message.includes('endpoint')) {
                statusEl.textContent = '';
                statusEl.className = 'connection-status';
            }
            
        } finally {
            // Restore button state
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            }
        }
    }
    
    getDarkModeSetting() {
        // Check localStorage first, then system preference
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return saved === 'true';
        }
        
        // Default to system preference
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    handleDarkModeToggle(isDarkMode) {
        // Save preference
        localStorage.setItem('darkMode', isDarkMode.toString());
        
        // Apply theme
        this.applyTheme(isDarkMode);
        
        // Update modal immediately
        this.updateModalTheme();
        
        // Emit event for other components
        this.eventBus.emit('theme:changed', { darkMode: isDarkMode });
    }
    
    applyTheme(isDarkMode) {
        const html = document.documentElement;
        if (isDarkMode) {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
    }
    
    updateModalTheme() {
        // Force update the modal styles by re-applying CSS variables
        if (this.modal && this.isVisible) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            // Update modal background
            this.modal.style.backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
            this.modal.style.color = isDark ? '#f8f9fa' : '#343a40';
            
            // Update all form elements
            const inputs = this.modal.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.style.backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
                input.style.color = isDark ? '#f8f9fa' : '#343a40';
                input.style.borderColor = isDark ? '#495057' : '#dee2e6';
            });
            
            // Update labels and text
            const labels = this.modal.querySelectorAll('label, .form-help, h2');
            labels.forEach(label => {
                label.style.color = isDark ? '#f8f9fa' : '#343a40';
            });
            
            // Update help text
            const helpTexts = this.modal.querySelectorAll('.form-help');
            helpTexts.forEach(help => {
                help.style.color = isDark ? '#adb5bd' : '#6c757d';
            });
        }
    }
    
    initializeDarkMode() {
        // Initialize dark mode on app startup
        const isDarkMode = this.getDarkModeSetting();
        this.applyTheme(isDarkMode);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (localStorage.getItem('darkMode') === null) {
                    this.applyTheme(e.matches);
                }
            });
        }
    }
}