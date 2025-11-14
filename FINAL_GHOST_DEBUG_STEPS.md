# Final Ghost Animation Debug Steps

## What I've Done

I've added comprehensive logging throughout the ghost animation code. Every step now logs to the console so we can see exactly where it's failing.

## Files Modified with Logging

1. **frontend/js/utils/KiroweenEffect.js**
   - `preloadGhostImage()` - Logs when image starts loading and when it succeeds/fails
   - `trigger()` - Logs when triggered and what effects are available
   - `playFloatingGhost()` - Logs every step of the animation process

2. **frontend/js/components/TestChamberPanel.js**
   - `init()` - Logs when KiroweenEffect is initialized and ghostAvailable status
   - `displayTestResult()` - Logs whether Kiroween will be triggered and why

## How to Debug

### Step 1: Restart Everything

```bash
# Stop the server (Ctrl+C)
# Start fresh
python run.py
```

### Step 2: Open Browser with Console

1. Navigate to `http://localhost:5000`
2. Open DevTools (F12)
3. Go to Console tab
4. **Keep it open** - you'll see all the logs

### Step 3: Watch the Initial Load

You should see these messages appear:

```
✅ Expected on page load:
- "Prompt-Laboratory initializing..."
- "TestChamberPanel initialized"
- "Preloading ghost image from: /assets/images/kiro_monster_leftfacing.png"
- "Ghost image loaded successfully!" ← CRITICAL!
- "KiroweenEffect initialized, ghostAvailable: true" ← CRITICAL!
- "TestChamberPanel: Kiroween checkbox initialized, enabled: false"
```

**STOP HERE if you don't see "Ghost image loaded successfully!"**

If the image fails to load:
- Check Network tab for 404 error
- Verify file exists: `dir frontend\assets\images\kiro_monster_leftfacing.png`
- Check the exact error message

### Step 4: Enable the Effect

1. Scroll to Test Chamber Parameters
2. Check the "Kiroween effect" checkbox

You should see:
```
✅ Expected:
- "TestChamberPanel: Kiroween effect toggled: true"
```

### Step 5: Run a Test

1. Load a prompt in Workbench (or create a new one)
2. Enter a test message
3. Click "Run Test"
4. **Watch the console carefully**

### Step 6: Analyze the Console Output

When the test completes, you should see this EXACT sequence:

```
✅ Complete expected sequence:
1. "TestChamberPanel: displayTestResult() {...}"
2. "Triggering Kiroween effect - enabled: true, ghostAvailable: true"
3. "KiroweenEffect.trigger() called - enabled: true, ghostAvailable: true, audioAvailable: false"
4. "Calling playFloatingGhost()"
5. "playFloatingGhost() called"
6. "Ghost path calculated: {startX: XXX, midX: XXX, endX: XXX}"
7. "Ghost element created: <img class='kiroween-ghost' src='/assets/images/kiro_monster_leftfacing.png'>"
8. "Ghost added to DOM"
9. "Ghost floating class added"
10. [Wait 4 seconds]
11. "Ghost animation complete, element removed"
```

## Troubleshooting by Log Message

### If you see: "Kiroween effect NOT triggered"

**Meaning**: The effect wasn't triggered at all

**Check**:
```javascript
// In console, check:
localStorage.getItem('prompt-laboratory-kiroween-enabled')
// Should return: {"enabled":true}
```

### If you see: "Effect not enabled, skipping"

**Meaning**: Checkbox isn't actually enabling the effect

**Fix**: 
- Uncheck and recheck the checkbox
- Check localStorage (see above)
- Look for errors in the checkbox event handler

### If you see: "Ghost not available, skipping ghost animation"

**Meaning**: Image didn't load

**Fix**:
- Scroll up in console to find the image loading error
- Check Network tab for 404
- Verify image file exists

### If you see: "Header elements not found"

**Meaning**: Can't find `.header-title` or `.settings-icon`

**Check in console**:
```javascript
document.querySelector('.header-title')
document.querySelector('.settings-icon')
// Both should return elements, not null
```

### If logs stop at "Ghost added to DOM"

**Meaning**: Ghost is in the DOM but CSS animation isn't working

**Debug**:
1. Open Elements tab in DevTools
2. Find the `<img class="kiroween-ghost floating">` element
3. Check its computed styles
4. Look for the `animation` property
5. Check if CSS variables are set (--start-x, --mid-x, --end-x)

**Possible causes**:
- CSS file didn't load (check Network tab)
- CSS animation syntax error
- Browser doesn't support CSS animations

### If you see all logs but NO visual ghost

**Meaning**: Ghost is animating but not visible

**Check**:
1. Inspect the ghost element in Elements tab
2. Check its position (should be `position: fixed`)
3. Check its z-index (should be 10000)
4. Check its opacity during animation
5. Check if it's off-screen

## Manual Tests in Console

### Test 1: Check Image Loads
```javascript
const img = new Image();
img.onload = () => console.log('✅ Image loads!');
img.onerror = () => console.log('❌ Image FAILS!');
img.src = '/assets/images/kiro_monster_leftfacing.png';
```

### Test 2: Check Header Elements
```javascript
console.log('Title:', document.querySelector('.header-title'));
console.log('Gear:', document.querySelector('.settings-icon'));
```

### Test 3: Check CSS Loaded
```javascript
const styles = getComputedStyle(document.documentElement);
console.log('Primary color:', styles.getPropertyValue('--primary-color'));
// Should return a color value
```

### Test 4: Check LocalStorage
```javascript
console.log(localStorage.getItem('prompt-laboratory-kiroween-enabled'));
// Should return: {"enabled":true} after checking the box
```

## What to Report

Please copy and paste:

1. **All console output** from page load through test completion
2. **Any red error messages**
3. **Network tab** - screenshot showing any 404 errors
4. **Result of manual tests** (above)
5. **Do you see the purple flash?** (Yes/No)

## Expected Behavior

When working correctly:
1. **Purple flash** appears across the entire screen (1 second)
2. **Ghost appears** at the right edge of "Prompt-Laboratory" title
3. **Ghost faces right** (horizontally flipped)
4. **Ghost floats rightward** with bobbing motion
5. **Ghost passes in front** of "Ollama Connected" status
6. **Ghost reaches settings gear** and flips to face left
7. **Ghost floats leftward** back to start
8. **Ghost passes behind** "Ollama Connected" status
9. **Ghost fades out** smoothly
10. **Total time**: ~4 seconds

## Quick Visual Checklist

While test is running, watch for:
- [ ] Purple flash (if yes, flash effect works!)
- [ ] Ghost appears in header
- [ ] Ghost moves across screen
- [ ] Ghost has floating/bobbing motion
- [ ] Ghost flips direction at midpoint
- [ ] Ghost fades out at end

---

With all this logging, we'll find the exact point where it's failing!
