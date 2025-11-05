// PromptLab Main Application
import { AppController } from './controllers/AppController.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { LoadingManager } from './utils/LoadingManager.js';
import { ToastManager } from './utils/ToastManager.js';

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
        console.log('PromptLab initializing...');
        
        // Initialize core utilities
        LoadingManager.init();
        ToastManager.init();
        ErrorHandler.init();
        
        // Initialize main application controller
        const app = new AppController();
        await app.init();
        
        console.log('PromptLab ready');
        ToastManager.show('PromptLab initialized successfully', 'success');
        
    } catch (error) {
        console.error('Failed to initialize PromptLab:', error);
        ErrorHandler.handleError(error, 'Application initialization failed');
    }
});