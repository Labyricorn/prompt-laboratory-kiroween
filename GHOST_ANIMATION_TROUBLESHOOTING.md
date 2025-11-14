# Ghost Animation Troubleshooting Guide

## Current Status

The ghost animation code is now properly integrated:
- ✅ CSS added to `frontend/css/styles.css`
- ✅ JavaScript has `ghostAvailable` check
- ✅ KiroweenEffect integrated in TestChamberPanel
- ✅ Checkbox event listener added
- ✅ Trigger called on successful test completion
- ✅ Duplicate event listener removed

## Why Tests Don't Run in HTML Files

The test HTML files (`test_ghost_animation.html`, `verify_ghost_fix.html`) use ES6 modules which require:
1. A web server (not just opening the file)
2. Proper MIME types for JavaScript modules

**Solution**: Run the application through the Flask backend which serves files correctly.

## How to Test the Ghost Animation

### Step 1: Start the Application

```bash
# Make sure you're in the project root directory
python run.py
```

The application should start on `http://localhost:5000`

### Step 2: Open the Application

Open your browser and navigate to:
```
http://localhost:5000
```

### Step 3: Enable Kiroween Effect

1. Scroll down to the "Test Chamber" panel
2. Find the "Test Chamber Parameters" section
3. Check the "Kiroween effect" checkbox at the bottom

### Step 4: Run a Test

1. Make sure you have a prompt loaded in the Workbench
2. Enter a test message in the Test Chamber
3. Click "Run Test"
4. Wait for the test to complete successfully

### Step 5: Watch for the Ghost!

When the test completes successfully, you should see:
1. **Purple lightning flash** across the screen
2. **Ghost animation** floating across the header:
   - Starts after "Prompt-Laboratory" title
   - Faces right initially
   - Moves rightward (in front of "Ollama Connected")
   - Flips to face left at settings gear
   - Moves leftward (behind "Ollama Connected")
   - Fades out at the end
   - Total duration: ~4 seconds

## Debugging Steps

### Check 1: Is the Server Running?

Open browser console (F12) and check for:
- No 404 errors for CSS or JS files
- No module loading errors

### Check 2: Is the Ghost Image Loading?

In browser console, type:
```javascript
const img = new Image();
img.onload = () => console.log('Ghost image loaded!');
img.onerror = () => console.log('Ghost image FAILED to load');
img.src = '/assets/images/kiro_monster_leftfacing.png';
```

Expected: "Ghost image loaded!"

### Check 3: Is KiroweenEffect Initialized?

In browser console, check:
```javascript
// This should show the TestChamberPanel component
document.querySelector('.test-chamber-panel')
```

### Check 4: Is the Checkbox Working?

1. Check the Kiroween checkbox
2. In console, you should see: "TestChamberPanel: Kiroween effect toggled: true"

### Check 5: Is the Effect Enabled?

After checking the checkbox, in console type:
```javascript
// Find the TestChamberPanel instance (it's not globally exposed, but we can check localStorage)
localStorage.getItem('prompt-laboratory-kiroween-enabled')
```

Expected: `{"enabled":true}`

### Check 6: Manual Trigger Test

After enabling the checkbox, in console type:
```javascript
// This won't work directly because kiroweenEffect is not globally exposed
// But you can check if the CSS is loaded:
getComputedStyle(document.documentElement).getPropertyValue('--primary-color')
```

Expected: Should return a color value (means CSS is loaded)

## Common Issues

### Issue 1: Ghost Image 404 Error

**Symptom**: Console shows "404 Not Found" for ghost image

**Solution**:
1. Verify file exists: `frontend/assets/images/kiro_monster_leftfacing.png`
2. Check file permissions
3. Restart the Flask server

### Issue 2: CSS Not Loading

**Symptom**: No purple flash, no ghost styles

**Solution**:
1. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Check Network tab for CSS 404 errors
4. Verify `frontend/css/styles.css` contains Kiroween styles

### Issue 3: Checkbox Not Working

**Symptom**: Checking the box doesn't enable the effect

**Solution**:
1. Check browser console for JavaScript errors
2. Verify TestChamberPanel.js has the event listener
3. Check localStorage is working (not in private/incognito mode)

### Issue 4: Animation Not Triggering

**Symptom**: Test completes but no animation

**Possible Causes**:
1. **Effect not enabled**: Check the checkbox
2. **Test not successful**: Check if test actually succeeded (no errors)
3. **Ghost image not loaded**: Check console for image loading errors
4. **Reduced motion enabled**: Check browser/OS accessibility settings

**Debug**:
```javascript
// Check localStorage
localStorage.getItem('prompt-laboratory-kiroween-enabled')

// Should return: {"enabled":true}
```

### Issue 5: Header Elements Not Found

**Symptom**: Console shows "Header elements not found"

**Solution**:
1. Verify header HTML structure in `frontend/index.html`
2. Check that `.header-title` and `.settings-icon` elements exist
3. Make sure header is visible (not display: none)

## Testing Without Running a Real Test

If you want to test the animation without running an actual AI test:

1. Open browser console
2. Enable the Kiroween checkbox
3. Unfortunately, the kiroweenEffect instance is not globally exposed

**Workaround**: Temporarily add this to `frontend/js/components/TestChamberPanel.js` after line 51:
```javascript
// Make kiroweenEffect globally accessible for testing
window.testKiroween = this.kiroweenEffect;
```

Then in console:
```javascript
window.testKiroween.trigger()
```

## Expected Console Messages

When everything is working correctly, you should see:
```
Prompt-Laboratory initializing...
TestChamberPanel initialized
TestChamberPanel: Kiroween checkbox initialized, enabled: false
[User checks checkbox]
TestChamberPanel: Kiroween effect toggled: true
[User runs test]
Running test with data: {...}
TestChamberPanel: displayTestResult() {...}
[Ghost animation plays]
Test completed in X.XXs
```

## File Checklist

Verify these files have the correct content:

- ✅ `frontend/css/styles.css` - Contains `.kiroween-ghost` and `@keyframes ghostFloat`
- ✅ `frontend/js/utils/KiroweenEffect.js` - Has `ghostAvailable` check in `playFloatingGhost()`
- ✅ `frontend/js/components/TestChamberPanel.js` - Has checkbox listener and trigger call
- ✅ `frontend/assets/images/kiro_monster_leftfacing.png` - Ghost image exists
- ✅ `frontend/index.html` - Has Kiroween checkbox in parameters section

## Next Steps

1. **Start the server**: `python run.py`
2. **Open the app**: `http://localhost:5000`
3. **Enable the effect**: Check the Kiroween checkbox
4. **Run a test**: Complete a successful test
5. **Watch the magic**: Ghost should float across the header! 👻✨

If you still don't see the animation after following all these steps, please share:
- Browser console errors
- Network tab showing any 404s
- Screenshot of the Test Chamber panel
- Output of: `localStorage.getItem('prompt-laboratory-kiroween-enabled')`
