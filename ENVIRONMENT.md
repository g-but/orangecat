# Environment Variables Management for Palfare

This document describes how environment variables are managed in the Palfare project.

## Overview

Palfare uses environment variables for configuration and sensitive data. We maintain environment variables in multiple places:

1. **Local development**: `.env.local` (never committed to Git)
2. **Vercel deployment**: Environment variables in Vercel dashboard
3. **CI/CD pipeline**: GitHub Secrets for deployment

## Required Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|:--------:|---------|
| `NEXT_PUBLIC_BITCOIN_ADDRESS` | Bitcoin wallet address for donations | ✅ | - |
| `NEXT_PUBLIC_LIGHTNING_ADDRESS` | Lightning address for donations | ✅ | - |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | ✅ | `https://palfare.vercel.app` |
| `NEXT_PUBLIC_SITE_NAME` | Site name | ✅ | `Palfare` |
| `NODE_ENV` | Environment name | ✅ | `development` or `production` |
| `NEXT_PUBLIC_BLOCKCYPHER_API_KEY` | BlockCypher API key | ❌ | - |

## Environment Synchronization

We provide tools to synchronize environment variables between local development and Vercel:

### Pull from Vercel to Local

```bash
npm run env:pull
```

This will pull all environment variables from Vercel to your local `.env.local` file.

### Push from Local to Vercel

```bash
npm run env:push
```

This will push your local `.env.local` environment variables to Vercel.

## Setting up Environment Variables

### For Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your environment variables
3. Never commit `.env.local` to Git

```bash
cp .env.example .env.local
```

### For GitHub Actions

Add the following secrets to your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel API token
- `NEXT_PUBLIC_BITCOIN_ADDRESS`: Your Bitcoin address
- `NEXT_PUBLIC_LIGHTNING_ADDRESS`: Your Lightning address
- `NEXT_PUBLIC_SITE_URL`: Your site URL
- `NEXT_PUBLIC_SITE_NAME`: Your site name

### For Vercel Deployment

Environment variables are managed through:

1. The Vercel dashboard
2. Our `npm run env:push` script
3. CI/CD pipeline

## Environment Variables in CI/CD

During CI/CD, we create a `.env.production` file from GitHub Secrets and use it for the build.

## Best Practices

1. Keep sensitive information in environment variables, not in code
2. Use `NEXT_PUBLIC_` prefix for variables that need to be accessible in the browser
3. Regularly sync environment variables between local and production
4. Document new environment variables in this file
5. Update `.env.example` when adding new variables 