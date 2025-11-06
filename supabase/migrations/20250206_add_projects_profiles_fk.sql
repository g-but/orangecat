-- Add foreign key relationship between projects.user_id and profiles.id
-- This will enable Supabase to automatically join these tables

-- First, check if the foreign key already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_user_id_fkey'
        AND table_name = 'projects'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.projects
        ADD CONSTRAINT projects_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;

        RAISE NOTICE 'Foreign key constraint projects_user_id_fkey created successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint projects_user_id_fkey already exists';
    END IF;
END $$;

-- Create an index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

COMMENT ON CONSTRAINT projects_user_id_fkey ON public.projects IS
'Foreign key to profiles table - ensures project creators have valid profiles';
