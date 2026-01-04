/**
 * Groups Service Validation
 *
 * Request validation using Zod schemas.
 * Uses only the new unified groups types.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-29
 * Last Modified Summary: Simplified to use only new groups types
 */

import { z } from 'zod';
import type { CreateGroupInput, UpdateGroupInput } from '@/types/group';
import { GROUP_LABELS } from '@/config/group-labels';
import { GOVERNANCE_PRESETS } from '@/config/governance-presets';

// Valid label values - auto-derived from config (SSOT)
// Adding a new label to GROUP_LABELS automatically includes it here
const validLabels = Object.keys(GROUP_LABELS) as readonly string[];
const validLabelsTuple = Object.keys(GROUP_LABELS) as [string, ...string[]]; // For zod.enum

// Valid governance presets - auto-derived from config (SSOT)
const validGovernancePresets = Object.keys(GOVERNANCE_PRESETS) as readonly string[];
const validGovernancePresetsTuple = Object.keys(GOVERNANCE_PRESETS) as [string, ...string[]]; // For zod.enum

// Valid visibility values from config
const validVisibilities = ['public', 'members_only', 'private'] as const;

/**
 * Validate create group request
 */
export function validateCreateGroupRequest(
  request: CreateGroupInput
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  // Name validation
  if (!request.name || request.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Group name must be at least 3 characters' });
  }
  if (request.name && request.name.length > 100) {
    errors.push({ field: 'name', message: 'Group name cannot exceed 100 characters' });
  }

  // Description validation
  if (request.description && request.description.length > 2000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 2000 characters' });
  }

  // Label validation
  if (!request.label) {
    errors.push({ field: 'label', message: 'Group label is required' });
  } else if (!validLabels.includes(request.label as any)) {
    errors.push({ field: 'label', message: `Label must be one of: ${validLabels.join(', ')}` });
  }

  // Governance preset validation
  if (
    request.governance_preset &&
    !validGovernancePresets.includes(request.governance_preset as any)
  ) {
    errors.push({
      field: 'governance_preset',
      message: `Governance preset must be one of: ${validGovernancePresets.join(', ')}`,
    });
  }

  // Visibility validation
  if (request.visibility && !validVisibilities.includes(request.visibility as any)) {
    errors.push({
      field: 'visibility',
      message: `Visibility must be one of: ${validVisibilities.join(', ')}`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate update group request
 */
export function validateUpdateGroupRequest(
  request: UpdateGroupInput
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  // Name validation (if provided)
  if (request.name !== undefined) {
    if (request.name.trim().length < 3) {
      errors.push({ field: 'name', message: 'Group name must be at least 3 characters' });
    }
    if (request.name.length > 100) {
      errors.push({ field: 'name', message: 'Group name cannot exceed 100 characters' });
    }
  }

  // Description validation (if provided)
  if (request.description !== undefined && request.description.length > 2000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 2000 characters' });
  }

  // Label validation (if provided)
  if (request.label !== undefined && !validLabels.includes(request.label as any)) {
    errors.push({ field: 'label', message: `Label must be one of: ${validLabels.join(', ')}` });
  }

  // Governance preset validation (if provided)
  if (
    request.governance_preset !== undefined &&
    !validGovernancePresets.includes(request.governance_preset as any)
  ) {
    errors.push({
      field: 'governance_preset',
      message: `Governance preset must be one of: ${validGovernancePresets.join(', ')}`,
    });
  }

  // Visibility validation (if provided)
  if (
    request.visibility !== undefined &&
    !validVisibilities.includes(request.visibility as any)
  ) {
    errors.push({
      field: 'visibility',
      message: `Visibility must be one of: ${validVisibilities.join(', ')}`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Zod schema for create group request (for runtime validation)
 */
export const createGroupSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().optional(),
  description: z.string().max(2000).optional(),
  label: z.enum(validLabelsTuple),
  tags: z.array(z.string()).optional(),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
  banner_url: z.string().url().optional().nullable().or(z.literal('')),
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
  label: z.enum(validLabels).optional(),
  tags: z.array(z.string()).optional(),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
  banner_url: z.string().url().optional().nullable().or(z.literal('')),
  is_public: z.boolean().optional(),
  visibility: z.enum(validVisibilities).optional(),
  bitcoin_address: z.string().optional().nullable(),
  lightning_address: z.string().optional().nullable(),
  governance_preset: z.enum(validGovernancePresetsTuple).optional(),
  voting_threshold: z.number().int().min(1).max(100).optional().nullable(),
});

// Export inferred types
export type CreateGroupSchemaType = z.infer<typeof createGroupSchema>;
export type UpdateGroupSchemaType = z.infer<typeof updateGroupSchema>;

