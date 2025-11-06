-- Add foreign key constraint to enable automatic JOINs between projects and profiles
-- This must be run with sufficient privileges (service_role or postgres user)

-- Step 1: Check if any orphaned records exist (projects without matching profiles)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM projects p
    LEFT JOIN profiles pr ON p.user_id = pr.id
    WHERE p.user_id IS NOT NULL AND pr.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Warning: Found % orphaned projects (user_id does not match any profile)', orphaned_count;
        -- Optionally, you could log these or handle them
    ELSE
        RAISE NOTICE 'No orphaned projects found - safe to add foreign key';
    END IF;
END $$;

-- Step 2: Add the foreign key constraint
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE public.projects
ADD CONSTRAINT projects_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Step 4: Verify the constraint was created
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'projects'
    AND kcu.column_name = 'user_id';
