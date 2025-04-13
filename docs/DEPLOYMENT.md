# OrangeCat Deployment Guide

## Domains

- Primary: https://www.orangecat.com
- Redirect: https://orangecat.com → https://www.orangecat.com
- Preview: https://orangecat.vercel.app

## DNS Configuration

### Required Records

- orangecat.com (redirects to www)
- www.orangecat.com (main production domain)
- orangecat.vercel.app (preview domain)

## Environment Variables

### Production

```env
NEXT_PUBLIC_SITE_URL=https://www.orangecat.com
NEXT_PUBLIC_SITE_NAME=OrangeCat
```

### Development

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=OrangeCat (Dev)
```

## Deployment Checklist

### DNS Setup
- ✓ orangecat.com redirects to www.orangecat.com
- ✓ www.orangecat.com assigned to main branch
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
- https://www.orangecat.com (production)
- https://orangecat.vercel.app (preview)

### Checklist
- [ ] Website accessible at https://www.orangecat.com
- [ ] Redirect from https://orangecat.com working
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