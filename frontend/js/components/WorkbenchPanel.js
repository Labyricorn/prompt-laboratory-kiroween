// Workbench Panel Component
export class WorkbenchPanel {
    constructor({ eventBus, apiClient, config }) {
        this.eventBus = eventBus;
        this.apiClient = apiClient;
        this.config = config;
        this.currentPrompt = null;
        this.isDirty = false;
        
        // DOM elements
        this.container = null;
        this.objectiveInput = null;
        this.refineBtn = null;
        this.saveBtn = null;
        this.saveAsBtn = null;
        this.editorContainer = null;
        this.editor = null; // Monaco editor instance
    }
    
    async init() {
        this.container = document.querySelector('.workbench-panel');
        this.objectiveInput = document.getElementById('objective-input');
        this.refineBtn = document.getElementById('refine-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.saveAsBtn = document.getElementById('save-as-btn');
        this.copyPromptBtn = document.getElementById('copy-prompt-btn');
        this.editorContainer = document.getElementById('system-prompt-editor');
        
        this.setupEventListeners();
        await this.initializeEditor();
        console.log('WorkbenchPanel initialized');
    }
    
    setupEventListeners() {
        // Objective input
        if (this.objectiveInput) {
            this.objectiveInput.addEventListener('input', () => {
                this.setDirtyState(true);
            });
        }
        
        // Button handlers
        if (this.refineBtn) {
            this.refineBtn.addEventListener('click', () => {
                this.handleRefine();
            });
        }
        
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => {
                this.savePrompt();
            });
        }
        
        if (this.saveAsBtn) {
            this.saveAsBtn.addEventListener('click', () => {
                this.savePromptAs();
            });
        }
        
