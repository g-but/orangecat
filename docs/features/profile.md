# Profile Feature Documentation

## Overview
The profile feature allows users to create and manage their profiles for accepting Bitcoin donations. It includes both Bitcoin and Lightning address support.

## Architecture

### Components
- `ProfileContext`: Manages global profile state
- `CreateProfileForm`: Handles profile creation
- `ProfilePage`: Displays profile creation UI

### Data Flow
1. User authenticates
2. Profile context checks for existing profile
3. If no profile exists, user is redirected to create profile
4. User fills out form with validation
5. Profile is created in Supabase
6. User is redirected to dashboard

## Technical Details

### Profile Schema
```typescript
interface Profile {
  id: string
  username: string | null
  display_name: string | null
  bio?: string
  avatar_url?: string
  banner_url?: string
  website?: string
  bitcoin_address?: string
  lightning_address?: string
  created_at: string
  updated_at: string
}
```

### Validation Rules
- **Username**: Required, 3-30 characters, alphanumeric with underscores/hyphens only. Must be unique.
- **Name (display_name)**: Optional, max 100 characters. Displayed on profile. Auto-populated from username if not provided.
- **Bio**: Optional, max 500 characters
- **Location**: Optional, max 100 characters
- **Bitcoin Address**: Optional, must be valid format
- **Lightning Address**: Optional, must be valid email format
- **Website**: Optional, must be valid URL
- **Avatar URL**: Optional, must be valid URL
- **Banner URL**: Optional, must be valid URL

### Security Considerations
- All profile operations require authentication
- User can only access their own profile
- Sensitive data is not stored in profile

## Usage Examples

### Creating a Profile
```typescript
const { createProfile } = useProfile()
await createProfile({
  username: 'johndoe',
  display_name: 'John Doe',
  bitcoin_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
})
```

### Accessing Profile Data
```typescript
const { profile, loading, error } = useProfile()
```

## Error Handling
- Form validation errors are displayed inline
- API errors are shown in a global error message
- Loading states are properly handled

## Testing
- Unit tests for form validation
- Integration tests for Supabase operations
- E2E tests for complete flow 