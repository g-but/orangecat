# Deployment Troubleshooting Guide

**Created:** 2025-01-30  
**Last Modified:** 2025-01-30  
**Last Modified Summary:** Troubleshooting guide for when automatic Vercel deployment doesn't trigger

## 🚨 If Build Doesn't Happen Automatically

### Option 1: Check Vercel Dashboard (Recommended First Step)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find your OrangeCat project
   - Check the "Deployments" tab

2. **Check for Errors:**
   - Look for failed builds (red status)
   - Check build logs for errors
   - Verify GitHub integration is connected

3. **Manual Trigger:**
   - Click "Redeploy" on the latest commit
   - Or click "Deploy" → "Deploy Latest Commit"

---

### Option 2: Manual Deployment via Vercel CLI

**Prerequisites:**

- Vercel CLI installed (`npm i -g vercel`)
- Logged in (`vercel login`)

**Quick Deploy:**

```bash
npm run deploy:quick
# or
vercel --prod
```

**Full Deployment Script:**

```bash
npm run deploy:production
# or
./w production
```

---

### Option 3: Check GitHub Integration

**Verify Vercel is connected to GitHub:**

1. Go to Vercel Dashboard → Project Settings
2. Check "Git" section
3. Verify repository is connected
4. Check if webhook is active

**Reconnect if needed:**

1. Disconnect GitHub integration
2. Reconnect and authorize
3. Select the correct repository
4. Set production branch to `main`

---

### Option 4: Check Build Logs

**Via Vercel CLI:**

```bash
npm run monitor:logs
# or
vercel logs --follow
```

**Via Dashboard:**

- Go to Deployment → View Build Logs
- Check for:
  - Build errors
  - Environment variable issues
  - Dependency installation failures
  - TypeScript/ESLint errors

---

### Option 5: Verify Environment Variables

**Check if all required env vars are set:**

```bash
npm run deployment:verify
```

**Pull environment variables:**

```bash
npm run env:pull
```

**Common Missing Variables:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (if needed)

---

### Option 6: Force Deployment

**If automatic deployment is stuck:**

```bash
npm run deploy:force
# or
vercel --prod --force
```

**Note:** This bypasses some checks, use with caution.

---

## 🔍 Diagnostic Commands

### Check Deployment Status

```bash
# List recent deployments
vercel ls

# Check specific deployment
vercel inspect [deployment-url]
```

### Check Build Locally First

```bash
# Test build before deploying
npm run build

# If build fails locally, fix issues first
```

### Monitor Deployment

```bash
# Monitor deployment progress
npm run deploy:monitor
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Build Fails Due to TypeScript Errors

**Solution:**

```bash
# Check for type errors
npm run type-check

# Fix errors, then redeploy
```

### Issue 2: Build Fails Due to Missing Dependencies

**Solution:**

```bash
# Ensure all dependencies are in package.json
npm install

# Commit package-lock.json if changed
git add package-lock.json
git commit -m "chore: update dependencies"
git push
```

### Issue 3: Environment Variables Not Set

**Solution:**

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add missing variables
3. Redeploy

### Issue 4: GitHub Webhook Not Triggering

**Solution:**

1. Check GitHub repository settings → Webhooks
2. Verify Vercel webhook is active
3. Test webhook delivery
4. Reconnect if needed

### Issue 5: Build Timeout

**Solution:**

- Check `vercel.json` for timeout settings
- Optimize build process
- Consider splitting into smaller deployments

---

## ✅ Quick Checklist

Before manual deployment:

- [ ] Code is committed and pushed to GitHub
- [ ] Local build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Environment variables are set in Vercel
- [ ] Vercel CLI is installed and logged in

---

## 🚀 Recommended Deployment Flow

1. **Check automatic deployment first** (wait 2-3 minutes)
2. **If no deployment:**
   - Check Vercel dashboard
   - Check GitHub webhook status
   - Try manual trigger in dashboard
3. **If still no deployment:**
   - Use Vercel CLI: `npm run deploy:quick`
   - Monitor: `npm run deploy:monitor`
4. **Verify deployment:**
   - Visit: https://orangecat.ch
   - Check: https://orangecat.ch/api/health
   - Test new features

---

## 📞 Need Help?

- **Vercel Status:** https://www.vercel-status.com/
- **Vercel Docs:** https://vercel.com/docs
- **GitHub Actions:** Check `.github/workflows/` for CI/CD

---

**Status:** Ready for troubleshooting
