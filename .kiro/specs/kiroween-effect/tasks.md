# Implementation Plan

- [x] 1. Create KiroweenEffect utility class





  - Create `frontend/js/utils/KiroweenEffect.js` with core effect management functionality
  - Implement localStorage integration for preference persistence
  - Implement lightning flash animation trigger method
  - Implement audio playback with error handling
  - Add prefers-reduced-motion support
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [ ] 2. Add audio asset
  - Create `frontend/assets/audio/` directory
  - Add `kiroween.wav` audio file (thunder/lightning sound effect)
  - Ensure file is optimized (<100KB, 1-2 seconds duration)
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3. Add CSS styles for lightning flash effect





  - Add `.kiroween-flash-overlay` styles to `frontend/css/styles.css` with purple background (#9333EA)
  - Implement `@keyframes lightningFlash` animation
  - Add dark mode support for flash overlay (lighter purple #A855F7)
  - Add checkbox styling (`.parameter-checkbox-label`, `.parameter-checkbox`)
  - Add purple text styling for Kiroween label (`.kiroween-label`)
  - Add `prefers-reduced-motion` media query support
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Add checkbox to Test Chamber Parameters HTML





  - Add checkbox markup to `frontend/index.html` in Test Chamber Parameters section
  - Position checkbox at the bottom of parameters section
  - Add `kiroween-label` class to label for purple text styling
  - Include proper ARIA labels and help text
  - _Requirements: 1.1, 1.2_

- [x] 5. Integrate KiroweenEffect into TestChamberPanel





  - Import `KiroweenEffect` class in `TestChamberPanel.js`
  - Add checkbox DOM element reference in constructor
  - Initialize KiroweenEffect instance in `init()` method
  - Add checkbox event listener in `setupEventListeners()`
  - Implement `initKiroweenCheckbox()` method to sync checkbox with stored preference
  - Implement `handleKiroweenToggle()` method to handle checkbox changes
  - Implement `isTestSuccessful()` method to determine if result is successful
  - _Requirements: 1.3, 1.4, 1.5, 4.1, 4.2, 4.3_

- [x] 6. Trigger effect on successful test completion





  - Modify `displayTestResult()` in `TestChamberPanel.js` to check for success
  - Call `KiroweenEffect.trigger()` when test is successful and effect is enabled
  - Ensure effect does not trigger on errors or timeouts
  - _Requirements: 2.5, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Create flash overlay element




  - Add flash overlay div creation in `KiroweenEffect.init()`
  - Append overlay to document body
  - Ensure overlay has proper z-index and pointer-events styling
  - _Requirements: 2.1, 2.4_

- [x] 8. Verify error handling and edge cases





  - Test audio loading failure (missing file)
  - Test audio playback failure (autoplay blocked)
  - Test localStorage failure (quota exceeded)
  - Test rapid test execution (multiple triggers)
  - Verify graceful degradation in all error scenarios
  - _Requirements: 2.5, 3.5, 4.5_

- [x] 9. Add CSS styles for floating ghost animation





  - Add `.kiroween-ghost` base styles to `frontend/css/styles.css` with fixed positioning and z-index
  - Implement `.kiroween-ghost.floating` class with animation trigger
  - Add `.kiroween-ghost.facing-right` and `.kiroween-ghost.facing-left` classes for horizontal flipping
  - Add `.kiroween-ghost.front-layer` and `.kiroween-ghost.back-layer` classes for z-index control
  - Implement `@keyframes ghostFloat` animation with floating motion (vertical oscillation ±3px)
  - Add CSS variables support for dynamic positioning (--start-x, --mid-x, --end-x, --current-x, --flip-x)
  - Add fade-out effect at animation end (opacity 1 to 0 over last 500ms)
  - Add `prefers-reduced-motion` media query support to disable ghost animation
  - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9_

- [x] 10. Implement ghost animation in KiroweenEffect class





  - Add `ghostImagePath`, `ghostDuration`, `ghostElement`, and `ghostAnimating` properties to KiroweenEffect class
  - Implement `calculateGhostPath()` method to dynamically calculate start, mid, and end positions based on header elements
  - Implement `createGhostElement()` method to create ghost img element with error handling
  - Implement `playFloatingGhost()` method to trigger ghost animation with position calculation and CSS variable injection
  - Add ghost animation trigger to `trigger()` method (call `playFloatingGhost()`)
  - Preload ghost image during `init()` method (async, non-blocking)
  - Add animation overlap prevention (check `ghostAnimating` flag)
  - Add header element existence check before calculating positions
  - Remove ghost element from DOM after animation completes (4000ms timeout)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [x] 11. Test ghost animation functionality





  - Verify ghost appears at correct start position (after "Prompt-Laboratory" title)
  - Verify ghost is initially flipped to face right
  - Verify ghost moves rightward with floating motion
  - Verify ghost appears in front of "Ollama Connected" text during rightward journey
  - Verify ghost flips to face left at settings gear
  - Verify ghost moves leftward with floating motion
  - Verify ghost appears behind "Ollama Connected" text during leftward journey
  - Verify ghost fades out smoothly at end position
  - Verify total animation duration is approximately 4 seconds
  - Test with ghost image missing (graceful degradation)
  - Test rapid test execution (animation overlap prevention)
  - Test with header elements missing (graceful degradation)
  - Test window resize during animation
  - Test in light mode and dark mode
  - Test with `prefers-reduced-motion` enabled
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_
