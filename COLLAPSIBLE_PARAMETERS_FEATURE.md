# Collapsible Parameters Feature

## Overview
The Test Chamber's parameter section (Model and Temperature controls) is now collapsible, allowing users to shrink it vertically and make more room for viewing AI responses.

## Features

### Collapsible Parameters Section
- **Default State**: Expanded (parameters visible)
- **Collapsed State**: Hidden (only header visible)
- **Smooth Animation**: 0.3s ease transition
- **Persistent State**: Preference saved to localStorage

### User Interaction

1. **Click the Arrow Button**: Click the ▼ button in the parameters header
2. **Click the Header**: Click anywhere on the "Parameters" header
3. **Visual Feedback**: Arrow rotates 90° when collapsed

### Benefits

- **More Response Space**: Collapse parameters to see more of the AI response
- **Quick Access**: Expand when you need to change model or temperature
- **Persistent Preference**: Your choice is remembered across sessions

## Implementation Details

### Files Created
- `frontend/js/utils/CollapsibleManager.js` - Reusable collapsible section manager

### Files Modified
- `frontend/index.html` - Added collapsible structure to parameters
- `frontend/css/styles.css` - Added collapsible styling and animations
- `frontend/js/main.js` - Integrated CollapsibleManager

### CSS Classes
- `.parameters-header` - Clickable header with hover effect
- `.parameters-content` - Collapsible content container
- `.parameters-content.collapsed` - Collapsed state (max-height: 0)
- `.collapse-toggle-btn` - Toggle button styling
- `.collapse-icon` - Arrow icon with rotation animation

### localStorage Key
- `prompt-laboratory-parameters-expanded` - Stores expanded/collapsed state

## Usage

**To Collapse Parameters:**
- Click the ▼ button or click anywhere on the "Parameters" header
- Arrow rotates to ▶ and parameters slide up

**To Expand Parameters:**
- Click the ▶ button or click the header again
- Arrow rotates to ▼ and parameters slide down
