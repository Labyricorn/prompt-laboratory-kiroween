# Test Chamber Flow Documentation

## Overview
This document explains how the System Prompt from the Workbench is combined with the Test Chamber User Message and Parameters to produce the AI response.

## Complete Flow

### Step 1: User Prepares System Prompt (Workbench)
**Location**: Workbench Panel → System Prompt Editor

The user creates or loads a system prompt that defines the AI's role and behavior.

**Example System Prompt**:
```
You are a helpful coding assistant with expertise in Python.
Provide clear, concise answers with code examples when appropriate.
```

### Step 2: User Enters Test Message (Test Chamber)
**Location**: Test Chamber → Test Chamber User Message

The user enters a message to test how the AI responds with the given system prompt.

**Example User Message**:
```
How do I write a for loop in Python?
```

### Step 3: User Configures Parameters (Test Chamber)
**Location**: Test Chamber → Test Chamber Parameters

The user selects:
- **Model**: Which AI model to use (e.g., llama3.2:1b, qwen2.5:14b)
- **Temperature**: Randomness level (0.0 = deterministic, 2.0 = creative)
- **Timeout**: Maximum wait time (30s - 300s)

**Example Parameters**:
```
Model: llama3.2:1b
Temperature: 0.7
Timeout: 60s
```

### Step 4: User Clicks "Run Test"
**Location**: Test Chamber → Run Test Button

This triggers the test execution.

### Step 5: Backend Combines Everything
**Location**: `backend/services/ollama_service.py` → `test_prompt()` method

#### 5.1: Apply Parameters
```python
# Use selected model or default
model = model or config.default_model

# Use selected temperature or default
temperature = temperature if temperature is not None else config.default_temperature

# Use selected timeout or default
request_timeout = timeout if timeout is not None else self.timeout
```

#### 5.2: Combine System Prompt + User Message
```python
# Format: [System Prompt]\n\nUser: [User Message]\n\nAssistant:
full_prompt = f"{system_prompt}\n\nUser: {user_input}\n\nAssistant:"
```

**Example Combined Prompt**:
```
You are a helpful coding assistant with expertise in Python.
Provide clear, concise answers with code examples when appropriate.

User: How do I write a for loop in Python?