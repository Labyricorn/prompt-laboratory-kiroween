# Debug Ghost Animation - Step by Step

I've added extensive logging to help us figure out why the ghost isn't showing. Follow these steps:

## Step 1: Start Fresh

1. **Stop the server** if it's running (Ctrl+C)
2. **Start the server again**:
   ```bash
   python run.py
   ```
3. **Open the application** in your browser: `http://localhost:5000`
4. **Open Browser DevTools** (F12) and go to the Console tab

## Step 2: Check Initial Loading

Look for these console messages when the page loads:

```
Expected messages:
- "Prompt-Laboratory initializing..."
- "TestChamberPanel initialized"
- "Preloading ghost image from: /assets/images/kiro_monster_leftfacing.png"
- "Ghost image loaded successfully!" (this is critical!)
- "KiroweenEffect initialized, ghostAvailable: true"
- "TestChamberPanel: Kiroween checkbox initialized, enabled: false"
```

### If you see "Ghost image failed to load":
- The image path is wrong or the file doesn't exist
- Check the Network tab (F12) for a 404 error
- Verify the file exists: `frontend/assets/images/kiro_monster_leftfacing.png`

### If you DON'T see "Ghost image loaded successfully!":
- The image is still loading (wait a moment)
- Or there's an error (check for red error messages)

## Step 3: Enable the Effect

1. **Scroll down** to the Test Chamber panel
2. **Find** the "Test Chamber Parameters" section
3. **Check** the "Kiroween effect" checkbox

Look for this console message:
```
Expected:
- "TestChamberPanel: Kiroween effect toggled: true"
```

## Step 4: Run a Test

1. **Make sure** you have a prompt loaded in the Workbench
2. **Enter** a test message (anything like "Hello")
3. **Click** "Run Test"
4. **Wait** for the test to complete

## Step 5: Check the Console Logs

When the test completes, you should see these messages in order:

```
Expected sequence:
1. "TestChamberPanel: displayTestResult() {...}"
2. "Triggering Kiroween effect - enabled: true, ghostAvailable: true"
3. "KiroweenEffect.trigger() called - enabled: true, ghostAvailable: true, audioAvailable: false"
4. "Calling playFloatingGhost()"
5. "playFloatingGhost() called"
6. "Ghost path calculated: {startX: XXX, midX: XXX, endX: XXX}"
7. "Ghost element created: <img...>"
8. "Ghost added to DOM"
9. "Ghost floating class added"
10. [After 4 seconds] "Ghost animation complete, element removed"
```

## Troubleshooting Based on Console Output

### Scenario A: "Kiroween effect NOT triggered"
**Problem**: Test not considered successful or effect not initialized
**Check**: 
- Did the test actually succeed? (no errors?)
- Is `this.kiroweenEffect` defined?

### Scenario B: "Effect not enabled, skipping"
**Problem**: Checkbox not checked or localStorage not saving
**Solution**:
- Check the checkbox again
- Check localStorage: `localStorage.getItem('prompt-laboratory-kiroween-enabled')`
- Should return: `{"enabled":true}`

### Scenario C: "Ghost not available, skipping"
**Problem**: Ghost image didn't load
**Solution**:
- Check Network tab for 404 on the image
- Verify file exists
- Check image path in code

### Scenario D: "Header elements not found"
**Problem**: Can't find `.header-title` or `.settings-icon`
**Solution**:
- Check if header exists in the page
- Inspect the header HTML structure
- Make sure elements have the correct classes

### Scenario E: Logs stop after "Ghost added to DOM"
**Problem**: CSS animation not working
**Solution**:
- Check if CSS was loaded (Network tab)
- Hard refresh (Ctrl+F5)
- Inspect the ghost element in DevTools Elements tab
- Check if `.kiroween-ghost.floating` class is applied
- Check if CSS variables are set (--start-x, --mid-x, --end-x)

## Manual Test in Console

After enabling the checkbox, you can manually test in the console:

```javascript
// Check if ghost image is available
// (You'll need to find the TestChamberPanel instance, but we can check the image directly)
const testImg = new Image();
testImg.onload = () => console.log('✅ Image loads!');
testImg.onerror = () => console.log('❌ Image fails!');
testImg.src = '/assets/images/kiro_monster_leftfacing.png';
```

## What to Report Back

Please copy and paste:

1. **All console messages** from page load to after running a test
2. **Any red error messages**
3. **Network tab** - any 404 errors?
4. **The result of**:
   ```javascript
   localStorage.getItem('prompt-laboratory-kiroween-enabled')
   ```
5. **The result of**:
   ```javascript
   document.querySelector('.header-title')
   document.querySelector('.settings-icon')
   ```

## Quick Visual Check

While the test is running, also watch for:
- **Purple flash** - If you see this, the flash effect works!
- **Ghost animation** - Should appear in the header area

If you see the purple flash but NO ghost, then:
- Ghost image didn't load, OR
- CSS animation isn't working, OR
- Ghost is being added but not visible (z-index issue?)

---

With all this logging, we'll be able to pinpoint exactly where the ghost animation is failing!
