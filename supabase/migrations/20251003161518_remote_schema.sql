create extension if not exists "pgjwt" with schema "extensions";


create type "public"."governance_model_enum" as enum ('hierarchical', 'democratic', 'consensus', 'dao', 'other');

create type "public"."membership_role_enum" as enum ('owner', 'admin', 'moderator', 'member', 'guest');

create type "public"."membership_status_enum" as enum ('active', 'pending', 'suspended', 'left', 'banned');

create type "public"."organization_type_enum" as enum ('non_profit', 'business', 'dao', 'community', 'foundation', 'other');

drop trigger if exists "update_organization_member_count_trigger" on "public"."memberships";

drop trigger if exists "update_organization_trust_score_trigger" on "public"."memberships";

drop trigger if exists "update_organization_trust_score_proposals_trigger" on "public"."organization_proposals";

drop policy "Campaigns are viewable by everyone" on "public"."campaigns";

drop policy "Users can insert their own campaigns" on "public"."campaigns";

drop policy "Users can update own campaigns" on "public"."campaigns";

drop policy "Funding pages are viewable by everyone" on "public"."funding_pages";

drop policy "Users can create their own funding pages" on "public"."funding_pages";

drop policy "Organization admins can manage memberships" on "public"."memberships";

drop policy "Users can create their own memberships" on "public"."memberships";

drop policy "Users can update their own memberships" on "public"."memberships";

drop policy "Users can view memberships for accessible organizations" on "public"."memberships";

drop policy "Organization admins can view analytics" on "public"."organization_analytics";

drop policy "System can insert analytics" on "public"."organization_analytics";

drop policy "Members can create proposals for their organizations" on "public"."organization_proposals";

drop policy "Proposers and admins can update their proposals" on "public"."organization_proposals";

drop policy "Users can view proposals for their organizations" on "public"."organization_proposals";

drop policy "Users can update their own votes" on "public"."organization_votes";

drop policy "Users can view votes for their organizations" on "public"."organization_votes";

drop policy "Users can vote on proposals in their organizations" on "public"."organization_votes";

drop policy "Organization owners and admins can update their organizations" on "public"."organizations";

drop policy "Organization owners can delete their organizations" on "public"."organizations";

drop policy "Public organizations are viewable by everyone" on "public"."organizations";

drop policy "Users can create organizations" on "public"."organizations";

drop policy "Users can insert their own profile" on "public"."profiles";

drop policy "Users can update own profile" on "public"."profiles";

drop policy "Transactions are viewable by everyone" on "public"."transactions";

drop policy "Users can create transactions" on "public"."transactions";

drop policy "Users can update their own transactions" on "public"."transactions";

revoke delete on table "public"."campaigns" from "anon";

revoke insert on table "public"."campaigns" from "anon";

revoke references on table "public"."campaigns" from "anon";

revoke select on table "public"."campaigns" from "anon";

revoke trigger on table "public"."campaigns" from "anon";

revoke truncate on table "public"."campaigns" from "anon";

revoke update on table "public"."campaigns" from "anon";

revoke delete on table "public"."campaigns" from "authenticated";

revoke insert on table "public"."campaigns" from "authenticated";

revoke references on table "public"."campaigns" from "authenticated";

revoke select on table "public"."campaigns" from "authenticated";

revoke trigger on table "public"."campaigns" from "authenticated";

revoke truncate on table "public"."campaigns" from "authenticated";

revoke update on table "public"."campaigns" from "authenticated";

revoke delete on table "public"."campaigns" from "service_role";

revoke insert on table "public"."campaigns" from "service_role";

revoke references on table "public"."campaigns" from "service_role";

revoke select on table "public"."campaigns" from "service_role";

revoke trigger on table "public"."campaigns" from "service_role";

revoke truncate on table "public"."campaigns" from "service_role";

revoke update on table "public"."campaigns" from "service_role";

revoke delete on table "public"."funding_pages" from "anon";

revoke insert on table "public"."funding_pages" from "anon";

revoke references on table "public"."funding_pages" from "anon";

revoke select on table "public"."funding_pages" from "anon";

revoke trigger on table "public"."funding_pages" from "anon";

