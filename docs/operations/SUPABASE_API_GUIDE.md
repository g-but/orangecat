# 🔑 Supabase API Key Retrieval Guide

## Quick Start

**Easiest Method:**
```bash
npm run env:update-api-key
```

## Your Supabase Project Details

- **Project Reference:** `ohkueislstxomdjavyhs`
- **Dashboard URL:** https://app.supabase.com/project/ohkueislstxomdjavyhs/settings/api
- **Target:** Get the "anon public" API key

## 🎯 What You Need to Do

### Step 1: Navigate to Supabase Dashboard
Open your browser and go to:
```
https://app.supabase.com/project/ohkueislstxomdjavyhs/settings/api
```

### Step 2: Login (if required)
- Login with your Supabase account credentials
- You should be redirected to the API settings page

### Step 3: Find the API Key
Look for these elements on the page:

**Visual Indicators:**
- 📋 A table titled "Project API keys"
- 🔑 A row labeled "anon" or "public"
- 📄 A long string starting with `eyJ`
- 📋 A "Copy" button next to the key

**Example of what you'll see:**
```
Project API keys
┌──────────────┬─────────────────────────────────────────┬────────┐
│ Name         │ Key                                     │ Action │
├──────────────┼─────────────────────────────────────────┼────────┤
│ anon public  │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │ [Copy] │
│ service_role │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │ [Copy] │
└──────────────┴─────────────────────────────────────────┴────────┘
```

### Step 4: Copy the Key
- Click the "Copy" button next to the "anon public" key
- Or manually select and copy the entire key string

### Step 5: Update Your Environment
Run one of these commands and paste the key when prompted:

```bash
# Option 1: Use npm script (recommended)
npm run env:update-api-key

# Option 2: Direct Node.js
node scripts/update-api-key.js

# Option 3: Bash script (Linux/macOS)
./scripts/get-supabase-key.sh

# Option 4: Python script
python3 scripts/extract-supabase-key.py
```

## 🔍 For Browser Automation / Debugging

### DOM Elements to Inspect

If you need to inspect the page manually using browser dev tools:

**CSS Selectors:**
```css
[data-testid*="anon"]
[data-testid*="api-key"]
table tr:contains("anon")
table tr:contains("public")
code
pre
.api-key
.anon-key
```

**JavaScript Console Commands:**
```javascript
// Find all potential API key elements
document.querySelectorAll('[data-testid*="anon"], [data-testid*="api-key"], code, pre')

// Search for JWT tokens in page text
document.body.innerText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g)

// Find tables with API keys
Array.from(document.querySelectorAll('table')).filter(table =>
  table.innerText.includes('anon') || table.innerText.includes('public')
)
```

### Common HTML Patterns

The API key might appear in these structures:

```html
<!-- Table format -->
<table>
  <tr>
    <td>anon public</td>
    <td>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</td>
    <td><button>Copy</button></td>
  </tr>
</table>

<!-- Code block format -->
<code>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>

<!-- Div with data attributes -->
<div data-testid="anon-key">
  <span>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</span>
</div>

<!-- Pre-formatted text -->
<pre>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</pre>
```

## 🛠️ API Key Validation

Your API key should:
- ✅ Start with `eyJ`
- ✅ Contain exactly 3 parts separated by dots (.)
- ✅ Be at least 100 characters long
- ✅ Be a valid JWT token

Example format:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDc5NTAsImV4cCI6MjA2MDEyMzk1MH0.Qc6ahUbs_5BCa4csEYsBtyxNUDYb4h3Y4K_16N1DNaY
```

## 🔧 Manual Environment Update

If you prefer to update manually:

1. Open `/home/g/dev/orangecat/.env.local`
2. Find the line: `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
3. Replace the value with your new key:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_new_key_here"
   ```
4. Save the file

## 🚨 Troubleshooting

### "Can't find API key on the page"
- Refresh the page and wait for it to fully load
- Check that you're logged into the correct Supabase account
- Verify the project reference ID: `ohkueislstxomdjavyhs`
- Try clearing browser cache

### "Invalid API key format"
- Ensure you copied the complete key (no truncation)
- Remove any extra whitespace
- Make sure you copied the "anon public" key, not the service role key

### "Permission denied"
- Verify you have access to the Supabase project
- Check with project administrator
- Ensure you're logged into the correct account

### "Page won't load"
- Check your internet connection
- Try a different browser
- Disable ad blockers temporarily
- Check if Supabase is experiencing outages

## 📁 Available Scripts

| Script | Best For | Requirements |
|--------|----------|-------------|
| `update-api-key.js` | Everyone | Node.js only |
| `get-supabase-key.sh` | Linux/macOS users | Bash |
| `extract-supabase-key.py` | Python users | Python 3 |
| `fetch-supabase-api-key.js` | Full automation | Puppeteer |

## 🎉 Success!

After updating your API key:

1. ✅ Your `.env.local` file will be updated
2. ✅ A backup will be created automatically
3. ✅ Restart your development server:
   ```bash
   npm run dev
   ```

The OrangeCat application should now work with the fresh API key!