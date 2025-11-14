/**
 * KiroweenEffect - Manages the lightning flash and audio effect for successful test completions
 * 
 * This utility class handles:
 * - Lightning flash animation overlay
 * - Audio playback with error handling
 * - User preference persistence via localStorage
 * - Accessibility support (prefers-reduced-motion)
 */
export class KiroweenEffect {
    constructor() {
        this.storageKey = 'prompt-laboratory-kiroween-enabled';
        this.audioPath = '/assets/audio/kiroween.wav';
        this.ghostImagePath = '/assets/images/kiro_monster_leftfacing.png';
        this.flashDuration = 1000; // 1 second
        this.ghostDuration = 8000; // 8 seconds
        this.audioElement = null;
        this.audioAvailable = false;
        this.ghostAvailable = false;
        this.ghostAnimating = false;
        this.flashOverlay = null;
        this.flashTimeout = null;
        this.enabled = false;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Initialize the effect system
     * - Creates flash overlay element
     * - Loads audio file
     * - Preloads ghost image
     * - Loads user preference from localStorage
     */
    async init() {
        // Create flash overlay element
        this.createFlashOverlay();

        // Load user preference
        this.loadPreference();

        // Load audio file asynchronously
        try {
            await this.loadAudio();
            this.audioAvailable = true;
        } catch (error) {
            console.warn('Kiroween audio failed to load:', error);
            this.audioAvailable = false;
        }

        // Preload ghost image asynchronously (non-blocking)
        this.preloadGhostImage();
    }

    /**
     * Create the flash overlay element and append to document body
     */
    createFlashOverlay() {
        this.flashOverlay = document.createElement('div');
        this.flashOverlay.className = 'kiroween-flash-overlay';
        document.body.appendChild(this.flashOverlay);
    }

    /**
     * Load user preference from localStorage
     */
    loadPreference() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                this.enabled = data.enabled === true;
            } else {
                // Default to disabled
                this.enabled = false;
            }
        } catch (error) {
            console.warn('Failed to load Kiroween preference:', error);
            this.enabled = false;
        }
    }

    /**
     * Check if effect is enabled
     * @returns {boolean} True if effect is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Set effect enabled state and persist to localStorage
     * @param {boolean} enabled - Whether effect should be enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({ enabled }));
        } catch (error) {
            console.warn('Failed to save Kiroween preference:', error);
        }
    }

    /**
     * Load audio file
     * @returns {Promise<void>}
     */
    loadAudio() {
        return new Promise((resolve, reject) => {
            this.audioElement = new Audio(this.audioPath);
            
            this.audioElement.addEventListener('canplaythrough', () => {
                resolve();
            }, { once: true });

            this.audioElement.addEventListener('error', (error) => {
                reject(error);
            }, { once: true });

            // Start loading
            this.audioElement.load();
        });
    }

    /**
     * Trigger the complete effect (flash + audio + ghost)
     * Only triggers if effect is enabled
     */
    trigger() {
        console.log('KiroweenEffect.trigger() called - enabled:', this.enabled, 
                   'ghostAvailable:', this.ghostAvailable, 'audioAvailable:', this.audioAvailable);
        
        if (!this.enabled) {
            console.log('Effect not enabled, skipping');
            return;
        }

        // Play visual effect
        this.playLightningFlash();

        // Play audio effect if available
        if (this.audioAvailable) {
            this.playAudio();
        }

        // Play ghost animation if available
        if (this.ghostAvailable) {
            console.log('Calling playFloatingGhost()');
            this.playFloatingGhost();
        } else {
            console.log('Ghost not available, skipping ghost animation');
        }
    }

    /**
     * Play lightning flash animation
     */
    playLightningFlash() {
        if (!this.flashOverlay) {
            console.warn('Flash overlay not initialized');
            return;
        }

        // Clear any existing animation timeout to prevent overlapping
        if (this.flashTimeout) {
            clearTimeout(this.flashTimeout);
        }

        // Remove and re-add active class to restart animation if already playing
        this.flashOverlay.classList.remove('active');
        
        // Force reflow to restart CSS animation
        void this.flashOverlay.offsetWidth;
        
        // Add active class to trigger animation
        this.flashOverlay.classList.add('active');

        // Remove active class after animation completes
        this.flashTimeout = setTimeout(() => {
            this.flashOverlay.classList.remove('active');
            this.flashTimeout = null;
        }, this.flashDuration);
    }

    /**
     * Play audio file
     * Handles autoplay blocking gracefully
     */
    async playAudio() {
        if (!this.audioElement) {
            return;
        }

        try {
            // Reset audio to start
            this.audioElement.currentTime = 0;
            
            // Play audio (may be blocked by browser autoplay policy)
            await this.audioElement.play();
        } catch (error) {
            console.warn('Kiroween audio playback blocked:', error);
            // Graceful degradation - visual effect continues
        }
    }

    /**
     * Preload ghost image asynchronously
     * Sets ghostAvailable flag when image loads successfully
     */
    preloadGhostImage() {
        console.log('Preloading ghost image from:', this.ghostImagePath);
        const img = new Image();
        img.onload = () => {
            this.ghostAvailable = true;
            console.log('Ghost image loaded successfully!');
        };
        img.onerror = (error) => {
            console.error('Kiroween ghost image failed to load:', error);
            console.error('Image path was:', this.ghostImagePath);
            this.ghostAvailable = false;
        };
        img.src = this.ghostImagePath;
    }

    /**
     * Calculate ghost animation path based on header element positions
     * @returns {Object} Object with startX, midX, endX positions in pixels
     */
    calculateGhostPath() {
        // Look for header title - try multiple selectors
        const titleElement = document.querySelector('.header-title') || 
                            document.querySelector('.app-header h1') ||
                            document.querySelector('header h1');
        const gearElement = document.querySelector('.settings-icon');

        if (!titleElement || !gearElement) {
            console.warn('Header elements not found:', { 
                title: !!titleElement, 
                gear: !!gearElement 
            });
            return null;
        }

        const titleRect = titleElement.getBoundingClientRect();
        const gearRect = gearElement.getBoundingClientRect();
        
        // Calculate middle position (between title and gear)
        const middleX = titleRect.right + ((gearRect.left - titleRect.right) / 2);

        return {
            startX: titleRect.right + 10,  // Start: 10px gap after title
            gearX: gearRect.left - 70,     // Gear: Stop before gear (ghost width ~60px + 10px gap)
            middleX: middleX,              // Middle: Center between title and gear
            endX: titleRect.right + 10     // End: Return to start position
        };
    }

    /**
     * Create ghost element with error handling
     * @returns {HTMLImageElement} Ghost image element
     */
    createGhostElement() {
        const ghost = document.createElement('img');
        ghost.className = 'kiroween-ghost';
        ghost.src = this.ghostImagePath;
        ghost.alt = ''; // Decorative image
        
        ghost.onerror = () => {
            console.warn('Kiroween ghost image failed to load during animation');
        };

        return ghost;
    }

    /**
     * Play floating ghost animation
     * Triggers ghost to float across header with position calculation and CSS variable injection
     */
    playFloatingGhost() {
        console.log('playFloatingGhost() called');
        
        // Skip if ghost image not available
        if (!this.ghostAvailable) {
            console.log('Ghost not available, skipping');
            return;
        }

        // Skip if reduced motion is preferred
        if (this.prefersReducedMotion) {
            console.log('Reduced motion preferred, skipping');
            return;
        }

        // Skip if already animating (prevent overlap)
        if (this.ghostAnimating) {
            console.log('Ghost already animating, skipping');
            return;
        }

        // Calculate ghost path
        const path = this.calculateGhostPath();
        if (!path) {
            console.warn('Header elements not found, skipping ghost animation');
            return;
        }
        
        console.log('Ghost path calculated:', path);

        // Create ghost element
        const ghost = this.createGhostElement();
        console.log('Ghost element created:', ghost);

        // Set CSS variables for animation positions
        ghost.style.setProperty('--start-x', `${path.startX}px`);
        ghost.style.setProperty('--gear-x', `${path.gearX}px`);
        ghost.style.setProperty('--middle-x', `${path.middleX}px`);
        ghost.style.setProperty('--end-x', `${path.endX}px`);

        // Add ghost to DOM
        document.body.appendChild(ghost);
        console.log('Ghost added to DOM');

        // Mark as animating
        this.ghostAnimating = true;

        // Trigger animation after a brief delay to ensure DOM is ready
        requestAnimationFrame(() => {
            ghost.classList.add('floating');
            console.log('Ghost floating class added');
        });

        // Remove ghost element after animation completes
        setTimeout(() => {
            if (ghost.parentNode) {
                ghost.parentNode.removeChild(ghost);
            }
            this.ghostAnimating = false;
            console.log('Ghost animation complete, element removed');
        }, this.ghostDuration);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KiroweenEffect;
}