revoke truncate on table "public"."funding_pages" from "anon";

revoke update on table "public"."funding_pages" from "anon";

revoke delete on table "public"."funding_pages" from "authenticated";

revoke insert on table "public"."funding_pages" from "authenticated";

revoke references on table "public"."funding_pages" from "authenticated";

revoke select on table "public"."funding_pages" from "authenticated";

revoke trigger on table "public"."funding_pages" from "authenticated";

revoke truncate on table "public"."funding_pages" from "authenticated";

revoke update on table "public"."funding_pages" from "authenticated";

revoke delete on table "public"."funding_pages" from "service_role";

revoke insert on table "public"."funding_pages" from "service_role";

revoke references on table "public"."funding_pages" from "service_role";

revoke select on table "public"."funding_pages" from "service_role";

revoke trigger on table "public"."funding_pages" from "service_role";

revoke truncate on table "public"."funding_pages" from "service_role";

revoke update on table "public"."funding_pages" from "service_role";

revoke delete on table "public"."memberships" from "anon";

revoke insert on table "public"."memberships" from "anon";

revoke references on table "public"."memberships" from "anon";

revoke select on table "public"."memberships" from "anon";

revoke trigger on table "public"."memberships" from "anon";

revoke truncate on table "public"."memberships" from "anon";

revoke update on table "public"."memberships" from "anon";

revoke delete on table "public"."memberships" from "authenticated";

revoke insert on table "public"."memberships" from "authenticated";

revoke references on table "public"."memberships" from "authenticated";

revoke select on table "public"."memberships" from "authenticated";

revoke trigger on table "public"."memberships" from "authenticated";

revoke truncate on table "public"."memberships" from "authenticated";

revoke update on table "public"."memberships" from "authenticated";

revoke delete on table "public"."memberships" from "service_role";

revoke insert on table "public"."memberships" from "service_role";

revoke references on table "public"."memberships" from "service_role";

revoke select on table "public"."memberships" from "service_role";

revoke trigger on table "public"."memberships" from "service_role";

revoke truncate on table "public"."memberships" from "service_role";

revoke update on table "public"."memberships" from "service_role";

revoke delete on table "public"."organization_analytics" from "anon";

revoke insert on table "public"."organization_analytics" from "anon";

revoke references on table "public"."organization_analytics" from "anon";

revoke select on table "public"."organization_analytics" from "anon";

revoke trigger on table "public"."organization_analytics" from "anon";

revoke truncate on table "public"."organization_analytics" from "anon";

revoke update on table "public"."organization_analytics" from "anon";

revoke delete on table "public"."organization_analytics" from "authenticated";

revoke insert on table "public"."organization_analytics" from "authenticated";

revoke references on table "public"."organization_analytics" from "authenticated";

revoke select on table "public"."organization_analytics" from "authenticated";

revoke trigger on table "public"."organization_analytics" from "authenticated";

revoke truncate on table "public"."organization_analytics" from "authenticated";

revoke update on table "public"."organization_analytics" from "authenticated";

revoke delete on table "public"."organization_analytics" from "service_role";

revoke insert on table "public"."organization_analytics" from "service_role";

revoke references on table "public"."organization_analytics" from "service_role";

revoke select on table "public"."organization_analytics" from "service_role";

revoke trigger on table "public"."organization_analytics" from "service_role";

revoke truncate on table "public"."organization_analytics" from "service_role";

revoke update on table "public"."organization_analytics" from "service_role";

revoke delete on table "public"."organization_proposals" from "anon";

revoke insert on table "public"."organization_proposals" from "anon";

revoke references on table "public"."organization_proposals" from "anon";

revoke select on table "public"."organization_proposals" from "anon";

revoke trigger on table "public"."organization_proposals" from "anon";

revoke truncate on table "public"."organization_proposals" from "anon";

revoke update on table "public"."organization_proposals" from "anon";

revoke delete on table "public"."organization_proposals" from "authenticated";

revoke insert on table "public"."organization_proposals" from "authenticated";

revoke references on table "public"."organization_proposals" from "authenticated";

revoke select on table "public"."organization_proposals" from "authenticated";

