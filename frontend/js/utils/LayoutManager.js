// Layout Manager - Handles layout mode switching between Workbench and Test Chamber
export class LayoutManager {
    constructor() {
        this.appMain = null;
        this.currentMode = 'default'; // 'default', 'workbench-mode', 'test-chamber-mode'
        this.workbenchToggleBtn = null;
        this.testToggleBtn = null;
    }
    
    init() {
        this.appMain = document.querySelector('.app-main');
        this.workbenchToggleBtn = document.getElementById('layout-toggle-workbench');
        this.testToggleBtn = document.getElementById('layout-toggle-test');
        
        if (!this.appMain) {
            console.error('LayoutManager: .app-main element not found');
            return;
        }
        
        this.setupEventListeners();
        this.updateButtonStates();
    }
    
    setupEventListeners() {
        if (this.workbenchToggleBtn) {
            this.workbenchToggleBtn.addEventListener('click', () => {
                this.toggleWorkbenchMode();
            });
        }
        
        if (this.testToggleBtn) {
            this.testToggleBtn.addEventListener('click', () => {
                this.toggleTestChamberMode();
            });
        }
    }
    
    toggleWorkbenchMode() {
        if (this.currentMode === 'workbench-mode') {
            this.setMode('default');
        } else {
            this.setMode('workbench-mode');
        }
    }
    
    toggleTestChamberMode() {
        if (this.currentMode === 'test-chamber-mode') {
            this.setMode('default');
        } else {
            this.setMode('test-chamber-mode');
        }
    }
    
    setMode(mode) {
        if (!this.appMain) return;
        
        // Remove all mode classes
        this.appMain.classList.remove('workbench-mode', 'test-chamber-mode');
        
        // Add new mode class if not default
        if (mode !== 'default') {
            this.appMain.classList.add(mode);
        }
        
        this.currentMode = mode;
        this.updateButtonStates();
        
        // Store preference in localStorage
        try {
            localStorage.setItem('prompt-laboratory-layout-mode', mode);
        } catch (e) {
            console.warn('Failed to save layout preference:', e);
        }
    }
    
    updateButtonStates() {
        // Update workbench toggle button
        if (this.workbenchToggleBtn) {
            if (this.currentMode === 'workbench-mode') {
                this.workbenchToggleBtn.setAttribute('aria-label', 'Restore Default Layout');
                this.workbenchToggleBtn.setAttribute('title', 'Restore Default Layout');
                this.workbenchToggleBtn.style.backgroundColor = 'var(--primary-color)';
                this.workbenchToggleBtn.style.color = 'white';
                this.workbenchToggleBtn.style.borderColor = 'var(--primary-color)';
            } else {
                this.workbenchToggleBtn.setAttribute('aria-label', 'Expand Workbench');
                this.workbenchToggleBtn.setAttribute('title', 'Expand Workbench');
                this.workbenchToggleBtn.style.backgroundColor = '';
                this.workbenchToggleBtn.style.color = '';
                this.workbenchToggleBtn.style.borderColor = '';
            }
        }
        
        // Update test chamber toggle button
        if (this.testToggleBtn) {
            if (this.currentMode === 'test-chamber-mode') {
                this.testToggleBtn.setAttribute('aria-label', 'Restore Default Layout');
                this.testToggleBtn.setAttribute('title', 'Restore Default Layout');
                this.testToggleBtn.style.backgroundColor = 'var(--primary-color)';
                this.testToggleBtn.style.color = 'white';
                this.testToggleBtn.style.borderColor = 'var(--primary-color)';
            } else {
                this.testToggleBtn.setAttribute('aria-label', 'Expand Test Chamber');
                this.testToggleBtn.setAttribute('title', 'Expand Test Chamber');
                this.testToggleBtn.style.backgroundColor = '';
                this.testToggleBtn.style.color = '';
                this.testToggleBtn.style.borderColor = '';
            }
        }
    }
    
    restorePreference() {
        try {
            const savedMode = localStorage.getItem('prompt-laboratory-layout-mode');
            if (savedMode && ['default', 'workbench-mode', 'test-chamber-mode'].includes(savedMode)) {
                this.setMode(savedMode);
            } else {
                // Default to workbench-mode on first load
                this.setMode('workbench-mode');
            }
        } catch (e) {
            console.warn('Failed to restore layout preference:', e);
            // Fallback to workbench-mode if localStorage fails
            this.setMode('workbench-mode');
        }
    }
    
    getCurrentMode() {
        return this.currentMode;
    }
}

// Export singleton instance
export const layoutManager = new LayoutManager();
