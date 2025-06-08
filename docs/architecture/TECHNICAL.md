# Technical Documentation

**Last Updated**: June 6, 2025  
**Status**: 🛡️ Security Hardened | 📊 Test Coverage Critical Gap (4.9%)

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with centralized theme system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (security hardened)
- **Bitcoin Integration**: Mempool API
- **State Management**: Zustand (auth & campaigns)
- **Testing**: Jest, React Testing Library
- **Security**: Multi-layer validation, celebrity impersonation prevention
- **Logging**: Structured logging system (production-safe)

## Security Status

✅ **SECURE** - All critical vulnerabilities fixed (June 2025):
- File upload authorization bypass - **FIXED**
- Celebrity impersonation prevention - **IMPLEMENTED**
- Console.log data exposure - **ELIMINATED**
- Auth state inconsistencies - **RESOLVED**

**Security Test Coverage**: 77 comprehensive security tests

## Test Coverage Status

⚠️ **CRITICAL GAP** - Current test coverage: **4.9%** (Target: 80%)
- **Security Tests**: Excellent (77 tests)
- **Component Tests**: Minimal coverage
- **Integration Tests**: None
- **Service Tests**: None

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── __tests__/     # API security tests (69 tests)
│   ├── (authenticated)/   # Protected pages
│   ├── profile/          # Profile pages
│   ├── auth/             # Authentication pages
│   ├── funding/          # Funding pages
│   └── __tests__/         # Page tests
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── funding/          # Funding page components
│   ├── profile/          # Profile components
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication hook (21 tests)
│   └── __tests__/        # Hook tests
├── stores/               # State management (Zustand)
│   ├── campaignStore.ts  # Campaign state management
│   └── __tests__/        # Store tests
├── services/             # Business logic services
│   ├── supabase/         # Supabase client & services
│   ├── featured.ts       # Featured campaigns
│   └── transparency.ts   # Transparency scoring
├── utils/                # Utility functions
│   ├── validation.ts     # Input validation (security hardened)
│   ├── verification.ts   # Celebrity impersonation prevention
│   ├── logger.ts         # Structured logging system
│   └── bitcoin.ts        # Bitcoin address validation
├── types/                # TypeScript type definitions
└── __tests__/           # Test files
    ├── components/      # Component tests (NEEDED)
    ├── hooks/          # Hook tests
    └── utils/          # Utility tests
```

## Key Components

### Authentication (✅ Security Hardened)
- Implemented using Supabase Auth with enhanced security
- `useAuth` hook for authentication state management (21 tests)
- Protected routes using middleware
- Session persistence and automatic refresh
- **Security**: Auth state inconsistency fixes implemented

### Profile Management (✅ Security Hardened)
- Complete CRUD operations through Supabase
- Type-safe operations with TypeScript
- **Security**: Enhanced profile validation and sanitization
- **Security**: Celebrity impersonation prevention (25 tests)
- **Security**: Rate limiting for abuse prevention
- Avatar upload with security validation

### File Upload System (✅ Security Hardened)
- **Security**: Mandatory user authentication
- **Security**: Magic byte validation for file types
- **Security**: Malicious content scanning
- **Security**: Automatic metadata stripping for privacy
- **Security**: Path traversal attack prevention
- Comprehensive security testing (9 tests)

### Funding System
- Bitcoin and Lightning Network integration
- Transaction tracking and verification
- Goal tracking and progress updates
- Donation history and analytics
- **Security**: Enhanced Bitcoin address validation

### Testing Infrastructure (⚠️ CRITICAL GAP)
- Jest for unit testing
- React Testing Library for component testing
- **Current Coverage**: 4.9% (Need 80% for production)
- **Security Tests**: Excellent (77 tests)
- **Component Tests**: Critical gap
- **Integration Tests**: Critical gap

### Celebrity Impersonation Prevention (✅ NEW)
- 75+ protected celebrity/brand usernames
- Character substitution attack detection
- Unicode lookalike character prevention
- Bio content analysis for authority claims
- Comprehensive testing (25 tests)

### Logging System (✅ Security Hardened)
- Structured logging with proper log levels
- Production-safe (no sensitive data exposure)
- Replaced 95%+ of console.log statements
- Development-only console statements for debugging

## Environment Variables

Required environment variables:
```env
# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=OrangeCat (Dev)
NODE_ENV=development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ohkueislstxomdjavyhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Bitcoin Configuration
NEXT_PUBLIC_BITCOIN_ADDRESS=bitcoin:bc1qtkxw47wqlld9t0w7sujycl4mrmc90phypjygf6
NEXT_PUBLIC_LIGHTNING_ADDRESS=orangecat@getalby.com
BITCOIN_NETWORK=mainnet
```

## Database Schema

### Users Table
```sql
create table users (
  id uuid references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
```

### Profiles Table
```sql
create table profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  bio text,
  website text,
  social_links jsonb,
  bitcoin_address text,
  lightning_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
```

### Funding Pages Table
```sql
create table funding_pages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  goal_amount decimal,
  current_amount decimal default 0,
  status text default 'active',
  bitcoin_address text,
  lightning_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
```

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/g-but/orangecat.git
   cd orangecat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Start development server (recommended):
   ```bash
   npm run fresh:start
   ```

5. Run tests to verify setup:
   ```bash
   npm test
   ```

## Testing

The project uses Jest and React Testing Library for testing:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test/file

# Run only security tests
npm test -- --testPathPattern="security|verification|validation"
```

### Test Coverage Goals
- **Current**: 4.9% (CRITICAL - need improvement)
- **Target**: 80% before production
- **Security Coverage**: Excellent (77 tests)
- **Priority**: Component and integration tests

## Deployment

The application is deployed on Vercel with the following configuration:
- Automatic deployments from main branch
- Environment variables managed in Vercel dashboard
- Production URL: https://orangecat.ch
- Staging environment available
- Automated testing before deployment
- **Security**: All critical vulnerabilities fixed before deployment

## Architecture Priorities

### ✅ COMPLETED
- Critical security vulnerabilities fixed
- Celebrity impersonation prevention
- File upload security hardening
- Auth state management improvements
- Console.log production exposure eliminated

### 🚨 CRITICAL NEXT STEPS
1. **Test Coverage** (Essential for production)
   - Increase from 4.9% to 80%
   - Add component testing
   - Add integration testing
   - Add service layer testing

2. **TypeScript Improvements**
   - Replace 200+ `any` types with proper interfaces
   - Improve type safety

3. **Architecture Refactoring**
   - Split large files (supabase/client.ts: 1076 lines)
   - Extract duplicate code (600+ lines)
   - Break down oversized components

## Best Practices

- **Security First**: All major vulnerabilities have been fixed
- **Testing**: Comprehensive test coverage required before production
- **Type Safety**: Avoid `any` types, use proper TypeScript interfaces
- **File Structure**: Keep components under 200 lines
- **State Management**: Use Zustand for complex state (campaigns, auth)
- **Logging**: Use structured logger, never console.log in production
- **Validation**: Multi-layer security validation for all inputs
- **Documentation**: Keep documentation updated with current state 