revoke trigger on table "public"."organization_proposals" from "authenticated";

revoke truncate on table "public"."organization_proposals" from "authenticated";

revoke update on table "public"."organization_proposals" from "authenticated";

revoke delete on table "public"."organization_proposals" from "service_role";

revoke insert on table "public"."organization_proposals" from "service_role";

revoke references on table "public"."organization_proposals" from "service_role";

revoke select on table "public"."organization_proposals" from "service_role";

revoke trigger on table "public"."organization_proposals" from "service_role";

revoke truncate on table "public"."organization_proposals" from "service_role";

revoke update on table "public"."organization_proposals" from "service_role";

revoke delete on table "public"."organization_votes" from "anon";

revoke insert on table "public"."organization_votes" from "anon";

revoke references on table "public"."organization_votes" from "anon";

revoke select on table "public"."organization_votes" from "anon";

revoke trigger on table "public"."organization_votes" from "anon";

revoke truncate on table "public"."organization_votes" from "anon";

revoke update on table "public"."organization_votes" from "anon";

revoke delete on table "public"."organization_votes" from "authenticated";

revoke insert on table "public"."organization_votes" from "authenticated";

revoke references on table "public"."organization_votes" from "authenticated";

revoke select on table "public"."organization_votes" from "authenticated";

revoke trigger on table "public"."organization_votes" from "authenticated";

revoke truncate on table "public"."organization_votes" from "authenticated";

revoke update on table "public"."organization_votes" from "authenticated";

revoke delete on table "public"."organization_votes" from "service_role";

revoke insert on table "public"."organization_votes" from "service_role";

revoke references on table "public"."organization_votes" from "service_role";

revoke select on table "public"."organization_votes" from "service_role";

revoke trigger on table "public"."organization_votes" from "service_role";

revoke truncate on table "public"."organization_votes" from "service_role";

revoke update on table "public"."organization_votes" from "service_role";

revoke delete on table "public"."organizations" from "anon";

revoke insert on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "anon";

revoke select on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke update on table "public"."organizations" from "anon";

revoke delete on table "public"."organizations" from "authenticated";

revoke insert on table "public"."organizations" from "authenticated";

revoke references on table "public"."organizations" from "authenticated";

revoke select on table "public"."organizations" from "authenticated";

revoke trigger on table "public"."organizations" from "authenticated";

revoke truncate on table "public"."organizations" from "authenticated";

revoke update on table "public"."organizations" from "authenticated";

revoke delete on table "public"."organizations" from "service_role";

revoke insert on table "public"."organizations" from "service_role";

revoke references on table "public"."organizations" from "service_role";

revoke select on table "public"."organizations" from "service_role";

revoke trigger on table "public"."organizations" from "service_role";

revoke truncate on table "public"."organizations" from "service_role";

revoke update on table "public"."organizations" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."transactions" from "anon";

revoke insert on table "public"."transactions" from "anon";

revoke references on table "public"."transactions" from "anon";

revoke select on table "public"."transactions" from "anon";

revoke trigger on table "public"."transactions" from "anon";

revoke truncate on table "public"."transactions" from "anon";

revoke update on table "public"."transactions" from "anon";

revoke delete on table "public"."transactions" from "authenticated";

revoke insert on table "public"."transactions" from "authenticated";

revoke references on table "public"."transactions" from "authenticated";

revoke select on table "public"."transactions" from "authenticated";

revoke trigger on table "public"."transactions" from "authenticated";

revoke truncate on table "public"."transactions" from "authenticated";

revoke update on table "public"."transactions" from "authenticated";

revoke delete on table "public"."transactions" from "service_role";

revoke insert on table "public"."transactions" from "service_role";

revoke references on table "public"."transactions" from "service_role";

revoke select on table "public"."transactions" from "service_role";

revoke trigger on table "public"."transactions" from "service_role";

revoke truncate on table "public"."transactions" from "service_role";

revoke update on table "public"."transactions" from "service_role";

alter table "public"."campaigns" drop constraint "campaigns_status_check";

alter table "public"."campaigns" drop constraint "campaigns_user_id_fkey";

alter table "public"."funding_pages" drop constraint "funding_pages_status_check";

