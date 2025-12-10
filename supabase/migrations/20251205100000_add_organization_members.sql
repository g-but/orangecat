-- Organization Members System
-- Adds member management to organizations with roles and permissions

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'removed')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  permissions JSONB DEFAULT '{
    "can_invite_members": false,
    "can_manage_treasury": false,
    "can_create_proposals": true,
    "can_vote": true,
    "can_manage_projects": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Ensure one owner per organization
  CONSTRAINT unique_owner_per_org EXCLUDE (organization_id WITH =) WHERE (role = 'owner'),

  -- Unique membership per user per organization
  UNIQUE(organization_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON public.organization_members(status);

-- Updated_at trigger
CREATE TRIGGER set_org_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Default permissions based on role
CREATE OR REPLACE FUNCTION update_member_permissions()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.role
    WHEN 'owner' THEN
      NEW.permissions = '{
        "can_invite_members": true,
        "can_manage_treasury": true,
        "can_create_proposals": true,
        "can_vote": true,
        "can_manage_projects": true
      }'::jsonb;
    WHEN 'admin' THEN
      NEW.permissions = '{
        "can_invite_members": true,
        "can_manage_treasury": true,
        "can_create_proposals": true,
        "can_vote": true,
        "can_manage_projects": true
      }'::jsonb;
    WHEN 'member' THEN
      NEW.permissions = '{
        "can_invite_members": false,
        "can_manage_treasury": false,
        "can_create_proposals": true,
        "can_vote": true,
        "can_manage_projects": false
      }'::jsonb;
    ELSE
      NEW.permissions = '{
        "can_invite_members": false,
        "can_manage_treasury": false,
        "can_create_proposals": true,
        "can_vote": true,
        "can_manage_projects": false
      }'::jsonb;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_permissions_trigger
  BEFORE INSERT OR UPDATE OF role ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION update_member_permissions();

-- RLS Policies
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organization members can view their own membership and organization members
CREATE POLICY "org_members_read" ON public.organization_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Only owners and admins can manage memberships
CREATE POLICY "org_members_write" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Users can update their own membership status (for accepting invitations)
CREATE POLICY "org_members_update_own" ON public.organization_members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to add organization creator as owner
CREATE OR REPLACE FUNCTION add_organization_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
  VALUES (NEW.id, NEW.created_by, 'owner', 'active', NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_org_creator_as_owner
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION add_organization_creator_as_owner();














