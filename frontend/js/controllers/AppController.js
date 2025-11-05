// Main Application Controller
import { LibraryPanel } from '../components/LibraryPanel.js';
import { WorkbenchPanel } from '../components/WorkbenchPanel.js';
import { TestChamberPanel } from '../components/TestChamberPanel.js';
import { SettingsModal } from '../components/SettingsModal.js';
import { EventBus } from '../utils/EventBus.js';
import { ApiClient } from '../services/ApiClient.js';
import { ConfigService } from '../services/ConfigService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { LoadingManager } from '../utils/LoadingManager.js';
import { ToastManager } from '../utils/ToastManager.js';
import { NotificationManager } from '../utils/NotificationManager.js';

export class AppController {
    constructor() {
        this.eventBus = new EventBus();
        this.apiClient = new ApiClient();
        this.configService = new ConfigService(this.apiClient);
        
        // Component instances
        this.libraryPanel = null;
        this.workbenchPanel = null;
        this.testChamberPanel = null;
        this.settingsModal = null;
        
        // Application state
        this.currentPrompt = null;
        this.isDirty = false;
        this.config = null;
        
        this.setupEventListeners();
    }
    
    async init() {
        try {
            // Initialize notification system first
            NotificationManager.init();
            
            LoadingManager.show('Initializing application...');
            
            // Load configuration
            await this.loadConfiguration();
            
            // Initialize components
            await this.initializeComponents();
            
            // Setup inter-panel communication
            this.setupPanelCommunication();
            
            // Setup global event handlers
            this.setupGlobalHandlers();
            
            // Load initial data
            await this.loadInitialData();
            
            LoadingManager.hide();
            
        } catch (error) {
            LoadingManager.hide();
            this.handleConfigurationError(error);
            
            // Don't throw - allow app to continue with limited functionality
            console.warn('Application initialized with errors:', error);
        }
    }
    
    async loadConfiguration() {
        try {
            // Load configuration from backend
            const configResponse = await this.configService.getConfig();
            
            // Handle different response formats
            if (configResponse.config) {
                this.config = configResponse.config;
                this.ollamaStatus = configResponse.ollama_status;
            } else {
                this.config = configResponse;
                this.ollamaStatus = { connected: false, endpoint: this.config.ollama_endpoint };
            }
            
            // Display connection status
            this.displayConnectionStatus();
            
        } catch (error) {
            console.warn('Failed to load configuration, using defaults:', error);
            
            // Use default configuration
            this.config = this.configService.getDefaultConfig();
            this.ollamaStatus = { connected: false, endpoint: this.config.ollama_endpoint };
            
            // Show error message to user
            this.eventBus.emit('toast:show', 
                'Failed to load configuration. Using defaults. Check settings to configure Ollama connection.', 
                'warning'
            );
            
            // Display connection status
            this.displayConnectionStatus();
        }
    }
    
    async initializeComponents() {
        // Initialize panels with shared dependencies
        this.libraryPanel = new LibraryPanel({
            eventBus: this.eventBus,
            apiClient: this.apiClient
        });
        
        this.workbenchPanel = new WorkbenchPanel({
            eventBus: this.eventBus,
            apiClient: this.apiClient,
            config: this.config
        });
        
        this.testChamberPanel = new TestChamberPanel({
            eventBus: this.eventBus,
            apiClient: this.apiClient,
            config: this.config
        });
        
        this.settingsModal = new SettingsModal({
            eventBus: this.eventBus,
            configService: this.configService,
            config: this.config
        });
        
        // Initialize all components
        this.libraryPanel.init();
        await this.workbenchPanel.init(); // Wait for Monaco Editor to load
        this.testChamberPanel.init();
        this.settingsModal.init();
    }
    
    setupPanelCommunication() {
        // Library Panel Events
        this.eventBus.on('prompt:selected', (prompt) => {
            this.handlePromptSelected(prompt);
        });
        
        this.eventBus.on('prompt:deleted', (promptId) => {
            this.handlePromptDeleted(promptId);
        });
        
        this.eventBus.on('library:refresh', () => {
            this.libraryPanel.refreshPrompts();
        });
        
        // Workbench Panel Events
        this.eventBus.on('prompt:refined', (refinedPrompt) => {
            this.handlePromptRefined(refinedPrompt);
        });
        
        this.eventBus.on('prompt:saved', (prompt) => {
            this.handlePromptSaved(prompt);
        });
        
        this.eventBus.on('prompt:changed', () => {
            this.setDirtyState(true);
        });
        
        // Test Chamber Events
        this.eventBus.on('test:run-requested', (testData) => {
            this.handleTestRunRequested(testData);
        });
        
        this.eventBus.on('test:completed', (result) => {
            this.handleTestCompleted(result);
        });
        
        // Settings Events
        this.eventBus.on('config:updated', (newConfig) => {
            this.handleConfigUpdated(newConfig);
        });
        
        // Import/Export Events
        this.eventBus.on('library:export', () => {
            this.handleLibraryExport();
        });
        
        this.eventBus.on('library:import', (file) => {
            this.handleLibraryImport(file);
        });
        
        // New prompt event
        this.eventBus.on('prompt:new', () => {
            this.handleNewPrompt();
        });
        
        // Toast events
        this.eventBus.on('toast:show', (message, type = 'info', options = {}) => {
            ToastManager.show(message, type, options);
        });
    }
    
