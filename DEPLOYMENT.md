# Palfare Deployment Guide

## Current Status
- Branch: `main`
- Last Commit: "Update environment variable configuration for Vercel best practices"
- Environment: Production
- Target Domain: palfare.com

## Prerequisites
1. Domain: palfare.com
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
NEXT_PUBLIC_SITE_URL=https://palfare.com
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

### 1. Domain Configuration
1. Configure DNS records for palfare.com
2. Set up SSL certificate (automatic with Vercel)
3. Configure domain in Vercel

### 2. Environment Setup
1. Set required environment variables in Vercel as described above
2. Optional: Configure BlockCypher API key when ready to enable Bitcoin functionality
3. Configure build settings in Vercel

### 3. Deployment Process
1. Push to `main` branch
2. Vercel will automatically deploy
3. Verify deployment success

### 4. Post-Deployment Checks
- [ ] Website accessible at https://palfare.com
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