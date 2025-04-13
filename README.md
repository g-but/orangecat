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
- Supabase account
- Bitcoin Lightning Network account

### Environment Variables
Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Set up Supabase:
   - Create a new project
   - Set up authentication
   - Create necessary tables
4. Set up Bitcoin Lightning Network:
   - Create a Bitcoin Lightning Network account
   - Configure necessary parameters

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

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout

### Profiles
- GET /api/profiles/:id - Get profile
- POST /api/profiles - Create profile
- PUT /api/profiles/:id - Update profile

### Funding Pages
- GET /api/funding/:id - Get funding page
- POST /api/funding - Create funding page
- PUT /api/funding/:id - Update funding page
- POST /api/funding/:id/donate - Process donation

## Development Workflow
1. Create feature branch
2. Implement changes
3. Run tests
4. Create pull request
5. Code review
6. Merge to main

## Testing
Run tests with:
```bash
npm test
# or
yarn test
```

## Deployment
The application is deployed on Vercel. Push to main branch to trigger deployment.

## Contributing
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

## License
MIT
