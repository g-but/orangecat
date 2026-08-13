/**
 * Canonical public identity path. Keep this file import-free so ecosystem
 * config can use it without creating a routes → entity-registry → ecosystem cycle.
 */
export function publicProfilePath(username: string): string {
  return `/profiles/${encodeURIComponent(username)}`;
}