alter table "public"."memberships" drop constraint "memberships_organization_id_profile_id_key";

alter table "public"."memberships" drop constraint "memberships_role_check";

alter table "public"."memberships" drop constraint "memberships_status_check";

alter table "public"."organization_analytics" drop constraint "organization_analytics_metric_type_check";

alter table "public"."organization_analytics" drop constraint "organization_analytics_organization_id_fkey";

alter table "public"."organization_analytics" drop constraint "organization_analytics_organization_id_metric_name_time_per_key";

alter table "public"."organization_analytics" drop constraint "organization_analytics_time_period_check";

alter table "public"."organization_proposals" drop constraint "organization_proposals_organization_id_fkey";

alter table "public"."organization_proposals" drop constraint "organization_proposals_proposal_type_check";

alter table "public"."organization_proposals" drop constraint "organization_proposals_proposer_id_fkey";

alter table "public"."organization_proposals" drop constraint "organization_proposals_status_check";

alter table "public"."organization_proposals" drop constraint "organization_proposals_voting_method_check";

alter table "public"."organization_votes" drop constraint "organization_votes_proposal_id_fkey";

alter table "public"."organization_votes" drop constraint "organization_votes_proposal_id_voter_id_key";

alter table "public"."organization_votes" drop constraint "organization_votes_vote_type_check";

alter table "public"."organization_votes" drop constraint "organization_votes_voter_id_fkey";

alter table "public"."organizations" drop constraint "organizations_governance_model_check";

alter table "public"."organizations" drop constraint "organizations_status_check";

alter table "public"."organizations" drop constraint "organizations_type_check";

alter table "public"."profiles" drop constraint "profiles_kyc_status_check";

alter table "public"."profiles" drop constraint "profiles_status_check";

alter table "public"."profiles" drop constraint "profiles_verification_status_check";

alter table "public"."transactions" drop constraint "transactions_payment_method_check";

alter table "public"."transactions" drop constraint "transactions_user_id_fkey";

alter table "public"."funding_pages" drop constraint "funding_pages_user_id_fkey";

alter table "public"."memberships" drop constraint "memberships_profile_id_fkey";

alter table "public"."organizations" drop constraint "organizations_profile_id_fkey";

alter table "public"."transactions" drop constraint "transactions_status_check";

drop function if exists "public"."get_storage_bucket_info"();

drop function if exists "public"."update_organization_member_count"();

drop function if exists "public"."update_organization_trust_score"();

alter table "public"."campaigns" drop constraint "campaigns_pkey";

alter table "public"."organization_analytics" drop constraint "organization_analytics_pkey";

alter table "public"."organization_proposals" drop constraint "organization_proposals_pkey";

alter table "public"."organization_votes" drop constraint "organization_votes_pkey";

drop index if exists "public"."campaigns_pkey";

drop index if exists "public"."idx_analytics_metric_name";

drop index if exists "public"."idx_analytics_organization_id";

drop index if exists "public"."idx_analytics_time_period";

drop index if exists "public"."idx_campaigns_created_at";

drop index if exists "public"."idx_campaigns_status";

drop index if exists "public"."idx_campaigns_user_id";

drop index if exists "public"."idx_funding_pages_created_at";

drop index if exists "public"."idx_funding_pages_status";

drop index if exists "public"."idx_funding_pages_user_id";

drop index if exists "public"."idx_memberships_organization_id";

drop index if exists "public"."idx_memberships_profile_id";

drop index if exists "public"."idx_memberships_role";

drop index if exists "public"."idx_memberships_status";

drop index if exists "public"."idx_organizations_created_at";

drop index if exists "public"."idx_organizations_is_public";

drop index if exists "public"."idx_organizations_profile_id";

drop index if exists "public"."idx_organizations_slug";

drop index if exists "public"."idx_organizations_status";

drop index if exists "public"."idx_organizations_treasury_address";

drop index if exists "public"."idx_organizations_type";

drop index if exists "public"."idx_profiles_created_at";

drop index if exists "public"."idx_profiles_status";

drop index if exists "public"."idx_profiles_username";

drop index if exists "public"."idx_profiles_verification_status";

drop index if exists "public"."idx_proposals_organization_id";

