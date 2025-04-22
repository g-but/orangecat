# OrangeCat - Crowdfunding Platform

A modern crowdfunding platform built with Next.js and Supabase.

## Features

- User authentication and profiles
- Create and manage funding campaigns
- Track donations and transactions
- Real-time updates
- Secure payment processing

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Row Level Security

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Update `.env.local` with your Supabase credentials
5. Run the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses three main tables:

1. **profiles**: User profile information
2. **funding_pages**: Crowdfunding campaign pages
3. **transactions**: Donation records

See [Database Schema Documentation](docs/database-schema.md) for detailed information.

## Development

### Database Migrations

Database changes are managed through Supabase migrations. To apply migrations:

```bash
npx supabase db push
```

### Type Generation

TypeScript types are generated from the database schema:

```bash
npx supabase gen types typescript --project-id your-project-id --schema public > src/types/database.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