        if (this.copyPromptBtn) {
            this.copyPromptBtn.addEventListener('click', () => {
                this.handleCopyPrompt();
            });
        }
    }
    
    async initializeEditor() {
        if (!this.editorContainer) {
            console.error('Editor container not found');
            return;
        }
        
        try {
            // Configure Monaco Editor loader
            if (typeof require !== 'undefined') {
                require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });
                
                // Load Monaco Editor
                await new Promise((resolve, reject) => {
                    require(['vs/editor/editor.main'], resolve, reject);
                });
                
                // Create Monaco Editor instance
                this.editor = monaco.editor.create(this.editorContainer, {
                    value: '',
                    language: 'markdown',
                    theme: 'vs',
                    automaticLayout: true,
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    folding: true,
                    renderWhitespace: 'boundary',
                    tabSize: 2,
                    insertSpaces: true
                });
                
                // Set up change detection for dirty state
                this.editor.onDidChangeModelContent(() => {
                    this.setDirtyState(true);
                });
                
                console.log('Monaco Editor initialized successfully');
                
            } else {
                throw new Error('Monaco Editor loader not available');
            }
            
        } catch (error) {
            console.warn('Failed to initialize Monaco Editor, falling back to textarea:', error);
            this.initializeFallbackEditor();
        }
    }
    
    initializeFallbackEditor() {
        // Fallback textarea editor
        const textarea = document.createElement('textarea');
        textarea.className = 'editor-fallback';
        textarea.placeholder = 'System prompt will appear here...';
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.fontFamily = 'Monaco, Menlo, "Ubuntu Mono", monospace';
        textarea.style.fontSize = '14px';
        textarea.style.padding = '1rem';
        textarea.style.backgroundColor = '#fafafa';
        
        textarea.addEventListener('input', () => {
            this.setDirtyState(true);
        });
        
        this.editorContainer.appendChild(textarea);
        this.editor = { 
            getValue: () => textarea.value, 
            setValue: (value) => { 
                textarea.value = value || '';
            },
            dispose: () => {
                if (textarea.parentNode) {
                    textarea.parentNode.removeChild(textarea);
                }
            }
        };
        
        console.log('Fallback textarea editor initialized');
    }
    
    loadPrompt(prompt) {
        if (this.isDirty && !this.checkUnsavedChanges()) {
            return false;
        }
        
        this.currentPrompt = prompt;
        
        // Clear objective input when loading a saved prompt
        if (this.objectiveInput) {
            this.objectiveInput.value = '';
        }
        
        if (this.editor && prompt.system_prompt) {
            this.editor.setValue(prompt.system_prompt);
        }
        
        this.setDirtyState(false);
        return true;
    }
    
    clearPrompt() {
        if (this.isDirty && !this.checkUnsavedChanges()) {
            return false;
        }
        
        this.currentPrompt = null;
        
        if (this.objectiveInput) {
            this.objectiveInput.value = '';
            // Focus on the objective input for immediate user interaction
            setTimeout(() => {
                this.objectiveInput.focus();
            }, 100);
        }
        
        if (this.editor) {
            this.editor.setValue('');
        }
        
        this.setDirtyState(false);
        return true;
    }
    
    setSystemPrompt(prompt) {
        if (this.editor) {
            this.editor.setValue(prompt);
            this.setDirtyState(true);
        }
    }
    
    async handleCopyPrompt() {
        try {
            const promptText = this.editor?.getValue() || '';
            
            if (!promptText.trim()) {
                this.eventBus.emit('toast:show', 'No system prompt to copy', 'warning');
                return;
            }
            
            // Copy to clipboard
            await navigator.clipboard.writeText(promptText);
            
            // Show success feedback
            this.eventBus.emit('toast:show', 'System prompt copied to clipboard!', 'success');
            
            // Visual feedback on button
            this.showCopyFeedback();
            
        } catch (error) {
            console.error('Failed to copy prompt:', error);
            
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = this.editor?.getValue() || '';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.eventBus.emit('toast:show', 'System prompt copied to clipboard!', 'success');
                this.showCopyFeedback();
            } catch (fallbackError) {
                this.eventBus.emit('toast:show', 'Failed to copy to clipboard', 'error');
            }
        }
    }
    
    showCopyFeedback() {
        if (this.copyPromptBtn) {
            const originalText = this.copyPromptBtn.querySelector('.btn-text').textContent;
            const originalIcon = this.copyPromptBtn.querySelector('.copy-icon').textContent;
            
            // Change button appearance temporarily
            this.copyPromptBtn.querySelector('.btn-text').textContent = 'Copied!';
            this.copyPromptBtn.querySelector('.copy-icon').textContent = '✓';
            this.copyPromptBtn.classList.add('btn-accent');
            this.copyPromptBtn.classList.remove('btn-secondary');
            
            // Reset after 2 seconds
            setTimeout(() => {
                if (this.copyPromptBtn) {
                    this.copyPromptBtn.querySelector('.btn-text').textContent = originalText;
                    this.copyPromptBtn.querySelector('.copy-icon').textContent = originalIcon;
                    this.copyPromptBtn.classList.remove('btn-accent');
                    this.copyPromptBtn.classList.add('btn-secondary');
                }
            }, 2000);
        }
    }
    
    async handleRefine() {
        const objective = this.objectiveInput?.value?.trim();
        if (!objective) {
            this.eventBus.emit('toast:show', 'Please enter an objective to refine.', 'warning');
            return;
        }
        
        // Show loading state
        this.setRefineLoading(true);
        
        try {
            // Get current model from config or use default
            const model = this.config?.default_model || 'llama2';
            
            // Call API to refine the prompt
            const result = await this.apiClient.refinePrompt(objective, model);
            
            // Set the refined system prompt in the editor
            if (result.refined_prompt) {
                this.setSystemPrompt(result.refined_prompt);
                this.eventBus.emit('toast:show', 'Objective refined successfully!', 'success');
                
                // Emit event to notify other components
                this.eventBus.emit('prompt:refined', result.refined_prompt);
            } else {
                throw new Error('No refined prompt returned from API');
            }
            
        } catch (error) {
            console.error('Refinement failed:', error);
            this.eventBus.emit('toast:show', `Refinement failed: ${error.message}`, 'error');
        } finally {
            this.setRefineLoading(false);
        }
    }
    
    async savePrompt() {
        if (!this.validatePromptData()) {
            return;
        }
        
        try {
            if (this.currentPrompt) {
                // Update existing prompt
                await this.updateExistingPrompt();
            } else {
                // Save as new prompt
                await this.savePromptAs();
            }
        } catch (error) {
            console.error('Save failed:', error);
            this.eventBus.emit('toast:show', `Save failed: ${error.message}`, 'error');
        }
    }
    
    async savePromptAs(defaultName = '') {
        const result = await this.showNameDialog(defaultName);
        if (!result) return;
        
        if (!this.validatePromptData()) {
            return;
        }
        
        try {
            const promptData = {
                name: result.name,
                description: result.description,
                ...this.getPromptData()
            };
            
            const savedPrompt = await this.apiClient.createPrompt(promptData);
            
            this.currentPrompt = savedPrompt;
            this.setDirtyState(false);
            
            this.eventBus.emit('toast:show', `Prompt "${result.name}" saved successfully!`, 'success');
            
            this.eventBus.emit('library:refresh');
            
            // Update Test Chamber with the saved prompt so it can be tested immediately
            this.eventBus.emit('prompt:selected', savedPrompt);
            
        } catch (error) {
            // Check for conflict errors (409 status or specific messages)
            if (error.status === 409 || 
                error.message.includes('already exists') || 
                error.message.includes('unique') ||
                error.message.includes('DUPLICATE_NAME')) {
                // Handle name conflict
                const shouldOverwrite = confirm(`A prompt named "${result.name}" already exists. Do you want to overwrite it?`);
                if (shouldOverwrite) {
                    await this.handleNameConflict(result.name);
                } else {
                    // User chose not to overwrite, show the name dialog again with a different default name
                    this.eventBus.emit('toast:show', 'Please choose a different name.', 'info');
                    const newName = this.generateUniqueName(result.name);
                    await this.savePromptAs(newName);
                }
            } else {
                throw error;
            }
        }
    }
    
    getPromptData() {
        console.log('WorkbenchPanel.getPromptData() - config:', this.config);
        console.log('WorkbenchPanel.getPromptData() - default_model:', this.config?.default_model);
        
        return {
            system_prompt: this.editor?.getValue() || '',
            model: this.config?.default_model || 'llama2',
            temperature: this.config?.default_temperature || 0.7
        };
    }
    
    setDirtyState(dirty) {
        this.isDirty = dirty;
        this.setDirtyIndicator(dirty);
        this.eventBus.emit('prompt:changed', dirty);
    }
    
    setDirtyIndicator(dirty) {
        // Visual indicator for unsaved changes
        if (this.saveBtn) {
            this.saveBtn.style.fontWeight = dirty ? 'bold' : 'normal';
            this.saveBtn.textContent = dirty ? 'Save*' : 'Save';
        }
        
        if (this.saveAsBtn) {
            this.saveAsBtn.style.fontWeight = dirty ? 'bold' : 'normal';
        }
        
        // Add visual indicator to the panel header
        const panelHeader = this.container?.querySelector('.panel-header h2');
        if (panelHeader) {
            panelHeader.textContent = dirty ? 'Workbench*' : 'Workbench';
        }
    }
    
    setRefineLoading(loading) {
        if (!this.refineBtn) return;
        
        const btnText = this.refineBtn.querySelector('.btn-text');
        const spinner = this.refineBtn.querySelector('.loading-spinner');
        
        if (loading) {
            this.refineBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (spinner) spinner.style.display = 'inline-block';
        } else {
            this.refineBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (spinner) spinner.style.display = 'none';
        }
    }
    
    updateConfig(newConfig) {
        this.config = newConfig;
        console.log('WorkbenchPanel: config updated', newConfig);
    }
    
    dispose() {
        if (this.editor && typeof this.editor.dispose === 'function') {
            this.editor.dispose();
        }
    }
    
    validatePromptData() {
        const systemPrompt = this.editor?.getValue()?.trim();
        
        if (!systemPrompt) {
            this.eventBus.emit('toast:show', 'Please enter a system prompt before saving.', 'warning');
            return false;
        }
        
        return true;
    }
    
    async updateExistingPrompt() {
        const promptData = this.getPromptData();
        
        const updatedPrompt = await this.apiClient.updatePrompt(this.currentPrompt.id, promptData);
        
        this.currentPrompt = updatedPrompt;
        this.setDirtyState(false);
        
        this.eventBus.emit('toast:show', `Prompt "${this.currentPrompt.name}" updated successfully!`, 'success');
        
        this.eventBus.emit('library:refresh');
        
        // Update Test Chamber with the updated prompt
        this.eventBus.emit('prompt:selected', updatedPrompt);
    }
    
    async showNameDialog(defaultName = '') {
        return new Promise((resolve) => {
            const modal = this.createNameDialog(defaultName, resolve);
            document.body.appendChild(modal);
            
            // Focus the input
            const input = modal.querySelector('.name-input');
            if (input) {
                input.focus();
                input.select();
            }
        });
    }
    
    createNameDialog(defaultName, callback) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content name-dialog">
                <h3>Save Prompt</h3>
                <div class="form-group">
                    <label for="prompt-name">Prompt Name:</label>
                    <input type="text" id="prompt-name" class="name-input" value="${defaultName}" placeholder="Enter prompt name...">
                </div>
                <div class="form-group">
                    <label for="prompt-description">Description (optional):</label>
                    <textarea id="prompt-description" class="description-input" placeholder="Brief description of this prompt..."></textarea>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary cancel-btn">Cancel</button>
                    <button class="btn btn-primary save-btn">Save</button>
                </div>
            </div>
        `;
        
        // Event handlers
        const nameInput = modal.querySelector('.name-input');
        const descriptionInput = modal.querySelector('.description-input');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const saveBtn = modal.querySelector('.save-btn');
        
        const cleanup = () => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        };
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            callback(null);
        });
        
        saveBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (!name) {
                nameInput.focus();
                return;
            }
            
            cleanup();
            callback({
                name,
                description: descriptionInput.value.trim() || null
            });
        });
        
        // Handle Enter key
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            } else if (e.key === 'Escape') {
                cancelBtn.click();
            }
        });
        
        // Handle Escape key on modal
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelBtn.click();
            }
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cancelBtn.click();
            }
        });
        
        return modal;
    }
    
    async handleNameConflict(name) {
        try {
            // Find the existing prompt with this name
            const prompts = await this.apiClient.getPrompts({ search: name });
            const existingPrompt = prompts.find(p => p.name === name);
            
            if (existingPrompt) {
                // Update the existing prompt
                const promptData = this.getPromptData();
                const updatedPrompt = await this.apiClient.updatePrompt(existingPrompt.id, promptData);
                
                this.currentPrompt = updatedPrompt;
                this.setDirtyState(false);
                
                this.eventBus.emit('toast:show', `Prompt "${name}" overwritten successfully!`, 'success');
                
                this.eventBus.emit('library:refresh');
                
                // Update Test Chamber with the overwritten prompt
                this.eventBus.emit('prompt:selected', updatedPrompt);
            }
        } catch (error) {
            throw new Error(`Failed to overwrite prompt: ${error.message}`);
        }
    }
    
    checkUnsavedChanges() {
        if (this.isDirty) {
            return confirm('You have unsaved changes. Do you want to discard them?');
        }
        return true;
    }
    
    generateUniqueName(baseName) {
        // Generate a unique name by appending a timestamp or number
        const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
        return `${baseName} (${timestamp})`;
    }
}