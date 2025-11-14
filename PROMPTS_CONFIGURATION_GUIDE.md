# Prompts Configuration Guide

## Overview
Prompt-Laboratory now supports customizable meta-prompts and parameters through an external configuration file. This allows you to modify how the "Refine" feature converts objectives into system prompts without changing code.

## Configuration Files

### Location
- **Main Config**: `prompts_config.yaml` (in project root)
- **Backup Config**: `prompts_config.yaml.backup` (in project root)

### Purpose
- **prompts_config.yaml**: Active configuration used by the application
- **prompts_config.yaml.backup**: Original backup for restoration

## Configuration Structure

```yaml
meta_prompt:
  template: |
    [Your meta-prompt template here]
    Use {objective} as placeholder for user input
  
  parameters:
    temperature: 0.3      # 0.0-2.0
    top_p: 0.9           # 0.0-1.0
    top_k: 0             # 0 or positive integer
    repeat_penalty: 1.1  # >= 1.0
```

## Parameters Explained

### Temperature (0.0 - 2.0)
Controls randomness in AI responses:
- **0.0-0.3**: Very consistent, deterministic outputs (recommended for refinement)
- **0.4-0.7**: Balanced creativity and consistency
- **0.8-1.5**: More creative, varied outputs
- **1.6-2.0**: Highly creative, potentially unpredictable

**Default**: 0.3 (consistent prompt refinement)

### Top P (0.0 - 1.0)
Nucleus sampling - limits token selection to top probability mass:
- **0.5-0.7**: More focused, deterministic
- **0.8-0.9**: Balanced diversity (recommended)
- **0.95-1.0**: Maximum diversity

**Default**: 0.9 (balanced)

### Top K (0 or positive integer)
Limits selection to top K most likely tokens:
- **0**: Disabled (uses top_p instead) - recommended
- **40-100**: Typical values if enabled

**Default**: 0 (disabled)

### Repeat Penalty (>= 1.0)
Penalizes repetition in output:
- **1.0**: No penalty
- **1.1-1.2**: Slight reduction in repetition (recommended)
- **1.3-1.5**: Moderate reduction
- **>1.5**: Strong reduction (may affect quality)

**Default**: 1.1 (slight reduction)

## How to Modify Configuration

### Step 1: Backup Current Configuration
```bash
# Create a backup before making changes
cp prompts_config.yaml prompts_config.yaml.my_backup
```

### Step 2: Edit Configuration
Open `prompts_config.yaml` in a text editor:
```bash
# Windows
notepad prompts_config.yaml

# Linux/Mac
nano prompts_config.yaml
# or
vim prompts_config.yaml
```

### Step 3: Make Changes
Modify the template or parameters as needed. See examples below.

### Step 4: Restart Application
```bash
# Stop the application (Ctrl+C)
# Then restart
python run.py
```

### Step 5: Test Changes
1. Open Prompt-Laboratory
2. Enter an objective in the Workbench
3. Click "Refine"
4. Verify the output meets your expectations

## Example Modifications

### Example 1: More Creative Refinement
```yaml
parameters:
  temperature: 0.7  # Increased from 0.3
  top_p: 0.95       # Increased from 0.9
  top_k: 0
  repeat_penalty: 1.1
```

### Example 2: Very Consistent Refinement
```yaml
parameters:
  temperature: 0.1  # Decreased from 0.3
  top_p: 0.7        # Decreased from 0.9
  top_k: 0
  repeat_penalty: 1.2
```

### Example 3: Domain-Specific Meta-Prompt
```yaml
meta_prompt:
  template: |
    You are an expert prompt engineer specializing in software development.
    Convert this objective into a detailed system prompt for a coding assistant.
    
    Guidelines:
    1. Emphasize code quality and best practices
    2. Include error handling requirements
    3. Specify code documentation standards
    4. Add testing considerations
    5. Include security best practices
    
    Objective: {objective}
    
    Create a comprehensive system prompt. Return only the prompt text.
```

### Example 4: Concise Prompts
```yaml
meta_prompt:
  template: |
    You are a prompt engineer. Convert this objective into a concise,
    effective system prompt. Be brief but complete.
    
    Objective: {objective}
    
    Return only the system prompt text, no explanations.
```

## Common Use Cases

### Use Case 1: Industry-Specific Prompts
Modify the meta-prompt to emphasize industry-specific requirements:
- Healthcare: Add HIPAA compliance, medical terminology
- Legal: Add legal terminology, citation requirements
- Finance: Add regulatory compliance, numerical accuracy
- Education: Add pedagogical approaches, learning objectives

### Use Case 2: Tone Adjustment
Modify the meta-prompt to generate prompts with specific tones:
- Professional: Formal, business-oriented
- Casual: Friendly, conversational
- Technical: Precise, detailed
- Creative: Imaginative, flexible

### Use Case 3: Output Format Emphasis
Modify guidelines to emphasize specific output formats:
- Structured data (JSON, XML)
- Markdown formatting
- Code snippets
- Step-by-step instructions

