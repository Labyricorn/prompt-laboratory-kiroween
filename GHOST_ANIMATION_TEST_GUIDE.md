# Ghost Animation Test Guide

## Overview

This guide provides instructions for testing the Kiroween ghost animation feature using the comprehensive test suite in `test_ghost_animation.html`.

## Test File Location

- **Test Suite**: `test_ghost_animation.html`
- **Implementation**: `frontend/js/utils/KiroweenEffect.js`
- **Ghost Image**: `frontend/assets/images/kiro_monster_leftfacing.png`

## Running the Tests

### Prerequisites

1. Ensure the backend server is running (if needed for asset serving)
2. Open `test_ghost_animation.html` in a modern web browser
3. Open browser DevTools Console (F12) to see detailed logs

### Quick Start

1. Open `test_ghost_animation.html` in your browser
2. Click "Run All Tests" to execute the complete test suite
3. Observe the visual animations and check the test results panel

## Test Categories

### Visual & Animation Tests (Tests 1-11)

These tests verify the core animation functionality:

1. **Basic Ghost Animation**: Verifies the ghost animation triggers without errors
2. **Start Position**: Confirms ghost starts at correct position (after "Prompt-Laboratory" title)
3. **Initial Right-Facing Flip**: Verifies ghost is horizontally flipped to face right at start
4. **Rightward Movement**: Confirms ghost moves from left to right
5. **Front Layer**: Verifies ghost appears in front of "Ollama Connected" during rightward journey
6. **Flip at Settings Gear**: Confirms ghost flips to face left at midpoint (settings gear)
7. **Leftward Movement**: Verifies ghost moves from right to left
8. **Back Layer**: Confirms ghost appears behind "Ollama Connected" during leftward journey
9. **Fade Out Animation**: Verifies smooth fade-out at end position
10. **Animation Duration**: Confirms total duration is approximately 4 seconds (±500ms)
11. **Floating Motion Effect**: Verifies vertical oscillation (±3px) during movement

### Error Handling & Edge Cases (Tests 12-17)

These tests verify graceful degradation and error handling:

12. **Missing Ghost Image**: Tests behavior when image file is not found
13. **Rapid Triggers**: Tests animation overlap prevention when triggered multiple times rapidly
14. **Missing Header Elements**: Tests behavior when header elements are not present
15. **Window Resize**: Tests animation stability during window resize
16. **Dark Mode Compatibility**: Verifies animation works correctly in dark mode
17. **Prefers-Reduced-Motion**: Tests accessibility support for users with motion sensitivity

## Test Controls

### Checkboxes

- **Dark Mode**: Toggle between light and dark themes to test visual compatibility
- **Simulate Reduced Motion**: Enable to test accessibility behavior (animation should be skipped)
- **Auto-clear Results**: Automatically clear previous results when running new tests

### Buttons

- **Individual Test Buttons**: Run specific tests one at a time
- **Run All Tests**: Execute all 17 tests sequentially with appropriate delays
- **Clear Results**: Manually clear the test results panel

## Expected Results

### Visual Verification Checklist

When running the tests, verify the following visually:

- [ ] Ghost appears at the correct starting position (right after "Prompt-Laboratory" title)
- [ ] Ghost is initially flipped to face right (mirrored horizontally)
- [ ] Ghost moves smoothly from left to right across the header
- [ ] Ghost appears **in front of** "Ollama Connected" text during rightward journey
- [ ] Ghost reaches the settings gear icon and flips to face left
- [ ] Ghost moves smoothly from right to left back to start
- [ ] Ghost appears **behind** "Ollama Connected" text during leftward journey
- [ ] Ghost has a floating/bobbing motion (vertical oscillation) throughout
- [ ] Ghost fades out smoothly at the end position
- [ ] Total animation takes approximately 4 seconds
- [ ] Ghost element is removed from DOM after animation completes

### Automated Verification

The test suite automatically verifies:

- ✅ No JavaScript errors during animation
- ✅ Correct position calculations based on header elements
- ✅ Animation duration within acceptable tolerance (4000ms ±500ms)
- ✅ Overlap prevention (only one ghost animating at a time)
- ✅ Graceful degradation when image is missing
- ✅ Graceful degradation when header elements are missing
- ✅ Proper handling of reduced motion preference
- ✅ Ghost element cleanup after animation

## Requirements Coverage

This test suite validates all requirements from the specification:


### Requirement 5.1
**Covered by**: Test 1 (Basic Animation)
- Ghost animation displays using kiro_monster_leftfacing.png image

### Requirement 5.2
**Covered by**: Test 2 (Start Position)
- Ghost starts at right edge of "Prompt-Laboratory" title text

### Requirement 5.3
**Covered by**: Test 3 (Initial Flip)
- Ghost is horizontally flipped to face right at animation start

### Requirement 5.4
**Covered by**: Test 4, 5 (Rightward Movement, Front Layer)
- Ghost moves rightward across header in front of "Ollama Connected" status

### Requirement 5.5
**Covered by**: Test 6 (Midpoint Flip)
- Ghost horizontally flips to face left when reaching settings gear

### Requirement 5.6
**Covered by**: Test 7, 8 (Leftward Movement, Back Layer)
- Ghost moves leftward behind "Ollama Connected" status text

### Requirement 5.7
**Covered by**: Test 9 (Fade Out)
- Ghost fades out over 0.5 seconds (±0.1s) at completion

