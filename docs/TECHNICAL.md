# Technical Documentation

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   │   └── DashboardCard.tsx
│   ├── sections/          # Page sections
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── CTA.tsx
│   └── ui/               # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── config/               # Configuration files
│   └── dashboard.ts      # Dashboard data configuration
├── hooks/               # Custom React hooks
│   └── useAuth.ts       # Authentication hook
├── lib/                # Utility libraries
│   └── supabase/       # Supabase-related code
│       ├── client.ts   # Supabase client configuration
│       └── profile.ts  # Profile service
└── types/              # TypeScript type definitions
    ├── dashboard.ts    # Dashboard types
    └── profile.ts      # Profile types
```

## Key Components

### Authentication
- `useAuth` hook manages authentication state
- Supabase handles user authentication
- Session management is automatic

### Profile Management
- Profile type includes all necessary fields
- CRUD operations through Supabase
- Type-safe operations with TypeScript

### UI Components
- Reusable components with consistent styling
- Type-safe props
- Accessibility support
- Responsive design

## Environment Variables

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

### Profiles Table
```sql
create table profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  full_name text not null,
  bio text,
  avatar_url text,
  website text,
  bitcoin_address text,
  lightning_address text,
  social_links jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Start development server:
   ```bash
   npm run dev
   ```

## Testing

Testing infrastructure needs to be set up. Planned tools:
- Jest for unit testing
- React Testing Library for component testing
- Cypress for end-to-end testing

## Deployment

The application is configured for Vercel deployment. Ensure all environment variables are set in the Vercel dashboard. 