# Environment Variables

This document describes all environment variables used in the OrangeCat application.

## Required Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL | ✅ | `https://orangecat.ch` |
| `NEXT_PUBLIC_SITE_NAME` | Site name | ✅ | `OrangeCat` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ | `xxx` |
| `BITCOIN_NETWORK` | Bitcoin network (mainnet/testnet) | ✅ | `mainnet` |
| `LIGHTNING_NODE_URL` | Lightning node URL | ✅ | `https://xxx.lightning.node` |
| `LIGHTNING_MACAROON` | Lightning macaroon | ✅ | `xxx` |
| `LIGHTNING_TLS_CERT` | Lightning TLS certificate | ✅ | `xxx` |

## Optional Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | ❌ | `development` |
| `NEXT_PUBLIC_APP_URL` | Application URL | ❌ | `http://localhost:3000` |

## Development Values

For local development, you can use these values:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=OrangeCat (Dev)
NODE_ENV=development
BITCOIN_NETWORK=testnet
```

## Production Values

For production, ensure these values are set:

```env
NEXT_PUBLIC_SITE_URL=https://orangecat.ch
NEXT_PUBLIC_SITE_NAME=OrangeCat
NODE_ENV=production
BITCOIN_NETWORK=mainnet
```

## Development Setup

1. Copy `.env.example` to `.env.local`
2. Update variables with your local values
3. Never commit `.env.local` to version control

## Production Setup

1. Set variables in Vercel dashboard
2. Mark sensitive variables as "Sensitive"
3. Enable "Automatically expose System Environment Variables"

## Security Notes

- Never commit sensitive data to version control
- Use environment variables for all secrets
- Keep `.env.local` in `.gitignore`
- Use strong, unique values for production

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