// API Client for backend communication
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class ApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }
    
    /**
     * Make HTTP request with comprehensive error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };
        
        const context = `API ${options.method || 'GET'} ${endpoint}`;
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                await ErrorHandler.handleApiError(response, context);
            }
            
            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
            
        } catch (error) {
            // Handle different types of errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError = new Error('Network connection failed. Please check your connection.');
                networkError.isNetworkError = true;
                networkError.originalError = error;
                throw ErrorHandler.handleError(networkError, context);
            }
            
            if (error.name === 'AbortError') {
                const timeoutError = new Error('Request timed out. Please try again.');
                timeoutError.isTimeoutError = true;
                timeoutError.originalError = error;
                throw ErrorHandler.handleError(timeoutError, context);
            }
            
            // Re-throw API errors and other handled errors
            throw error;
        }
    }
    
    /**
     * Make request with automatic retry for network errors
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise} Response data
     */
    async requestWithRetry(endpoint, options = {}) {
        const context = `API ${options.method || 'GET'} ${endpoint}`;
        const operationId = `${context}-${Date.now()}`;
        
        return ErrorHandler.retryOperation(
            () => this.request(endpoint, options),
            operationId,
            {
                maxAttempts: 3,
                baseDelay: 1000,
                retryCondition: (error) => ErrorHandler.isNetworkError(error) || error.isTimeoutError
            }
        );
    }
    
    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise} Response data
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }
    
    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise} Response data
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise} Response data
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Response data
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
    
    /**
     * Upload file
     * @param {string} endpoint - API endpoint
     * @param {File} file - File to upload
     * @param {Object} additionalData - Additional form data
     * @returns {Promise} Response data
     */
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });
        
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
    }
    
    // Prompt Management API Methods
    
    /**
     * Get all prompts
     * @param {Object} filters - Search and filter parameters
     * @returns {Promise<Array>} Array of prompts
     */
    async getPrompts(filters = {}) {
        const response = await this.get('/prompts', filters);
        return response.prompts || response; // Handle both response formats
    }
    
    /**
     * Get a specific prompt by ID
     * @param {number} id - Prompt ID
     * @returns {Promise<Object>} Prompt data
     */
    async getPrompt(id) {
        return this.get(`/prompts/${id}`);
    }
    
    /**
     * Create a new prompt
     * @param {Object} promptData - Prompt data
     * @returns {Promise<Object>} Created prompt
     */
    async createPrompt(promptData) {
        const response = await this.post('/prompts', promptData);
        return response.prompt || response; // Handle both response formats
    }
    
    /**
     * Update an existing prompt
     * @param {number} id - Prompt ID
     * @param {Object} promptData - Updated prompt data
     * @returns {Promise<Object>} Updated prompt
     */
    async updatePrompt(id, promptData) {
        const response = await this.put(`/prompts/${id}`, promptData);
        return response.prompt || response; // Handle both response formats
    }
    
    /**
     * Delete a prompt
     * @param {number} id - Prompt ID
     * @returns {Promise} Deletion confirmation
     */
    async deletePrompt(id) {
        return this.delete(`/prompts/${id}`);
    }
    
    // Ollama Integration API Methods
    
    /**
     * Refine an objective into a detailed system prompt
     * @param {string} objective - Simple objective description
     * @param {string} model - Target model for refinement
     * @returns {Promise<Object>} Refined prompt data
     */
    async refinePrompt(objective, model = 'llama2') {
        return this.post('/refine-prompt', {
            objective,
            target_model: model
        });
    }
    
    /**
     * Test a prompt with user input
     * @param {Object} testData - Test configuration
     * @returns {Promise<Object>} Test results
     */
    async runTest(testData) {
        return this.post('/run-test', testData);
    }
    
    /**
     * Get available Ollama models
     * @returns {Promise<Array>} Array of available models
     */
    async getModels() {
        return this.get('/models');
    }
    
    // Configuration API Methods
    
    /**
     * Get application configuration
     * @returns {Promise<Object>} Configuration data
     */
    async getConfig() {
        return this.get('/config');
    }
    
    /**
     * Update application configuration
     * @param {Object} configData - Configuration updates
     * @returns {Promise<Object>} Updated configuration
     */
    async updateConfig(configData) {
        return this.put('/config', configData);
    }
    
    // Import/Export API Methods
    
    /**
     * Export prompt library
     * @param {string} format - Export format ('json' or 'yaml')
     * @returns {Promise<Object>} Export data
     */
    async exportLibrary(format = 'json') {
        return this.post('/export-library', { format });
    }
    
    /**
     * Import prompt library
     * @param {string} importData - Import data as string
     * @param {string} conflictResolution - How to handle conflicts ('skip', 'overwrite', 'rename')
     * @param {string} format - Data format ('json' or 'yaml')
     * @returns {Promise<Object>} Import results
     */
    async importLibrary(importData, conflictResolution = 'skip', format = 'json') {
        return this.post('/import-library', {
            import_data: importData,
            conflict_resolution: conflictResolution,
            format: format
        });
    }
    
    // Health Check
    
    /**
     * Check API health
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        return this.get('/health');
    }
    
    /**
     * Check Ollama connection
     * @param {string} endpoint - Optional endpoint to test
     * @returns {Promise<Object>} Ollama status
     */
    async checkOllamaConnection(endpoint = null) {
        if (endpoint) {
            return this.post('/config/test-connection', { endpoint });
        }
        return this.post('/config/test-connection', {});
    }
    
    // Utility Methods
    
    /**
     * Set default headers for all requests
     * @param {Object} headers - Headers to set
     */
    setDefaultHeaders(headers) {
        this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    }
    
    /**
     * Set base URL for API requests
     * @param {string} baseUrl - New base URL
     */
    setBaseUrl(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    /**
     * Create a request with timeout
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} Response data
     */
    async requestWithTimeout(endpoint, options = {}, timeout = 30000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await this.request(endpoint, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw ErrorHandler.handleError(
                    new Error('Request timeout'),
                    `API ${options.method || 'GET'} ${endpoint}`
                );
            }
            throw error;
        }
    }
}