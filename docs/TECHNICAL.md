# Technical Documentation

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication routes
│   ├── profile/          # Profile pages
│   └── funding/          # Funding pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── funding/          # Funding page components
│   ├── profile/          # Profile components
│   └── ui/               # Reusable UI components
├── config/               # Configuration files
│   ├── site.ts          # Site configuration
│   └── bitcoin.ts       # Bitcoin configuration
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication context
│   └── ThemeContext.tsx # Theme context
├── features/            # Feature-specific code
│   ├── auth/           # Authentication feature
│   ├── profile/        # Profile feature
│   └── funding/        # Funding feature
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication hook
│   └── useProfile.ts   # Profile hook
├── lib/               # Utility libraries
│   ├── supabase/      # Supabase-related code
│   └── bitcoin/       # Bitcoin-related code
├── services/          # Business logic services
│   ├── auth.ts        # Authentication service
│   ├── profile.ts     # Profile service
│   └── funding.ts     # Funding service
├── types/             # TypeScript type definitions
│   ├── auth.ts        # Authentication types
│   ├── profile.ts     # Profile types
│   └── funding.ts     # Funding types
├── utils/             # Utility functions
│   ├── api.ts         # API utilities
│   └── validation.ts  # Validation utilities
└── __tests__/         # Test files
    ├── components/    # Component tests
    ├── hooks/         # Hook tests
    └── utils/         # Utility tests
```

## Key Components

### Authentication
- Implemented using Supabase Auth
- `useAuth` hook for authentication state management
- Protected routes using middleware
- Session persistence and automatic refresh

### Profile Management
- Complete CRUD operations through Supabase
- Type-safe operations with TypeScript
- Profile validation and sanitization
- Avatar upload and management

### Funding System
- Bitcoin and Lightning Network integration
- Transaction tracking and verification
- Goal tracking and progress updates
- Donation history and analytics

### Testing Infrastructure
- Jest for unit testing
- React Testing Library for component testing
- Test coverage reporting
- CI/CD integration

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

4. Start development server:
   ```bash
   npm run dev
   ```

## Testing

The project uses Jest and React Testing Library for testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test/file

# Generate coverage report
npm run test:coverage
```

## Deployment

The application is deployed on Vercel with the following configuration:
- Automatic deployments from main branch
- Environment variables managed in Vercel dashboard
- Production URL: https://orangecat.ch
- Staging environment available
- Automated testing before deployment 