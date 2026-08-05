/**
 * Shared discovery shapes.
 *
 * Extracted so `discovery` (entities → owners) and `interests` (declared
 * interests → people) can both speak the same "person" language without
 * importing each other.
 */

import type { EntityType } from '@/config/entity-registry';

export interface DiscoveryPerson {
  userId: string | null;
  displayName: string;
  username: string | null;
  profileUrl: string | null;
  /** Why they surfaced — published work and/or a declared interest. */
  via: string[];
}

export interface DiscoveryHit {
  entityType: EntityType;
  entityId: string;
  title: string;
  description: string | null;
  url: string;
  similarity: number;
  owner: DiscoveryPerson | null;
}

export interface DiscoveryResult {
  topic: string;
  hits: DiscoveryHit[];
  people: DiscoveryPerson[];
  /** True when the semantic index could not be consulted at all. */
  degraded: boolean;
}
