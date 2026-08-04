/**
 * Webhook endpoints — outbound delivery configuration service.
 *
 * docs/api/CONVENTIONS.md §6 advertises HMAC-SHA-256 signed webhooks
 * so integrations can react to entity-create / status-change events
 * without polling. This file is the persistence layer only: mint /
 * list / revoke. The signing util, event firing, and retry worker are
 * separate commits.
 *
 * Shape mirrors integration_keys (same actor-bound model, same
 * soft-revocation pattern, same admin-only RLS posture). The minting
 * user must already be authorised to act as the bound actor — once
 * minted, every event for that actor flows through this endpoint with
 * no per-event membership recheck.
 *
 * - createWebhookEndpoint: mints a new endpoint, returns the secret
 *   ONCE. The secret is the signing key the integration uses to verify
 *   delivery authenticity.
 * - listWebhookEndpoints: lists a user's endpoints (no secret, ever).
 * - revokeWebhookEndpoint: marks revoked. The active-target index
 *   excludes revoked rows so the firing loop skips them immediately.
 *
 * Created: 2026-06-03
 */

import { fromTable } from '@/lib/supabase/untyped';
import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptWebhookSecret, decryptWebhookSecret } from '@/lib/crypto/webhookSecretCipher';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  resolveCreationActor,
  ActorNotPermittedError,
} from '@/services/actors/resolveCreationActor';

const SECRET_PREFIX = 'ock_whk_' as const;
const SECRET_RANDOM_BYTES = 24; // 48 hex chars → ~192 bits of entropy
const DISPLAY_PREFIX_LENGTH = 15; // "ock_whk_a1b2c3d"

export interface WebhookEndpoint {
  id: string;
  user_id: string;
  actor_id: string;
  name: string;
  url: string;
  secret_prefix: string;
  event_types: string[] | null;
  created_at: string;
  last_delivery_at: string | null;
  revoked_at: string | null;
}

export interface MintedWebhookEndpoint {
  /** Stored record (no secret). */
  endpoint: WebhookEndpoint;
  /** Plaintext signing secret — show to user ONCE and never again. */
  secret: string;
}

function generateSecret(): string {
  return `${SECRET_PREFIX}${randomBytes(SECRET_RANDOM_BYTES).toString('hex')}`;
}

const ENDPOINT_SELECT =
  'id, user_id, actor_id, name, url, secret_prefix, event_types, created_at, last_delivery_at, revoked_at';

/**
 * Mint a new webhook endpoint. The caller must already be authorised
 * to act as the requested actor (same gate as integration-key mint
 * and entity creation).
 *
 * @throws ActorNotPermittedError when the user can't act as `actorId`.
 */
export async function createWebhookEndpoint(params: {
  userId: string;
  actorId: string;
  name: string;
  url: string;
  eventTypes?: string[] | null;
}): Promise<MintedWebhookEndpoint> {
  const { userId, actorId, name, url, eventTypes } = params;

  await resolveCreationActor(userId, actorId);

  const secret = generateSecret();
  const secretPrefix = secret.slice(0, DISPLAY_PREFIX_LENGTH);
  // Phase 2: encrypt-only. If encryption fails (env var missing/bad),
  // the mint fails — we never persist a row the worker can't decrypt
  // at fire time.
  const secretEncrypted = encryptWebhookSecret(secret);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(DATABASE_TABLES.WEBHOOK_ENDPOINTS)
    .insert({
      user_id: userId,
      actor_id: actorId,
      name: name.trim(),
      url: url.trim(),
      // `secret_encrypted` is a `bytea` column; postgres-meta types it as the
      // hex string PostgREST returns on read, while this insert passes the raw
      // Buffer (the read path in getEndpointSigningContext accepts both).
      secret_encrypted: secretEncrypted as unknown as string,
      secret_prefix: secretPrefix,
      event_types: eventTypes && eventTypes.length > 0 ? eventTypes : null,
    })
    .select(ENDPOINT_SELECT)
    .single();

  if (error || !data) {
    logger.error('createWebhookEndpoint: insert failed', { error, userId, actorId });
    throw error ?? new Error('Failed to create webhook endpoint');
  }

  return { endpoint: data as WebhookEndpoint, secret };
}

/** List the user's endpoints — never returns the secret or its hash. */
export async function listWebhookEndpoints(userId: string): Promise<WebhookEndpoint[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from(DATABASE_TABLES.WEBHOOK_ENDPOINTS)
    .select(ENDPOINT_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('listWebhookEndpoints: query failed', { error, userId });
    throw error;
  }

  return (data ?? []) as WebhookEndpoint[];
}

/**
 * List the LIVE endpoints bound to a given actor — used by the firing
 * loop to fan an event out to every active subscriber. Excludes
 * revoked endpoints via the partial index.
 */
