// Comprehensive Notification and Feedback Manager
import { ToastManager } from './ToastManager.js';
import { LoadingManager } from './LoadingManager.js';
import { ErrorHandler } from './ErrorHandler.js';

export class NotificationManager {
    static isInitialized = false;
    static activeOperations = new Map();
    static notificationQueue = [];
    static maxQueueSize = 10;
    
    static init() {
        if (this.isInitialized) return;
        
        // Initialize dependent managers
        ToastManager.init();
        LoadingManager.init();
        ErrorHandler.init();
        
        this.isInitialized = true;
        console.log('NotificationManager initialized');
    }
    
    /**
     * Show success notification for completed actions
     * @param {string} action - Action that was completed
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    static success(action, options = {}) {
        const message = typeof action === 'string' && !action.includes('successfully') ?
            `${action} completed successfully` : action;
        
        return ToastManager.success(message, {
            duration: 4000,
            ...options
        });
    }
    
    /**
     * Show error notification with optional retry
     * @param {string|Error} error - Error message or Error object
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    static error(error, options = {}) {
        const message = error instanceof Error ? error.message : error;
        
        const actions = [];
        if (options.onRetry) {
            actions.push({
                label: 'Retry',
                handler: (toastId) => {
                    ToastManager.hide(toastId);
                    options.onRetry();
                }
            });
        }
        
        return ToastManager.error(message, {
            duration: 8000,
            actions,
            ...options
        });
    }
    
    /**
     * Show warning notification
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    static warning(message, options = {}) {
        return ToastManager.warning(message, {
            duration: 6000,
            ...options
        });
    }
    
    /**
     * Show info notification
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    static info(message, options = {}) {
        return ToastManager.info(message, options);
    }
    
    /**
     * Show confirmation dialog with action buttons
     * @param {string} message - Confirmation message
     * @param {Object} options - Options including callbacks
     * @returns {string} Notification ID
     */
    static confirm(message, options = {}) {
        return ToastManager.showConfirmation(message, options);
    }
    
    /**
     * Start a loading operation with progress tracking
     * @param {string} operationId - Unique operation identifier
     * @param {string} message - Loading message
     * @param {Object} options - Loading options
     * @returns {Object} Operation control object
     */
    static startOperation(operationId, message, options = {}) {
        const {
            showProgress = false,
            showInToast = false,
            showInOverlay = true,
            estimatedDuration = null
        } = options;
        
        // Store operation info
        const operation = {
            id: operationId,
            message,
            startTime: Date.now(),
            estimatedDuration,
            showProgress,
            showInToast,
            showInOverlay
        };
        
        this.activeOperations.set(operationId, operation);
        
        // Show loading indicators
        if (showInOverlay) {
            if (showProgress) {
                operation.progressIndicator = LoadingManager.createProgressIndicator(message, {
                    id: operationId,
                    showPercentage: true,
                    showETA: estimatedDuration !== null
                });
            } else {
                LoadingManager.show(message, operationId);
            }
        }
        
        if (showInToast) {
            operation.loadingToast = ToastManager.showLoading(message, {
                id: `toast-${operationId}`
            });
        }
        
        return {
            updateProgress: (current, total, customMessage) => {
                if (operation.progressIndicator) {
                    operation.progressIndicator.updateProgress(current, total, customMessage);
                }
                if (operation.loadingToast) {
                    const percent = Math.round((current / total) * 100);
                    const progressMessage = customMessage || `${message} (${percent}%)`;
                    operation.loadingToast.updateMessage(progressMessage);
                }
            },
            
            updateMessage: (newMessage) => {
                operation.message = newMessage;
                if (showInOverlay) {
                    LoadingManager.show(newMessage, operationId);
                }
                if (operation.loadingToast) {
                    operation.loadingToast.updateMessage(newMessage);
                }
            },
            
            complete: (finalMessage, type = 'success') => {
                this.completeOperation(operationId, finalMessage, type);
            },
            
            fail: (errorMessage) => {
                this.failOperation(operationId, errorMessage);
            }
        };
    }
    
    /**
     * Complete a loading operation successfully
     * @param {string} operationId - Operation identifier
     * @param {string} finalMessage - Final success message
     * @param {string} type - Success type (success, info)
     */
    static completeOperation(operationId, finalMessage, type = 'success') {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;
        
        // Hide loading indicators
        if (operation.showInOverlay) {
            if (operation.progressIndicator) {
                operation.progressIndicator.complete(finalMessage);
            } else {
                LoadingManager.hide(operationId);
            }
        }
        
        if (operation.loadingToast) {
            operation.loadingToast.complete(finalMessage, type);
        }
        
        // Show success notification if no toast was used
        if (!operation.showInToast && finalMessage) {
            this.success(finalMessage);
        }
        
        // Clean up
        this.activeOperations.delete(operationId);
    }
    
    /**
     * Fail a loading operation with error
     * @param {string} operationId - Operation identifier
     * @param {string} errorMessage - Error message
     */
    static failOperation(operationId, errorMessage) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;
        
        // Hide loading indicators
        if (operation.showInOverlay) {
            if (operation.progressIndicator) {
                operation.progressIndicator.hide();
            } else {
                LoadingManager.hide(operationId);
            }
        }
        
        if (operation.loadingToast) {
            operation.loadingToast.complete(errorMessage, 'error');
        }
        
        // Show error notification if no toast was used
        if (!operation.showInToast) {
            this.error(errorMessage);
        }
        
