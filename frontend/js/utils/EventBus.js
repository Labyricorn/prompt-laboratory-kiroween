// Event Bus for inter-component communication
export class EventBus {
    constructor() {
        this.events = new Map();
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        this.events.get(event).add(callback);
        
        // Return unsubscribe function
        return () => {
            this.off(event, callback);
        };
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).delete(callback);
            
            // Clean up empty event sets
            if (this.events.get(event).size === 0) {
                this.events.delete(event);
            }
        }
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...any} args - Arguments to pass to callbacks
     */
    emit(event, ...args) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event handler for '${event}':`, error);
                }
            });
        }
    }
    
    /**
     * Subscribe to an event only once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        const unsubscribe = this.on(event, (...args) => {
            unsubscribe();
            callback(...args);
        });
        
        return unsubscribe;
    }
    
    /**
     * Remove all listeners for an event or all events
     * @param {string} [event] - Specific event to clear, or all if not provided
     */
    clear(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }
    
    /**
     * Get list of events with listener counts
     * @returns {Object} Event statistics
     */
    getStats() {
        const stats = {};
        this.events.forEach((listeners, event) => {
            stats[event] = listeners.size;
        });
        return stats;
    }
}