drop index if exists "public"."idx_proposals_proposer_id";

drop index if exists "public"."idx_proposals_status";

drop index if exists "public"."idx_proposals_voting_deadline";

drop index if exists "public"."idx_transactions_created_at";

drop index if exists "public"."idx_transactions_funding_page_id";

drop index if exists "public"."idx_transactions_status";

drop index if exists "public"."idx_transactions_user_id";

drop index if exists "public"."idx_votes_proposal_id";

drop index if exists "public"."idx_votes_voter_id";

drop index if exists "public"."memberships_organization_id_profile_id_key";

drop index if exists "public"."organization_analytics_organization_id_metric_name_time_per_key";

drop index if exists "public"."organization_analytics_pkey";

drop index if exists "public"."organization_proposals_pkey";

drop index if exists "public"."organization_votes_pkey";

drop index if exists "public"."organization_votes_proposal_id_voter_id_key";

drop table "public"."campaigns";

drop table "public"."organization_analytics";

drop table "public"."organization_proposals";

drop table "public"."organization_votes";

create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" text not null,
    "message" text not null,
    "metadata" jsonb not null default '{}'::jsonb,
    "is_read" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "read_at" timestamp with time zone
);


alter table "public"."notifications" enable row level security;

create table "public"."organization_application_questions" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "question_text" text not null,
    "question_type" text not null,
    "is_required" boolean not null default true,
    "options" jsonb default '[]'::jsonb,
    "order_number" integer not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."organization_application_questions" enable row level security;

