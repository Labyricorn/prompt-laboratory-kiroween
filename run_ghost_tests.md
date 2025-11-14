# Quick Test Instructions

## Running Ghost Animation Tests

### Option 1: Direct Browser Open
1. Open `test_ghost_animation.html` in your web browser
2. Click "Run All Tests" button
3. Watch the animations and review results

### Option 2: With Local Server
If you need to serve the files through a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000

# Then open in browser:
# http://localhost:8000/test_ghost_animation.html
```

## Quick Test Checklist

### Visual Tests (Watch the Animation)
1. ✅ Ghost appears after "Prompt-Laboratory" title
2. ✅ Ghost faces right initially
3. ✅ Ghost moves right across header
4. ✅ Ghost is in front of "Ollama Connected" (rightward)
5. ✅ Ghost flips at settings gear
6. ✅ Ghost moves left back to start
7. ✅ Ghost is behind "Ollama Connected" (leftward)
8. ✅ Ghost fades out smoothly
9. ✅ Ghost has floating/bobbing motion
10. ✅ Animation takes ~4 seconds

### Automated Tests (Check Results Panel)
11. ✅ No JavaScript errors
12. ✅ Correct position calculations
13. ✅ Overlap prevention works
14. ✅ Graceful degradation (missing image)
15. ✅ Graceful degradation (missing header)
16. ✅ Window resize handling
17. ✅ Dark mode compatibility
18. ✅ Reduced motion support

## Individual Test Buttons

You can also run tests individually:
- Click any numbered test button to run that specific test
- Use "Clear Results" to reset the results panel
- Toggle "Dark Mode" to test theme compatibility
- Toggle "Simulate Reduced Motion" to test accessibility

## Expected Output

### Console (F12 DevTools)
- No errors should appear
- Info messages about test progress
- Warnings only for intentional error tests (missing image, etc.)

### Results Panel
- Green checkmarks (✅) for passing tests
- Red X marks (❌) for failing tests
- Blue info icons (ℹ️) for informational messages

## Troubleshooting

### Ghost Not Appearing
- Check console for errors
- Verify `frontend/assets/images/kiro_monster_leftfacing.png` exists
- Ensure browser supports CSS animations

### Tests Not Running
- Check that JavaScript modules are enabled
- Verify `frontend/js/utils/KiroweenEffect.js` exists
- Open console to see error messages

### Animation Stuttering
- Close other browser tabs to free resources
- Check CPU usage
- Try in a different browser

## Next Steps

After all tests pass:
1. Mark task 11 as complete in `tasks.md`
2. Review test results with team
3. Document any issues found
4. Proceed with integration testing
