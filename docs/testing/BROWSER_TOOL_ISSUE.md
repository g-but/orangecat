# Browser Tool Issue - Explanation & Solution

**Date**: 2025-11-24  
**Issue**: Cursor's browser tool opens Chrome with many tabs that don't load

## 🔍 What's Happening

The Cursor browser tool (MCP browser integration) appears to have an issue where:

1. It opens Chrome/Chromium
2. Opens multiple tabs rapidly
3. Tabs don't load properly
4. The tool becomes unresponsive

## 🐛 Likely Causes

1. **Multiple Browser Instances**: The tool might be creating multiple browser contexts instead of reusing one
2. **Race Conditions**: Rapid navigation commands might be firing before pages load
3. **Configuration Issue**: Browser tool might not be properly configured for this project
4. **Resource Limits**: Too many browser instances consuming system resources

## ✅ Solution: Use Playwright Demo Script

I've created a **Playwright-based demo script** that does exactly what you want:

### What It Does:

- ✅ Opens a **single browser window** (visible, not headless)
- ✅ Navigates through workflows **step by step**
- ✅ **Slows down actions** so you can watch
- ✅ Takes **screenshots** at each step
- ✅ Shows you **exactly what's happening**

### How to Run:

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run the demo
node scripts/test/demo-profile-workflow.js
```

### What You'll See:

1. Browser opens (Chrome/Chromium)
2. Navigates to homepage
3. Signs in (if needed)
4. Clicks "My Info" in sidebar
5. Shows view mode
6. Clicks "Edit Profile"
7. Shows edit mode with guidance sidebar
8. Scrolls through form
9. Verifies wallets are NOT in editor
10. Clicks "Back to View"
11. Returns to view mode

All actions happen **slowly** (1 second delay) so you can watch!

## 📸 Screenshots

Screenshots are automatically saved to `demo-screenshots/` folder:

- `01-homepage.png`
- `02-after-auth.png`
- `03-view-mode.png`
- `04-edit-mode.png`
- `05-guidance-sidebar.png`
- `06-no-wallets.png`
- `07-back-to-view.png`

## 🔧 Alternative: Fix Browser Tool

If you want to fix the Cursor browser tool itself:

1. **Check MCP Configuration**: The browser tool might need configuration in Cursor settings
2. **Restart Cursor**: Sometimes the MCP server needs a restart
3. **Check Browser Processes**: Kill any stuck browser processes:
   ```bash
   pkill -f "chrome.*mcp|playwright.*chrome"
   ```
4. **Check Logs**: Look for MCP browser tool errors in Cursor's developer console

## 💡 Recommendation

**Use the Playwright demo script** - it's more reliable and gives you exactly what you want:

- Single browser window
- Step-by-step navigation
- Visible actions
- Screenshots
- No multiple tabs issue

The script is at: `scripts/test/demo-profile-workflow.js`
