# Quick Start: Layout Toggle Feature

## What's New?

Prompt-Laboratory now supports dynamically resizing the Workbench and Test Chamber panels to focus on your current task!

## How to Use

### Method 1: Click Toggle Buttons

1. **Expand Workbench** (for editing prompts):
   - Look for the `⇄` button in the Workbench panel header
   - Click it to expand the Workbench area
   - The Test Chamber will shrink to give you more editing space
   - Click again to return to default layout

2. **Expand Test Chamber** (for viewing results):
   - Look for the `⇄` button in the Test Chamber panel header
   - Click it to expand the Test Chamber area
   - The Workbench will shrink to give you more testing space
   - Click again to return to default layout

### Method 2: Keyboard Shortcuts

- **Ctrl+1** (Windows/Linux) or **Cmd+1** (Mac): Toggle Workbench mode
- **Ctrl+2** (Windows/Linux) or **Cmd+2** (Mac): Toggle Test Chamber mode

## Visual Indicators

- **Default State**: Toggle button has gray border
- **Active State**: Toggle button has blue background (mode is active)
- **Hover State**: Toggle button shows light background

## Your Preference is Saved

The layout mode you choose is automatically saved and will be restored when you reload the page.

## Tips

1. **Writing Mode**: Use Workbench mode when crafting detailed prompts
2. **Testing Mode**: Use Test Chamber mode when reviewing AI responses
3. **Quick Switch**: Use keyboard shortcuts to rapidly switch between modes
4. **Reset Anytime**: Click the active toggle button to return to balanced view

## Example Workflow

```
1. Start in Default Mode (balanced view)
   ↓
2. Click Workbench toggle (or Ctrl+1) to expand editing area
   ↓
3. Write and refine your prompt
   ↓
4. Click Test Chamber toggle (or Ctrl+2) to expand testing area
   ↓
5. Run tests and review results in expanded view
   ↓
6. Click toggle again to return to default when done
```

## Troubleshooting

**Q: The toggle button doesn't seem to work**
- Make sure JavaScript is enabled in your browser
- Try refreshing the page
- Check browser console for any errors

**Q: Layout doesn't persist after reload**
- Check if localStorage is enabled in your browser
- Some privacy modes may prevent localStorage

**Q: Layout looks wrong on mobile**
- The toggle feature is optimized for desktop/tablet
- On mobile, panels stack vertically (existing behavior)

## Need Help?

If you encounter any issues, please check the browser console for error messages or refer to the full documentation in `LAYOUT_TOGGLE_FEATURE.md`.