    setupGlobalHandlers() {
        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', async () => {
                await this.settingsModal.show();
            });
        }
        
        // Prevent accidental navigation with unsaved changes
        window.addEventListener('beforeunload', (event) => {
            if (this.isDirty) {
                event.preventDefault();
                event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return event.returnValue;
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    }
    
    async loadInitialData() {
        try {
            // Load prompts for library panel
            await this.libraryPanel.loadPrompts();
            
        } catch (error) {
            console.warn('Failed to load prompts:', error);
            this.eventBus.emit('toast:show', 'Failed to load prompt library', 'warning');
        }
        
        try {
            // Load available models for test chamber (only if Ollama is connected)
            if (this.ollamaStatus && this.ollamaStatus.connected) {
                await this.testChamberPanel.loadModels();
            } else {
                // Show guidance for setting up Ollama
                this.eventBus.emit('toast:show', 
                    'Ollama not connected. Click the connection status or settings to configure.', 
                    'info',
                    { duration: 5000 }
                );
            }
            
        } catch (error) {
            console.warn('Failed to load models:', error);
            this.eventBus.emit('toast:show', 'Failed to load AI models. Check Ollama connection in settings.', 'warning');
        }
    }
    
    setupEventListeners() {
        // This method is called in constructor to set up any early event listeners
        // Most event setup happens in setupPanelCommunication after components are initialized
    }
    
    // Event Handlers
    handlePromptSelected(prompt) {
        // The workbench panel will handle unsaved changes check internally
        const loaded = this.workbenchPanel.loadPrompt(prompt);
        if (loaded) {
            this.currentPrompt = prompt;
            this.testChamberPanel.updatePromptContext(prompt);
            this.setDirtyState(false);
        }
    }
    
    handlePromptDeleted(promptId) {
        if (this.currentPrompt && this.currentPrompt.id === promptId) {
            this.currentPrompt = null;
            this.workbenchPanel.clearPrompt();
            this.testChamberPanel.clearPromptContext();
            this.setDirtyState(false);
        }
    }
    
    handlePromptRefined(refinedPrompt) {
        this.workbenchPanel.setSystemPrompt(refinedPrompt);
        this.setDirtyState(true);
    }
    
    handlePromptSaved(prompt) {
        this.currentPrompt = prompt;
        this.setDirtyState(false);
        this.eventBus.emit('library:refresh');
    }
    
    async handleTestRunRequested(testData) {
        try {
            console.log('Running test with data:', testData);
            
            // Set loading state
            this.testChamberPanel.setLoadingState(true);
            this.testChamberPanel.resetResponseStyling();
            
            // Call API to run test
            const result = await this.apiClient.runTest(testData);
            
            // Display results
            this.testChamberPanel.displayTestResult(result);
            
        } catch (error) {
            console.error('Test execution failed:', error);
            this.testChamberPanel.displayTestError(error);
        } finally {
            // Always clear loading state
            this.testChamberPanel.setLoadingState(false);
        }
    }
    
    handleTestCompleted(result) {
        // Test results are handled by the test chamber panel
        // This is for any app-level actions needed after testing
        console.log('Test completed:', result);
    }
    
    async handleConfigUpdated(newConfig) {
        this.config = newConfig;
        
        // Update panels with new configuration
        this.workbenchPanel.updateConfig(newConfig);
        this.testChamberPanel.updateConfig(newConfig);
        
        // Test new Ollama connection and update status
        try {
            const connectionResult = await this.configService.testOllamaConnection();
            this.ollamaStatus = {
                connected: connectionResult.connected,
                endpoint: connectionResult.endpoint
            };
            this.displayConnectionStatus();
            
            // Refresh models in test chamber if connection is successful
            if (connectionResult.connected) {
                await this.testChamberPanel.loadModels();
            }
            
        } catch (error) {
            console.warn('Failed to test new Ollama connection:', error);
            this.ollamaStatus = { connected: false, endpoint: newConfig.ollama_endpoint };
            this.displayConnectionStatus();
        }
    }
    
    async handleLibraryExport() {
        try {
            LoadingManager.show('Exporting library...');
            const exportData = await this.apiClient.exportLibrary();
            this.downloadFile(exportData, 'promptlab-library.json', 'application/json');
            LoadingManager.hide();
        } catch (error) {
            LoadingManager.hide();
            ErrorHandler.handleError(error, 'Failed to export library');
        }
    }
    
    async handleLibraryImport(file) {
        try {
            LoadingManager.show('Importing library...');
            const result = await this.apiClient.importLibrary(file);
            await this.libraryPanel.loadPrompts();
            LoadingManager.hide();
            
            if (result.conflicts && result.conflicts.length > 0) {
                // Handle conflicts - for now just show a message
                alert(`Import completed with ${result.conflicts.length} conflicts resolved.`);
            }
        } catch (error) {
            LoadingManager.hide();
            ErrorHandler.handleError(error, 'Failed to import library');
        }
    }
    
    // Utility Methods
    setDirtyState(dirty) {
        this.isDirty = dirty;
        this.workbenchPanel.setDirtyIndicator(dirty);
    }
    
    confirmDiscardChanges() {
        return confirm('You have unsaved changes. Do you want to discard them?');
    }
    
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + S: Save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.workbenchPanel.savePrompt();
        }
        
        // Ctrl/Cmd + N: New prompt
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            this.eventBus.emit('prompt:new');
        }
        
        // Escape: Close modals
        if (event.key === 'Escape') {
            this.settingsModal.hide();
        }
    }
    
    handleNewPrompt() {
        const cleared = this.workbenchPanel.clearPrompt();
        if (cleared) {
            this.currentPrompt = null;
            this.testChamberPanel.clearPromptContext();
            this.setDirtyState(false);
        }
    }
    
    displayConnectionStatus() {
        // Create or update connection status indicator in the header
        let statusIndicator = document.getElementById('connection-status');
        
        if (!statusIndicator) {
            // Create status indicator if it doesn't exist
            const header = document.querySelector('.app-header');
            if (header) {
                statusIndicator = document.createElement('div');
                statusIndicator.id = 'connection-status';
                statusIndicator.className = 'connection-status-indicator';
                
                // Insert before settings button
                const settingsBtn = document.getElementById('settings-btn');
                if (settingsBtn) {
                    header.insertBefore(statusIndicator, settingsBtn);
                } else {
                    header.appendChild(statusIndicator);
                }
            }
        }
        
        if (statusIndicator && this.ollamaStatus) {
            const isConnected = this.ollamaStatus.connected;
            const endpoint = this.ollamaStatus.endpoint || 'Unknown';
            
            statusIndicator.className = `connection-status-indicator ${isConnected ? 'connected' : 'disconnected'}`;
            statusIndicator.innerHTML = `
                <span class="status-dot"></span>
                <span class="status-text">${isConnected ? 'Ollama Connected' : 'Ollama Disconnected'}</span>
            `;
            statusIndicator.title = `${isConnected ? 'Connected to' : 'Disconnected from'} ${endpoint}. Click to open settings.`;
            
            // Add click handler to open settings
            statusIndicator.onclick = async () => {
                await this.settingsModal.show();
            };
        }
    }
    
    showSetupGuidance() {
        // Show setup guidance when there are configuration issues
        const guidance = `
            <div class="setup-guidance">
                <h3>Setup Required</h3>
                <p>To use PromptLab, you need to have Ollama running locally:</p>
                <ol>
                    <li>Install Ollama from <a href="https://ollama.ai" target="_blank">ollama.ai</a></li>
                    <li>Start Ollama service</li>
                    <li>Pull at least one model (e.g., <code>ollama pull llama2</code>)</li>
                    <li>Click the connection status or settings button to configure</li>
                </ol>
            </div>
        `;
        
        this.eventBus.emit('toast:show', guidance, 'info', { 
            duration: 10000,
            allowHtml: true 
        });
    }
    
    handleConfigurationError(error) {
        console.error('Configuration error:', error);
        
        // Determine the type of error and provide appropriate guidance
        if (error.message.includes('connection') || error.message.includes('network')) {
            this.eventBus.emit('toast:show', 
                'Cannot connect to backend. Please ensure the server is running.', 
                'error'
            );
        } else if (error.message.includes('ollama') || error.message.includes('models')) {
            this.showSetupGuidance();
        } else {
            this.eventBus.emit('toast:show', 
                'Configuration error. Check settings and try again.', 
                'error'
            );
        }
    }
    
    downloadFile(data, filename, mimeType) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}