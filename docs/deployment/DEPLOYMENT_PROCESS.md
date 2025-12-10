---
created_date: 2025-12-10
last_modified_date: 2025-12-10
last_modified_summary: Added Next.js security requirement for Vercel deployments
---

# 🚀 OrangeCat Deployment Process

## ⚠️ CRITICAL: SINGLE SOURCE OF TRUTH

**This document is the ONLY authoritative source for deploying OrangeCat.**

All other deployment methods, scripts, and documentation are deprecated and will be removed.

---

## 🎯 Deployment Philosophy

- **One Command**: `npm run deploy` triggers the entire automated process
- **Zero Manual Steps**: No direct involvement required after saying "deploy"
- **Full Automation**: GitHub → Build → Deploy → Verify → Notify
- **Browser Verification**: Automated testing ensures the app actually works in production

---

## 🚀 How to Deploy

### The Only Way to Deploy

```bash
# From anywhere in the project
npm run deploy
```

That's it. The system handles everything else automatically.

### What Happens When You Run `npm run deploy`

1. **Code Quality Checks** (2-3 minutes)
   - Lint code
   - Type checking
   - Security scans

2. **Commit & Push** (1-2 minutes)
   - Stages all changes
   - Creates conventional commit message
   - Pushes to main branch

3. **GitHub Actions Deployment** (5-8 minutes)
   - Triggers production workflow
   - Builds application
   - Deploys to Vercel
   - Health checks

4. **Browser Verification** (2-3 minutes)
   - Opens production site in browser
   - Clicks through key user flows
   - Verifies functionality

5. **Notification** (immediate)
   - Reports success/failure
   - Provides monitoring links

---

## 📋 Prerequisites

### Required Tools

- Node.js 20+
- GitHub CLI (`gh`) installed and authenticated
- Vercel CLI installed
- Playwright browsers installed (for verification)

### Authentication

```bash
# GitHub CLI
gh auth login

# Vercel CLI
vercel login
```

### Next.js security gate (Vercel)

- Vercel blocks deployments on vulnerable Next.js releases. Keep the app on a patched version (currently 15.5.7 or newer) before triggering `npm run deploy`.

### Environment Setup

All environment variables must be configured in:

- **Vercel Dashboard** (production)
- **GitHub Secrets** (CI/CD)

---

## 🔧 Technical Implementation

### Core Components

#### 1. Main Deployment Script

Location: `scripts/deployment/deploy.js`

```javascript
// Automated deployment workflow
- Quality gates
- Git operations
- Workflow triggering
- Monitoring
- Browser verification
```

#### 2. GitHub Actions Workflow

Location: `.github/workflows/production-deploy.yml`

```yaml
# Production deployment pipeline
- Build & test
- Vercel deployment
- Health validation
- Performance audit
```

#### 3. Browser Verification

Location: `scripts/deployment/browser-verify.js`

```javascript
// Automated browser testing
- Load production site
- Test critical user flows
- Screenshot verification
- Error detection
```

#### 4. Monitoring & Notification

Location: `scripts/deployment/monitor.js`

```javascript
// Real-time deployment tracking
- GitHub Actions status
- Vercel deployment status
- Health endpoint monitoring
- Slack/email notifications
```

---

## 📊 Deployment Flow Diagram

```
User says "deploy"
       ↓
  npm run deploy
       ↓
┌─────────────────┐
│ Code Quality    │ ← Lint, TypeScript, Security
└─────────────────┘
       ↓
┌─────────────────┐
│ Git Operations  │ ← Commit, Push to main
└─────────────────┘
       ↓
┌─────────────────┐
│ GitHub Actions  │ ← Trigger production workflow
└─────────────────┘
       ↓
┌─────────────────┐
│ Vercel Deploy   │ ← Build & deploy to production
└─────────────────┘
       ↓
┌─────────────────┐
│ Health Checks   │ ← API endpoints, database
└─────────────────┘
       ↓
┌─────────────────┐
│ Browser Verify  │ ← Click through user flows
└─────────────────┘
       ↓
┌─────────────────┐
│ Notifications   │ ← Success/failure reports
└─────────────────┘
```

---

## 🎛️ Available Commands

### Primary Deployment

```bash
npm run deploy          # Full automated deployment
```

### Manual Overrides (Emergency Only)

```bash
npm run deploy:force    # Skip quality checks (not recommended)
npm run deploy:staging  # Deploy to staging environment
```

