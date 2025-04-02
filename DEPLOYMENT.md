# Palfare Deployment Guide

## Current Status
- Branch: `main`
- Last Commit: "Prepare for production deployment to palfare.com"
- Environment: Production
- Target Domain: palfare.com

## Prerequisites
1. Domain: palfare.com
2. Hosting: Vercel
3. API Keys:
   - BlockCypher API Key
   - Vercel Deployment Token

## Environment Variables Setup

### Vercel Environment Variables
1. Go to Project Settings > Environment Variables
2. Copy the contents of `.env.example` (excluding comments) into the environment variables section
3. Replace placeholder values with actual production values
4. Enable "Automatically expose System Environment Variables"
5. For sensitive values (like API keys), enable "Sensitive" option

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
1. Set environment variables in Vercel as described above
2. Verify API keys are properly configured
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