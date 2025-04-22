# Database Migrations

This directory contains SQL migration files that define the database schema and its evolution over time. Each migration file represents a specific change to the database structure.

## File Structure

- `20240324000000_combined_setup.sql`: The main migration file that sets up the initial database schema, including:
  - Enabling UUID extension
  - Creating tables (profiles, funding_pages, transactions)
  - Setting up Row Level Security (RLS) policies
  - Creating triggers and functions

## Migration Process

1. Each migration file is named with a timestamp prefix (YYYYMMDDHHMMSS) to ensure they are applied in the correct order.
2. Migrations are applied using the Supabase CLI or through direct SQL execution.
3. Once a migration is applied, it should not be modified to maintain database consistency.

## Current Schema

The database consists of three main tables:

1. **profiles**
   - Stores user profile information
   - Links to auth.users via user_id
   - Contains optional fields like username, display_name, website, etc.

2. **funding_pages**
   - Stores crowdfunding campaign information
   - Links to profiles via user_id
   - Tracks campaign status, goals, and current funding

3. **transactions**
   - Records donations and payments
   - Links to funding_pages and users
   - Tracks transaction status and amounts

## Security

- Row Level Security (RLS) is enabled on all tables
- Policies are defined to control access based on user authentication
- Users can only access and modify their own data

## Usage

To apply migrations:

```bash
# Using Supabase CLI
npx supabase db push

# Or run the migration script directly
npx tsx src/scripts/apply-migrations.ts
```

## Best Practices

1. Always create new migration files for schema changes
2. Never modify existing migration files
3. Test migrations in a development environment before applying to production
4. Keep migrations atomic and focused on a single change
5. Document any complex changes in the migration file comments 