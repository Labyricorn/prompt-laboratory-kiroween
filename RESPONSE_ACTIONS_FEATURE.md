# Response Actions Feature

## Overview
Users can now copy the AI response to clipboard or save it to a local file directly from the Test Chamber, making it easy to preserve and share test results.

## Features

### Copy Response Button
- **Icon**: 📋 (clipboard)
- **Location**: Next to "Response" label in Test Chamber
- **Action**: Copies response text to clipboard
- **Feedback**: Success toast notification

### Save Response Button
- **Icon**: 💾 (floppy disk)
- **Location**: Next to copy button in Response section
- **Action**: Downloads response as .txt file
- **Filename**: `response-YYYY-MM-DDTHH-MM-SS.txt`

### Button States
- **Disabled**: When no response is available (grayed out)
- **Enabled**: After successful test execution
- **Hover**: Visual feedback on hover

## Usage

### Copying Response
1. Run a test in Test Chamber
2. Wait for AI response to appear
3. Click the 📋 button next to "Response" label
4. Response is copied to clipboard
5. Success notification appears

### Saving Response
1. Run a test in Test Chamber
2. Wait for AI response to appear
3. Click the 💾 button next to "Response" label
4. Browser download dialog appears
5. File saved with timestamp in filename
6. Success notification appears

## Implementation Details

### Files Modified

1. **frontend/index.html**
   - Added `.section-header` wrapper for Response section
   - Added `.response-actions` container with two buttons
   - Updated YAML section to use consistent structure
   - Moved YAML copy button to header

2. **frontend/css/styles.css**
   - Added `.section-header` styling for result sections
   - Added `.response-actions` flex container
   - Added icon styling for copy and save icons

3. **frontend/js/components/TestChamberPanel.js**
   - Added DOM references for new buttons
   - Added event listeners for copy and save actions
   - Implemented `handleCopyResponse()` method
   - Implemented `handleSaveResponse()` method
   - Updated `displayTestResult()` to enable buttons
   - Updated `clearTestResults()` to disable buttons

### Button Behavior

**Initial State:**
- Both buttons disabled (no response available)
- Grayed out appearance

**After Test Execution:**
- Buttons enabled when response is available
- Full color, clickable

**After Clearing:**
- Buttons disabled again
- Return to grayed out state

### File Naming Convention
Saved files use ISO 8601 timestamp format:
```
response-2024-01-15T14-30-45.txt
```

Format: `response-YYYY-MM-DDTHH-MM-SS.txt`

### Error Handling

**Copy Failures:**
- Logs error to console
- Shows error toast notification
- Graceful degradation

**Save Failures:**
- Logs error to console
- Shows error toast notification
- Cleans up temporary resources

## User Experience

### Visual Design
- Compact icon-only buttons to save space
- Consistent with existing YAML copy button
- Tooltips on hover for clarity
- Disabled state clearly visible

### Feedback
- Toast notifications for all actions
- Success: "Response copied to clipboard"
- Success: "Response saved to file"
- Warning: "No response to copy/save"
- Error: "Failed to copy/save response"

### Accessibility
- `aria-label` attributes for screen readers
- `title` attributes for tooltips
- Disabled state properly indicated
- Keyboard accessible

## Technical Details

### Copy Implementation
```javascript
navigator.clipboard.writeText(responseContent)
```
- Uses modern Clipboard API
- Async operation with promise handling
- Error handling with fallback

### Save Implementation
```javascript
const blob = new Blob([responseContent], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
// Create download link and trigger
```
- Creates Blob from text content
- Generates temporary object URL
- Programmatically triggers download
- Cleans up resources after download

### Browser Compatibility
- **Copy**: Requires HTTPS or localhost (Clipboard API)
- **Save**: Works in all modern browsers
- **Fallback**: Error messages if features unavailable

## Layout Considerations

### Minimal Impact
- Buttons placed in existing header area
- No additional vertical space required
- Consistent with YAML section design
- Responsive to different screen sizes

### Responsive Behavior
- Buttons stack on very small screens
- Icons remain visible and clickable
- Tooltips adjust to viewport

## Use Cases

### Documentation
- Save AI responses for documentation
- Copy responses into reports
- Archive test results

### Iteration
- Compare responses across tests
- Track improvements over time
- Share results with team

### Development
- Copy responses for code review
- Save examples for testing
- Document AI behavior

## Future Enhancements
- Save with custom filename
- Save in different formats (Markdown, JSON)
- Batch save multiple responses
- Export with metadata (model, temperature, etc.)
- Copy with formatting options
