# Prompts Configuration Quick Reference

## Files
- **Config**: `prompts_config.yaml`
- **Backup**: `prompts_config.yaml.backup`
- **Guide**: `PROMPTS_CONFIGURATION_GUIDE.md`

## Quick Edit
```bash
# 1. Backup
cp prompts_config.yaml prompts_config.yaml.my_backup

# 2. Edit
notepad prompts_config.yaml  # Windows
nano prompts_config.yaml     # Linux/Mac

# 3. Restart
python run.py
```

## Parameters Cheat Sheet

| Parameter | Range | Default | Purpose |
|-----------|-------|---------|---------|
| temperature | 0.0-2.0 | 0.3 | Randomness (lower = consistent) |
| top_p | 0.0-1.0 | 0.9 | Diversity (lower = focused) |
| top_k | 0+ | 0 | Token limit (0 = disabled) |
| repeat_penalty | 1.0+ | 1.1 | Repetition reduction |

## Common Adjustments

### More Consistent
```yaml
temperature: 0.1
top_p: 0.7
```

### More Creative
```yaml
temperature: 0.7
top_p: 0.95
```

### Less Repetitive
```yaml
repeat_penalty: 1.3
```

## Template Rules
- ✓ Must contain `{objective}`
- ✓ Use YAML multi-line format (`|`)
- ✓ Keep guidelines clear
- ✗ Don't remove placeholder
- ✗ Don't break YAML syntax

## Restore Defaults
```bash
cp prompts_config.yaml.backup prompts_config.yaml
```

## Validation
Look for on startup:
- ✓ `Prompts configuration loaded`
- ✗ `Using fallback configuration` (error!)

## Need Help?
See `PROMPTS_CONFIGURATION_GUIDE.md` for:
- Detailed parameter explanations
- Example modifications
- Troubleshooting guide
- Best practices
