---
created_date: 2025-01-21
last_modified_date: 2025-01-21
last_modified_summary: Initial setup guide for GitHub + Vercel integration
---

# 🔗 GitHub + Vercel Integration Setup

This guide explains how to set up automatic deployments from GitHub to Vercel.

## 🎯 Overview

When properly configured, Vercel automatically deploys your application whenever you push to the `main` branch. This integration provides:

- ✅ **Automatic deployments** on every push to `main`
- ✅ **Preview deployments** for pull requests
- ✅ **Zero-downtime deployments** with automatic rollbacks
- ✅ **Built-in CI/CD** without additional configuration
- ✅ **Deployment status** directly in GitHub

## 📋 Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if needed
3. **Project Access**: Admin access to both GitHub repository and Vercel project

## 🚀 Setup Steps

### Step 1: Connect GitHub Repository to Vercel

1. **Go to Vercel Dashboard**
   - Navigate to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sign in or create an account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose your GitHub repository (`g-but/orangecat`)

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install && npm install --include=optional sharp`

4. **Set Production Branch**
   - Ensure **Production Branch** is set to `main`
   - This ensures only pushes to `main` trigger production deployments

5. **Configure Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - See [Environment Variables](#environment-variables) section below

6. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application

### Step 2: Verify GitHub Integration

After the initial deployment:

1. **Check GitHub Integration**
   - Go to Vercel Dashboard → Your Project → Settings → Git
   - Verify GitHub repository is connected
   - Check that "Production Branch" is set to `main`

2. **Test Automatic Deployment**
   - Make a small change to your code
   - Commit and push to `main` branch:
     ```bash
     git add .
     git commit -m "test: verify auto-deployment"
     git push origin main
     ```
   - Go to Vercel Dashboard → Deployments
   - You should see a new deployment automatically triggered

3. **Check Deployment Status in GitHub**
   - Go to your GitHub repository
   - Navigate to any commit on `main` branch
   - You should see Vercel deployment status checks

### Step 3: Configure Preview Deployments (Optional)

Preview deployments are automatically created for pull requests:

1. **Enable Preview Deployments**
   - Vercel Dashboard → Settings → Git
   - Ensure "Preview Deployments" is enabled
   - Configure preview environment variables if needed

2. **Test Preview Deployment**
   - Create a new branch and pull request
   - Vercel will automatically create a preview deployment
   - The preview URL will appear in the PR comments

## 🔧 Configuration Files

### vercel.json

The project includes a `vercel.json` configuration file with:

- Framework settings (Next.js)
- Build configuration
- Security headers
- Redirects and rewrites
- Function timeouts
- Cron jobs

**Location**: `/vercel.json`

### GitHub Actions CI

While Vercel handles deployment, GitHub Actions runs CI checks:

- Linting
- Type checking
- Unit tests
- Integration tests
- Build verification
- Security scans

**Location**: `.github/workflows/ci.yml`

## 🌍 Environment Variables

### Required Environment Variables

Configure these in Vercel Dashboard → Settings → Environment Variables:

#### Production Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://orangecat.ch
NODE_ENV=production
```

#### Optional Variables

```
NEXT_TELEMETRY_DISABLED=1
NPM_CONFIG_FUND=false
```

### Environment Variable Scope

- **Production**: Applied to `main` branch deployments
- **Preview**: Applied to PR preview deployments
- **Development**: Applied to local development (optional)

### Adding New Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Click "Add New"
3. Enter variable name and value
4. Select environment scope (Production, Preview, Development)
5. Click "Save"

## 🔄 Deployment Flow

### Automatic Deployment Process

```
Push to main branch
       ↓
GitHub webhook triggers Vercel
       ↓
Vercel clones repository
       ↓
Installs dependencies
       ↓
Runs build command
       ↓
Deploys to production
       ↓
Updates production URL
       ↓
GitHub status check updates
```

### Deployment Status

You can monitor deployments in:

1. **Vercel Dashboard**
   - Real-time build logs
   - Deployment status
   - Build analytics

2. **GitHub**
   - Commit status checks
   - PR deployment comments
   - Actions workflow status

3. **Email Notifications** (if enabled)
   - Deployment success/failure
   - Build errors

