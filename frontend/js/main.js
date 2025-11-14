// Prompt-Laboratory Main Application
import { AppController } from './controllers/AppController.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { LoadingManager } from './utils/LoadingManager.js';
import { ToastManager } from './utils/ToastManager.js';
import { layoutManager } from './utils/LayoutManager.js';
import { collapsibleManager } from './utils/CollapsibleManager.js';
import { resizeManager } from './utils/ResizeManager.js';

// Global error handling
window.addEventListener('error', (event) => {
    ErrorHandler.handleError(event.error, 'Global error');
});

window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handleError(event.reason, 'Unhandled promise rejection');
});

// Application initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Prompt-Laboratory initializing...');
        
        // Initialize core utilities
        LoadingManager.init();
        ToastManager.init();
        ErrorHandler.init();
        layoutManager.init();
        
        // Make layoutManager globally accessible for keyboard shortcuts
        window.layoutManager = layoutManager;
        
        // Restore layout preference
        layoutManager.restorePreference();
        
        // Initialize collapsible sections
        initializeCollapsibles();
        
        // Initialize resizable sections
        initializeResizers();
        
        // Initialize main application controller
        const app = new AppController();
        await app.init();
        
        console.log('Prompt-Laboratory ready');
        ToastManager.show('Prompt-Laboratory initialized successfully', 'success');
        
    } catch (error) {
        console.error('Failed to initialize Prompt-Laboratory:', error);
        ErrorHandler.handleError(error, 'Application initialization failed');
    }
});

// Initialize collapsible sections
function initializeCollapsibles() {
    // Test Chamber Parameters
    const toggleBtn = document.getElementById('toggle-parameters-btn');
    const content = document.getElementById('parameters-content');
    const header = document.querySelector('.parameters-header');
    
    if (toggleBtn && content) {
        collapsibleManager.register(
            'test-parameters',
            toggleBtn,
            content,
            true, // Default expanded
            'prompt-laboratory-parameters-expanded'
        );
        
        // Make the entire header clickable (except the button itself)
        if (header) {
            header.addEventListener('click', (e) => {
                // Don't trigger if clicking the button directly (it has its own handler)
                if (e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
                    collapsibleManager.toggle('test-parameters');
                }
            });
        }
    }
}

// Initialize resizable sections
function initializeResizers() {
    // Test Chamber Results (Response vs YAML)
    const handle = document.getElementById('results-resize-handle');
    const responseSection = document.getElementById('response-section');
    const yamlSection = document.getElementById('yaml-section');
    
    if (handle && responseSection && yamlSection) {
        resizeManager.register(
            'test-results',
            handle,
            responseSection,
            yamlSection,
            'prompt-laboratory-results-resize'
        );
    }
}