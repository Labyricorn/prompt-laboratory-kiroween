// Resize Manager - Handles resizable sections in the UI
export class ResizeManager {
    constructor() {
        this.resizers = new Map();
        this.isResizing = false;
        this.currentResizer = null;
    }
    
    /**
     * Register a resizable section
     * @param {string} id - Unique identifier
     * @param {HTMLElement} handle - Resize handle element
     * @param {HTMLElement} topSection - Section above the handle
     * @param {HTMLElement} bottomSection - Section below the handle
     * @param {string} storageKey - localStorage key for persistence (optional)
     */
    register(id, handle, topSection, bottomSection, storageKey = null) {
        if (!handle || !topSection || !bottomSection) {
            console.error(`ResizeManager: Invalid elements for ${id}`);
            return;
        }
        
        const resizer = {
            id,
            handle,
            topSection,
            bottomSection,
            storageKey,
            startY: 0,
            startTopHeight: 0,
            startBottomHeight: 0
        };
        
        // Restore saved sizes if storage key provided
        if (storageKey) {
            this.restoreSizes(resizer);
        }
        
        // Add mouse event listeners
        handle.addEventListener('mousedown', (e) => {
            this.startResize(e, resizer);
        });
        
        // Store reference
        this.resizers.set(id, resizer);
    }
    
    startResize(e, resizer) {
        e.preventDefault();
        
        this.isResizing = true;
        this.currentResizer = resizer;
        
        // Store initial positions and sizes
        resizer.startY = e.clientY;
        resizer.startTopHeight = resizer.topSection.offsetHeight;
        resizer.startBottomHeight = resizer.bottomSection.offsetHeight;
        
        // Add document-level event listeners
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Add resizing class for visual feedback
        resizer.handle.classList.add('resizing');
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
    }
    
    handleMouseMove = (e) => {
        if (!this.isResizing || !this.currentResizer) return;
        
        const resizer = this.currentResizer;
        const deltaY = e.clientY - resizer.startY;
        
        // Calculate new heights
        const newTopHeight = resizer.startTopHeight + deltaY;
        const newBottomHeight = resizer.startBottomHeight - deltaY;
        
        // Get minimum heights from CSS or use defaults
        const minTopHeight = parseInt(getComputedStyle(resizer.topSection).minHeight) || 150;
        const minBottomHeight = parseInt(getComputedStyle(resizer.bottomSection).minHeight) || 100;
        
        // Apply constraints
        if (newTopHeight >= minTopHeight && newBottomHeight >= minBottomHeight) {
            // Calculate flex values based on total height
            const totalHeight = resizer.startTopHeight + resizer.startBottomHeight;
            const topFlex = newTopHeight / totalHeight * 3; // Scale to reasonable flex values
            const bottomFlex = newBottomHeight / totalHeight * 3;
            
            resizer.topSection.style.flex = `${topFlex}`;
            resizer.bottomSection.style.flex = `${bottomFlex}`;
        }
    }
    
    handleMouseUp = () => {
        if (!this.isResizing || !this.currentResizer) return;
        
        const resizer = this.currentResizer;
        
        // Remove resizing class
        resizer.handle.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Save sizes if storage key provided
        if (resizer.storageKey) {
            this.saveSizes(resizer);
        }
        
        // Remove document-level event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        this.isResizing = false;
        this.currentResizer = null;
    }
    
    saveSizes(resizer) {
        try {
            const sizes = {
                topFlex: resizer.topSection.style.flex || '2',
                bottomFlex: resizer.bottomSection.style.flex || '1'
            };
            localStorage.setItem(resizer.storageKey, JSON.stringify(sizes));
        } catch (e) {
            console.warn('Failed to save resize state:', e);
        }
    }
    
    restoreSizes(resizer) {
        try {
            const saved = localStorage.getItem(resizer.storageKey);
            if (saved) {
                const sizes = JSON.parse(saved);
                resizer.topSection.style.flex = sizes.topFlex;
                resizer.bottomSection.style.flex = sizes.bottomFlex;
            }
        } catch (e) {
            console.warn('Failed to restore resize state:', e);
        }
    }
    
    /**
     * Reset a resizer to default sizes
     * @param {string} id - Identifier of the resizer
     */
    reset(id) {
        const resizer = this.resizers.get(id);
        if (!resizer) return;
        
        resizer.topSection.style.flex = '2';
        resizer.bottomSection.style.flex = '1';
        
        if (resizer.storageKey) {
            try {
                localStorage.removeItem(resizer.storageKey);
            } catch (e) {
                console.warn('Failed to clear resize state:', e);
            }
        }
    }
}

// Export singleton instance
export const resizeManager = new ResizeManager();
