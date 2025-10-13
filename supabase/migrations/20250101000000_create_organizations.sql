-- =====================================================================
-- ORGANIZATIONS SCHEMA - FOR BITCOIN CROWDFUNDING PLATFORM
-- =====================================================================
-- This migration creates all organization-related tables and configurations
-- =====================================================================

-- =====================================================================
-- ORGANIZATIONS TABLE - MAIN ORGANIZATION ENTITY
-- =====================================================================

create table if not exists public.organizations (
  -- Core identification
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references auth.users on delete cascade not null,

  -- Basic information
  name text not null,
  slug text unique not null,
  description text,

  -- Media and branding
  avatar_url text,
  banner_url text,
  website_url text,

  -- Organization details
  type text not null check (type in ('dao', 'company', 'nonprofit', 'community', 'cooperative', 'foundation', 'collective', 'guild', 'syndicate')),
  category text,
  tags text[] default array[]::text[],

  -- Governance
  governance_model text default 'hierarchical' check (governance_model in ('hierarchical', 'flat', 'democratic', 'consensus', 'liquid_democracy', 'quadratic_voting', 'stake_weighted', 'reputation_based')),

  -- Treasury and funding
  treasury_address text,
  treasury_balance numeric(20,8) default 0,

  -- Visibility and access
  is_public boolean default true,
  requires_approval boolean default true,

  -- Contact and metadata
  contact_info jsonb default '{}'::jsonb,
  settings jsonb default '{}'::jsonb,

  -- Statistics
  member_count integer default 0,
  campaign_count integer default 0,
  total_funding numeric(20,8) default 0,
  trust_score numeric(5,2) default 0,

  -- Status and temporal
  status text default 'active' check (status in ('active', 'inactive', 'suspended', 'dissolved')),
  founded_at timestamp with time zone,
  dissolved_at timestamp with time zone,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================================
-- MEMBERSHIPS TABLE - USER MEMBERSHIPS IN ORGANIZATIONS
-- =====================================================================

create table if not exists public.memberships (
  -- Core identification
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations on delete cascade not null,
  profile_id uuid references auth.users on delete cascade not null,

  -- Role and status
  role text not null check (role in ('owner', 'admin', 'moderator', 'member', 'guest')),
  status text default 'active' check (status in ('active', 'inactive', 'suspended', 'banned')),

  -- Member details
  title text,
  bio text,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Permissions
  permissions jsonb default '{
    "manage_members": false,
    "invite_members": false,
    "manage_settings": false,
    "manage_treasury": false,
    "create_proposals": false,
    "moderate_content": false,
    "view_analytics": false
  }'::jsonb,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure unique membership per user per organization
  unique(organization_id, profile_id)
);

-- =====================================================================
-- ORGANIZATION_PROPOSALS TABLE - GOVERNANCE PROPOSALS
-- =====================================================================

