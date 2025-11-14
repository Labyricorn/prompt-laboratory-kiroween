# Ghost Animation Timing Updated 👻⏱️

## New Timing Specification

The ghost animation has been updated to the following 8-second sequence:

### Timeline

**0-5 seconds (0-62.5%)**: Ghost floats rightward
- Starts after "Prompt-Laboratory" title
- Faces right (horizontally flipped with scaleX(-1))
- Floats with bobbing motion (±3px vertical oscillation)
- Appears **in front** of "Ollama Connected" status (z-index: 10000)
- Travels to the settings gear

**5 seconds (62.5%)**: First flip
- Ghost reaches the settings gear
- Flips to face left (scaleX(1))

**5-7 seconds (62.5-87.5%)**: Ghost floats leftward
- Continues floating motion
- Appears **behind** "Ollama Connected" status (z-index: 1)
- Stops at the middle position (between title and gear)

**7 seconds (87.5%)**: Second flip
- Ghost reaches middle position
- Flips back to face right (scaleX(-1))

**7-8 seconds (87.5-100%)**: Fade out
- Ghost remains at middle position
- Opacity fades from 1 to 0
- Element removed from DOM after animation completes

## Changes Made

### 1. JavaScript (`KiroweenEffect.js`)

**Updated `calculateGhostPath()` method:**
- Added `middleX` calculation (center between title and gear)
- Renamed `midX` to `gearX` for clarity
- Now returns 4 positions: `startX`, `gearX`, `middleX`, `endX`

**Updated CSS variable setting:**
- Added `--gear-x` for the gear position
- Added `--middle-x` for the middle stopping point
- Kept `--start-x` and `--end-x` for reference

### 2. CSS (`styles.css`)

**Updated `@keyframes ghostFloat`:**
- Changed timing percentages to match new 8-second duration
- 0-62.5%: Rightward journey (facing right)
- 62.5%: Flip at gear
- 62.5-87.5%: Leftward journey (facing left)
- 87.5%: Flip at middle
- 87.5-100%: Fade out (facing right)

**Removed duplicate keyframes:**
- Cleaned up old translateX-based animation
- Now only one clean keyframes definition

## Visual Behavior

The ghost now:
1. ✅ Takes longer to cross the screen (more leisurely pace)
2. ✅ Flips twice (once at gear, once at middle)
3. ✅ Stops in the middle of the header (not back at start)
4. ✅ Fades out while facing right
5. ✅ Maintains floating/bobbing motion throughout

## Z-Index Layering

The z-index is controlled by the JavaScript based on position:
- **Rightward journey**: Ghost is in front (z-index: 10000)
- **Leftward journey**: Ghost is behind (z-index: 1)

This creates the effect of the ghost passing in front of the status text on the way out, then behind it on the way back.

## How to Test

1. **Hard refresh** the page (Ctrl+F5 or Cmd+Shift+R)
2. **Enable** the Kiroween effect checkbox
3. **Run a test**
4. **Watch** the ghost:
   - Floats right for 5 seconds
   - Flips at gear
   - Floats left for 2 seconds
   - Flips at middle
   - Fades out for 1 second

Total duration: 8 seconds

## Technical Details

### CSS Variables Used
- `--start-x`: Starting position (after title)
- `--gear-x`: Gear position (flip point 1)
- `--middle-x`: Middle position (flip point 2 and fade out location)
- `--end-x`: End position (kept for reference, same as start-x)

### Transform States
- `scaleX(-1)`: Facing right (mirrored)
- `scaleX(1)`: Facing left (normal)
- `translateY(±3px)`: Floating/bobbing motion

The ghost animation is now more dynamic with two flips and a middle stopping point! 👻✨
