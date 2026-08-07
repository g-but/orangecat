/**
 * Canonical JSON + content hashing — OrangeCat's half of the cross-system
 * contract with Solon (`src/lib/domain/canonical.ts` there). A policy's
 * contentHash is what Solon's voters sign over; OrangeCat re-hashes the
 * proposed content with THESE rules when verifying a decision document, so
 * the two implementations must stay byte-identical. Guarded by golden-hash
 * tests pinned to the same values on both sides — if either drifts, CI
 * breaks instead of decision verification in prod.
 *
 * Rules: recursively key-sorted objects, arrays in order, no whitespace,
 * `undefined` object values dropped; hash = sha256 hex of the UTF-8 string.
 */
import { createHash } from 'node:crypto';

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(v => canonicalJson(v)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** The contentHash Solon voters sign over: sha256 of the canonical JSON. */
export function contentHashOf(content: unknown): string {
  return sha256Hex(canonicalJson(content));
}