create table "public"."transparency_scores" (
    "id" uuid not null default gen_random_uuid(),
    "entity_id" uuid not null,
    "entity_type" text not null,
    "score" numeric(5,2) not null,
    "calculation_date" timestamp with time zone not null default now(),
    "details" jsonb not null default '{}'::jsonb,
    "verified_transactions_count" bigint default 0,
    "audit_notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."transparency_scores" enable row level security;

alter table "public"."funding_pages" drop column "categories";

alter table "public"."funding_pages" drop column "currency";

alter table "public"."funding_pages" drop column "goal_amount";

alter table "public"."funding_pages" drop column "lightning_address";

alter table "public"."funding_pages" drop column "raised_amount";

alter table "public"."funding_pages" drop column "status";

alter table "public"."funding_pages" drop column "website_url";

alter table "public"."funding_pages" add column "is_public" boolean not null default true;

alter table "public"."funding_pages" add column "is_verified" boolean not null default false;

alter table "public"."funding_pages" add column "verification_level" integer not null default 0;

alter table "public"."funding_pages" alter column "bitcoin_address" set not null;

alter table "public"."funding_pages" alter column "description" set not null;

alter table "public"."funding_pages" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."memberships" add column "achievements" jsonb not null default '[]'::jsonb;

alter table "public"."memberships" add column "contribution_address" character varying(255);

alter table "public"."memberships" add column "invitation_expires_at" timestamp with time zone;

alter table "public"."memberships" add column "invitation_token" character varying(255);

alter table "public"."memberships" add column "invited_by" uuid;

alter table "public"."memberships" add column "metadata" jsonb not null default '{}'::jsonb;

alter table "public"."memberships" add column "reward_percentage" numeric(5,2) not null default 0;

alter table "public"."memberships" add column "total_contributions" numeric(20,8) not null default 0;

alter table "public"."memberships" alter column "created_at" set default now();

alter table "public"."memberships" alter column "id" set default gen_random_uuid();

alter table "public"."memberships" alter column "joined_at" set default now();

alter table "public"."memberships" alter column "last_active_at" set default now();

alter table "public"."memberships" alter column "permissions" set default '{}'::jsonb;

alter table "public"."memberships" alter column "permissions" set not null;

alter table "public"."memberships" alter column "role" set default 'member'::membership_role_enum;

alter table "public"."memberships" alter column "role" set data type membership_role_enum using "role"::membership_role_enum;

alter table "public"."memberships" alter column "status" set default 'active'::membership_status_enum;

alter table "public"."memberships" alter column "status" set not null;

alter table "public"."memberships" alter column "status" set data type membership_status_enum using "status"::membership_status_enum;

alter table "public"."memberships" alter column "title" set data type character varying(150) using "title"::character varying(150);

alter table "public"."memberships" alter column "updated_at" set default now();

alter table "public"."memberships" disable row level security;

alter table "public"."organizations" drop column "campaign_count";

alter table "public"."organizations" drop column "dissolved_at";

alter table "public"."organizations" drop column "member_count";

alter table "public"."organizations" drop column "status";

alter table "public"."organizations" drop column "total_funding";

alter table "public"."organizations" drop column "treasury_balance";

alter table "public"."organizations" add column "application_process" jsonb default '{"questions": []}'::jsonb;

alter table "public"."organizations" add column "verification_level" integer not null default 0;

alter table "public"."organizations" alter column "avatar_url" set data type character varying(500) using "avatar_url"::character varying(500);

alter table "public"."organizations" alter column "banner_url" set data type character varying(500) using "banner_url"::character varying(500);

alter table "public"."organizations" alter column "category" set data type character varying(100) using "category"::character varying(100);

alter table "public"."organizations" alter column "contact_info" set not null;

alter table "public"."organizations" alter column "created_at" set default now();

alter table "public"."organizations" alter column "founded_at" set default now();

alter table "public"."organizations" alter column "founded_at" set not null;

alter table "public"."organizations" alter column "governance_model" set default 'hierarchical'::governance_model_enum;

alter table "public"."organizations" alter column "governance_model" set not null;

alter table "public"."organizations" alter column "governance_model" set data type governance_model_enum using "governance_model"::governance_model_enum;

alter table "public"."organizations" alter column "id" set default gen_random_uuid();

alter table "public"."organizations" alter column "is_public" set not null;

alter table "public"."organizations" alter column "name" set data type character varying(255) using "name"::character varying(255);

alter table "public"."organizations" alter column "requires_approval" set not null;

alter table "public"."organizations" alter column "settings" set not null;

alter table "public"."organizations" alter column "slug" set data type character varying(100) using "slug"::character varying(100);

alter table "public"."organizations" alter column "tags" set default '{}'::text[];

alter table "public"."organizations" alter column "tags" set not null;

alter table "public"."organizations" alter column "treasury_address" set data type character varying(255) using "treasury_address"::character varying(255);

alter table "public"."organizations" alter column "trust_score" set default 0.00;

alter table "public"."organizations" alter column "trust_score" set not null;

alter table "public"."organizations" alter column "trust_score" set data type numeric(3,2) using "trust_score"::numeric(3,2);

alter table "public"."organizations" alter column "type" set data type organization_type_enum using "type"::organization_type_enum;

alter table "public"."organizations" alter column "updated_at" set default now();

alter table "public"."organizations" alter column "website_url" set data type character varying(500) using "website_url"::character varying(500);

alter table "public"."organizations" disable row level security;

alter table "public"."profiles" drop column "banner_url";

alter table "public"."profiles" drop column "bio";

alter table "public"."profiles" drop column "bitcoin_address";

alter table "public"."profiles" drop column "bitcoin_balance";

alter table "public"."profiles" drop column "bitcoin_public_key";

alter table "public"."profiles" drop column "campaign_count";

alter table "public"."profiles" drop column "cover_image_url";

alter table "public"."profiles" drop column "currency";

alter table "public"."profiles" drop column "custom_css";

alter table "public"."profiles" drop column "display_name";

alter table "public"."profiles" drop column "email";

alter table "public"."profiles" drop column "follower_count";

alter table "public"."profiles" drop column "following_count";

alter table "public"."profiles" drop column "kyc_status";

alter table "public"."profiles" drop column "language";

alter table "public"."profiles" drop column "last_active_at";

alter table "public"."profiles" drop column "last_login_at";

alter table "public"."profiles" drop column "lightning_address";

alter table "public"."profiles" drop column "lightning_balance";

alter table "public"."profiles" drop column "lightning_node_id";

alter table "public"."profiles" drop column "location";

alter table "public"."profiles" drop column "login_count";

alter table "public"."profiles" drop column "metadata";

alter table "public"."profiles" drop column "onboarding_completed";

alter table "public"."profiles" drop column "payment_preferences";

alter table "public"."profiles" drop column "phone";

alter table "public"."profiles" drop column "preferences";

alter table "public"."profiles" drop column "privacy_policy_accepted_at";

alter table "public"."profiles" drop column "privacy_settings";

alter table "public"."profiles" drop column "profile_badges";

alter table "public"."profiles" drop column "profile_color";

alter table "public"."profiles" drop column "profile_completed_at";

alter table "public"."profiles" drop column "profile_views";

alter table "public"."profiles" drop column "social_links";

alter table "public"."profiles" drop column "status";

alter table "public"."profiles" drop column "terms_accepted_at";

alter table "public"."profiles" drop column "theme_preferences";

alter table "public"."profiles" drop column "timezone";

alter table "public"."profiles" drop column "total_donated";

alter table "public"."profiles" drop column "total_raised";

alter table "public"."profiles" drop column "two_factor_enabled";

alter table "public"."profiles" drop column "verification_data";

alter table "public"."profiles" drop column "verification_level";

alter table "public"."profiles" drop column "verification_status";

alter table "public"."profiles" alter column "username" set not null;

alter table "public"."transactions" drop column "currency";

alter table "public"."transactions" drop column "payment_details";

alter table "public"."transactions" drop column "payment_method";

alter table "public"."transactions" drop column "updated_at";

alter table "public"."transactions" drop column "user_id";

alter table "public"."transactions" alter column "amount" set data type numeric using "amount"::numeric;

alter table "public"."transactions" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."transactions" alter column "status" drop default;

alter table "public"."transactions" alter column "status" set not null;

alter table "public"."transactions" alter column "transaction_hash" set not null;

CREATE INDEX funding_pages_created_at_idx ON public.funding_pages USING btree (created_at);

CREATE INDEX funding_pages_user_id_idx ON public.funding_pages USING btree (user_id);

CREATE INDEX idx_app_questions_organization ON public.organization_application_questions USING btree (organization_id);

CREATE INDEX idx_notifications_type_created ON public.notifications USING btree (type, created_at DESC);

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);

