// Configuration Service
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class ConfigService {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.config = null;
        this.listeners = new Set();
    }
    
    /**
     * Get current configuration
     * @param {boolean} forceRefresh - Force refresh from server
     * @returns {Promise<Object>} Configuration data
     */
    async getConfig(forceRefresh = false) {
        if (!this.config || forceRefresh) {
            try {
                const response = await this.apiClient.getConfig();
                // Extract the config object from the response
                this.config = response.config || response;
            } catch (error) {
                ErrorHandler.handleError(error, 'Failed to load configuration');
                // Return default config on error
                this.config = this.getDefaultConfig();
            }
        }
        
        return { ...this.config };
    }
    
    /**
     * Update configuration
     * @param {Object} updates - Configuration updates
     * @returns {Promise<Object>} Updated configuration
     */
    async updateConfig(updates) {
        try {
            const response = await this.apiClient.updateConfig(updates);
            // Extract the config object from the response
            const updatedConfig = response.config || response;
            this.config = updatedConfig;
            
            // Notify listeners of config change
            this.notifyListeners(updatedConfig);
            
            return { ...updatedConfig };
            
        } catch (error) {
            ErrorHandler.handleError(error, 'Failed to update configuration');
            throw error;
        }
    }
    
    /**
     * Get default configuration
     * @returns {Object} Default configuration
     */
    getDefaultConfig() {
        return {
            ollama_endpoint: 'http://localhost:11434',
            default_model: 'llama2',
            default_temperature: 0.7,
            refine_timeout: 120,
            max_tokens: 2048,
            timeout: 30000,
            auto_save: true,
            theme: 'light'
        };
    }
    
    /**
     * Get specific configuration value
     * @param {string} key - Configuration key
     * @param {any} defaultValue - Default value if key not found
     * @returns {any} Configuration value
     */
    async getValue(key, defaultValue = null) {
        const config = await this.getConfig();
        return config[key] !== undefined ? config[key] : defaultValue;
    }
    
    /**
     * Set specific configuration value
     * @param {string} key - Configuration key
     * @param {any} value - Configuration value
     * @returns {Promise<Object>} Updated configuration
     */
    async setValue(key, value) {
        return this.updateConfig({ [key]: value });
    }
    
    /**
     * Test Ollama connection with current or specified configuration
     * @param {string} endpoint - Optional endpoint to test (defaults to current config)
     * @returns {Promise<Object>} Connection test result
     */
    async testOllamaConnection(endpoint = null) {
        try {
            const testData = endpoint ? { endpoint } : {};
            const result = await this.apiClient.post('/config/test-connection', testData);
            return {
                success: true,
                connected: result.connected,
                endpoint: result.endpoint,
                models_available: result.models_available,
                models: result.models,
                error: null
            };
        } catch (error) {
            return {
                success: false,
                connected: false,
                endpoint: endpoint || (await this.getValue('ollama_endpoint', 'http://localhost:11434')),
                models_available: 0,
                models: [],
                error: error.message || 'Connection failed'
            };
        }
    }
    
    /**
     * Get available models from Ollama
     * @returns {Promise<Array>} Array of available models
     */
    async getAvailableModels() {
        try {
            return await this.apiClient.getModels();
        } catch (error) {
            ErrorHandler.handleError(error, 'Failed to fetch available models');
            return [];
        }
    }
    
    /**
     * Validate configuration values
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];
        
        // Validate Ollama endpoint
        if (config.ollama_endpoint) {
            try {
                new URL(config.ollama_endpoint);
            } catch {
                errors.push('Invalid Ollama endpoint URL');
            }
        } else {
            errors.push('Ollama endpoint is required');
        }
        
        // Validate temperature
        if (config.default_temperature !== undefined) {
            const temp = parseFloat(config.default_temperature);
            if (isNaN(temp) || temp < 0 || temp > 2) {
                errors.push('Temperature must be between 0 and 2');
            }
        }
        
        // Validate max_tokens
        if (config.max_tokens !== undefined) {
            const tokens = parseInt(config.max_tokens);
            if (isNaN(tokens) || tokens < 1 || tokens > 32768) {
                warnings.push('Max tokens should be between 1 and 32768');
            }
        }
        
        // Validate timeout
        if (config.timeout !== undefined) {
            const timeout = parseInt(config.timeout);
            if (isNaN(timeout) || timeout < 1000) {
                warnings.push('Timeout should be at least 1000ms');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Reset configuration to defaults
     * @returns {Promise<Object>} Reset configuration
     */
    async resetToDefaults() {
        const defaultConfig = this.getDefaultConfig();
        return this.updateConfig(defaultConfig);
    }
    
    /**
     * Export configuration
     * @returns {Object} Configuration data for export
     */
    async exportConfig() {
        const config = await this.getConfig();
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            config
        };
    }
    
    /**
     * Import configuration
     * @param {Object} importData - Configuration data to import
     * @returns {Promise<Object>} Imported configuration
     */
    async importConfig(importData) {
        if (!importData.config) {
            throw new Error('Invalid configuration import data');
        }
        
        const validation = this.validateConfig(importData.config);
        if (!validation.valid) {
            throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
        }
        
        return this.updateConfig(importData.config);
    }
    
    /**
     * Add configuration change listener
     * @param {Function} listener - Listener function
     * @returns {Function} Unsubscribe function
     */
    addListener(listener) {
        this.listeners.add(listener);
        
        return () => {
            this.listeners.delete(listener);
        };
    }
    
    /**
     * Remove configuration change listener
     * @param {Function} listener - Listener function to remove
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }
    
    /**
     * Notify all listeners of configuration changes
     * @param {Object} config - Updated configuration
     */
    notifyListeners(config) {
        this.listeners.forEach(listener => {
            try {
                listener(config);
            } catch (error) {
                console.error('Error in config listener:', error);
            }
        });
    }
    
    /**
     * Get configuration schema for UI generation
     * @returns {Object} Configuration schema
     */
    getConfigSchema() {
        return {
            ollama_endpoint: {
                type: 'url',
                label: 'Ollama Endpoint',
                description: 'URL of your Ollama instance',
                required: true,
                default: 'http://localhost:11434'
            },
            default_model: {
                type: 'select',
                label: 'Default Model',
                description: 'Default AI model to use',
                required: true,
                default: 'llama2',
                options: [] // Will be populated dynamically
            },
            default_temperature: {
                type: 'range',
                label: 'Default Temperature',
                description: 'Default creativity level (0 = deterministic, 2 = very creative)',
                min: 0,
                max: 2,
                step: 0.1,
                default: 0.7
            },
            max_tokens: {
                type: 'number',
                label: 'Max Tokens',
                description: 'Maximum tokens in AI responses',
                min: 1,
                max: 32768,
                default: 2048
            },
            timeout: {
                type: 'number',
                label: 'Request Timeout (ms)',
                description: 'Timeout for AI requests in milliseconds',
                min: 1000,
                default: 30000
            },
            auto_save: {
                type: 'boolean',
                label: 'Auto Save',
                description: 'Automatically save changes',
                default: true
            },
            theme: {
                type: 'select',
                label: 'Theme',
                description: 'Application theme',
                options: ['light', 'dark', 'auto'],
                default: 'light'
            }
        };
    }
    
    /**
     * Clear cached configuration
     */
    clearCache() {
        this.config = null;
    }
}