### Monitoring & Debugging

```bash
npm run deploy:status   # Check deployment status
npm run deploy:logs     # View deployment logs
npm run deploy:rollback # Rollback to previous version
```

---

## 🔍 Verification Process

### Automated Browser Testing

After deployment, the system automatically:

1. **Opens Production Site**
   - Navigates to https://www.orangecat.ch
   - Waits for page load

2. **Critical Flow Testing**
   - Home page loads
   - Navigation works
   - Authentication flows
   - Core features functional

3. **Screenshot Verification**
   - Captures key pages
   - Compares with expected layouts
   - Detects visual regressions

4. **Error Detection**
   - Console errors logged
   - Network failures caught
   - JavaScript errors reported

### Health Checks

- **API Health**: `/api/health` endpoint
- **Database**: Connection and basic queries
- **External Services**: Supabase, payment processors
- **Performance**: Core Web Vitals

---

## 📱 Monitoring & Notifications

### Real-time Tracking

During deployment, monitor progress at:

- **GitHub Actions**: `https://github.com/your-org/orangecat/actions`
- **Vercel Dashboard**: `https://vercel.com/your-org/orangecat`
- **Production Site**: `https://www.orangecat.ch`

### Notification Channels

- **Terminal Output**: Real-time status updates
- **GitHub Checks**: Pass/fail status on commits
- **Slack/Webhooks**: Configurable notifications (optional)

### Success Criteria

Deployment is considered successful when:

- ✅ GitHub Actions workflow completes
- ✅ Vercel reports successful deployment
- ✅ Health checks pass
- ✅ Browser verification succeeds
- ✅ No critical errors detected

---

## 🚨 Troubleshooting

### Automated Diagnostics

Run comprehensive diagnostics:

```bash
npm run deploy:diagnose
```

This checks:

- Prerequisites (Node.js, GitHub CLI, Vercel CLI)
- Authentication status
- Project configuration
- Production site accessibility

### Deployment Issues

#### Code Quality Failures

**Symptoms:** Deployment stops at quality checks

**Solutions:**

- Fix linting errors: `npm run lint`
- Fix TypeScript errors: `npm run type-check`
- Fix security issues: `npm run test:security`

#### Git Operations Fail

**Symptoms:** Can't commit or push

**Solutions:**

- Check uncommitted changes: `git status`
- Resolve merge conflicts: `git merge --abort`
- Switch to main branch: `git checkout main`
- Pull latest changes: `git pull origin main`

#### GitHub Actions Fail

**Symptoms:** Workflow doesn't trigger or fails

**Solutions:**

- Check GitHub Actions tab: `https://github.com/g-but/orangecat/actions`
- Verify workflow file: `.github/workflows/one-button-deploy.yml`
- Check repository permissions
- Verify secrets are set in GitHub Settings

#### Vercel Build Fails

**Symptoms:** Build succeeds locally but fails in CI

**Solutions:**

- Check Vercel dashboard: `https://vercel.com/dashboard`
- Compare local vs CI environment variables
- Check build logs for specific errors
- Verify Node.js version compatibility

### Browser Verification Issues

#### Site Doesn't Load

**Symptoms:** Browser verification fails at page load

**Debug:**

```bash
# Manual verification
npm run deploy:verify

# Check production site directly
curl -I https://www.orangecat.ch
```

**Possible causes:**

- DNS propagation delay (wait 5-10 minutes)
- Vercel deployment still in progress
- Environment variable issues

#### Features Don't Work

**Symptoms:** Site loads but functionality fails

**Debug:**

```bash
# Check API health
curl https://www.orangecat.ch/api/health

# Check browser console for errors
npm run deploy:verify  # Captures screenshots
```

**Possible causes:**

- Database connection issues
- Missing environment variables
- JavaScript runtime errors
- Network connectivity problems

### Manual Deployment Options

#### Force Deploy (Emergency)

Bypasses quality checks for critical fixes:

```bash
npm run deploy:force
```

#### Direct Vercel Deploy

Manual deployment bypassing GitHub Actions:

```bash
npm run deploy:quick
```

### Environment Variable Issues

#### Check Variables

```bash
# Pull latest from Vercel
npm run env:pull

# Validate configuration
npm run deployment:verify
```

#### Common Missing Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Rollback Procedures

#### Automatic Rollback

```bash
npm run deploy:rollback
```

#### Manual Rollback via Vercel

1. Go to Vercel Dashboard
2. Select previous deployment
3. Click "Promote to Production"