CREATE INDEX idx_transparency_scores_entity ON public.transparency_scores USING btree (entity_id, entity_type);

CREATE INDEX idx_transparency_scores_score ON public.transparency_scores USING btree (score DESC);

CREATE UNIQUE INDEX memberships_invitation_token_key ON public.memberships USING btree (invitation_token);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX organization_application_questions_pkey ON public.organization_application_questions USING btree (id);

CREATE INDEX profiles_username_idx ON public.profiles USING btree (username);

CREATE INDEX transactions_created_at_idx ON public.transactions USING btree (created_at);

CREATE INDEX transactions_funding_page_id_idx ON public.transactions USING btree (funding_page_id);

CREATE UNIQUE INDEX transparency_scores_pkey ON public.transparency_scores USING btree (id);

CREATE UNIQUE INDEX unique_entity_score ON public.transparency_scores USING btree (entity_id, entity_type);

CREATE UNIQUE INDEX unique_membership ON public.memberships USING btree (organization_id, profile_id);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."organization_application_questions" add constraint "organization_application_questions_pkey" PRIMARY KEY using index "organization_application_questions_pkey";

alter table "public"."transparency_scores" add constraint "transparency_scores_pkey" PRIMARY KEY using index "transparency_scores_pkey";

alter table "public"."memberships" add constraint "memberships_invitation_token_key" UNIQUE using index "memberships_invitation_token_key";

alter table "public"."memberships" add constraint "memberships_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES profiles(id) not valid;

alter table "public"."memberships" validate constraint "memberships_invited_by_fkey";

alter table "public"."memberships" add constraint "unique_membership" UNIQUE using index "unique_membership";

alter table "public"."memberships" add constraint "valid_contributions" CHECK ((total_contributions >= (0)::numeric)) not valid;

alter table "public"."memberships" validate constraint "valid_contributions";

alter table "public"."memberships" add constraint "valid_reward_percentage" CHECK (((reward_percentage >= (0)::numeric) AND (reward_percentage <= (100)::numeric))) not valid;

