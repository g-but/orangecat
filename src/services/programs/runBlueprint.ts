/**
 * Program blueprint runner
 *
 * Creates a blueprint's entities by POSTing each step to that entity type's own
 * public API endpoint (ENTITY_REGISTRY[type].apiEndpoint). Deliberately NOT a
 * bespoke server route: every step goes through the same validation, RLS,
 * actor resolution, rate limiting, audit trail and webhooks as a hand-filled
 * create form, so a program can never create something a user could not.
 *
 * Steps run in sequence, not in parallel — the write rate limit is 30/min per
 * user and a burst of eight creates plus a dozen wishlist items is close enough
 * to that to be worth pacing. A failed step does not stop the run: the rest
 * still get created and the failure is reported against its own row, because a
 * half-built program the user can finish by hand beats an all-or-nothing wipe.
 *
 * Created: 2026-08-14
 */

import { ENTITY_REGISTRY } from '@/config/entity-registry';
import type { BlueprintStep } from '@/config/program-blueprints';
import { logger } from '@/utils/logger';

export type StepStatus = 'pending' | 'running' | 'created' | 'failed';

export interface StepResult {
  key: string;
  status: StepStatus;
  /** id (or slug, for groups) of the created entity. */
  id?: string;
  /** Where the created entity lives, for the success list. */
  href?: string;
  /** Children created under this step, e.g. wishlist items. */
  childrenCreated?: number;
  childrenFailed?: number;
  error?: string;
}

interface ApiEnvelope {
  success?: boolean;
  data?: unknown;
  error?: { message?: string } | string;
}

/** Pull a human-usable message out of whatever the endpoint returned. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiEnvelope;
    const err = body?.error;
    if (typeof err === 'string' && err) {
      return err;
    }
    if (err && typeof err === 'object' && typeof err.message === 'string' && err.message) {
      return err.message;
    }
  } catch {
    // Non-JSON body (HTML error page, empty 500) — fall through to the status.
  }
  return `Request failed (${response.status})`;
}

/** The created row, unwrapped from `{ success, data }`. */
function unwrap(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const envelope = body as ApiEnvelope;
  const data = 'data' in envelope ? envelope.data : envelope;
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
}

async function postJson(path: string, payload: Record<string, unknown>): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });
}

/**
 * Run one step: create the entity, then its children (if any).
 * Never throws — a network failure comes back as `status: 'failed'`.
 */
export async function runBlueprintStep(
  step: BlueprintStep,
  options: { actorId?: string | null } = {}
): Promise<StepResult> {
  const meta = ENTITY_REGISTRY[step.entityType];
  const payload: Record<string, unknown> = { ...step.payload };
  if (options.actorId) {
    payload.actor_id = options.actorId;
  }

  let created: Record<string, unknown> | null;
  try {
    const response = await postJson(meta.apiEndpoint, payload);
    if (!response.ok) {
      return { key: step.key, status: 'failed', error: await errorMessage(response) };
    }
    created = unwrap(await response.json());
  } catch (error) {
    logger.error('Blueprint step request failed', { step: step.key, error });
    return {
      key: step.key,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }

  // Groups are addressed by slug, every other entity by id.
  const identifier =
    (typeof created?.slug === 'string' && created.slug) ||
    (typeof created?.id === 'string' && created.id) ||
    undefined;

  const result: StepResult = {
    key: step.key,
    status: 'created',
    id: identifier,
    href: identifier ? `${meta.publicBasePath}/${identifier}` : meta.basePath,
  };

  if (!step.children || !identifier) {
    return result;
  }

  // Children hang off the created entity's id — never the slug, since the
  // sub-resource routes validate a UUID.
  const parentId = typeof created?.id === 'string' ? created.id : identifier;
  const childPath = `${meta.apiEndpoint}/${parentId}${step.children.pathSuffix}`;
  let childrenCreated = 0;
  let childrenFailed = 0;

  for (const child of step.children.payloads) {
    try {
      const response = await postJson(childPath, child);
      if (response.ok) {
        childrenCreated += 1;
      } else {
        childrenFailed += 1;
        logger.warn('Blueprint child create failed', {
          step: step.key,
          status: response.status,
        });
      }
    } catch (error) {
      childrenFailed += 1;
      logger.warn('Blueprint child request failed', { step: step.key, error });
    }
  }

  return { ...result, childrenCreated, childrenFailed };
}
