/**
 * Program Blueprints — types
 *
 * A blueprint is a *program*: a set of OrangeCat entities that only makes
 * sense together. "Ten computers to India" is not a project, or a cause, or a
 * product — it is all of them plus an AI assistant, a handover event and a
 * rules document, wired into one economic loop.
 *
 * The registry (index.ts) is the SSOT. The runner
 * (src/services/programs/runBlueprint.ts) posts each step to the entity's own
 * `apiEndpoint` from ENTITY_REGISTRY, so blueprints get the same validation,
 * RLS, rate limiting and audit trail as a hand-filled create form. There is no
 * privileged back door: anything a blueprint creates, a user can create.
 *
 * Created: 2026-08-14
 */

import type { LucideIcon } from 'lucide-react';
import type { EntityType } from '@/config/entity-registry';

export type BlueprintParamValue = string | number;

/** A knob the user turns before the program is created. */
export interface BlueprintParam {
  key: string;
  label: string;
  type: 'text' | 'number';
  defaultValue: BlueprintParamValue;
  /** One line under the input explaining what the number actually buys. */
  help?: string;
  min?: number;
  max?: number;
  /** Rendered after the input — 'CHF', 'BTC', 'seats'. */
  suffix?: string;
}

export type BlueprintParamValues = Record<string, BlueprintParamValue>;

/**
 * Rows POSTed to a sub-resource of the step's created entity — currently only
 * wishlist items (`POST /api/wishlists/{id}/items`).
 */
export interface BlueprintChildren {
  /** Appended to `${apiEndpoint}/${createdId}`, e.g. '/items'. */
  pathSuffix: string;
  /** Plural noun for progress copy: "10 machines". */
  label: string;
  payloads: Record<string, unknown>[];
}

export interface BlueprintStep {
  /** Stable within a blueprint — used as the React key and the result key. */
  key: string;
  entityType: EntityType;
  /** Why the program needs this entity. Shown in the review list. */
  role: string;
  /** Body POSTed to ENTITY_REGISTRY[entityType].apiEndpoint. */
  payload: Record<string, unknown>;
  children?: BlueprintChildren;
}

export interface ProgramBlueprint {
  id: string;
  name: string;
  tagline: string;
  /** Two or three sentences on how the money actually moves. */
  summary: string;
  icon: LucideIcon;
  params: BlueprintParam[];
  buildSteps: (values: BlueprintParamValues) => BlueprintStep[];
}

/** Param defaults as a values object — the initial state of the review form. */
export function defaultParamValues(blueprint: ProgramBlueprint): BlueprintParamValues {
  return Object.fromEntries(blueprint.params.map(p => [p.key, p.defaultValue]));
}

/** Read a numeric param, falling back to the blueprint default when cleared. */
export function numberParam(values: BlueprintParamValues, key: string, fallback: number): number {
  const raw = values[key];
  const parsed = typeof raw === 'number' ? raw : Number.parseFloat(String(raw ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Read a text param, falling back when blank. */
export function textParam(values: BlueprintParamValues, key: string, fallback: string): string {
  const raw = values[key];
  const trimmed = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}
