// Toast Notification Manager
export class ToastManager {
    static isInitialized = false;
    static container = null;
    static toasts = new Map();
    static defaultDuration = 5000;
    static maxToasts = 5;
    
    static init() {
        if (this.isInitialized) return;
        
        this.container = document.getElementById('toast-container');
        
        if (!this.container) {
            console.warn('Toast container not found in DOM, creating one...');
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.container);
        }
        
        this.isInitialized = true;
        console.log('ToastManager initialized');
    }
    
    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    static show(message, type = 'info', options = {}) {
        if (!this.isInitialized) {
            console.warn('ToastManager not initialized');
            return null;
        }
        
        const {
            duration = this.defaultDuration,
            persistent = false,
            id = this.generateId(),
            actions = []
        } = options;
        
        // Remove oldest toast if at max capacity
        if (this.toasts.size >= this.maxToasts) {
            const oldestId = this.toasts.keys().next().value;
            this.hide(oldestId);
        }
        
        const toast = this.createToastElement(message, type, id, actions);
        this.container.appendChild(toast);
        
        // Store toast reference
        this.toasts.set(id, {
            element: toast,
            type,
            message,
            timestamp: Date.now(),
            persistent
        });
        
        // Trigger show animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto-hide if not persistent
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }
        
        return id;
    }
    
    /**
     * Hide a specific toast
     * @param {string} id - Toast ID to hide
     */
    static hide(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;
        
        toast.element.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
            this.toasts.delete(id);
        }, 300);
    }
    
    /**
     * Hide all toasts
     */
    static hideAll() {
        Array.from(this.toasts.keys()).forEach(id => {
            this.hide(id);
        });
    }
    
    /**
     * Show success toast
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    static success(message, options = {}) {
        return this.show(message, 'success', options);
    }
    
    /**
     * Show error toast
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    static error(message, options = {}) {
        return this.show(message, 'error', {
            duration: 8000, // Longer duration for errors
            ...options
        });
    }
    
    /**
     * Show warning toast
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    static warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }
    
    /**
     * Show info toast
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    static info(message, options = {}) {
        return this.show(message, 'info', options);
    }
    
    /**
     * Create toast DOM element
     * @param {string} message - Toast message
     * @param {string} type - Toast type
     * @param {string} id - Toast ID
     * @param {Array} actions - Action buttons
     * @returns {HTMLElement} Toast element
     */
    static createToastElement(message, type, id, actions) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('data-toast-id', id);
        
        // Create message content
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        toast.appendChild(messageEl);
        
        // Add action buttons if provided
        if (actions.length > 0) {
            const actionsEl = document.createElement('div');
            actionsEl.className = 'toast-actions';
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'toast-action-btn';
                button.textContent = action.label;
                button.addEventListener('click', () => {
                    action.handler(id);
                });
                actionsEl.appendChild(button);
            });
            
            toast.appendChild(actionsEl);
        }
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.addEventListener('click', () => {
            this.hide(id);
        });
        toast.appendChild(closeBtn);
        
        // Add click to dismiss (except for actions area)
        toast.addEventListener('click', (event) => {
            if (!event.target.closest('.toast-actions') && 
                !event.target.closest('.toast-close')) {
                this.hide(id);
            }
        });
        
        return toast;
    }
    
    /**
     * Generate unique toast ID
     * @returns {string} Unique ID
     */
    static generateId() {
        return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    /**
     * Get active toasts
     * @returns {Array} Array of active toast info
     */
    static getActiveToasts() {
        return Array.from(this.toasts.values()).map(toast => ({
            type: toast.type,
            message: toast.message,
            timestamp: toast.timestamp,
            persistent: toast.persistent
        }));
    }
    
    /**
     * Update toast message
     * @param {string} id - Toast ID
     * @param {string} newMessage - New message
     */
    static updateMessage(id, newMessage) {
        const toast = this.toasts.get(id);
        if (!toast) return;
        
        const messageEl = toast.element.querySelector('.toast-message');
        if (messageEl) {
            messageEl.textContent = newMessage;
            toast.message = newMessage;
        }
    }
    
    /**
     * Check if a toast exists
     * @param {string} id - Toast ID
     * @returns {boolean} True if toast exists
     */
    static exists(id) {
        return this.toasts.has(id);
    }
    
    /**
     * Create a toast with progress indicator
     * @param {string} message - Message to display
     * @param {string} type - Toast type
     * @param {Object} options - Additional options
     * @returns {Object} Toast control object
     */
    static createProgressToast(message, type = 'info', options = {}) {
        const id = this.show(message, type, {
            persistent: true,
            ...options
        });
        
        const toast = this.toasts.get(id);
        if (!toast) return null;
        
        // Add progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'toast-progress';
        progressBar.innerHTML = '<div class="toast-progress-bar"></div>';
        toast.element.appendChild(progressBar);
        
        const progressBarInner = progressBar.querySelector('.toast-progress-bar');
        
        return {
            id,
            updateProgress: (percent) => {
                progressBarInner.style.width = `${Math.max(0, Math.min(100, percent))}%`;
            },
            updateMessage: (newMessage) => {
                this.updateMessage(id, newMessage);
            },
            complete: (finalMessage) => {
                if (finalMessage) {
                    this.updateMessage(id, finalMessage);
                }
                setTimeout(() => this.hide(id), 2000);
            },
            hide: () => {
                this.hide(id);
            }
        };
    }
    
    /**
     * Show a loading toast with spinner
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     * @returns {Object} Loading toast control object
     */
    static showLoading(message = 'Loading...', options = {}) {
        const id = this.show(message, 'info', {
            persistent: true,
            ...options
        });
        
        const toast = this.toasts.get(id);
        if (!toast) return null;
        
        // Add loading spinner
        const spinner = document.createElement('div');
        spinner.className = 'toast-loading-spinner';
        spinner.innerHTML = '<div class="loading-spinner"></div>';
        toast.element.appendChild(spinner);
        
        return {
            id,
            updateMessage: (newMessage) => {
                this.updateMessage(id, newMessage);
            },
            complete: (finalMessage, type = 'success') => {
                // Remove spinner
                const spinnerEl = toast.element.querySelector('.toast-loading-spinner');
                if (spinnerEl) {
                    spinnerEl.remove();
                }
                
                // Update message and type
                if (finalMessage) {
                    this.updateMessage(id, finalMessage);
                }
                
                // Update toast type
                toast.element.className = `toast ${type}`;
                toast.type = type;
                
                // Auto-hide after delay
                setTimeout(() => this.hide(id), 3000);
            },
            hide: () => {
                this.hide(id);
            }
        };
    }
    
    /**
     * Show confirmation toast with action buttons
     * @param {string} message - Confirmation message
     * @param {Object} options - Options including onConfirm and onCancel callbacks
     * @returns {string} Toast ID
     */
    static showConfirmation(message, options = {}) {
        const {
            onConfirm = () => {},
            onCancel = () => {},
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            type = 'warning'
        } = options;
        
        const actions = [
            {
                label: confirmText,
                handler: (toastId) => {
                    this.hide(toastId);
                    onConfirm();
                }
            },
            {
                label: cancelText,
                handler: (toastId) => {
                    this.hide(toastId);
                    onCancel();
                }
            }
        ];
        
        return this.show(message, type, {
            persistent: true,
            actions,
            ...options
        });
    }
    
    /**
     * Show success confirmation for completed actions
     * @param {string} action - Action that was completed
     * @param {Object} options - Additional options
     * @returns {string} Toast ID
     */
    static showActionSuccess(action, options = {}) {
        const message = `${action} completed successfully`;
        return this.success(message, {
            duration: 4000,
            ...options
        });
    }
    
    /**
     * Show batch operation progress
     * @param {string} operation - Operation name
     * @param {number} current - Current item number
     * @param {number} total - Total items
     * @param {Object} options - Additional options
     * @returns {Object} Progress toast control object
     */
    static showBatchProgress(operation, current, total, options = {}) {
        const percent = Math.round((current / total) * 100);
        const message = `${operation}: ${current}/${total} (${percent}%)`;
        
        return this.createProgressToast(message, 'info', {
            ...options,
            id: `batch-${operation}`
        });
    }
}