alter table "public"."memberships" validate constraint "valid_reward_percentage";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['follow'::text, 'donation'::text, 'collaboration'::text, 'invitation'::text, 'application'::text, 'system'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."organization_application_questions" add constraint "organization_application_questions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_application_questions" validate constraint "organization_application_questions_organization_id_fkey";

alter table "public"."organization_application_questions" add constraint "organization_application_questions_question_type_check" CHECK ((question_type = ANY (ARRAY['text'::text, 'select'::text, 'checkbox'::text, 'file'::text]))) not valid;

alter table "public"."organization_application_questions" validate constraint "organization_application_questions_question_type_check";

alter table "public"."organizations" add constraint "non_empty_name" CHECK ((length(TRIM(BOTH FROM name)) > 0)) not valid;

alter table "public"."organizations" validate constraint "non_empty_name";

alter table "public"."organizations" add constraint "valid_slug_format" CHECK (((slug)::text ~ '^[a-z0-9][a-z0-9\-]*[a-z0-9]$'::text)) not valid;

alter table "public"."organizations" validate constraint "valid_slug_format";

alter table "public"."organizations" add constraint "valid_trust_score" CHECK (((trust_score >= (0)::numeric) AND (trust_score <= (1)::numeric))) not valid;

alter table "public"."organizations" validate constraint "valid_trust_score";

alter table "public"."organizations" add constraint "valid_verification_level" CHECK ((verification_level >= 0)) not valid;

alter table "public"."organizations" validate constraint "valid_verification_level";

alter table "public"."transparency_scores" add constraint "transparency_scores_entity_type_check" CHECK ((entity_type = ANY (ARRAY['profile'::text, 'organization'::text]))) not valid;

alter table "public"."transparency_scores" validate constraint "transparency_scores_entity_type_check";

alter table "public"."transparency_scores" add constraint "transparency_scores_score_check" CHECK (((score >= (0)::numeric) AND (score <= (100)::numeric))) not valid;

alter table "public"."transparency_scores" validate constraint "transparency_scores_score_check";

alter table "public"."transparency_scores" add constraint "unique_entity_score" UNIQUE using index "unique_entity_score";

alter table "public"."funding_pages" add constraint "funding_pages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."funding_pages" validate constraint "funding_pages_user_id_fkey";

alter table "public"."memberships" add constraint "memberships_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."memberships" validate constraint "memberships_profile_id_fkey";

alter table "public"."organizations" add constraint "organizations_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."organizations" validate constraint "organizations_profile_id_fkey";

alter table "public"."transactions" add constraint "transactions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'failed'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$function$
;

create policy "Public funding pages are viewable by everyone"
on "public"."funding_pages"
as permissive
for select
to public
using ((is_public = true));


create policy "Users can create funding pages"
on "public"."funding_pages"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own funding pages"
on "public"."funding_pages"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can view their own funding pages"
on "public"."funding_pages"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update own notifications"
on "public"."notifications"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Org admins can manage questions"
on "public"."organization_application_questions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM memberships m
  WHERE ((m.organization_id = organization_application_questions.organization_id) AND (m.profile_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::membership_role_enum, 'admin'::membership_role_enum]))))));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can create transactions for their funding pages"
on "public"."transactions"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM funding_pages
  WHERE ((funding_pages.id = transactions.funding_page_id) AND (funding_pages.user_id = auth.uid())))));


create policy "Users can view transactions for their funding pages"
on "public"."transactions"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM funding_pages
  WHERE ((funding_pages.id = transactions.funding_page_id) AND (funding_pages.user_id = auth.uid())))));


create policy "Users can view own entity scores"
on "public"."transparency_scores"
as permissive
for select
to public
using ((((entity_type = 'profile'::text) AND (entity_id = auth.uid())) OR ((entity_type = 'organization'::text) AND (EXISTS ( SELECT 1
   FROM memberships m
  WHERE ((m.organization_id = transparency_scores.entity_id) AND (m.profile_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::membership_role_enum, 'admin'::membership_role_enum]))))))));


CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_application_questions_updated_at BEFORE UPDATE ON public.organization_application_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transparency_scores_updated_at BEFORE UPDATE ON public.transparency_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



