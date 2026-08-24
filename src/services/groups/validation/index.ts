/**
 * Groups Service Validation
 *
 * Request validation using Zod schemas.
 * Uses only the new unified groups types.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-03-31
 * Last Modified Summary: Remove as-any casts by typing .includes() properly
 */

import { z } from 'zod';
import { webUrl } from '@/lib/validation/base';
import { GROUP_LABELS, type GroupLabel } from '@/config/group-labels';
import { GOVERNANCE_PRESETS, type GovernancePreset } from '@/config/governance-presets';

// Valid label values - auto-derived from config (SSOT)
// Adding a new label to GROUP_LABELS automatically includes it here
const validLabelsTuple = Object.keys(GROUP_LABELS) as [GroupLabel, ...GroupLabel[]]; // For zod.enum

// Valid governance presets - auto-derived from config (SSOT)
const validGovernancePresetsTuple = Object.keys(GOVERNANCE_PRESETS) as [
  GovernancePreset,
  ...GovernancePreset[],
]; // For zod.enum

// Valid visibility values from config
const validVisibilities = ['public', 'members_only', 'private'] as const;

/**
 * Zod schema for create group request (for runtime validation)
 */
export const createGroupSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().optional(),
  description: z.string().max(2000).optional(),
  label: z.enum(validLabelsTuple),
  tags: z.array(z.string()).optional(),
  avatar_url: webUrl().optional().nullable().or(z.literal('')),
  banner_url: webUrl().optional().nullable().or(z.literal('')),
  is_public: z.boolean().optional(),
  visibility: z.enum(validVisibilities).optional(),
  bitcoin_address: z.string().optional().nullable(),
  lightning_address: z.string().optional().nullable(),
  governance_preset: z.enum(validGovernancePresetsTuple).optional(),
  voting_threshold: z.number().int().min(1).max(100).optional().nullable(),
});

/**
 * Zod schema for update group request (all fields optional)
 */
export const updateGroupSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  label: z.enum(validLabelsTuple).optional(),
  tags: z.array(z.string()).optional(),
  avatar_url: webUrl().optional().nullable().or(z.literal('')),
  banner_url: webUrl().optional().nullable().or(z.literal('')),
  is_public: z.boolean().optional(),
  visibility: z.enum(validVisibilities).optional(),
  bitcoin_address: z.string().optional().nullable(),
  lightning_address: z.string().optional().nullable(),
  governance_preset: z.enum(validGovernancePresetsTuple).optional(),
  voting_threshold: z.number().int().min(1).max(100).optional().nullable(),
});

export type CreateGroupSchemaType = z.infer<typeof createGroupSchema>;

/**
 * Input for creating a new group — derived from the Zod schema (SSOT).
 * Re-exported from @/types/group for consumers of the types module.
 */
export type CreateGroupInput = CreateGroupSchemaType;