export async function listActiveEndpointsForActor(actorId: string): Promise<WebhookEndpoint[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from(DATABASE_TABLES.WEBHOOK_ENDPOINTS)
    .select(ENDPOINT_SELECT)
    .eq('actor_id', actorId)
    .is('revoked_at', null);

  if (error) {
    logger.error('listActiveEndpointsForActor: query failed', { error, actorId });
    throw error;
  }

  return (data ?? []) as WebhookEndpoint[];
}

/**
 * Fetch the signing secret + url for a single endpoint — the firing
 * worker needs both to actually POST a delivery. Returns null if the
 * endpoint was revoked or deleted between enqueue and fire.
 *
 * INTERNAL ONLY. Never expose the secret via the user-facing API.
 */
export async function getEndpointSigningContext(
  endpointId: string
): Promise<{ url: string; secret: string; actorId: string } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from(DATABASE_TABLES.WEBHOOK_ENDPOINTS)
    .select('url, secret_encrypted, actor_id, revoked_at')
    .eq('id', endpointId)
    .maybeSingle();

  if (error) {
    logger.error('getEndpointSigningContext: query failed', { error, endpointId });
    return null;
  }
  if (!data) {
    return null;
  }

  // Supabase returns bytea as a base64 string in the JSON envelope.
  const row = data as {
    url: string;
    secret_encrypted: string | Buffer | null;
    actor_id: string;
    revoked_at: string | null;
  };
  if (row.revoked_at) {
    return null;
  }
  if (!row.secret_encrypted) {
    logger.error('getEndpointSigningContext: secret_encrypted is null on a live row', {
      endpointId,
    });
    return null;
  }

  let secret: string;
  try {
    const blob = Buffer.isBuffer(row.secret_encrypted)
      ? row.secret_encrypted
      : decodeSupabaseBytea(row.secret_encrypted);
    secret = decryptWebhookSecret(blob);
  } catch (err) {
    // Decrypt failure means the WEBHOOK_SECRET_KEY drifted from what
    // encrypted this row, OR the blob was tampered with. Either way the
    // delivery cannot be signed — fail by returning null so the worker
    // records a "[endpoint revoked]" outcome rather than a forged signature.
    logger.error('getEndpointSigningContext: decrypt failed', {
      endpointId,
      error: err instanceof Error ? err.message : err,
    });
    return null;
  }

  return { url: row.url, secret, actorId: row.actor_id };
}

/**
 * Supabase returns BYTEA columns through PostgREST as the canonical
 * `\x...hex...` text. Strip the prefix and parse hex.
 */
function decodeSupabaseBytea(value: string): Buffer {
  if (value.startsWith('\\x')) {
    return Buffer.from(value.slice(2), 'hex');
  }
  // Fallback: assume base64 for environments where postgrest serialises
  // bytea differently (e.g. when row-level RLS bypass returns a JSON
  // base64 string). Never happens on the admin client today but cheap
  // to support.
  return Buffer.from(value, 'base64');
}

/**
 * Authorisation check for endpoint-scoped routes (deliveries drawer
 * etc.): does this endpoint exist AND belong to the caller? Returns
 * true even when the endpoint is revoked — the user can still review
 * past deliveries for an endpoint they once owned.
 */
export async function userOwnsEndpoint(endpointId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from(DATABASE_TABLES.WEBHOOK_ENDPOINTS)
    .select('id')
    .eq('id', endpointId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('userOwnsEndpoint: query failed', { error, endpointId, userId });
    return false;
  }
  return !!data;
}

/**
 * Bump last_delivery_at on the endpoint — fire-and-forget from the worker
 * after a successful POST so the /settings/integrations UI shows freshness.
 */
export async function touchEndpointLastDelivery(endpointId: string): Promise<void> {
  const admin = createAdminClient();

  const { error } = await fromTable(admin, DATABASE_TABLES.WEBHOOK_ENDPOINTS)
    .update({ last_delivery_at: new Date().toISOString() })
    .eq('id', endpointId);
  if (error) {
    logger.warn('touchEndpointLastDelivery failed (non-fatal)', { error, endpointId });
  }
}

/**
 * Soft-revoke (sets revoked_at). The partial index excludes revoked
 * rows so the firing loop skips them on the next query.
 *
 * @returns true when the endpoint was found and revoked; false if it
 *          didn't belong to the user (or was already revoked).
 */
export async function revokeWebhookEndpoint(endpointId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data, error } = await fromTable(admin, DATABASE_TABLES.WEBHOOK_ENDPOINTS)
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', endpointId)
    .eq('user_id', userId)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    logger.error('revokeWebhookEndpoint: update failed', { error, userId, endpointId });
    throw error;
  }

  return !!data;
}

export { ActorNotPermittedError };
