// Global Error Handler
import { ToastManager } from './ToastManager.js';
import { LoadingManager } from './LoadingManager.js';

export class ErrorHandler {
    static isInitialized = false;
    static errorLog = [];
    static maxLogSize = 100;
    static retryAttempts = new Map();
    static maxRetryAttempts = 3;
    static retryDelay = 1000; // Base delay in milliseconds
    
    static init() {
        if (this.isInitialized) return;
        
        // Set up global error handlers
        this.setupGlobalErrorHandlers();
        
        this.isInitialized = true;
        console.log('ErrorHandler initialized');
    }
    
    /**
     * Set up global error handlers for unhandled errors
     */
    static setupGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, 'Unhandled Promise Rejection', { silent: false });
            event.preventDefault(); // Prevent default browser behavior
        });
        
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            this.handleError(event.error, 'JavaScript Error', { silent: false });
        });
        
        // Handle network errors for fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                return response;
            } catch (error) {
                // Only handle if it's a network error, not API errors
                if (this.isNetworkError(error)) {
                    this.handleError(error, 'Network Request', { silent: true });
                }
                throw error;
            }
        };
    }
    
    /**
     * Handle an error with user-friendly messaging
     * @param {Error|string} error - The error to handle
     * @param {string} context - Context where the error occurred
     * @param {Object} options - Additional options
     */
    static handleError(error, context = 'Unknown', options = {}) {
        const errorInfo = this.processError(error, context);
        
        // Log the error
        this.logError(errorInfo);
        
        // Show user notification unless suppressed
        if (!options.silent) {
            this.showUserNotification(errorInfo, options);
        }
        
        // Console logging for development (always log in browser environment)
        console.error(`[${context}]`, error);
        
        return errorInfo;
    }
    
    /**
     * Process error into standardized format
     * @param {Error|string} error - The error
     * @param {string} context - Error context
     * @returns {Object} Processed error info
     */
    static processError(error, context) {
        const timestamp = new Date().toISOString();
        
        if (error instanceof Error) {
            return {
                message: error.message,
                name: error.name,
                stack: error.stack,
                context,
                timestamp,
                type: 'exception'
            };
        }
        
        if (typeof error === 'string') {
            return {
                message: error,
                name: 'StringError',
                context,
                timestamp,
                type: 'string'
            };
        }
        
        if (error && typeof error === 'object') {
            return {
                message: error.message || 'Unknown error',
                name: error.name || 'ObjectError',
                context,
                timestamp,
                type: 'object',
                details: error
            };
        }
        
        return {
            message: 'Unknown error occurred',
            name: 'UnknownError',
            context,
            timestamp,
            type: 'unknown'
        };
    }
    
    /**
     * Log error to internal log
     * @param {Object} errorInfo - Processed error information
     */
    static logError(errorInfo) {
        this.errorLog.unshift(errorInfo);
        
        // Maintain log size limit
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }
    }
    
    /**
     * Show user-friendly notification
     * @param {Object} errorInfo - Processed error information
     * @param {Object} options - Display options
     */
    static showUserNotification(errorInfo, options = {}) {
        // Use enhanced notification with retry if available
        if (options.showRetryButton || options.onRetry) {
            this.showUserNotificationWithRetry(errorInfo, options);
        } else {
            const userMessage = this.getUserFriendlyMessage(errorInfo);
            const toastType = options.type || 'error';
            
            if (ToastManager.isInitialized) {
                ToastManager.show(userMessage, toastType, {
                    duration: toastType === 'error' ? 8000 : 5000
                });
            } else {
                // Fallback to alert if toast manager not available
                alert(`Error: ${userMessage}`);
            }
        }
    }
    
    /**
     * Convert technical error to user-friendly message
     * @param {Object} errorInfo - Processed error information
     * @returns {string} User-friendly message
     */
    static getUserFriendlyMessage(errorInfo) {
        const { message, context, details } = errorInfo;
        
        // Network errors
        if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
            return 'Network connection error. Please check your connection and try again.';
        }
        
        // API errors
        if (context.includes('API') || context.includes('api')) {
            if (message.includes('404')) {
                return 'The requested resource was not found.';
            }
            if (message.includes('409') || message.includes('already exists') || message.includes('unique')) {
                // For conflict errors, preserve the original message as it contains useful info
                return message;
            }
            if (message.includes('500')) {
                return 'Server error occurred. Please try again later.';
            }
            if (message.includes('401') || message.includes('403')) {
                return 'Access denied. Please check your permissions.';
            }
            if (message.includes('400') && details) {
                // For validation errors, preserve the original message
                return message;
            }
            return 'Server communication error. Please try again.';
        }
        
        // Ollama-specific errors
        if (context.includes('Ollama') || message.includes('ollama')) {
            return 'AI service is not available. Please check your Ollama configuration.';
        }
        
        // File operation errors
        if (context.includes('file') || context.includes('import') || context.includes('export')) {
            return 'File operation failed. Please check the file and try again.';
        }
        
        // Validation errors
        if (context.includes('validation') || message.includes('required') || message.includes('invalid')) {
            return `Validation error: ${message}`;
        }
        
        // Database errors
        if (context.includes('database') || message.includes('database')) {
            return 'Data storage error occurred. Please try again.';
        }
        
        // Generic fallback
        return message || 'An unexpected error occurred. Please try again.';
    }
    
    /**
     * Handle API response errors with detailed error information
     * @param {Response} response - Fetch response object
     * @param {string} context - Context for the API call
     * @returns {Promise<never>} Always throws
     */
    static async handleApiError(response, context) {
        let errorMessage = `HTTP ${response.status}`;
        let errorDetails = null;
        let errorCode = null;
        
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            errorDetails = errorData.details || null;
            errorCode = errorData.code || null;
        } catch {
            // If we can't parse JSON, use status text
            errorMessage = response.statusText || errorMessage;
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        error.details = errorDetails;
        error.code = errorCode;
        error.isApiError = true;
        
        // Handle specific API error types
        if (response.status >= 500) {
            error.isServerError = true;
        } else if (response.status >= 400) {
            error.isClientError = true;
        }
        
        // Log the error but don't process it through handleError to preserve properties
        this.logError(this.processError(error, context));
        throw error;
    }
    
    /**
     * Handle validation errors with field-level feedback
     * @param {Object} validationErrors - Object with field-level errors
     * @param {string} context - Context where validation failed
     * @param {Object} options - Additional options
     */
    static handleValidationErrors(validationErrors, context = 'Validation', options = {}) {
        const errorInfo = {
            message: 'Please correct the following errors:',
            name: 'ValidationError',
            context,
            timestamp: new Date().toISOString(),
            type: 'validation',
            details: validationErrors
        };
        
        this.logError(errorInfo);
        
        // Show field-level errors
        this.showValidationFeedback(validationErrors, options);
        
        // Show general toast if not suppressed
        if (!options.silent) {
            const errorCount = Object.keys(validationErrors).length;
            const message = `${errorCount} validation error${errorCount > 1 ? 's' : ''} found`;
            ToastManager.error(message, { duration: 6000 });
        }
        
        return errorInfo;
    }
    
    /**
     * Show field-level validation feedback
     * @param {Object} validationErrors - Field-level errors
     * @param {Object} options - Display options
     */
    static showValidationFeedback(validationErrors, options = {}) {
        Object.entries(validationErrors).forEach(([field, message]) => {
            // Find form field by name or id
            const fieldElement = document.querySelector(`[name="${field}"], #${field}, #${field}-input`);
            
            if (fieldElement) {
                this.showFieldError(fieldElement, message, options);
            }
        });
    }
    
    /**
     * Show error message for a specific form field
     * @param {HTMLElement} fieldElement - Form field element
     * @param {string} message - Error message
     * @param {Object} options - Display options
     */
    static showFieldError(fieldElement, message, options = {}) {
        // Remove existing error
        this.clearFieldError(fieldElement);
        
        // Add error class to field
        fieldElement.classList.add('error');
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'polite');
        
        // Insert error message after the field
        fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
        
        // Auto-clear error on input
        const clearError = () => {
            this.clearFieldError(fieldElement);
            fieldElement.removeEventListener('input', clearError);
            fieldElement.removeEventListener('change', clearError);
        };
        
        fieldElement.addEventListener('input', clearError);
        fieldElement.addEventListener('change', clearError);
    }
    
    /**
     * Clear error state from a form field
     * @param {HTMLElement} fieldElement - Form field element
     */
    static clearFieldError(fieldElement) {
        fieldElement.classList.remove('error');
        
        // Remove error message
        const errorElement = fieldElement.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    /**
     * Clear all field errors in a container
     * @param {HTMLElement} container - Container element (defaults to document)
     */
    static clearAllFieldErrors(container = document) {
        const errorFields = container.querySelectorAll('.error');
        errorFields.forEach(field => this.clearFieldError(field));
    }
    
    /**
     * Create a promise wrapper that handles errors
     * @param {Promise} promise - Promise to wrap
     * @param {string} context - Error context
     * @param {Object} options - Error handling options
     * @returns {Promise} Wrapped promise
     */
    static async wrapPromise(promise, context, options = {}) {
        try {
            return await promise;
        } catch (error) {
            this.handleError(error, context, options);
            throw error;
        }
    }
    
    /**
     * Get error log for debugging
     * @param {number} limit - Number of recent errors to return
     * @returns {Array} Recent errors
     */
    static getErrorLog(limit = 10) {
        return this.errorLog.slice(0, limit);
    }
    
    /**
     * Clear error log
     */
    static clearErrorLog() {
        this.errorLog = [];
    }
    
    /**
     * Check if error is network-related
     * @param {Error} error - Error to check
     * @returns {boolean} True if network error
     */
    static isNetworkError(error) {
        return error.message.includes('fetch') || 
               error.message.includes('network') || 
               error.message.includes('Failed to fetch') ||
               error.name === 'NetworkError';
    }
    
    /**
     * Check if error is validation-related
     * @param {Error} error - Error to check
     * @returns {boolean} True if validation error
     */
    static isValidationError(error) {
        return error.message.includes('required') ||
               error.message.includes('invalid') ||
               error.message.includes('validation') ||
               error.status === 400 ||
               error.name === 'ValidationError' ||
               error.code === 'VALIDATION_ERROR';
    }
    
    /**
     * Retry a failed operation with exponential backoff
     * @param {Function} operation - Async operation to retry
     * @param {string} operationId - Unique identifier for the operation
     * @param {Object} options - Retry options
     * @returns {Promise} Result of the operation
     */
    static async retryOperation(operation, operationId, options = {}) {
        const {
            maxAttempts = this.maxRetryAttempts,
            baseDelay = this.retryDelay,
            exponentialBackoff = true,
            retryCondition = (error) => this.isNetworkError(error)
        } = options;
        
        let attempts = this.retryAttempts.get(operationId) || 0;
        
        try {
            const result = await operation();
            // Reset retry count on success
            this.retryAttempts.delete(operationId);
            return result;
        } catch (error) {
            attempts++;
            this.retryAttempts.set(operationId, attempts);
            
            // Check if we should retry
            if (attempts < maxAttempts && retryCondition(error)) {
                const delay = exponentialBackoff ? 
                    baseDelay * Math.pow(2, attempts - 1) : 
                    baseDelay;
                
                console.log(`Retrying operation ${operationId} (attempt ${attempts}/${maxAttempts}) after ${delay}ms`);
                
                // Show retry notification
                ToastManager.info(`Retrying... (${attempts}/${maxAttempts})`, {
                    duration: delay,
                    id: `retry-${operationId}`
                });
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.retryOperation(operation, operationId, options);
            } else {
                // Max attempts reached or non-retryable error
                this.retryAttempts.delete(operationId);
                
                if (attempts >= maxAttempts) {
                    const retryError = new Error(`Operation failed after ${maxAttempts} attempts: ${error.message}`);
                    retryError.originalError = error;
                    retryError.isRetryExhausted = true;
                    throw retryError;
                }
                
                throw error;
            }
        }
    }
    
    /**
     * Create a network recovery mechanism
     * @param {Function} operation - Operation to wrap with recovery
     * @param {string} context - Context for error handling
     * @param {Object} options - Recovery options
     * @returns {Function} Wrapped operation with recovery
     */
    static withNetworkRecovery(operation, context, options = {}) {
        return async (...args) => {
            const operationId = `${context}-${Date.now()}`;
            
            try {
                return await this.retryOperation(
                    () => operation(...args),
                    operationId,
                    options
                );
            } catch (error) {
                // Handle final failure
                if (error.isRetryExhausted) {
                    this.handleError(error.originalError, context, {
                        ...options,
                        showRetryButton: true
                    });
                } else {
                    this.handleError(error, context, options);
                }
                throw error;
            }
        };
    }
    
    /**
     * Show user notification with retry option
     * @param {Object} errorInfo - Processed error information
     * @param {Object} options - Display options
     */
    static showUserNotificationWithRetry(errorInfo, options = {}) {
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        const toastType = options.type || 'error';
        
        const actions = [];
        
        // Add retry button for network errors
        if (options.showRetryButton && this.isNetworkError(errorInfo)) {
            actions.push({
                label: 'Retry',
                handler: (toastId) => {
                    ToastManager.hide(toastId);
                    if (options.onRetry) {
                        options.onRetry();
                    }
                }
            });
        }
        
        // Add details button for complex errors
        if (errorInfo.details || errorInfo.stack) {
            actions.push({
                label: 'Details',
                handler: (toastId) => {
                    this.showErrorDetails(errorInfo);
                }
            });
        }
        
        if (ToastManager.isInitialized) {
            ToastManager.show(userMessage, toastType, {
                duration: toastType === 'error' ? 8000 : 5000,
                actions,
                ...options
            });
        } else {
            // Fallback to alert if toast manager not available
            alert(`Error: ${userMessage}`);
        }
    }
    
    /**
     * Show detailed error information in a modal or expandable area
     * @param {Object} errorInfo - Detailed error information
     */
    static showErrorDetails(errorInfo) {
        // Create error details modal
        const modal = document.createElement('div');
        modal.className = 'error-details-modal';
        modal.innerHTML = `
            <div class="error-details-content">
                <div class="error-details-header">
                    <h3>Error Details</h3>
                    <button class="error-details-close" aria-label="Close">&times;</button>
                </div>
                <div class="error-details-body">
                    <div class="error-detail-section">
                        <strong>Message:</strong>
                        <p>${errorInfo.message}</p>
                    </div>
                    <div class="error-detail-section">
                        <strong>Context:</strong>
                        <p>${errorInfo.context}</p>
                    </div>
                    <div class="error-detail-section">
                        <strong>Time:</strong>
                        <p>${new Date(errorInfo.timestamp).toLocaleString()}</p>
                    </div>
                    ${errorInfo.details ? `
                        <div class="error-detail-section">
                            <strong>Details:</strong>
                            <pre>${JSON.stringify(errorInfo.details, null, 2)}</pre>
                        </div>
                    ` : ''}
                    ${errorInfo.stack ? `
                        <div class="error-detail-section">
                            <strong>Stack Trace:</strong>
                            <pre>${errorInfo.stack}</pre>
                        </div>
                    ` : ''}
                </div>
                <div class="error-details-footer">
                    <button class="btn btn-secondary error-details-copy">Copy Error Info</button>
                    <button class="btn btn-primary error-details-close">Close</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const closeButtons = modal.querySelectorAll('.error-details-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        const copyButton = modal.querySelector('.error-details-copy');
        copyButton.addEventListener('click', () => {
            const errorText = JSON.stringify(errorInfo, null, 2);
            navigator.clipboard.writeText(errorText).then(() => {
                ToastManager.success('Error details copied to clipboard');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = errorText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                ToastManager.success('Error details copied to clipboard');
            });
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        document.body.appendChild(modal);
    }
}