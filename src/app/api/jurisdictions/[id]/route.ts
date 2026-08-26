/**
 * Jurisdiction CRUD API (GET/PUT/DELETE by id).
 * Generic CRUD handler; entity metadata from entity-registry (SSOT).
 */

import { jurisdictionSchema } from '@/lib/validation';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import {
  createUpdatePayloadBuilder,
  commonFieldMappings,
  entityTransforms,
} from '@/lib/api/buildUpdatePayload';

// Note what is absent: verification_status, verified_at,
// verification_evidence_url, actor_id, and the two payment-rail columns. A body
// that can promote its own badge is not verified, it is self-declared — and a
// directory entry that can attach its own wallet is an impersonation with a
// payout attached. Both are written only by the claim flow, server-side with
// the service role, after evidence review.
const buildJurisdictionUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description', transform: entityTransforms.emptyStringToNull },
  { from: 'level' },
  { from: 'parent_id', transform: entityTransforms.normalizeUUID },
  { from: 'country_code', transform: entityTransforms.emptyStringToNull },
  { from: 'region_code', transform: entityTransforms.emptyStringToNull },
  { from: 'locality', transform: entityTransforms.emptyStringToNull },
  { from: 'population' },
  { from: 'official_url', transform: entityTransforms.normalizeURL },
  { from: 'currency' },
  { from: 'annual_budget' },
  { from: 'budget_year' },
  { from: 'budget_url', transform: entityTransforms.normalizeURL },
  { from: 'avatar_url', transform: entityTransforms.emptyStringToNull },
  { from: 'cover_image_url', transform: entityTransforms.emptyStringToNull },
  commonFieldMappings.arrayField('tags', []),
  { from: 'status' },
]);

const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'jurisdiction',
  schema: jurisdictionSchema,
  buildUpdatePayload: buildJurisdictionUpdatePayload,
  // A directory row is edited by whoever added it until the body claims it;
  // `created_by` holds that, not an actor.
  ownershipField: 'created_by',
  useActorOwnership: false,
});

export { GET, PUT, DELETE };
