// Collapsible Manager - Handles collapsible sections in the UI
export class CollapsibleManager {
    constructor() {
        this.collapsibles = new Map();
    }
    
    /**
     * Register a collapsible section
     * @param {string} id - Unique identifier for this collapsible
     * @param {HTMLElement} toggleBtn - Button that toggles the section
     * @param {HTMLElement} content - Content element to show/hide
     * @param {boolean} defaultExpanded - Whether section starts expanded
     * @param {string} storageKey - localStorage key for persistence (optional)
     */
    register(id, toggleBtn, content, defaultExpanded = true, storageKey = null) {
        if (!toggleBtn || !content) {
            console.error(`CollapsibleManager: Invalid elements for ${id}`);
            return;
        }
        
        const collapsible = {
            id,
            toggleBtn,
            content,
            storageKey,
            isExpanded: defaultExpanded
        };
        
        // Restore saved state if storage key provided
        if (storageKey) {
            const savedState = this.getSavedState(storageKey);
            if (savedState !== null) {
                collapsible.isExpanded = savedState;
            }
        }
        
        // Set initial state
        this.setState(collapsible, collapsible.isExpanded, false);
        
        // Add click handler
        toggleBtn.addEventListener('click', () => {
            this.toggle(id);
        });
        
        // Store reference
        this.collapsibles.set(id, collapsible);
    }
    
    /**
     * Toggle a collapsible section
     * @param {string} id - Identifier of the collapsible to toggle
     */
    toggle(id) {
        const collapsible = this.collapsibles.get(id);
        if (!collapsible) {
            console.error(`CollapsibleManager: Collapsible ${id} not found`);
            return;
        }
        
        const newState = !collapsible.isExpanded;
        this.setState(collapsible, newState, true);
    }
    
    /**
     * Expand a collapsible section
     * @param {string} id - Identifier of the collapsible to expand
     */
    expand(id) {
        const collapsible = this.collapsibles.get(id);
        if (collapsible && !collapsible.isExpanded) {
            this.setState(collapsible, true, true);
        }
    }
    
    /**
     * Collapse a collapsible section
     * @param {string} id - Identifier of the collapsible to collapse
     */
    collapse(id) {
        const collapsible = this.collapsibles.get(id);
        if (collapsible && collapsible.isExpanded) {
            this.setState(collapsible, false, true);
        }
    }
    
    /**
     * Set the state of a collapsible section
     * @param {Object} collapsible - Collapsible object
     * @param {boolean} expanded - Whether to expand or collapse
     * @param {boolean} animate - Whether to animate the transition
     */
    setState(collapsible, expanded, animate) {
        collapsible.isExpanded = expanded;
        
        // Update button attributes
        collapsible.toggleBtn.setAttribute('aria-expanded', expanded.toString());
        collapsible.toggleBtn.setAttribute(
            'aria-label', 
            expanded ? 'Collapse parameters' : 'Expand parameters'
        );
        
        // Update content
        if (expanded) {
            collapsible.content.classList.remove('collapsed');
        } else {
            collapsible.content.classList.add('collapsed');
        }
        
        // Save state if storage key provided
        if (collapsible.storageKey) {
            this.saveState(collapsible.storageKey, expanded);
        }
    }
    
    /**
     * Get saved state from localStorage
     * @param {string} key - Storage key
     * @returns {boolean|null} Saved state or null if not found
     */
    getSavedState(key) {
        try {
            const saved = localStorage.getItem(key);
            if (saved !== null) {
                return saved === 'true';
            }
        } catch (e) {
            console.warn('Failed to read collapsible state:', e);
        }
        return null;
    }
    
    /**
     * Save state to localStorage
     * @param {string} key - Storage key
     * @param {boolean} expanded - State to save
     */
    saveState(key, expanded) {
        try {
            localStorage.setItem(key, expanded.toString());
        } catch (e) {
            console.warn('Failed to save collapsible state:', e);
        }
    }
    
    /**
     * Check if a collapsible is expanded
     * @param {string} id - Identifier of the collapsible
     * @returns {boolean} Whether the collapsible is expanded
     */
    isExpanded(id) {
        const collapsible = this.collapsibles.get(id);
        return collapsible ? collapsible.isExpanded : false;
    }
}

// Export singleton instance
export const collapsibleManager = new CollapsibleManager();
