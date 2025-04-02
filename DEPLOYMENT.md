# Palfare Deployment Guide

## Current Status
- Branch: `feature/initial-setup`
- Last Commit: "Prepare for production deployment to palfare.com"
- Environment: Production
- Target Domain: palfare.com

## Prerequisites
1. Domain: palfare.com
2. Hosting: Vercel
3. API Keys:
   - BlockCypher API Key
   - Vercel Deployment Token

## Environment Variables
Required environment variables for production:
```env
NEXT_PUBLIC_SITE_URL=https://palfare.com
NEXT_PUBLIC_SITE_NAME=Palfare
NEXT_PUBLIC_BLOCKCYPHER_API_KEY=your_production_api_key
NODE_ENV=production
```

## Deployment Steps

### 1. Domain Configuration
1. Configure DNS records for palfare.com
2. Set up SSL certificate
3. Configure domain in Vercel

### 2. Environment Setup
1. Set environment variables in Vercel
2. Verify API keys
3. Configure build settings

### 3. Deployment Process
1. Merge `feature/initial-setup` to `main`
2. Trigger deployment
3. Verify deployment success

### 4. Post-Deployment Checks
- [ ] Website accessible at https://palfare.com
- [ ] All routes functional
- [ ] SSL certificate valid
- [ ] Forms working
- [ ] API integrations working

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