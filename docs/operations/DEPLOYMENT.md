---
created_date: 2025-06-05
last_modified_date: 2025-06-10
last_modified_summary: Updated production URL from orangecat.com to orangecat.ch and clarified deployment configuration
---

# OrangeCat Deployment Guide

## ⚠️ CRITICAL: ONLY Deployment Method

**There is ONLY ONE way to deploy OrangeCat to production:**

### 🚀 GitHub → Vercel Auto-Deployment Workflow

1. **Commit changes** to your branch
2. **Push to GitHub** 
3. **Merge to main branch** (or push directly to main)
4. **Vercel automatically deploys** from main branch

**DO NOT use Vercel CLI directly. DO NOT use manual deployment scripts.**

---

## Deployment Process

### Step 1: Prepare Your Changes
```bash
# Make your changes, then commit
git add .
git commit -m "Your commit message"
```

### Step 2: Push to GitHub
```bash
# If on a feature branch
git push origin your-branch-name

# Then create a Pull Request and merge to main
# OR if already on main:
git push origin main
```

### Step 3: Automatic Deployment
- GitHub Actions automatically triggers
- Vercel deploys from main branch
- No manual intervention required

---

## Domains

- Primary: https://orangecat.ch
- Preview: https://orangecat.vercel.app

## DNS Configuration

### Required Records

- orangecat.ch (main production domain)
- orangecat.vercel.app (preview domain)

## Environment Variables

All environment variables are configured in:
1. **Vercel Dashboard** (production)
2. **GitHub Secrets** (for GitHub Actions)
3. **Local .env.local** (development only)

### Required Production Variables

```env
NEXT_PUBLIC_SITE_URL=https://orangecat.ch
NEXT_PUBLIC_SITE_NAME=OrangeCat
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BITCOIN_ADDRESS=your_bitcoin_address
NEXT_PUBLIC_LIGHTNING_ADDRESS=your_lightning_address
```

### Development

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=OrangeCat (Dev)
```

## Deployment Checklist

### DNS Setup
- ✓ orangecat.ch assigned to main branch
- ✓ orangecat.vercel.app assigned to main branch

### Environment Variables
- ✓ All required variables set in Vercel
- ✓ Production variables configured
- ✓ Development variables configured

### Security
- ✓ HTTPS enabled
- ✓ Security headers configured
- ✓ Domain verification complete

## Testing

### URLs to Verify
- https://orangecat.ch (production)
- https://orangecat.vercel.app (preview)

### Checklist
- [ ] Website accessible at https://orangecat.ch
- [ ] Preview site at https://orangecat.vercel.app working

## Monitoring
- Vercel Analytics enabled
- Error tracking configured
- Performance monitoring active

## Rollback Plan
1. Revert to previous deployment in Vercel
2. Restore previous environment variables if needed
3. Verify rollback success

## Contact
For deployment issues, contact: [Your Contact Information] 

## Verification

After pushing to main, verify deployment:

1. **Check GitHub Actions**: Visit `https://github.com/g-but/orangecat/actions`
2. **Verify Deployment**: Check https://orangecat.ch
3. **Monitor Logs**: Use Vercel dashboard

## Troubleshooting

### Deployment Not Triggering?
- Ensure changes are pushed to main branch
- Check GitHub Actions tab for errors
- Verify Vercel is connected to GitHub repository

### Build Failures?
- Check GitHub Actions logs
- Fix build errors in code
- Push fixes to main branch

### Environment Variables Missing?
- Update in Vercel dashboard
- Redeploy by pushing a small change to main

## Emergency Rollback

1. **Via Vercel Dashboard**: 
   - Go to Deployments
   - Select previous successful deployment
   - Click "Promote to Production"

2. **Via Git**:
   ```bash
   git revert <commit-hash>
   git push origin main
   # This triggers automatic redeployment
   ```

---

## What NOT to Do

❌ **DO NOT** use `vercel deploy` CLI commands  
❌ **DO NOT** use deployment scripts directly  
❌ **DO NOT** bypass GitHub Actions workflow  
❌ **DO NOT** deploy from local machine  

## What TO Do

✅ **ALWAYS** commit and push to GitHub  
✅ **ALWAYS** deploy through main branch  
✅ **ALWAYS** let GitHub Actions + Vercel handle deployment  
✅ **ALWAYS** verify deployment through GitHub Actions logs  

---

This process ensures:
- **Version Control**: All deployments are tracked in Git
- **Reproducibility**: Same build process every time  
- **Security**: No local credentials needed
- **Rollback**: Easy revert through Git history
- **Monitoring**: Full deployment logs in GitHub Actions 