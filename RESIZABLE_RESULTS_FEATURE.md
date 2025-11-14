# Resizable Results Feature

## Change Summary
1. Renamed "YAML Configuration" to "LLM Request YAML Summary" for clarity
2. Made the Response and YAML sections resizable with a drag handle
3. Response section now takes up more space by default (2:1 ratio)

## What Changed

### Title Update
- **Before**: "YAML Configuration"
- **After**: "LLM Request YAML Summary"
- **Rationale**: More descriptive and accurate name

### Resizable Layout
- **Before**: Fixed 50/50 split between Response and YAML sections
- **After**: 
  - Response section: 2/3 of space (flex: 2)
  - YAML section: 1/3 of space (flex: 1)
  - Draggable resize handle between sections
  - User can adjust to their preference

## Features

### Resize Handle
- **Location**: Between Response and YAML sections
- **Visual**: Horizontal bar with hover effect
- **Interaction**: Click and drag to resize
- **Feedback**: 
  - Hover: Handle highlights
  - Active: Orange tint while dragging
  - Cursor: Changes to resize cursor (↕)

### Default Layout
- **Response**: Takes up 2/3 of available space
- **YAML**: Takes up 1/3 of available space
- **Minimum Heights**: 
  - Response: 200px minimum
  - YAML: 150px minimum

### Persistence
- Resize preference saved to localStorage
- Restored on page reload
- Per-user customization
- Key: `prompt-laboratory-results-resize`

## Implementation

### Files Created
- `frontend/js/utils/ResizeManager.js` - Reusable resize utility

### Files Modified
1. **frontend/index.html**
   - Changed "YAML Configuration" to "LLM Request YAML Summary"
   - Added IDs to sections for resize functionality
   - Added resize handle element between sections

2. **frontend/css/styles.css**
   - Updated flex ratios (2:1 instead of 1:1)
   - Added resize handle styling
   - Added hover and active states
   - Set minimum heights for sections

3. **frontend/js/main.js**
   - Imported ResizeManager
   - Added `initializeResizers()` function
   - Registered test results resizer

### CSS Classes
- `.response-section` - Response area (flex: 2)
- `.yaml-section` - YAML area (flex: 1)
- `.resize-handle` - Draggable handle
- `.resize-handle-bar` - Visual indicator bar
- `.resizing` - Active state during drag

## User Experience

### Resizing Process
1. **Hover**: Move mouse over handle between sections
2. **Visual Feedback**: Handle highlights, cursor changes
3. **Click**: Press and hold mouse button
4. **Drag**: Move mouse up or down
5. **Release**: Let go to set new size
6. **Persist**: Size saved automatically

### Visual Feedback
- **Default**: Subtle gray handle with small bar
- **Hover**: Handle background changes, bar turns orange
- **Active**: Handle shows orange tint while dragging
- **Cursor**: Changes to resize cursor (↕) on hover

### Constraints
- **Minimum Heights**: Prevents sections from becoming too small
- **Smooth Dragging**: Responsive to mouse movement
- **Snap Back**: If dragged beyond limits, stays at minimum

## Technical Details

### Resize Algorithm
```javascript
1. On mousedown: Record start position and section heights
2. On mousemove: Calculate delta from start position
3. Calculate new heights: startHeight ± delta
4. Check constraints: Respect minimum heights
5. Apply flex values: Convert heights to flex ratios
6. Update sections: Apply new flex values
```

### Flex Calculation
```javascript
const totalHeight = topHeight + bottomHeight;
const topFlex = (newTopHeight / totalHeight) * 3;
const bottomFlex = (newBottomHeight / totalHeight) * 3;
```

### Storage Format
```json
{
  "topFlex": "2.5",
  "bottomFlex": "0.5"
}
```

## Benefits

### Better Title
- **Clarity**: "LLM Request YAML Summary" is more descriptive
- **Context**: Users understand what the YAML represents
- **Professional**: More precise terminology

### Resizable Sections
- **Flexibility**: Users can adjust to their needs
- **Focus**: Expand Response for long outputs
- **Efficiency**: Shrink YAML when not needed
- **Personalization**: Each user can set their preference

### Default Layout
- **Response Priority**: More space for AI responses
- **Practical**: Most users focus on response content
- **Balanced**: YAML still visible and accessible

## Use Cases

### Viewing Long Responses
1. Drag handle down to expand Response section
2. More space for reading AI output
3. YAML summary still visible at bottom

### Checking YAML Details
1. Drag handle up to expand YAML section
2. Review configuration details
3. Response summary still visible at top

### Balanced View
1. Drag to middle for equal split
2. See both sections clearly
3. Good for comparing output with config

## Accessibility

### Keyboard Support
- Handle is focusable (future enhancement)
- Keyboard resize with arrow keys (future enhancement)
- Screen reader announces resize capability

### Visual Indicators
- Clear cursor change on hover
- Visual feedback during drag
- Minimum size prevents content loss

### Mouse Support
- Smooth dragging experience
- Responsive to movement
- Clear start/end of drag

## Testing Checklist

- [ ] Title shows "LLM Request YAML Summary"
- [ ] Response section is larger by default (2:1 ratio)
- [ ] Resize handle is visible between sections
- [ ] Handle highlights on hover
- [ ] Cursor changes to resize cursor
- [ ] Dragging resizes sections smoothly
- [ ] Minimum heights are respected
- [ ] Resize preference persists after reload
- [ ] Works in both light and dark modes
- [ ] No visual glitches during resize

## Browser Compatibility

### Mouse Events
- `mousedown`, `mousemove`, `mouseup` - Universal support
- Works in all modern browsers
- No touch support yet (future enhancement)

### CSS Flexbox
- Flex values dynamically updated
- Smooth transitions
- Consistent rendering

### localStorage
- Saves resize preference
- Restores on page load
- Graceful fallback if unavailable

## Future Enhancements

### Potential Features
1. **Touch Support**: Drag on mobile devices
2. **Keyboard Resize**: Arrow keys to adjust
3. **Double-Click Reset**: Restore default sizes
4. **Preset Layouts**: Quick size presets
5. **Collapse/Expand**: Hide sections completely
6. **Animation**: Smooth transitions when resizing

### Additional Resizers
- Workbench editor height
- Library panel width
- Test Chamber width
- Parameters section height

## Related Changes

This feature complements:
1. **Collapsible Parameters**: More space control
2. **Response Actions**: Better viewing of saved content
3. **Timeout Slider**: Longer responses need more space
4. **Dark Mode**: Resize handle styled for both themes