## Troubleshooting

### Problem: Application Won't Start
**Symptoms**: Error loading prompts configuration

**Solutions**:
1. Check YAML syntax (indentation, colons, quotes)
2. Verify {objective} placeholder exists in template
3. Restore from backup:
   ```bash
   cp prompts_config.yaml.backup prompts_config.yaml
   ```

### Problem: Poor Refinement Quality
**Symptoms**: Generated prompts are too vague or too verbose

**Solutions**:
1. Adjust temperature (lower for consistency, higher for creativity)
2. Modify meta-prompt guidelines
3. Add examples to meta-prompt
4. Test with different models

### Problem: Repetitive Output
**Symptoms**: Generated prompts repeat phrases

**Solutions**:
1. Increase repeat_penalty (try 1.2 or 1.3)
2. Adjust temperature slightly higher
3. Modify meta-prompt to discourage repetition

### Problem: Inconsistent Results
**Symptoms**: Each refinement produces very different results

**Solutions**:
1. Lower temperature (try 0.1 or 0.2)
2. Lower top_p (try 0.7 or 0.8)
3. Add more specific guidelines to meta-prompt

## Validation

The application validates configuration on startup:

### Valid Configuration
```
✓ Prompts configuration loaded from prompts_config.yaml
```

### Invalid Configuration
```
Error loading prompts configuration: [error details]
Using fallback configuration
✓ Using fallback prompts configuration
```

If you see the fallback message, check your configuration file for errors.

## Restoring Defaults

### Method 1: From Backup
```bash
cp prompts_config.yaml.backup prompts_config.yaml
python run.py
```

### Method 2: Delete and Restart
```bash
# Delete the config file
rm prompts_config.yaml  # Linux/Mac
del prompts_config.yaml  # Windows

# Application will use backup automatically
python run.py
```

### Method 3: Manual Restoration
Copy the content from `prompts_config.yaml.backup` to `prompts_config.yaml`

## Advanced Customization

### Multi-Language Support
```yaml
meta_prompt:
  template: |
    You are an expert prompt engineer fluent in multiple languages.
    Convert this objective into a system prompt. If the objective is in
    a non-English language, create the system prompt in that language.
    
    Objective: {objective}
    
    Return only the system prompt text.
```

### Structured Output
```yaml
meta_prompt:
  template: |
    You are a prompt engineer. Convert this objective into a system prompt
    with the following structure:
    
    ROLE: [Define the AI's role]
    TASK: [Describe the main task]
    CONSTRAINTS: [List any constraints]
    OUTPUT FORMAT: [Specify output format]
    
    Objective: {objective}
    
    Return the structured system prompt.
```

### With Examples
```yaml
meta_prompt:
  template: |
    You are a prompt engineer. Convert this objective into a system prompt.
    
    Example objective: "Help users debug code"
    Example prompt: "You are an expert debugger. Analyze code, identify
    issues, and provide clear explanations with solutions."
    
    Now create a prompt for this objective: {objective}
    
    Return only the system prompt text.
```

## Best Practices

### DO:
✓ Keep backups before making changes
✓ Test changes with sample objectives
✓ Document your modifications
✓ Use version control for config files
✓ Start with small parameter adjustments
✓ Validate YAML syntax before restarting

### DON'T:
✗ Remove the {objective} placeholder
✗ Use extreme parameter values without testing
✗ Make multiple changes at once
✗ Forget to restart after changes
✗ Delete the backup file
✗ Use invalid YAML syntax

## Security Considerations

### Safe Modifications
- Changing parameters within recommended ranges
- Adding guidelines to meta-prompt
- Adjusting tone or style
- Adding domain-specific requirements

### Potentially Unsafe
- Removing validation guidelines
- Adding prompts that could generate harmful content
- Extreme parameter values (temp > 1.5)
- Removing error handling instructions

## Performance Impact

### Parameter Effects on Performance

**Temperature**:
- Lower values: Faster, more predictable
- Higher values: Slightly slower, more varied

**Top P**:
- Lower values: Faster generation
- Higher values: Slightly slower, more diverse

**Repeat Penalty**:
- Minimal performance impact
- Slight increase in processing time

## Support

### Getting Help
1. Check this documentation
2. Review error messages in console
3. Test with backup configuration
4. Check YAML syntax validators online
5. Review application logs

### Reporting Issues
When reporting configuration issues, include:
- Your prompts_config.yaml content
- Error messages from console
- Steps to reproduce
- Expected vs actual behavior

## Version History

### Version 1.0 (2024-01-15)
- Initial release
- Configurable meta-prompt template
- Configurable generation parameters
- Backup system
- Validation and fallback

## Future Enhancements

Planned features:
- Multiple meta-prompt templates
- Per-model parameter profiles
- UI for configuration editing
- Template library
- A/B testing support
- Configuration validation API endpoint
