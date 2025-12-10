-- Add 'circle' as an organization type for trust-based communities
-- This integrates circles functionality into the organizations system

ALTER TABLE public.organizations
DROP CONSTRAINT organizations_type_check;

ALTER TABLE public.organizations
ADD CONSTRAINT organizations_type_check
CHECK (type IN ('dao', 'company', 'nonprofit', 'community', 'cooperative', 'foundation', 'collective', 'guild', 'syndicate', 'circle'));













