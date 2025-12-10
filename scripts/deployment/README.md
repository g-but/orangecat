# 🚀 OrangeCat Deployment Scripts

This directory contains the complete automated deployment system for OrangeCat.

## 📋 Scripts Overview

### Core Deployment
- **`deploy.js`** - Main deployment script (the only way to deploy)
- **`browser-verify.js`** - Automated browser testing after deployment
- **`diagnose.js`** - Deployment readiness diagnostics

### Legacy Scripts (Deprecated)
- **`one-button-deploy.js`** - Old manual deployment trigger
- **`production-deploy.js`** - Legacy production deployment
- Other scripts are maintained for reference but should not be used

## 🎯 How to Deploy

### The Only Command You Need
```bash
npm run deploy
```

This runs the complete automated deployment pipeline.

### Other Available Commands
```bash
# Diagnose deployment readiness
npm run deploy:diagnose

# Force deploy (emergency only)
npm run deploy:force

# Verify browser functionality
npm run deploy:verify
```

## 🔧 Script Details

### deploy.js
**Purpose**: Complete automated deployment pipeline

**What it does**:
1. Code quality checks (lint, type-check, security)
2. Git commit and push to main
3. Trigger GitHub Actions workflow
4. Monitor deployment progress
5. Browser verification
6. Success/failure notifications

**Usage**: `npm run deploy`

### browser-verify.js
**Purpose**: Automated browser testing of deployed site

**What it does**:
1. Launches browser and navigates to production
2. Tests home page loading
3. Tests navigation functionality
4. Tests core features
5. Captures screenshots for verification
6. Checks for JavaScript errors

**Usage**: `npm run deploy:verify`

### diagnose.js
**Purpose**: Check deployment readiness

**What it does**:
1. Verifies all prerequisites installed
2. Checks authentication status
3. Validates project configuration
4. Tests production site accessibility
5. Provides specific fix recommendations

**Usage**: `npm run deploy:diagnose`

## 📚 Documentation

- **[Deployment Process](../../docs/deployment/DEPLOYMENT_PROCESS.md)** - Single source of truth
- **[Troubleshooting](../../docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md)** - Common issues and fixes

## 🔄 Development Workflow

1. **Make changes** in your development environment
2. **Test locally** with `npm run test:e2e`
3. **Run diagnostics** with `npm run deploy:diagnose`
4. **Deploy** with `npm run deploy`
5. **Monitor** deployment progress in terminal/GitHub
6. **Verify** production site works automatically

## 🚨 Emergency Procedures

### If Automated Deployment Fails
1. Check GitHub Actions logs
2. Run diagnostics: `npm run deploy:diagnose`
3. Manual intervention (rare):
   - Check Vercel dashboard
   - Verify environment variables
   - Check production site manually

### Rollback
```bash
npm run deploy:rollback
```

## 📊 Monitoring

### Real-time Monitoring
- Terminal output during deployment
- GitHub Actions workflow status
- Vercel deployment dashboard

### Post-deployment
- Production site: https://orangecat.ch
- Health check: https://orangecat.ch/api/health
- GitHub Actions: Repository → Actions tab

## 🔐 Security

- All scripts validate authentication before proceeding
- Secrets managed through GitHub Secrets and Vercel
- No hardcoded credentials in scripts
- Audit logs maintained in GitHub Actions

## 🤝 Contributing

When modifying deployment scripts:
1. Update this README
2. Update main deployment documentation
3. Test in staging environment first
4. Ensure backward compatibility
5. Update diagnostics to catch new issues