create table if not exists public.organization_proposals (
  -- Core identification
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations on delete cascade not null,
  proposer_id uuid references auth.users on delete cascade not null,

  -- Proposal details
  title text not null,
  description text not null,
  proposal_type text not null check (proposal_type in ('governance', 'funding', 'membership', 'policy', 'other')),

  -- Voting configuration
  voting_method text default 'simple_majority' check (voting_method in ('simple_majority', 'super_majority', 'consensus', 'quadratic')),
  voting_deadline timestamp with time zone,
  minimum_quorum integer default 1,

  -- Status
  status text default 'pending' check (status in ('pending', 'active', 'passed', 'failed', 'cancelled')),

  -- Results
  votes_for integer default 0,
  votes_against integer default 0,
  votes_abstain integer default 0,

  -- Metadata
  metadata jsonb default '{}'::jsonb,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================================
-- ORGANIZATION_VOTES TABLE - VOTES ON PROPOSALS
-- =====================================================================

create table if not exists public.organization_votes (
  -- Core identification
  id uuid default uuid_generate_v4() primary key,
  proposal_id uuid references public.organization_proposals on delete cascade not null,
  voter_id uuid references auth.users on delete cascade not null,

  -- Vote details
  vote_type text not null check (vote_type in ('for', 'against', 'abstain')),
  voting_power integer default 1,
  vote_weight numeric(10,2) default 1.0,

  -- Metadata
  metadata jsonb default '{}'::jsonb,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one vote per user per proposal
  unique(proposal_id, voter_id)
);

-- =====================================================================
-- ORGANIZATION_ANALYTICS TABLE - ORGANIZATION METRICS
-- =====================================================================

create table if not exists public.organization_analytics (
  -- Core identification
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations on delete cascade not null,

  -- Analytics data
  metric_name text not null,
  metric_value numeric(20,8) not null,
  metric_type text not null check (metric_type in ('counter', 'gauge', 'histogram')),

  -- Time period
  time_period text not null check (time_period in ('hourly', 'daily', 'weekly', 'monthly', 'yearly')),
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,

  -- Metadata
  metadata jsonb default '{}'::jsonb,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure unique metric per organization per period
  unique(organization_id, metric_name, time_period, period_start)
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all organization tables
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.organization_proposals enable row level security;
alter table public.organization_votes enable row level security;
alter table public.organization_analytics enable row level security;

-- =====================================================================
-- ORGANIZATIONS RLS POLICIES
-- =====================================================================

-- Public organizations are viewable by everyone
create policy "Public organizations are viewable by everyone"
  on public.organizations for select
  using (is_public = true or exists (
    select 1 from public.memberships
    where organization_id = organizations.id
    and profile_id = auth.uid()
    and status = 'active'
  ));

-- Users can create organizations
create policy "Users can create organizations"
  on public.organizations for insert
  with check (profile_id = auth.uid());

-- Organization owners and admins can update their organizations
create policy "Organization owners and admins can update their organizations"
  on public.organizations for update
  using (exists (
    select 1 from public.memberships
    where organization_id = organizations.id
    and profile_id = auth.uid()
    and role in ('owner', 'admin')
    and status = 'active'
  ))
  with check (exists (
    select 1 from public.memberships
    where organization_id = organizations.id
    and profile_id = auth.uid()
    and role in ('owner', 'admin')
    and status = 'active'
  ));

-- Organization owners can delete their organizations
create policy "Organization owners can delete their organizations"
  on public.organizations for delete
  using (exists (
    select 1 from public.memberships
    where organization_id = organizations.id
    and profile_id = auth.uid()
    and role = 'owner'
    and status = 'active'
  ));

-- =====================================================================
-- MEMBERSHIPS RLS POLICIES
-- =====================================================================

-- Users can view memberships for organizations they're members of or public organizations
create policy "Users can view memberships for accessible organizations"
  on public.memberships for select
  using (exists (
    select 1 from public.organizations
    where id = organization_id
    and (is_public = true or exists (
      select 1 from public.memberships m2
      where m2.organization_id = organizations.id
      and m2.profile_id = auth.uid()
      and m2.status = 'active'
    ))
  ));

-- Users can create their own memberships (invitation flow)
create policy "Users can create their own memberships"
  on public.memberships for insert
  with check (profile_id = auth.uid());

-- Users can update their own memberships
create policy "Users can update their own memberships"
  on public.memberships for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Organization admins can manage memberships
create policy "Organization admins can manage memberships"
  on public.memberships for all
  using (exists (
    select 1 from public.memberships m2
    where m2.organization_id = memberships.organization_id
    and m2.profile_id = auth.uid()
    and m2.role in ('owner', 'admin')
    and m2.status = 'active'
  ))
  with check (exists (
    select 1 from public.memberships m2
    where m2.organization_id = memberships.organization_id
    and m2.profile_id = auth.uid()
    and m2.role in ('owner', 'admin')
    and m2.status = 'active'
  ));

-- =====================================================================
-- PROPOSALS RLS POLICIES
-- =====================================================================

-- Users can view proposals for organizations they're members of
create policy "Users can view proposals for their organizations"
  on public.organization_proposals for select
  using (exists (
    select 1 from public.memberships
    where organization_id = organization_proposals.organization_id
    and profile_id = auth.uid()
    and status = 'active'
  ));

-- Members can create proposals for their organizations
create policy "Members can create proposals for their organizations"
  on public.organization_proposals for insert
  with check (proposer_id = auth.uid() and exists (
    select 1 from public.memberships
    where organization_id = organization_proposals.organization_id
    and profile_id = auth.uid()
    and status = 'active'
  ));

-- Proposers and admins can update their proposals
create policy "Proposers and admins can update their proposals"
  on public.organization_proposals for update
  using (proposer_id = auth.uid() or exists (
    select 1 from public.memberships
    where organization_id = organization_proposals.organization_id
    and profile_id = auth.uid()
    and role in ('owner', 'admin')
    and status = 'active'
  ))
  with check (proposer_id = auth.uid() or exists (
    select 1 from public.memberships
    where organization_id = organization_proposals.organization_id
    and profile_id = auth.uid()
    and role in ('owner', 'admin')
    and status = 'active'
  ));

-- =====================================================================
-- VOTES RLS POLICIES
-- =====================================================================

-- Users can view votes for proposals in organizations they're members of
create policy "Users can view votes for their organizations"
  on public.organization_votes for select
  using (exists (
    select 1 from public.organization_proposals op
    join public.memberships m on m.organization_id = op.organization_id
    where op.id = organization_votes.proposal_id
    and m.profile_id = auth.uid()
    and m.status = 'active'
  ));

-- Users can vote on proposals in organizations they're members of
create policy "Users can vote on proposals in their organizations"
  on public.organization_votes for insert
  with check (voter_id = auth.uid() and exists (
    select 1 from public.organization_proposals op
    join public.memberships m on m.organization_id = op.organization_id
    where op.id = organization_votes.proposal_id
    and m.profile_id = auth.uid()
    and m.status = 'active'
  ));

-- Users can update their own votes
create policy "Users can update their own votes"
  on public.organization_votes for update
  using (voter_id = auth.uid())
  with check (voter_id = auth.uid());

-- =====================================================================
-- ANALYTICS RLS POLICIES
-- =====================================================================

-- Organization admins can view analytics
create policy "Organization admins can view analytics"
  on public.organization_analytics for select
  using (exists (
    select 1 from public.memberships
    where organization_id = organization_analytics.organization_id
    and profile_id = auth.uid()
    and role in ('owner', 'admin')
    and status = 'active'
  ));

-- System can insert analytics (for automated tracking)
create policy "System can insert analytics"
  on public.organization_analytics for insert
  with check (true);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- Organizations indexes
create index if not exists idx_organizations_profile_id on public.organizations(profile_id);
create index if not exists idx_organizations_slug on public.organizations(slug);
create index if not exists idx_organizations_type on public.organizations(type);
create index if not exists idx_organizations_is_public on public.organizations(is_public);
create index if not exists idx_organizations_status on public.organizations(status);
create index if not exists idx_organizations_created_at on public.organizations(created_at);
create index if not exists idx_organizations_treasury_address on public.organizations(treasury_address) where treasury_address is not null;

-- Memberships indexes
create index if not exists idx_memberships_organization_id on public.memberships(organization_id);
create index if not exists idx_memberships_profile_id on public.memberships(profile_id);
create index if not exists idx_memberships_role on public.memberships(role);
create index if not exists idx_memberships_status on public.memberships(status);

-- Proposals indexes
create index if not exists idx_proposals_organization_id on public.organization_proposals(organization_id);
create index if not exists idx_proposals_proposer_id on public.organization_proposals(proposer_id);
create index if not exists idx_proposals_status on public.organization_proposals(status);
create index if not exists idx_proposals_voting_deadline on public.organization_proposals(voting_deadline);

-- Votes indexes
create index if not exists idx_votes_proposal_id on public.organization_votes(proposal_id);
create index if not exists idx_votes_voter_id on public.organization_votes(voter_id);

-- Analytics indexes
create index if not exists idx_analytics_organization_id on public.organization_analytics(organization_id);
create index if not exists idx_analytics_metric_name on public.organization_analytics(metric_name);
create index if not exists idx_analytics_time_period on public.organization_analytics(time_period, period_start);

-- =====================================================================
-- FUNCTIONS FOR AUTOMATION
-- =====================================================================

-- Function to update member count when memberships change
create or replace function public.update_organization_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.organizations
    set member_count = (
      select count(*) from public.memberships
      where organization_id = NEW.organization_id
      and status = 'active'
    )
    where id = NEW.organization_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.organizations
    set member_count = (
      select count(*) from public.memberships
      where organization_id = OLD.organization_id
      and status = 'active'
    )
    where id = OLD.organization_id;
    return OLD;
  elsif TG_OP = 'UPDATE' then
    update public.organizations
    set member_count = (
      select count(*) from public.memberships
      where organization_id = NEW.organization_id
      and status = 'active'
    )
    where id = NEW.organization_id;
    return NEW;
  end if;
  return null;
end;
$$ language plpgsql;

-- Trigger to automatically update member count
drop trigger if exists update_organization_member_count_trigger on public.memberships;
create trigger update_organization_member_count_trigger
  after insert or update or delete on public.memberships
  for each row execute procedure public.update_organization_member_count();

-- Function to calculate and update trust score
create or replace function public.update_organization_trust_score()
returns trigger as $$
begin
  update public.organizations
  set trust_score = (
    -- Base score from member count (0-20 points)
    least(20, (member_count * 2)) +

    -- Age bonus (0-10 points, max after 1 year)
    least(10, extract(days from (now() - created_at)) / 36.5) +

    -- Activity bonus based on recent proposals (0-20 points)
    least(20, (
      select coalesce(sum(
        case
          when created_at > now() - interval '30 days' then 10
          when created_at > now() - interval '90 days' then 5
          else 2
        end
      ), 0)
      from public.organization_proposals
      where organization_id = organizations.id
    )) +

    -- Treasury bonus for organizations with funding (0-20 points)
    case
      when treasury_balance > 0 then 20
      when treasury_balance > 0.001 then 10
      else 0
    end +

    -- Governance bonus for active organizations (0-20 points)
    least(20, (
      select count(*)
      from public.organization_proposals
      where organization_id = organizations.id
      and status in ('passed', 'failed')
      and created_at > now() - interval '90 days'
    ) * 4) +

    -- Transparency bonus for public organizations (0-10 points)
    case when is_public then 10 else 0 end
  )
  where id = NEW.organization_id or id = OLD.organization_id;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Trigger to automatically update trust score
drop trigger if exists update_organization_trust_score_trigger on public.memberships;
create trigger update_organization_trust_score_trigger
  after insert or update or delete on public.memberships
  for each row execute procedure public.update_organization_trust_score();

drop trigger if exists update_organization_trust_score_proposals_trigger on public.organization_proposals;
create trigger update_organization_trust_score_proposals_trigger
  after insert or update or delete on public.organization_proposals
  for each row execute procedure public.update_organization_trust_score();

-- =====================================================================
-- INITIAL DATA - CREATE ORANGE CAT ORGANIZATION (Optional)
-- =====================================================================
-- Note: This requires a user with email 'admin@orangecat.com' to exist
-- In production, create this organization through the application UI instead

-- Example of how to create the Orange Cat organization (commented out for safety):
/*
insert into public.organizations (
  profile_id,
  name,
  slug,
  description,
  type,
  category,
  governance_model,
  treasury_address,
  is_public,
  requires_approval,
  founded_at,
  created_at,
  updated_at
) values (
  (select id from auth.users where email = 'admin@orangecat.com' limit 1),
  'Orange Cat',
  'orange-cat',
  'Official Orange Cat organization for funding AI development tools including Claude Code and Cursor subscriptions. Support the development of this Bitcoin crowdfunding platform.',
  'foundation',
  'Technology',
  'hierarchical',
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  true,
  false,
  now(),
  now(),
  now()
) on conflict do nothing;
*/
