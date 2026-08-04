// Database types facade.
//
// The `Database` interface below is NOT hand-written any more: it is re-exported
// verbatim from `database.generated.ts`, which `npm run gen:types` produces from
// the live self-hosted Postgres schema (postgres-meta over SSH). That makes the
// live schema the single source of truth for every typed Supabase query.
//
// This module still exists — rather than importing the generated file directly —
// because it also re-exports the higher-level application models, so that
// `@/types/database` remains one import path for both schema Rows and app models.
//
// To pick up a schema change: `npm run gen:types`, then `npm run type-check`.
// Never edit `database.generated.ts` by hand.

import type { Profile as AppProfile } from './profile';
import type { Project as AppProject } from './project';
import type { ProfileData } from '../lib/validation';
import type { Database as GeneratedDatabase } from './database.generated';

export type { Json } from './database.generated';
export type Database = GeneratedDatabase;

type Tables = Database['public']['Tables'];
type Row<T extends keyof Tables> = Tables[T]['Row'];

// ---------------------------------------------------------------------------
// High-level application models
// ---------------------------------------------------------------------------

/**
 * Adapts a generated Row to the `BaseEntity` contract (`@/types/entity`).
 *
 * The generated timestamps are honestly `string | null` because the columns are
 * nullable, while `BaseEntity` declares them optional-and-non-null. Rather than
 * lying about the schema, entity view models re-declare just those two fields —
 * every other column keeps its generated type.
 */
export type AsEntity<T> = Omit<T, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

// Form data shape for profile editing flows (from Zod profile schema)
export type ProfileFormData = ProfileData;

// Project view model used by dashboard and timeline components
export type Project = AppProject;

// Commerce entity types — the generated Row plus the fields the entity list
// components require to be present.
export type UserProduct = AsEntity<Row<'user_products'>> & {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  status?: string;
  price?: number;
  currency?: string;
  images?: string[];
};

export type UserService = AsEntity<Row<'user_services'>> & {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  status?: string;
  category?: string;
  hourly_rate?: number;
  fixed_price?: number;
  service_location_type?: string;
};

/**
 * `current_amount` is not a column: raised amounts come from the settled-ledger
 * funding layer and are attached at read time (same pattern as `Project`).
 */
export type UserCause = AsEntity<Row<'user_causes'>> & {
  current_amount?: number;
};

// Extended Profile type that includes email from database
export type Profile = AppProfile & {
  email?: string | null;
};

// AI Assistant type for dashboard and entity components
export type AIAssistant = AsEntity<Row<'ai_assistants'>>;
