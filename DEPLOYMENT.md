# Palfare Deployment Guide

## Current Status
- Branch: `main`
- Last Commit: "Make BlockCypher API key optional for initial deployment"
- Environment: Production
- Target Domains:
  - Primary: https://www.palfare.com
  - Redirect: https://palfare.com → https://www.palfare.com
  - Preview: https://palfare.vercel.app

## Prerequisites
1. Domains:
   - palfare.com (redirects to www)
   - www.palfare.com (main production domain)
   - palfare.vercel.app (preview domain)
2. Hosting: Vercel
3. API Keys (Optional for initial deployment):
   - BlockCypher API Key (can be added later for Bitcoin functionality)

## Environment Variables Setup

### Vercel Environment Variables
1. Go to Project Settings > Environment Variables
2. Copy the contents of `.env.example` (excluding comments) into the environment variables section
3. Replace placeholder values with actual production values
4. Enable "Automatically expose System Environment Variables"
5. For sensitive values (like API keys), enable "Sensitive" option

### Required Variables for Initial Deployment
```env
NEXT_PUBLIC_SITE_URL=https://www.palfare.com
NEXT_PUBLIC_SITE_NAME=Palfare
NODE_ENV=production
```

### Optional Variables (Can be added later)
```env
NEXT_PUBLIC_BLOCKCYPHER_API_KEY=your_production_api_key
```

### Local Development
1. Copy `.env.example` to `.env.local`
2. Uncomment and update development variables
3. Never commit `.env.local` to version control

## Deployment Steps

### 1. Domain Configuration (Already Set Up)
- ✓ palfare.com redirects to www.palfare.com
- ✓ www.palfare.com assigned to main branch
- ✓ palfare.vercel.app assigned to main branch

### 2. Environment Setup
1. Set required environment variables in Vercel as described above
2. Optional: Configure BlockCypher API key when ready to enable Bitcoin functionality
3. Configure build settings in Vercel

### 3. Deployment Process
1. Push to `main` branch
2. Vercel will automatically deploy to:
   - https://www.palfare.com (production)
   - https://palfare.vercel.app (preview)
3. Verify deployment success

### 4. Post-Deployment Checks
- [ ] Website accessible at https://www.palfare.com
- [ ] Redirect from https://palfare.com working
- [ ] Preview site at https://palfare.vercel.app working
- [ ] All routes functional
- [ ] SSL certificate valid
- [ ] Forms working
- [ ] Basic functionality working (Bitcoin features will be disabled until API key is added)

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