# Adjustable Timeout Feature

## Overview
The Test Chamber now includes an adjustable timeout slider that allows users to set custom timeout values for Ollama API requests, preventing premature timeouts for complex or long-running AI responses.

## Features

### Timeout Slider
- **Range**: 30 seconds to 5 minutes (300 seconds)
- **Default**: 30 seconds
- **Step**: 10 seconds
- **Location**: Parameters section in Test Chamber

### Benefits
- **Prevents Timeouts**: Longer timeouts for complex prompts or large models
- **Flexibility**: Adjust based on task complexity
- **User Control**: Set appropriate timeout for each test
- **Visual Feedback**: Real-time display of selected timeout value

## Usage

### Setting Timeout
1. Open the Test Chamber Parameters section
2. Locate the "Timeout" slider
3. Drag the slider or click to set desired timeout (30s - 300s)
4. The value updates in real-time next to the label

### Recommended Timeouts
- **30-60s**: Quick responses, simple prompts, small models
- **60-120s**: Standard prompts, medium complexity
- **120-180s**: Complex prompts, detailed responses
- **180-300s**: Very complex tasks, large models, extensive outputs

## Implementation Details

### Files Modified

1. **frontend/index.html**
   - Added timeout slider input
   - Added timeout value display
   - Added help text

2. **frontend/js/components/TestChamberPanel.js**
   - Added timeout slider DOM references
   - Added timeout slider event listener
   - Included timeout in test data payload
   - Disabled timeout slider during test execution

3. **backend/api/ollama.py**
   - Added timeout parameter validation (30-300 seconds)
   - Passed timeout to OllamaService
   - Updated API documentation

4. **backend/services/ollama_service.py**
   - Updated test_prompt method to accept timeout parameter
   - Applied custom timeout to API request
   - Included timeout in response metadata

### API Changes

**Request Body** (POST /api/run-test):
```json
{
  "system_prompt": "string",
  "user_input": "string",
  "model": "string (optional)",
  "temperature": 0.7,
  "timeout": 30
}
```

**Response**:
```json
{
  "response": "AI response text",
  "execution_time": 12.5,
  "model": "llama2",
  "temperature": 0.7,
  "timeout": 30,
  "yaml_config": "..."
}
```

### Validation
- **Minimum**: 30 seconds
- **Maximum**: 300 seconds (5 minutes)
- **Default**: 30 seconds if not specified
- **Error**: Returns validation error if outside range

## Technical Details

### Frontend
- Slider updates value display in real-time
- Value sent with test request
- Slider disabled during test execution
- Persists across parameter collapse/expand

### Backend
- Timeout applied to HTTP request to Ollama
- Raises OllamaTimeoutError if exceeded
- Error message indicates timeout occurred
- Timeout value included in response metadata

### Error Handling
If a timeout occurs:
1. Backend raises OllamaTimeoutError
2. Error returned to frontend with appropriate message
3. User can increase timeout and retry
4. Clear indication that timeout was the issue

## User Experience

### Before Test
- User sets desired timeout based on expected complexity
- Visual feedback shows selected value
- Help text provides guidance

### During Test
- Timeout slider disabled
- Request uses specified timeout value
- Loading indicator shows test in progress

### After Test
- Execution time displayed in toast notification
- User can adjust timeout if needed
- Timeout value available in response metadata

## Examples

### Quick Test (30s)
```javascript
{
  "system_prompt": "You are a helpful assistant.",
  "user_input": "Hello!",
  "model": "llama2",
  "temperature": 0.7,
  "timeout": 30
}
```

### Complex Task (180s)
```javascript
{
  "system_prompt": "Analyze this code and provide detailed review...",
  "user_input": "[large code block]",
  "model": "codellama",
  "temperature": 0.3,
  "timeout": 180
}
```

## Troubleshooting

**Issue**: Request still times out
- **Solution**: Increase timeout slider value
- **Check**: Ollama service is running
- **Verify**: Model is loaded and available

**Issue**: Very long wait times
- **Solution**: Reduce timeout for faster feedback
- **Consider**: Using smaller model
- **Optimize**: Simplify prompt or input

## Future Enhancements
- Save timeout preference per prompt
- Auto-adjust based on model size
- Timeout presets (Quick/Standard/Extended)
- Warning if timeout seems too short for selected model
