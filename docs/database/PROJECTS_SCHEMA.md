# Projects Table Schema

## Database Schema

The `projects` table is the unified entity for all Bitcoin fundraising initiatives.

### Required Columns

- `id` (uuid, PRIMARY KEY) - Unique project identifier
- `user_id` (uuid, NOT NULL) - References `auth.users(id)` - Owner of the project
- `title` (text, NOT NULL) - Project title/name
- `description` (text, NOT NULL) - Project description
- `status` (text, DEFAULT 'draft') - Project status: 'draft', 'active', 'paused'
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

### Optional Columns

- `goal_amount` (numeric(20,8), nullable) - Funding goal in base currency
- `currency` (text, DEFAULT 'SATS') - Currency: 'SATS', 'BTC', 'CHF', 'USD', 'EUR'
- `funding_purpose` (text, nullable) - Description of how funds will be used
- `bitcoin_address` (text, nullable) - Bitcoin address for receiving donations
- `lightning_address` (text, nullable) - Lightning address for receiving donations
- `category` (text, nullable) - Project category
- `tags` (text[], DEFAULT '{}') - Array of tags
- `raised_amount` (numeric(20,8), DEFAULT 0) - Total amount raised in base currency
- `contributor_count` (integer, DEFAULT 0) - Number of unique contributors

## Frontend Mapping

The frontend uses the `FundingPage` interface which expects:

- `total_funding` - Maps to `raised_amount` from database
- `current_amount` - Maps to `raised_amount` from database
- `raised_amount` - Direct mapping from database

The project store automatically maps these fields when loading projects.

## API Endpoints

### GET /api/projects/[id]

Returns a single project with profile information.

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "string",
    "description": "string",
    "goal_amount": number | null,
    "currency": "string",
    "raised_amount": number,
    "status": "string",
    "profiles": {
      "id": "uuid",
      "username": "string",
      "name": "string",
      "avatar_url": "string" | null
    },
    ...
  }
}
```

### POST /api/projects

Creates a new project.

**Request Body:**

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "goal_amount": number | null,
  "currency": "SATS" | "BTC" | "CHF" | "USD" | "EUR",
  "funding_purpose": "string" | null,
  "bitcoin_address": "string" | null,
  "lightning_address": "string" | null,
  "category": "string" | null,
  "tags": ["string"]
}
```

## Routes

### Frontend Routes

- `/project/[id]` - View project page (singular "project")
- `/project/[id]/edit` - Edit project page
- `/projects/create` - Create new project (plural "projects" for action)

**Important:** The view route uses singular `/project/` but create uses plural `/projects/create`.

## Status Values

- `draft` - Project is not yet published
- `active` - Project is live and accepting donations
- `paused` - Project is temporarily paused
- `completed` - Project has finished (optional)

## Field Mapping Summary

| Database Column     | Frontend Field    | Notes                         |
| ------------------- | ----------------- | ----------------------------- |
| `raised_amount`     | `raised_amount`   | Direct mapping                |
| `raised_amount`     | `total_funding`   | For FundingPage compatibility |
| `raised_amount`     | `current_amount`  | For FundingPage compatibility |
| `status = 'active'` | `isActive = true` | Computed in store             |
| `status = 'draft'`  | `isDraft = true`  | Computed in store             |

## Indexes

- `idx_projects_user_id` - User's projects lookup
- `idx_projects_status` - Filter by status
- `idx_projects_created_at` - Sort by creation date
- `idx_projects_raised_amount` - Sort by funding amount

## Migration

Run the migration `20250130_ensure_projects_schema_consistency.sql` to ensure all columns exist and have correct defaults.
