// Library Panel Component
import { NotificationManager } from '../utils/NotificationManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { ToastManager } from '../utils/ToastManager.js';

export class LibraryPanel {
    constructor({ eventBus, apiClient }) {
        this.eventBus = eventBus;
        this.apiClient = apiClient;
        this.prompts = [];
        this.filteredPrompts = [];
        this.searchQuery = '';
        this.searchTimeout = null;
        this.isLoading = false;
        
        // DOM elements
        this.container = null;
        this.searchInput = null;
        this.promptList = null;
        this.newPromptBtn = null;
        this.exportBtn = null;
        this.importBtn = null;
        this.importFileInput = null;
    }
    
    init() {
        this.container = document.querySelector('.library-panel');
        this.searchInput = document.getElementById('search-input');
        this.promptList = document.getElementById('prompt-list');
        this.newPromptBtn = document.getElementById('new-prompt-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.importBtn = document.getElementById('import-btn');
        
        this.createImportFileInput();
        this.setupEventListeners();
        this.loadPrompts();
        console.log('LibraryPanel initialized');
    }
    
    setupEventListeners() {
        // Search functionality with debouncing
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            // Clear search on escape
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch();
                }
            });
        }
        
        // Button handlers
        if (this.newPromptBtn) {
            this.newPromptBtn.addEventListener('click', () => {
                this.handleNewPrompt();
            });
        }
        
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => {
                this.handleExport();
            });
        }
        
        if (this.importBtn) {
            this.importBtn.addEventListener('click', () => {
                this.handleImport();
            });
        }
        
        // File input handler
        if (this.importFileInput) {
            this.importFileInput.addEventListener('change', (e) => {
                this.handleFileSelected(e.target.files[0]);
            });
        }
        
        // Event bus listeners
        this.eventBus.on('prompt:saved', () => {
            this.refreshPrompts();
        });
        
        this.eventBus.on('library:refresh', () => {
            this.refreshPrompts();
        });
    }
    
    /**
     * Load all prompts from the API
     */
    async loadPrompts() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoadingState();
            
            const prompts = await this.apiClient.getPrompts();
            this.prompts = Array.isArray(prompts) ? prompts : [];
            this.applyCurrentFilter();
            this.renderPromptList();
            
        } catch (error) {
            NotificationManager.error('Failed to load prompts', {
                onRetry: () => this.loadPrompts()
            });
            this.showErrorState('Failed to load prompts');
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Refresh the prompt list
     */
    async refreshPrompts() {
        await this.loadPrompts();
    }
    
    /**
     * Handle search input with debouncing
     * @param {string} query - Search query
     */
    handleSearchInput(query) {
        // Clear existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Debounce search to avoid excessive filtering
        this.searchTimeout = setTimeout(() => {
            this.handleSearch(query);
        }, 300);
    }
    
    /**
     * Filter prompts based on search query
     * @param {string} query - Search query
     */
    handleSearch(query) {
        this.searchQuery = query.trim().toLowerCase();
        this.applyCurrentFilter();
        this.renderPromptList();
    }
    
    /**
     * Clear search input and show all prompts
     */
    clearSearch() {
        this.searchInput.value = '';
        this.searchQuery = '';
        this.applyCurrentFilter();
        this.renderPromptList();
    }
    
    /**
     * Apply current search filter to prompts
     */
    applyCurrentFilter() {
        if (!this.searchQuery) {
            this.filteredPrompts = [...this.prompts];
            return;
        }
        
        this.filteredPrompts = this.prompts.filter(prompt => {
            const name = (prompt.name || '').toLowerCase();
            const description = (prompt.description || '').toLowerCase();
            return name.includes(this.searchQuery) || description.includes(this.searchQuery);
        });
    }
    
    /**
     * Handle new prompt creation
     */
    handleNewPrompt() {
        this.eventBus.emit('prompt:new');
    }
    
    /**
     * Render the prompt list in the DOM
     */
    renderPromptList() {
        if (!this.promptList) return;
        
        // Clear existing content
        this.promptList.innerHTML = '';
        
        if (this.filteredPrompts.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Create prompt items
        this.filteredPrompts.forEach(prompt => {
            const promptItem = this.createPromptItem(prompt);
            this.promptList.appendChild(promptItem);
        });
    }
    
    /**
     * Create a prompt item element
     * @param {Object} prompt - Prompt data
     * @returns {HTMLElement} Prompt item element
     */
    createPromptItem(prompt) {
        const item = document.createElement('div');
        item.className = 'prompt-item';
        item.setAttribute('role', 'listitem');
        item.setAttribute('data-prompt-id', prompt.id);
        
        item.innerHTML = `
            <div class="prompt-item-content">
                <div class="prompt-item-header">
                    <div class="prompt-item-title-wrapper">
                        <h3 class="prompt-item-name">${this.escapeHtml(prompt.name)}</h3>
                        <button class="btn-icon edit-prompt-btn" 
                                aria-label="Edit prompt name and description"
                                data-action="edit-prompt" data-prompt-id="${prompt.id}"
                                title="Edit name and description">
                            ✏️
                        </button>
                    </div>
                    <div class="prompt-item-actions">
                        <button class="btn btn-small btn-primary load-btn" 
                                aria-label="Load prompt: ${this.escapeHtml(prompt.name)}"
                                data-action="load" data-prompt-id="${prompt.id}">
                            Load
                        </button>
                        <button class="btn btn-small btn-secondary delete-btn" 
                                aria-label="Delete prompt: ${this.escapeHtml(prompt.name)}"
                                data-action="delete" data-prompt-id="${prompt.id}">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="prompt-item-description">
                    ${prompt.description ? this.escapeHtml(prompt.description) : '<em>No description</em>'}
                </div>
                <div class="prompt-item-meta">
                    <span class="prompt-item-model">${this.escapeHtml(prompt.model || 'Unknown')}</span>
                    <span class="prompt-item-temp">Temp: ${prompt.temperature || 0.7}</span>
                    <span class="prompt-item-date">${this.formatDate(prompt.updated_at || prompt.created_at)}</span>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.setupPromptItemListeners(item, prompt);
        
        return item;
    }
    
    /**
     * Setup event listeners for a prompt item
     * @param {HTMLElement} item - Prompt item element
     * @param {Object} prompt - Prompt data
     */
    setupPromptItemListeners(item, prompt) {
        // Load button
        const loadBtn = item.querySelector('[data-action="load"]');
        if (loadBtn) {
            loadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleLoadPrompt(prompt);
            });
        }
        
        // Delete button
        const deleteBtn = item.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeletePrompt(prompt);
            });
        }
        
        // Edit prompt button
        const editPromptBtn = item.querySelector('[data-action="edit-prompt"]');
        if (editPromptBtn) {
            editPromptBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleEditPrompt(prompt);
            });
        }
        
        // Click on item to load
        item.addEventListener('click', () => {
            this.handleLoadPrompt(prompt);
        });
        
        // Keyboard navigation
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleLoadPrompt(prompt);
            } else if (e.key === 'Delete') {
                e.preventDefault();
                this.handleDeletePrompt(prompt);
            }
        });
        
        // Make item focusable
        item.setAttribute('tabindex', '0');
    }
    
    /**
     * Handle loading a prompt
     * @param {Object} prompt - Prompt to load
     */
    handleLoadPrompt(prompt) {
        this.eventBus.emit('prompt:selected', prompt);
        ToastManager.success(`Loaded prompt: ${prompt.name}`);
    }
    
    /**
     * Handle deleting a prompt with confirmation
     * @param {Object} prompt - Prompt to delete
     */
    async handleDeletePrompt(prompt) {
        const confirmed = await this.showDeleteConfirmation(prompt);
        if (!confirmed) return;
        
        try {
            await this.apiClient.deletePrompt(prompt.id);
            this.eventBus.emit('prompt:deleted', prompt.id);
            await this.refreshPrompts();
            ToastManager.success(`Deleted prompt: ${prompt.name}`);
        } catch (error) {
            ErrorHandler.handleError(error, 'Deleting prompt');
        }
    }
    
    /**
     * Handle editing a prompt's name and description
     * @param {Object} prompt - Prompt to edit
     */
    async handleEditPrompt(prompt) {
        const result = await this.showEditPromptDialog(prompt);
        if (!result) return; // User cancelled
        
        try {
            await this.apiClient.updatePrompt(prompt.id, {
                name: result.name.trim(),
                description: result.description.trim() || null
            });
            await this.refreshPrompts();
            ToastManager.success('Prompt updated successfully');
        } catch (error) {
            // Check for duplicate name error
            if (error.status === 409 || error.message.includes('already exists')) {
                ToastManager.error('A prompt with this name already exists');
            } else {
                ErrorHandler.handleError(error, 'Updating prompt');
            }
        }
    }
    
    /**
     * Show edit prompt dialog
     * @param {Object} prompt - Prompt to edit
     * @returns {Promise<Object|null>} Object with name and description, or null if cancelled
     */
    async showEditPromptDialog(prompt) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'edit-prompt-title');
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="edit-prompt-title">Edit Prompt</h3>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="name-input">Prompt Name:</label>
                            <input type="text" 
                                   id="name-input" 
                                   class="name-input" 
                                   value="${this.escapeHtml(prompt.name)}"
                                   placeholder="Enter prompt name..."
                                   maxlength="255"
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="description-input">Description (optional):</label>
                            <textarea id="description-input" 
                                      class="description-input" 
                                      placeholder="Brief description of this prompt..."
                                      rows="4"
                                      maxlength="1000">${this.escapeHtml(prompt.description || '')}</textarea>
                            <div class="form-help">Maximum 1000 characters</div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary cancel-btn">Cancel</button>
                        <button class="btn btn-primary save-btn">Save</button>
                    </div>
                </div>
            `;
            
            const nameInput = modal.querySelector('#name-input');
            const descriptionInput = modal.querySelector('#description-input');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const saveBtn = modal.querySelector('.save-btn');
            
            const cleanup = () => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            };
            
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });
            
            saveBtn.addEventListener('click', () => {
                const name = nameInput.value.trim();
                if (!name) {
                    nameInput.focus();
                    return;
                }
                
                cleanup();
                resolve({
                    name,
                    description: descriptionInput.value.trim()
                });
            });
            
            // Handle Enter key on name input
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveBtn.click();
                } else if (e.key === 'Escape') {
                    cancelBtn.click();
                }
            });
            
            // Handle Ctrl/Cmd+Enter on description to save
            descriptionInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    saveBtn.click();
                } else if (e.key === 'Escape') {
                    cancelBtn.click();
                }
            });
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cancelBtn.click();
                }
            });
            
            // Close on escape
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    cancelBtn.click();
                }
            });
            
            document.body.appendChild(modal);
            nameInput.focus();
            nameInput.select();
        });
    }
    
    /**
     * Show delete confirmation dialog
     * @param {Object} prompt - Prompt to delete
     * @returns {Promise<boolean>} True if confirmed
     */
    async showDeleteConfirmation(prompt) {
        return new Promise((resolve) => {
            const modal = this.createConfirmationModal(
                'Delete Prompt',
                `Are you sure you want to delete "${prompt.name}"? This action cannot be undone.`,
                [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        handler: () => {
                            this.removeModal(modal);
                            resolve(false);
                        }
                    },
                    {
                        label: 'Delete',
                        type: 'danger',
                        handler: () => {
                            this.removeModal(modal);
                            resolve(true);
                        }
                    }
                ]
            );
            
            document.body.appendChild(modal);
            modal.querySelector('.modal-action-btn[data-type="danger"]').focus();
        });
    }
    
    /**
     * Create a confirmation modal
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     * @param {Array} actions - Action buttons
     * @returns {HTMLElement} Modal element
     */
    createConfirmationModal(title, message, actions) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');
        
        const actionsHtml = actions.map(action => 
            `<button class="btn btn-${action.type} modal-action-btn" data-type="${action.type}">
                ${this.escapeHtml(action.label)}
            </button>`
        ).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-title">${this.escapeHtml(title)}</h3>
                </div>
                <div class="modal-body">
                    <p>${this.escapeHtml(message)}</p>
                </div>
                <div class="modal-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;
        
        // Add event listeners
        actions.forEach((action, index) => {
            const btn = modal.querySelectorAll('.modal-action-btn')[index];
            btn.addEventListener('click', action.handler);
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                actions[0].handler(); // Call first action (usually cancel)
            }
        });
        
        // Close on escape
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                actions[0].handler(); // Call first action (usually cancel)
            }
        });
        
        return modal;
    }
    
    /**
     * Remove modal from DOM
     * @param {HTMLElement} modal - Modal to remove
     */
    removeModal(modal) {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }
    
    /**
     * Show loading state
     */
    showLoadingState() {
        if (!this.promptList) return;
        
        this.promptList.innerHTML = `
            <div class="prompt-list-state">
                <div class="loading-spinner-large"></div>
                <p>Loading prompts...</p>
            </div>
        `;
    }
    
    /**
     * Show empty state
     */
    showEmptyState() {
        const message = this.searchQuery 
            ? `No prompts found matching "${this.searchQuery}"`
            : 'No prompts saved yet. Create your first prompt!';
            
        this.promptList.innerHTML = `
            <div class="prompt-list-state">
                <div class="empty-state-icon">📝</div>
                <p>${this.escapeHtml(message)}</p>
                ${!this.searchQuery ? '<button class="btn btn-primary" id="empty-new-prompt">Create New Prompt</button>' : ''}
            </div>
        `;
        
        // Add event listener for empty state button
        const emptyNewBtn = this.promptList.querySelector('#empty-new-prompt');
        if (emptyNewBtn) {
            emptyNewBtn.addEventListener('click', () => {
                this.handleNewPrompt();
            });
        }
    }
    
    /**
     * Show error state
     * @param {string} message - Error message
     */
    showErrorState(message) {
        if (!this.promptList) return;
        
        this.promptList.innerHTML = `
            <div class="prompt-list-state">
                <div class="error-state-icon">⚠️</div>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn-secondary" id="retry-load">Retry</button>
            </div>
        `;
        
        // Add retry handler
        const retryBtn = this.promptList.querySelector('#retry-load');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.loadPrompts();
            });
        }
    }
    
    /**
     * Create hidden file input for imports
     */
    createImportFileInput() {
        this.importFileInput = document.createElement('input');
        this.importFileInput.type = 'file';
        this.importFileInput.accept = '.json,.yaml,.yml';
        this.importFileInput.style.display = 'none';
        document.body.appendChild(this.importFileInput);
    }
    

    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'Unknown';
        }
    }
    
    /**
     * Handle library export
     */
    async handleExport() {
        if (this.prompts.length === 0) {
            NotificationManager.warning('No prompts to export');
            return;
        }
        
        const exportOperation = NotificationManager.startOperation(
            'export-library',
            'Preparing export...',
            { showProgress: true, showInToast: true }
        );
        
        try {
            exportOperation.updateProgress(1, 4, 'Preparing export...');
            
            // Get export data from API
            const response = await this.apiClient.exportLibrary();
            exportOperation.updateProgress(2, 4, 'Processing data...');
            
            // Extract the actual export data from the response
            const exportData = response.export_data || response;
            const contentType = response.content_type || 'application/json';
            
            // Create and download file
            const filename = `promptlab-library-${this.formatDateForFilename(new Date())}.json`;
            exportOperation.updateProgress(3, 4, 'Creating download...');
            
            this.downloadFileRaw(exportData, filename, contentType);
            exportOperation.updateProgress(4, 4, 'Download started');
            
            exportOperation.complete(`Exported ${this.prompts.length} prompts successfully`);
            
        } catch (error) {
            exportOperation.fail('Export failed');
            NotificationManager.error('Failed to export library', {
                onRetry: () => this.handleExport()
            });
        }
    }
    
    /**
     * Handle library import
     */
    handleImport() {
        if (!this.importFileInput) {
            NotificationManager.error('Import functionality is not available');
            return;
        }
        
        this.importFileInput.click();
    }
    
    /**
     * Handle file selection for import
     * @param {File} file - Selected file
     */
    async handleFileSelected(file) {
        if (!file) return;
        
        // Validate file type
        const validTypes = ['application/json', 'text/yaml', 'application/x-yaml', 'text/yml'];
        const validExtensions = ['.json', '.yaml', '.yml'];
        
        const isValidType = validTypes.includes(file.type) || 
                           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!isValidType) {
            NotificationManager.error('Please select a valid JSON or YAML file');
            return;
        }
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            NotificationManager.error('File is too large. Maximum size is 10MB');
            return;
        }
        
        try {
            // Read and validate file first
            const fileContent = await this.readFileContent(file);
            const isValid = await this.validateImportFile(fileContent, file.name);
            
            if (!isValid) {
                NotificationManager.error('Invalid file format');
                return;
            }
            
            // Determine format from file extension
            const format = file.name.toLowerCase().endsWith('.yaml') || file.name.toLowerCase().endsWith('.yml') ? 'yaml' : 'json';
            
            // Ask user for conflict resolution strategy BEFORE starting progress overlay
            const conflictResolution = await this.showConflictResolutionDialog();
            if (!conflictResolution) {
                NotificationManager.info('Import cancelled');
                return;
            }
            
            // Now start the progress operation without overlay to avoid blocking
            const importOperation = NotificationManager.startOperation(
                'import-library',
                'Importing prompts...',
                { showProgress: true, showInToast: true, showInOverlay: false }
            );
            
            importOperation.updateProgress(1, 3, 'Importing prompts...');
            
            // Send to API with file content as string
            const result = await this.apiClient.importLibrary(fileContent, conflictResolution, format);
            importOperation.updateProgress(2, 3, 'Refreshing library...');
            
            // Refresh the prompt list
            await this.refreshPrompts();
            importOperation.updateProgress(3, 3, 'Import completed');
            
            // Show results
            this.showImportResults(result, importOperation);
            
        } catch (error) {
            importOperation.fail('Import failed');
            NotificationManager.error('Failed to import library', {
                onRetry: () => this.handleFileSelected(file)
            });
        } finally {
            // Reset file input
            this.importFileInput.value = '';
        }
    }
    
    /**
     * Read file content as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Validate import file format
     * @param {string} content - File content
     * @param {string} filename - File name
     * @returns {Promise<boolean>} True if valid
     */
    async validateImportFile(content, filename) {
        try {
            let data;
            
            if (filename.toLowerCase().endsWith('.json')) {
                data = JSON.parse(content);
            } else if (filename.toLowerCase().endsWith('.yaml') || filename.toLowerCase().endsWith('.yml')) {
                // For YAML, we'll let the server handle parsing
                // Just check if it's not empty
                if (!content.trim()) {
                    throw new Error('File is empty');
                }
                return true;
            } else {
                throw new Error('Unsupported file format');
            }
            
            // Basic validation for JSON structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid file format: expected object');
            }
            
            // Check if it looks like a prompt library export
            if (Array.isArray(data)) {
                // Array of prompts
                if (data.length > 0 && !data[0].name && !data[0].system_prompt) {
                    throw new Error('Invalid prompt format: missing required fields');
                }
            } else if (data.prompts && Array.isArray(data.prompts)) {
                // Wrapped format
                if (data.prompts.length > 0 && !data.prompts[0].name && !data.prompts[0].system_prompt) {
                    throw new Error('Invalid prompt format: missing required fields');
                }
            } else {
                throw new Error('Invalid file format: expected array of prompts or object with prompts array');
            }
            
            return true;
            
        } catch (error) {
            ToastManager.error(`Invalid file format: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Show import results to user
     * @param {Object} result - Import result from API
     * @param {Object} progressToast - Progress toast to update
     */
    showImportResults(result, progressToast) {
        const imported = result.imported || 0;
        const conflicts = result.conflicts || [];
        const errors = result.errors || [];
        
        let message = `Successfully imported ${imported} prompts`;
        
        if (conflicts.length > 0) {
            message += ` (${conflicts.length} conflicts resolved)`;
        }
        
        if (errors.length > 0) {
            message += ` (${errors.length} errors)`;
            progressToast.complete(message);
            
            // Show detailed error information
            setTimeout(() => {
                this.showImportErrorDetails(errors);
            }, 1000);
        } else {
            progressToast.complete(message);
        }
        
        // Show conflict details if any
        if (conflicts.length > 0) {
            setTimeout(() => {
                this.showImportConflictDetails(conflicts);
            }, 1000);
        }
    }
    
    /**
     * Show import error details
     * @param {Array} errors - Array of error messages
     */
    showImportErrorDetails(errors) {
        const errorList = errors.slice(0, 5).map(error => `• ${error}`).join('\n');
        const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more` : '';
        
        ToastManager.error(`Import errors:\n${errorList}${moreErrors}`, {
            duration: 10000
        });
    }
    
    /**
     * Show import conflict details
     * @param {Array} conflicts - Array of conflict information
     */
    showImportConflictDetails(conflicts) {
        const conflictList = conflicts.slice(0, 3).map(conflict => 
            `• ${conflict.name}: ${conflict.resolution || 'resolved'}`
        ).join('\n');
        const moreConflicts = conflicts.length > 3 ? `\n... and ${conflicts.length - 3} more` : '';
        
        ToastManager.warning(`Import conflicts resolved:\n${conflictList}${moreConflicts}`, {
            duration: 8000
        });
    }
    
    /**
     * Download file to user's computer
     * @param {Object} data - Data to download
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadFile(data, filename, mimeType) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
        } catch (error) {
            throw new Error(`Failed to download file: ${error.message}`);
        }
    }
    
    /**
     * Download pre-formatted data as file
     * @param {string} data - Pre-formatted data string
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadFileRaw(data, filename, mimeType) {
        try {
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
        } catch (error) {
            throw new Error(`Failed to download file: ${error.message}`);
        }
    }
    
    /**
     * Format date for filename
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDateForFilename(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    /**
     * Show conflict resolution dialog
     * @returns {Promise<string|null>} Selected conflict resolution strategy or null if cancelled
     */
    async showConflictResolutionDialog() {
        return new Promise((resolve) => {
            const modal = this.createConfirmationModal(
                'Import Conflict Resolution',
                'How should conflicts with existing prompts be handled?',
                [
                    {
                        label: 'Skip Conflicts',
                        type: 'secondary',
                        description: 'Keep existing prompts, skip duplicates',
                        handler: () => {
                            this.removeModal(modal);
                            resolve('skip');
                        }
                    },
                    {
                        label: 'Overwrite Existing',
                        type: 'warning',
                        description: 'Replace existing prompts with imported ones',
                        handler: () => {
                            this.removeModal(modal);
                            resolve('overwrite');
                        }
                    },
                    {
                        label: 'Rename Duplicates',
                        type: 'primary',
                        description: 'Import all prompts, rename duplicates',
                        handler: () => {
                            this.removeModal(modal);
                            resolve('rename');
                        }
                    },
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        handler: () => {
                            this.removeModal(modal);
                            resolve(null);
                        }
                    }
                ]
            );
            
            // Ensure modal appears above any progress overlays
            modal.style.zIndex = '10001';
            
            // Add specific class for conflict resolution modal
            modal.classList.add('conflict-resolution-modal');
            
            // Make the conflict resolution modal wider to accommodate 4 buttons
            const modalContent = modal.querySelector('.modal-content');
            modalContent.style.maxWidth = '650px';
            modalContent.style.width = '95%';
            
            // Improve button layout for multiple buttons
            const modalActions = modal.querySelector('.modal-actions');
            modalActions.classList.add('conflict-actions');
            modalActions.style.display = 'grid';
            modalActions.style.gridTemplateColumns = 'repeat(2, 1fr)';
            modalActions.style.gap = '0.75rem';
            modalActions.style.padding = '1.5rem';
            
            // Make buttons more readable
            const buttons = modal.querySelectorAll('.modal-action-btn');
            buttons.forEach(btn => {
                btn.style.padding = '0.75rem 1rem';
                btn.style.fontSize = '0.875rem';
                btn.style.whiteSpace = 'nowrap';
                btn.style.minWidth = '140px';
            });
            
            document.body.appendChild(modal);
            modal.querySelector('.modal-action-btn[data-type="primary"]').focus();
        });
    }
}