# Layout Modes Visual Guide

## Default Mode (Balanced)
```
┌─────────────┬──────────────────────────┬─────────────────┐
│   Library   │       Workbench          │  Test Chamber   │
│   380px     │      (flexible)          │     525px       │
│   (fixed)   │                          │    (fixed)      │
└─────────────┴──────────────────────────┴─────────────────┘
```
**Use Case**: Balanced view for general workflow

---

## Workbench Mode (Expanded Editing) - DEFAULT
```
┌─────────────┬──────────────────────────────┬──────────────┐
│   Library   │       Workbench              │Test Chamber  │
│   380px     │      (flexible)              │   420px      │
│   (fixed)   │      ← EXPANDED →            │  (shrunk)    │
└─────────────┴──────────────────────────────┴──────────────┘
```
**Use Case**: Focus on writing and editing prompts
**Trigger**: Click ⇄ in Workbench header OR press Ctrl+1
**Note**: This is the default mode on first load

---

## Test Chamber Mode (Expanded Testing)
```
┌─────────────┬──────────────┬──────────────────────────────┐
│   Library   │  Workbench   │       Test Chamber           │
│   380px     │   420px      │        (flexible)            │
│   (fixed)   │  (shrunk)    │       ← EXPANDED →           │
└─────────────┴──────────────┴──────────────────────────────┘
```
**Use Case**: Focus on testing and viewing results
**Trigger**: Click ⇄ in Test Chamber header OR press Ctrl+2

---

## Toggle Button States

### Inactive (Default Mode)
```
┌─────┐
│  ⇄  │  ← Gray border, transparent background
└─────┘
```

### Active (Mode Enabled)
```
┌─────┐
│  ⇄  │  ← Blue background, white icon
└─────┘    (Highlighted to show active state)
```

### Hover
```
┌─────┐
│  ⇄  │  ← Light background, blue border
└─────┘    (Visual feedback on hover)
```

---

## Responsive Breakpoints

### Desktop (> 1200px)
- Default: 380px | flexible | 525px
- Workbench: 380px | flexible | 420px
- Test Chamber: 380px | 420px | flexible

### Laptop (992px - 1200px)
- Default: 340px | flexible | 480px
- Workbench: 340px | flexible | 400px
- Test Chamber: 340px | 400px | flexible

### Tablet (768px - 992px)
- Default: 300px | flexible | 450px
- Workbench: 300px | flexible | 380px
- Test Chamber: 300px | 380px | flexible

### Mobile (< 768px)
- Stacked vertical layout (existing behavior)
- Toggle buttons still functional

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` (or `Cmd+1` on Mac) | Toggle Workbench Mode |
| `Ctrl+2` (or `Cmd+2` on Mac) | Toggle Test Chamber Mode |

---

## Persistence

```
User Action → Toggle Mode → Save to localStorage
                              ↓
                    Page Reload → Restore Mode
```

The layout preference is automatically saved and restored across browser sessions.