        // Clean up
        this.activeOperations.delete(operationId);
    }
    
    /**
     * Show batch operation progress
     * @param {string} operationName - Name of the batch operation
     * @param {number} current - Current item number
     * @param {number} total - Total items
     * @param {Object} options - Additional options
     * @returns {Object} Batch progress control
     */
    static showBatchProgress(operationName, current, total, options = {}) {
        const operationId = `batch-${operationName}`;
        const percent = Math.round((current / total) * 100);
        const message = `${operationName}: ${current}/${total} (${percent}%)`;
        
        if (!this.activeOperations.has(operationId)) {
            // Start new batch operation
            return this.startOperation(operationId, message, {
                showProgress: true,
                showInToast: options.showInToast || false,
                ...options
            });
        } else {
            // Update existing batch operation
            const operation = this.activeOperations.get(operationId);
            if (operation.progressIndicator) {
                operation.progressIndicator.updateProgress(current, total, message);
            }
            if (operation.loadingToast) {
                operation.loadingToast.updateMessage(message);
            }
            
            return {
                complete: (finalMessage) => {
                    this.completeOperation(operationId, finalMessage);
                },
                fail: (errorMessage) => {
                    this.failOperation(operationId, errorMessage);
                }
            };
        }
    }
    
    /**
     * Show validation errors with field-level feedback
     * @param {Object} validationErrors - Field-level validation errors
     * @param {Object} options - Display options
     */
    static showValidationErrors(validationErrors, options = {}) {
        ErrorHandler.handleValidationErrors(validationErrors, 'Form Validation', options);
    }
    
    /**
     * Clear all validation errors
     * @param {HTMLElement} container - Container to clear errors from
     */
    static clearValidationErrors(container) {
        ErrorHandler.clearAllFieldErrors(container);
    }
    
    /**
     * Show network status change
     * @param {boolean} isOnline - Whether the network is online
     */
    static showNetworkStatus(isOnline) {
        if (isOnline) {
            this.success('Connection restored', {
                duration: 3000,
                id: 'network-status'
            });
        } else {
            this.error('Connection lost. Some features may not work.', {
                persistent: true,
                id: 'network-status'
            });
        }
    }
    
    /**
     * Show save status feedback
     * @param {string} itemName - Name of the item being saved
     * @param {string} status - Save status (saving, saved, failed)
     * @param {Object} options - Additional options
     */
    static showSaveStatus(itemName, status, options = {}) {
        const saveId = `save-${itemName}`;
        
        switch (status) {
            case 'saving':
                return this.startOperation(saveId, `Saving ${itemName}...`, {
                    showInToast: true,
                    showInOverlay: false,
                    ...options
                });
                
            case 'saved':
                this.completeOperation(saveId, `${itemName} saved successfully`);
                break;
                
            case 'failed':
                this.failOperation(saveId, `Failed to save ${itemName}`);
                break;
        }
    }
    
    /**
     * Show import/export progress
     * @param {string} operation - Operation type (import/export)
     * @param {string} status - Operation status
     * @param {Object} data - Operation data
     */
    static showImportExportProgress(operation, status, data = {}) {
        const operationId = `${operation}-operation`;
        
        switch (status) {
            case 'started':
                return this.startOperation(operationId, `${operation} in progress...`, {
                    showProgress: true,
                    showInToast: false,
                    estimatedDuration: data.estimatedDuration
                });
                
            case 'progress':
                const op = this.activeOperations.get(operationId);
                if (op && op.progressIndicator) {
                    op.progressIndicator.updateProgress(
                        data.current, 
                        data.total, 
                        `${operation}: ${data.current}/${data.total} items`
                    );
                }
                break;
                
            case 'completed':
                this.completeOperation(
                    operationId, 
                    `${operation} completed: ${data.processed} items processed`
                );
                break;
                
            case 'failed':
                this.failOperation(operationId, `${operation} failed: ${data.error}`);
                break;
        }
    }
    
    /**
     * Get active operations summary
     * @returns {Array} Array of active operation summaries
     */
    static getActiveOperations() {
        return Array.from(this.activeOperations.values()).map(op => ({
            id: op.id,
            message: op.message,
            duration: Date.now() - op.startTime,
            estimatedRemaining: op.estimatedDuration ? 
                Math.max(0, op.estimatedDuration - (Date.now() - op.startTime)) : null
        }));
    }
    
    /**
     * Cancel all active operations
     */
    static cancelAllOperations() {
        this.activeOperations.forEach((operation, operationId) => {
            if (operation.showInOverlay) {
                LoadingManager.hide(operationId);
            }
            if (operation.loadingToast) {
                operation.loadingToast.hide();
            }
        });
        
        this.activeOperations.clear();
        ToastManager.hideAll();
    }
    
    /**
     * Queue notification for later display
     * @param {Function} notificationFn - Function to call to show notification
     * @param {Array} args - Arguments for the notification function
     */
    static queueNotification(notificationFn, ...args) {
        if (this.notificationQueue.length >= this.maxQueueSize) {
            this.notificationQueue.shift(); // Remove oldest
        }
        
        this.notificationQueue.push({ fn: notificationFn, args });
    }
    
    /**
     * Process queued notifications
     */
    static processQueue() {
        while (this.notificationQueue.length > 0) {
            const { fn, args } = this.notificationQueue.shift();
            fn.apply(this, args);
        }
    }
}