## 🎛️ Deployment Settings

### Production Branch

- **Branch**: `main`
- **Auto-deploy**: Enabled
- **Auto-cancel**: Enabled (cancels previous deployments)

### Preview Deployments

- **Enabled**: Yes
- **Auto-deploy**: Enabled for all PRs
- **Cleanup**: Automatic after PR merge/close

### Build Settings

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install && npm install --include=optional sharp`
- **Node Version**: 20.x (from `package.json` engines)

## 🔍 Monitoring Deployments

### Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click "Deployments" tab
4. View deployment history, logs, and status

### GitHub Integration

1. Go to your repository on GitHub
2. Click "Actions" tab to see CI workflow runs
3. Click on any commit to see Vercel deployment status
4. Check PR comments for preview deployment links

### Deployment Logs

Access detailed logs:

1. Vercel Dashboard → Deployments → Select deployment
2. Click "View Build Logs"
3. Check for errors, warnings, or build issues

## 🚨 Troubleshooting

### Deployment Not Triggering

**Symptoms**: Push to `main` doesn't trigger deployment

**Solutions**:

1. Check Vercel Dashboard → Settings → Git
   - Verify GitHub repository is connected
   - Check that production branch is `main`
2. Check GitHub repository settings
   - Go to Settings → Webhooks
   - Verify Vercel webhook is active
3. Manually trigger deployment:
   - Vercel Dashboard → Deployments → "Redeploy"

### Build Failures

**Symptoms**: Deployment fails during build

**Solutions**:

1. Check build logs in Vercel Dashboard
2. Verify environment variables are set correctly
3. Test build locally: `npm run build`
4. Check Node.js version compatibility
5. Verify all dependencies are in `package.json`

### Environment Variable Issues

**Symptoms**: App works locally but fails in production

**Solutions**:

1. Verify all required variables are set in Vercel
2. Check variable names match exactly (case-sensitive)
3. Ensure variables are scoped to "Production"
4. Pull variables locally: `vercel env pull .env.local`

### Preview Deployments Not Working

**Symptoms**: PRs don't get preview deployments

**Solutions**:

1. Check Vercel Dashboard → Settings → Git
   - Ensure "Preview Deployments" is enabled
2. Verify PR is from a branch in the same repository
3. Check Vercel project permissions
4. Review Vercel logs for errors

## 🔒 Security Considerations

### Secrets Management

- ✅ Never commit secrets to repository
- ✅ Use Vercel environment variables for all secrets
- ✅ Rotate secrets regularly
- ✅ Use different secrets for production and preview

### Access Control

- ✅ Limit Vercel project access to trusted team members
- ✅ Use GitHub branch protection rules
- ✅ Require PR reviews before merging to `main`
- ✅ Enable deployment protection in Vercel

### Best Practices

1. **Branch Protection**: Protect `main` branch in GitHub
2. **Required Checks**: Require CI checks to pass before merge
3. **Review Requirements**: Require PR reviews
4. **Deployment Protection**: Enable in Vercel for critical deployments

## 📊 Deployment Analytics

### Vercel Analytics

Access deployment metrics:

1. Vercel Dashboard → Analytics
2. View:
   - Deployment frequency
   - Build times
   - Success/failure rates
   - Performance metrics

### GitHub Insights

View repository insights:

1. GitHub Repository → Insights
2. Check:
   - Deployment frequency
   - CI/CD success rates
   - Code review metrics

## 🔄 Rollback Procedures

### Automatic Rollback

Vercel automatically rolls back if:

- Build fails
- Health checks fail
- Critical errors detected

### Manual Rollback

1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback

### Git Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main
# Vercel will automatically deploy the reverted version
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Project Deployment Process](./DEPLOYMENT_PROCESS.md)

## ✅ Verification Checklist

After setup, verify:

- [ ] GitHub repository connected to Vercel
- [ ] Production branch set to `main`
- [ ] Environment variables configured
- [ ] Initial deployment successful
- [ ] Push to `main` triggers automatic deployment
- [ ] GitHub shows Vercel deployment status
- [ ] Preview deployments work for PRs
- [ ] Production site accessible at configured domain

---

**Last Updated**: 2025-01-21
