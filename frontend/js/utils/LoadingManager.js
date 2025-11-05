// Loading State Manager
export class LoadingManager {
    static isInitialized = false;
    static loadingOverlay = null;
    static loadingText = null;
    static activeLoaders = new Set();
    
    static init() {
        if (this.isInitialized) return;
        
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingText = this.loadingOverlay?.querySelector('.loading-text');
        
        if (!this.loadingOverlay) {
            console.warn('Loading overlay not found in DOM');
            return;
        }
        
        this.isInitialized = true;
        console.log('LoadingManager initialized');
    }
    
    /**
     * Show global loading overlay
     * @param {string} message - Loading message to display
     * @param {string} id - Optional unique identifier for this loading state
     */
    static show(message = 'Loading...', id = 'default') {
        if (!this.isInitialized) {
            console.warn('LoadingManager not initialized');
            return;
        }
        
        this.activeLoaders.add(id);
        
        if (this.loadingText) {
            this.loadingText.textContent = message;
        }
        
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('show');
            this.loadingOverlay.setAttribute('aria-hidden', 'false');
        }
    }
    
    /**
     * Hide global loading overlay
     * @param {string} id - Optional unique identifier for this loading state
     */
    static hide(id = 'default') {
        if (!this.isInitialized) {
            console.warn('LoadingManager not initialized');
            return;
        }
        
        this.activeLoaders.delete(id);
        
        // Only hide if no other loaders are active
        if (this.activeLoaders.size === 0 && this.loadingOverlay) {
            this.loadingOverlay.classList.remove('show');
            this.loadingOverlay.setAttribute('aria-hidden', 'true');
        }
    }
    
    /**
     * Set loading state for a specific button
     * @param {HTMLElement|string} button - Button element or selector
     * @param {boolean} loading - Loading state
     */
    static setButtonLoading(button, loading) {
        const btnElement = typeof button === 'string' ? document.querySelector(button) : button;
        
        if (!btnElement) {
            console.warn('Button not found for loading state');
            return;
        }
        
        if (loading) {
            btnElement.classList.add('loading');
            btnElement.disabled = true;
            
            // Update aria-label for accessibility
            const originalLabel = btnElement.getAttribute('aria-label') || btnElement.textContent;
            btnElement.setAttribute('data-original-label', originalLabel);
            btnElement.setAttribute('aria-label', `${originalLabel} (Loading...)`);
            
        } else {
            btnElement.classList.remove('loading');
            btnElement.disabled = false;
            
            // Restore original aria-label
            const originalLabel = btnElement.getAttribute('data-original-label');
            if (originalLabel) {
                btnElement.setAttribute('aria-label', originalLabel);
                btnElement.removeAttribute('data-original-label');
            }
        }
    }
    
    /**
     * Wrap an async function with loading state management
     * @param {Function} asyncFn - Async function to wrap
     * @param {Object} options - Loading options
     * @returns {Function} Wrapped function
     */
    static withLoading(asyncFn, options = {}) {
        return async (...args) => {
            const {
                message = 'Loading...',
                id = 'default',
                button = null,
                silent = false
            } = options;
            
            try {
                if (!silent) {
                    this.show(message, id);
                }
                
                if (button) {
                    this.setButtonLoading(button, true);
                }
                
                const result = await asyncFn(...args);
                return result;
                
            } finally {
                if (!silent) {
                    this.hide(id);
                }
                
                if (button) {
                    this.setButtonLoading(button, false);
                }
            }
        };
    }
    
    /**
     * Create a loading wrapper for a promise
     * @param {Promise} promise - Promise to wrap
     * @param {Object} options - Loading options
     * @returns {Promise} Wrapped promise
     */
    static async wrapPromise(promise, options = {}) {
        const {
            message = 'Loading...',
            id = 'default',
            button = null,
            silent = false
        } = options;
        
        try {
            if (!silent) {
                this.show(message, id);
            }
            
            if (button) {
                this.setButtonLoading(button, true);
            }
            
            const result = await promise;
            return result;
            
        } finally {
            if (!silent) {
                this.hide(id);
            }
            
            if (button) {
                this.setButtonLoading(button, false);
            }
        }
    }
    
    /**
     * Check if any loading states are active
     * @returns {boolean} True if loading
     */
    static isLoading() {
        return this.activeLoaders.size > 0;
    }
    
    /**
     * Get active loader IDs
     * @returns {Array} Array of active loader IDs
     */
    static getActiveLoaders() {
        return Array.from(this.activeLoaders);
    }
    
    /**
     * Clear all loading states
     */
    static clearAll() {
        this.activeLoaders.clear();
        
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('show');
            this.loadingOverlay.setAttribute('aria-hidden', 'true');
        }
        
        // Clear all button loading states
        document.querySelectorAll('.btn.loading').forEach(btn => {
            this.setButtonLoading(btn, false);
        });
    }
    
    /**
     * Create a debounced loading function
     * @param {number} delay - Delay in milliseconds
     * @returns {Object} Debounced loading functions
     */
    static createDebounced(delay = 300) {
        let showTimeout = null;
        let hideTimeout = null;
        
        return {
            show: (message, id) => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
                
                if (!showTimeout) {
                    showTimeout = setTimeout(() => {
                        this.show(message, id);
                        showTimeout = null;
                    }, delay);
                }
            },
            
            hide: (id) => {
                if (showTimeout) {
                    clearTimeout(showTimeout);
                    showTimeout = null;
                    return;
                }
                
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                }
                
                hideTimeout = setTimeout(() => {
                    this.hide(id);
                    hideTimeout = null;
                }, delay);
            }
        };
    }
    
    /**
     * Create a progress indicator for long-running operations
     * @param {string} message - Progress message
     * @param {Object} options - Progress options
     * @returns {Object} Progress control object
     */
    static createProgressIndicator(message, options = {}) {
        const {
            id = 'progress',
            showPercentage = true,
            showETA = false
        } = options;
        
        this.show(message, id);
        
        // Add progress bar to loading overlay
        if (this.loadingOverlay) {
            const existingProgress = this.loadingOverlay.querySelector('.progress-indicator');
            if (existingProgress) {
                existingProgress.remove();
            }
            
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-indicator';
            progressContainer.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-bar-fill"></div>
                </div>
                ${showPercentage ? '<div class="progress-percentage">0%</div>' : ''}
                ${showETA ? '<div class="progress-eta">Calculating...</div>' : ''}
            `;
            
            this.loadingOverlay.querySelector('.loading-content').appendChild(progressContainer);
        }
        
        const startTime = Date.now();
        
        return {
            updateProgress: (current, total, customMessage) => {
                const percent = Math.round((current / total) * 100);
                const message = customMessage || `${message} (${current}/${total})`;
                
                if (this.loadingText) {
                    this.loadingText.textContent = message;
                }
                
                const progressBar = this.loadingOverlay?.querySelector('.progress-bar-fill');
                if (progressBar) {
                    progressBar.style.width = `${percent}%`;
                }
                
                const percentageEl = this.loadingOverlay?.querySelector('.progress-percentage');
                if (percentageEl && showPercentage) {
                    percentageEl.textContent = `${percent}%`;
                }
                
                const etaEl = this.loadingOverlay?.querySelector('.progress-eta');
                if (etaEl && showETA && current > 0) {
                    const elapsed = Date.now() - startTime;
                    const rate = current / elapsed;
                    const remaining = (total - current) / rate;
                    const eta = new Date(Date.now() + remaining);
                    etaEl.textContent = `ETA: ${eta.toLocaleTimeString()}`;
                }
            },
            
            complete: (finalMessage) => {
                if (finalMessage && this.loadingText) {
                    this.loadingText.textContent = finalMessage;
                }
                
                const progressBar = this.loadingOverlay?.querySelector('.progress-bar-fill');
                if (progressBar) {
                    progressBar.style.width = '100%';
                }
                
                setTimeout(() => this.hide(id), 1000);
            },
            
            hide: () => {
                this.hide(id);
            }
        };
    }
    
    /**
     * Show inline loading indicator for specific elements
     * @param {HTMLElement|string} element - Element or selector
     * @param {string} message - Loading message
     * @param {Object} options - Loading options
     * @returns {Function} Function to hide the loading indicator
     */
    static showInlineLoading(element, message = 'Loading...', options = {}) {
        const targetElement = typeof element === 'string' ? 
            document.querySelector(element) : element;
        
        if (!targetElement) {
            console.warn('Target element not found for inline loading');
            return () => {};
        }
        
        const {
            showSpinner = true,
            replaceContent = false,
            className = 'inline-loading'
        } = options;
        
        // Store original content if replacing
        let originalContent = null;
        if (replaceContent) {
            originalContent = targetElement.innerHTML;
        }
        
        // Create loading indicator
        const loadingEl = document.createElement('div');
        loadingEl.className = className;
        loadingEl.innerHTML = `
            ${showSpinner ? '<div class="loading-spinner"></div>' : ''}
            <span class="loading-message">${message}</span>
        `;
        
        if (replaceContent) {
            targetElement.innerHTML = '';
            targetElement.appendChild(loadingEl);
        } else {
            targetElement.appendChild(loadingEl);
        }
        
        // Add loading class to target element
        targetElement.classList.add('loading-state');
        
        // Return function to hide loading
        return () => {
            targetElement.classList.remove('loading-state');
            
            if (replaceContent && originalContent !== null) {
                targetElement.innerHTML = originalContent;
            } else {
                const loadingIndicator = targetElement.querySelector(`.${className}`);
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
            }
        };
    }
    
    /**
     * Create a loading state manager for multiple operations
     * @returns {Object} Multi-operation loading manager
     */
    static createMultiOperationManager() {
        const operations = new Map();
        
        return {
            start: (operationId, message) => {
                operations.set(operationId, { message, startTime: Date.now() });
                this.updateMultiOperationDisplay(operations);
            },
            
            update: (operationId, message) => {
                const operation = operations.get(operationId);
                if (operation) {
                    operation.message = message;
                    this.updateMultiOperationDisplay(operations);
                }
            },
            
            complete: (operationId) => {
                operations.delete(operationId);
                if (operations.size === 0) {
                    this.hide('multi-operation');
                } else {
                    this.updateMultiOperationDisplay(operations);
                }
            },
            
            completeAll: () => {
                operations.clear();
                this.hide('multi-operation');
            }
        };
    }
    
    /**
     * Update display for multiple operations
     * @param {Map} operations - Active operations
     */
    static updateMultiOperationDisplay(operations) {
        const operationList = Array.from(operations.values());
        const message = operationList.length === 1 ? 
            operationList[0].message :
            `${operationList.length} operations in progress...`;
        
        this.show(message, 'multi-operation');
    }}