### Requirement 5.8
**Covered by**: Test 10 (Duration)
- Animation completes within 4 seconds (±0.5s)

### Requirement 5.9
**Covered by**: Test 11 (Floating Motion)
- Ghost uses smooth floating motion effect

### Requirement 5.10
**Covered by**: All tests
- Ghost animation does not interfere with header functionality

## Troubleshooting

### Ghost Image Not Loading

**Symptom**: Console warning "Kiroween ghost image failed to load"

**Solution**: 
- Verify `frontend/assets/images/kiro_monster_leftfacing.png` exists
- Check file permissions
- Ensure correct file path in `KiroweenEffect.js`

### Animation Not Triggering

**Symptom**: No ghost appears when clicking test buttons

**Solution**:
- Check browser console for JavaScript errors
- Verify `KiroweenEffect.js` is loaded correctly
- Ensure `ghostAvailable` flag is set to true after image preload

### Header Elements Not Found

**Symptom**: Console warning "Header elements not found"

**Solution**:
- Verify header HTML structure matches expected selectors
- Check that `.header-title` and `.settings-icon` elements exist
- Ensure elements are visible (not display: none)


### Reduced Motion Not Working

**Symptom**: Animation still plays with reduced motion enabled

**Solution**:
- Check that `prefersReducedMotion` flag is properly set
- Verify CSS `@media (prefers-reduced-motion: reduce)` rules are applied
- Test with browser/OS reduced motion settings enabled

### Multiple Ghosts Appearing

**Symptom**: Multiple ghost elements visible simultaneously

**Solution**:
- Verify `ghostAnimating` flag is working correctly
- Check that overlap prevention logic is functioning
- Ensure ghost elements are removed after animation completes

## Performance Considerations

### Expected Performance

- **Animation FPS**: 60fps (smooth)
- **CPU Usage**: Minimal (CSS animations are GPU-accelerated)
- **Memory**: Ghost element created on-demand and removed after animation
- **Network**: Ghost image preloaded during initialization (one-time load)

### Performance Testing

1. Open browser DevTools Performance tab
2. Start recording
3. Trigger ghost animation
4. Stop recording after animation completes
5. Verify:
   - No layout thrashing
   - Smooth 60fps animation
   - Minimal JavaScript execution time
   - GPU acceleration active (check for "Composite Layers")

## Browser Compatibility

### Tested Browsers

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Known Issues

- None currently identified

## Manual Testing Checklist

Use this checklist when performing manual testing:

### Basic Functionality
- [ ] Ghost animation triggers successfully
- [ ] Ghost image loads correctly
- [ ] Animation completes without errors
- [ ] Ghost element is removed after animation

### Visual Appearance
- [ ] Ghost starts at correct position
- [ ] Ghost is initially facing right
- [ ] Ghost moves smoothly across header
- [ ] Floating motion is visible and smooth
- [ ] Ghost flips direction at midpoint
- [ ] Fade-out is smooth and gradual

### Z-Index Layering
- [ ] Ghost appears in front of "Ollama Connected" during rightward journey
- [ ] Ghost appears behind "Ollama Connected" during leftward journey
- [ ] Ghost does not block header interactions


### Timing & Duration
- [ ] Animation takes approximately 4 seconds
- [ ] Rightward journey: 0-2 seconds
- [ ] Leftward journey: 2-3.5 seconds
- [ ] Fade-out: 3.5-4 seconds

### Error Handling
- [ ] Graceful degradation with missing image
- [ ] Graceful degradation with missing header elements
- [ ] No errors with rapid triggers
- [ ] Animation continues smoothly during window resize

### Accessibility
- [ ] Animation skipped with reduced motion preference
- [ ] Ghost does not interfere with keyboard navigation
- [ ] Ghost does not interfere with screen readers

### Theme Compatibility
- [ ] Animation works in light mode
- [ ] Animation works in dark mode
- [ ] Ghost is visible against both backgrounds

## Test Results Interpretation

### Pass Criteria

A test passes if:
- ✅ No JavaScript errors in console
- ✅ Visual behavior matches expected outcome
- ✅ Automated checks return "pass" status
- ✅ Animation completes within specified tolerances

### Fail Criteria

A test fails if:
- ❌ JavaScript errors occur
- ❌ Visual behavior does not match expected outcome
- ❌ Automated checks return "fail" status
- ❌ Animation does not complete or hangs

### Info Messages

Info messages provide:
- ℹ️ Test progress updates
- ℹ️ Manual verification instructions
- ℹ️ System state changes

## Continuous Testing

### Regression Testing

Run the full test suite after:
- Code changes to `KiroweenEffect.js`
- CSS changes to ghost animation styles
- Header HTML structure changes
- Browser updates

### Automated Testing

Consider integrating with:
- Visual regression testing tools (Percy, Chromatic)
- End-to-end testing frameworks (Playwright, Cypress)
- Performance monitoring tools

## Reporting Issues

When reporting issues, include:
1. Test number and name
2. Expected behavior
3. Actual behavior
4. Browser and version
5. Console errors (if any)
6. Screenshots or screen recordings
7. Steps to reproduce

## Conclusion

This comprehensive test suite ensures the Kiroween ghost animation meets all requirements and provides a delightful user experience. Run tests regularly during development and before releases to maintain quality.

For questions or issues, refer to the design document at `.kiro/specs/kiroween-effect/design.md`.
