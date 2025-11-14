# Layout Toggle Feature

## Overview
The Workbench and Test Chamber panels in Prompt-Laboratory now support dynamic resizing through toggle buttons, allowing you to expand either panel for better focus on your work.

## Features

### Three Layout Modes

1. **Default Mode** (380px | flexible | 525px)
   - Balanced layout with all panels visible
   - Library: 380px (fixed)
   - Workbench: Flexible (takes remaining space)
   - Test Chamber: 525px (fixed)

2. **Workbench Mode** (380px | flexible | 420px) - **DEFAULT ON FIRST LOAD**
   - Expands the Workbench area for editing
   - Test Chamber shrinks to 420px
   - Ideal for writing and refining prompts
   - Active by default when you first open the application

3. **Test Chamber Mode** (380px | 420px | flexible)
   - Expands the Test Chamber for testing
   - Workbench shrinks to 420px
   - Ideal for viewing test results and responses

### Toggle Buttons

- **Workbench Toggle**: Located in the Workbench panel header (⇄ icon)
  - Click to expand Workbench / restore default layout
  - Button highlights when Workbench mode is active

- **Test Chamber Toggle**: Located in the Test Chamber panel header (⇄ icon)
  - Click to expand Test Chamber / restore default layout
  - Button highlights when Test Chamber mode is active

### Keyboard Shortcuts

- **Ctrl/Cmd + 1**: Toggle Workbench mode
- **Ctrl/Cmd + 2**: Toggle Test Chamber mode

### Persistence

Your layout preference is automatically saved to localStorage and restored when you reload the application. On first load (or if no preference is saved), the application defaults to **Workbench Mode** to provide optimal space for prompt editing.

## Implementation Details

### Files Modified

1. **frontend/index.html**
   - Added toggle buttons to Workbench and Test Chamber panel headers

2. **frontend/css/styles.css**
   - Added layout mode classes and transitions
   - Added toggle button styling
   - Updated responsive breakpoints for all modes

3. **frontend/js/utils/LayoutManager.js** (NEW)
   - Manages layout state and mode switching
   - Handles localStorage persistence
   - Updates button states and accessibility attributes

4. **frontend/js/main.js**
   - Integrated LayoutManager initialization
   - Made layoutManager globally accessible

5. **frontend/js/controllers/AppController.js**
   - Added keyboard shortcuts for layout toggling

### CSS Classes

- `.workbench-mode`: Applied to `.app-main` when Workbench is expanded
- `.test-chamber-mode`: Applied to `.app-main` when Test Chamber is expanded
- `.layout-toggle-btn`: Styling for toggle buttons

### Responsive Behavior

The layout modes adapt to different screen sizes:
- **1200px and below**: Slightly smaller panel sizes
- **992px and below**: Further reduced panel sizes
- **768px and below**: Stacked layout (existing behavior)

## Usage

1. **To expand the Workbench**:
   - Click the ⇄ button in the Workbench header, OR
   - Press Ctrl/Cmd + 1

2. **To expand the Test Chamber**:
   - Click the ⇄ button in the Test Chamber header, OR
   - Press Ctrl/Cmd + 2

3. **To restore default layout**:
   - Click the active toggle button again, OR
   - Press the same keyboard shortcut

## Accessibility

- Toggle buttons include proper ARIA labels
- Button states update to reflect current mode
- Keyboard shortcuts provide alternative access
- Smooth transitions with reduced-motion support
