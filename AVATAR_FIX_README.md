# Fix Avatar Upload and Profile Update Issues

## Problem
Your Supabase `profiles` table is missing the `avatar_url` column, which is preventing avatar uploads and causing profile update issues.

## Current Status
- Profile updates work for: username, display_name, bio, bitcoin_address
- Avatar uploads fail because the `avatar_url` column doesn't exist
- The app has been updated to handle this gracefully with warning messages

## Solution Steps

### Step 1: Add the Missing Column
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and run the SQL from `scripts/add-avatar-column.sql`:

```sql
-- Add avatar_url column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'avatar_url'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    RAISE NOTICE 'avatar_url column added to profiles table';
  ELSE
    RAISE NOTICE 'avatar_url column already exists in profiles table';
  END IF;
END $$;
```

### Step 2: Verify the Column
Run this query to check your profiles table structure:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

You should see `avatar_url` listed as a `text` column.

### Step 3: Test the Fix
1. Go to your profile page in the app
2. Try uploading an avatar image
3. Update your profile information
4. Both should work without warnings now

## What Was Fixed

### Profile Service (`src/services/profileService.ts`)
- Added graceful handling for missing database columns
- Shows helpful warning messages when columns are missing
- Profile updates continue to work even if avatar_url column is missing

### Profile Page (`src/app/(authenticated)/profile/page.tsx`)
- Displays warning messages when database schema issues are detected
- Better user feedback for partial success scenarios

### Avatar Upload API (`src/app/api/avatar/route.ts`)
- Already properly configured for Supabase Storage
- Creates avatars bucket automatically if missing
- Processes and optimizes images using Sharp

## How Avatar Upload Works

1. **Image Processing**: Images are resized to 512x512px and converted to WebP format
2. **Storage**: Uploaded to Supabase Storage in the `avatars` bucket
3. **Database**: The public URL is saved to the `avatar_url` column in profiles table
4. **Display**: The avatar is displayed throughout the app using the stored URL

## Storage Configuration

The avatar upload system:
- Creates the `avatars` bucket automatically
- Sets public access for avatar images
- Optimizes images for web delivery
- Handles various image formats (JPEG, PNG, WebP, GIF)
- Limits file size to 10MB

## Troubleshooting

### If avatar upload still doesn't work:
1. Check Supabase Storage is enabled in your project
2. Verify the `avatars` bucket exists and is public
3. Check browser console for any error messages
4. Ensure you have proper Row Level Security policies

### If profile updates don't save:
1. Check the browser console for error messages
2. Verify your user authentication is working
3. Check Supabase logs in the dashboard

## Next Steps

After adding the `avatar_url` column, your avatar upload and profile update functionality should work perfectly. The app will automatically:

1. Upload and process avatar images
2. Save the avatar URL to your profile
3. Display your avatar throughout the app
4. Handle all profile updates correctly

If you need to add more profile fields in the future, you can follow the same pattern of adding the column to the database and updating the `ProfileFormData` type in `src/types/database.ts`. 