#### Git Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main
```

### Performance Issues

#### Build Too Slow

- Check bundle size: `npm run build:analyze`
- Optimize imports and dependencies
- Enable build caching in Vercel

#### Site Too Slow

- Run performance audit: Vercel Analytics
- Check Core Web Vitals
- Optimize images and assets

### Network Issues

#### Can't Reach Vercel

- Check Vercel status: `https://vercel-status.com`
- Verify internet connection
- Try different network/VPN

#### GitHub API Issues

- Check GitHub status: `https://www.githubstatus.com`
- Verify GitHub CLI authentication: `gh auth status`
- Check API rate limits

### Getting Help

#### Quick Checks

```bash
# Full diagnostic report
npm run deploy:diagnose

# Check deployment status
npm run deploy:status

# View recent logs
npm run deploy:logs
```

#### Emergency Contacts

- Vercel Status: `https://vercel-status.com`
- GitHub Status: `https://www.githubstatus.com`
- Supabase Status: `https://status.supabase.com`

---

## 📚 Database Deployment

For database schema changes and migrations:

### Database Deployment Methods

#### Method 1: Supabase Dashboard (Recommended)

1. Navigate to SQL Editor: `https://supabase.com/dashboard/project/[project-id]/sql/new`
2. Paste migration SQL
3. Click "RUN"
4. Verify results

#### Method 2: Migration Functions (Automated)

Create idempotent functions for safe repeated execution:

```sql
CREATE OR REPLACE FUNCTION apply_migration_name()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Migration logic here
  RETURN 'SUCCESS: Migration applied';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;
```

#### Method 3: CLI Migrations (Development)

```bash
# Link project
npx supabase link --project-ref [project-id]

# Apply migrations
npx supabase db push --linked
```

### Database Verification

After any database change:

```sql
-- Check if changes were applied
SELECT * FROM pg_indexes WHERE tablename = 'your_table';

-- Test query performance
EXPLAIN ANALYZE SELECT * FROM your_table WHERE condition;

-- Monitor for locks
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

### Database Rollback

Always have rollback scripts ready:

```sql
-- Example rollback
DROP INDEX IF EXISTS idx_name;
-- or
ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;
```

### Rollback Process

**Automatic Rollback:**

```bash
npm run deploy:rollback
```

**Manual Rollback:**

1. Go to Vercel dashboard
2. Select previous deployment
3. Click "Promote to Production"

---

## 🔒 Security & Compliance

### Secrets Management

- All secrets stored in GitHub Secrets
- Never committed to code
- Rotated regularly

### Access Control

- Deployments require GitHub authentication
- Production access restricted
- Audit logs maintained

### Environment Separation

- Production and staging isolated
- No cross-environment data leakage
- Separate secrets per environment

---

## 📈 Performance & Reliability

### Deployment Metrics

- **Build Time**: < 5 minutes
- **Deploy Time**: < 3 minutes
- **Verification Time**: < 2 minutes
- **Total Time**: < 10 minutes

### Uptime Guarantees

- Zero-downtime deployments
- Automatic rollbacks on failure
- Health monitoring 24/7

### Quality Gates

- Code coverage > 80%
- No critical vulnerabilities
- Performance budget compliance

---

## 🔄 Continuous Improvement

### Deployment Analytics

- Track deployment frequency
- Monitor failure rates
- Measure deployment time
- User feedback integration

### Process Updates

- Regular review of deployment process
- Automation improvements
- Security updates
- Performance optimizations

---

## 📞 Support

### For Deployment Issues

1. Check this documentation first
2. Run `npm run deploy:diagnose`
3. Check GitHub Actions logs
4. Contact deployment team

### Emergency Contacts

- **Critical Issues**: [Emergency Contact]
- **General Support**: [Support Contact]

---

## 📚 Related Documentation

- [Architecture Overview](../architecture/ARCHITECTURE.md)
- [Development Setup](../development/SETUP.md)
- [Environment Configuration](../development/environment-management.md)
- [Monitoring Guide](../devops/observability.md)

---

## 🏆 Success Metrics

A successful deployment:

- Takes < 10 minutes total
- Requires zero manual intervention
- Provides clear success/failure feedback
- Leaves the production site fully functional
- Includes comprehensive verification

---

**Remember**: If you find any other deployment documentation or scripts, they are outdated. This document and `npm run deploy` are the only ways to deploy OrangeCat.
