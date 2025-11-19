# Changelog

All notable changes to `Prompt-Laboratory` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-13

### ✨ Added
- **Complete Prompt Engineering Environment**
  - Three-panel interface: Library (left), Workbench (center), Test Chamber (right)
  - Advanced prompt editing with Monaco Editor syntax highlighting
  - Local-first architecture with Ollama integration
  - Configurable connection testing and timeout settings

- **Library Management**
  - Save, load, and organize prompts with metadata
  - Import/export functionality with conflict resolution
  - Search and filter capabilities
  - Edit prompt names and descriptions after saving

- **Theme System**
  - Dark mode as default for better eye comfort
  - Light/dark mode toggle with persistence
  - Modern orange primary color scheme (#FA7137)

- **Layout System**
  - Toggle between default, workbench-focused, and test-focused layouts
  - Keyboard shortcuts (Ctrl/⌘+1 for workbench, Ctrl/⌘+2 for test chamber)
  - Responsive design across desktop, tablet, and mobile
  - Layout preferences saved to localStorage

- **User Experience Enhancements**
  - Toast notifications for all operations
  - Loading indicators and progress feedback
  - Copy to clipboard functionality
  - Unsaved changes warnings
  - Favicon display in browser tabs

- **Configuration Management**
  - Persistent model and timeout settings
  - Configurable prompt refinement timeout (30s-5min range)
  - Model selection and connection testing
  - Settings UI with real-time validation

- **API Endpoints**
  - RESTful API for prompt operations
  - Config management through API
  - Health checks and system status
  - Import/export functionality

### 🔧 Changed
- **Branding**: Renamed from "PromptLab" to "Prompt-Laboratory" for consistency
- **Default Theme**: Now defaults to dark mode on first load
- **Layout Default**: Workbench mode prioritized for editing workflow
- **Config Persistence**: Settings now persist across server restarts

### 🐛 Fixed
- Config settings now properly persist to disk
- Model attribution correctly shows generation model in saved prompts
- Test Chamber enables immediately after saving prompts
- Graceful shutdown with signal handling
- Various UI styling and animation fixes
- Ghost animation timing and positioning corrections
- KIRO branding link color updates

### 📚 Documentation
- Comprehensive README with installation, usage, and API reference
- Feature documentation for layout toggles and configuration
- Prompts configuration guide for customization
- Troubleshooting section with common issues
