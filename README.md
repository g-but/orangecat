# OrangeCat - Bitcoin Donation Platform

## Project Overview
OrangeCat is a modern platform that enables users to create profiles and funding pages for Bitcoin donations. The platform allows individuals to showcase their work and raise funds for their projects or causes using Bitcoin.

## Tech Stack
- Frontend: Next.js 14 (App Router)
- Backend: Next.js API Routes
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- Styling: Tailwind CSS
- Payment Processing: Bitcoin Lightning Network
- Bitcoin Integration: Mainnet

## Current Configuration
- Supabase Project: ohkueislstxomdjavyhs
- Bitcoin Address: bc1qtkxw47wqlld9t0w7sujycl4mrmc90phypjygf6
- Lightning Address: orangecat@getalby.com
- Network: Bitcoin Mainnet

## Project Structure
```
orangecat/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication routes
│   ├── profile/          # Profile pages
│   └── funding/          # Funding pages
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/g-but/orangecat.git
   cd orangecat
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Environment Variables
All required environment variables are pre-configured in `.env.example`. For local development, copy them to `.env.local`:

```env
# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=OrangeCat (Dev)
NODE_ENV=development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ohkueislstxomdjavyhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Bitcoin Configuration
NEXT_PUBLIC_BITCOIN_ADDRESS=bitcoin:bc1qtkxw47wqlld9t0w7sujycl4mrmc90phypjygf6?message=OrangeCat%20Donation
NEXT_PUBLIC_LIGHTNING_ADDRESS=orangecat@getalby.com
BITCOIN_NETWORK=mainnet
```

### Supabase Setup
The project uses a pre-configured Supabase instance. No additional setup is required for development.

### Bitcoin Integration
- Mainnet Bitcoin address is configured
- Lightning address is set up with GetAlby
- To test transactions, use the configured addresses

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

## Development Workflow
1. Create feature branch from main
2. Implement changes
3. Run tests: `npm test`
4. Create pull request
5. Code review
6. Merge to main (triggers Vercel deployment)

## Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test/file
```

## Deployment
- The application is deployed on Vercel
- Main branch deployments are automatic
- Environment variables are managed in Vercel project settings
- Current production URL: https://orangecat.ch

## Contributing
1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Create pull request

## Troubleshooting
- If Supabase connection fails, verify environment variables
- For Bitcoin transaction issues, check network configuration
- For development issues, ensure Node.js version is 18+

## License
MIT
