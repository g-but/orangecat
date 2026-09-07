/**
 * Who the thing being created will belong to.
 *
 * ADR-0004 D8. The create form already had a "Create this on behalf of"
 * selector covering *me* and *a group I run*, with real server-side
 * authorization behind it (`resolveCreationActor` → 403). What it could not do
 * is name a person who has no account, because such a person has no `actors`
 * row — and giving them one is the alternative ADR-0004 rejects, since ~24
 * tables join `actors` and `actors.user_id` has no FK, which would demote the
 * money guarantee from structural to conventional.
 *
 * So the third option does not resolve to an actor. It changes the SUBMIT
 * TARGET:
 *
 *   me           → POST /api/<entity>
 *   group        → POST /api/<entity> { actor_id }
 *   someone else → POST /api/profile-claims { draft: { ..., entities: [...] } }
 *
 * Same form, same fields, same validation — which is the whole argument for
 * routing this through the create form rather than a parallel "invite" flow: a
 * bar drafted for Karl has exactly the fields a bar has.
 */

import { GROUP_LABELS, type GroupLabel } from '@/config/group-labels';
import type { EntityType } from '@/config/entity-registry';
import { CURRENCY_CODES } from '@/config/currencies';
import type { ClaimEntityDraft } from '@/domain/profileClaims/draft';

/** `EntityConfig.type` is an EntityType OR the legacy literal 'organization'. */
type ConfigEntityType = EntityType | 'organization';

function isGroupLabel(value: string | undefined): value is GroupLabel {
  return value !== undefined && Object.prototype.hasOwnProperty.call(GROUP_LABELS, value);
}

function isCurrencyCode(value: string | undefined): value is (typeof CURRENCY_CODES)[number] {
  return value !== undefined && (CURRENCY_CODES as readonly string[]).includes(value);
}

export type CreateOwner =
  | { kind: 'me' }
  | { kind: 'group'; actorId: string }
  | { kind: 'someone-else'; name: string };

export const OWNER_ME: CreateOwner = { kind: 'me' };

/**
 * Entity types a claim draft can actually carry.
 *
 * The option is offered ONLY for these. Showing "someone else" on an entity
 * type the claim cannot hold would take a creator through the whole form and
 * fail at the end — a dead end is worse than an absent option.
 */
export const CLAIMABLE_ENTITY_TYPES: readonly EntityType[] = ['group', 'project'];

export function canCreateForSomeoneElse(entityType: ConfigEntityType): boolean {
  return CLAIMABLE_ENTITY_TYPES.includes(entityType as EntityType);
}

/**
 * Map validated form values onto the claim's entity draft.
 *
 * Returns null when the entity type is not claimable, so a caller can never
 * silently post a draft that materialisation will not understand.
 */
export function toClaimEntity(
  entityType: ConfigEntityType,
  values: Record<string, unknown>
): ClaimEntityDraft | null {
  const str = (key: string): string | undefined => {
    const value = values[key];
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
  };

  if (entityType === 'group') {
    const name = str('name') ?? str('title');
    if (!name) {
      return null;
    }
    const rawLabel = str('label');
    return {
      kind: 'group',
      name,
      // A bar is a `groups` row with label='company'; the form's own label
      // select is the SSOT for which one, so it is passed through rather than
      // re-derived here.
      label: isGroupLabel(rawLabel) ? rawLabel : 'circle',
      description: str('description'),
      tags: Array.isArray(values.tags) ? (values.tags as string[]) : undefined,
    };
  }

  if (entityType === 'project') {
    const title = str('title') ?? str('name');
    const description = str('description');
    // `projectSchema` REQUIRES a description, so a project drafted without one
    // could never materialise. Refusing here means the CREATOR finds out at
    // submit time, instead of the RECIPIENT finding out after they accept.
    if (!title || !description) {
      return null;
    }
    const goal = values.goal_amount;
    const currency = str('currency');
    return {
      kind: 'project',
      title,
      description,
      // Positive INTEGER, matching projectSchema — anything else would validate
      // as a draft and fail at materialisation.
      goalAmount: typeof goal === 'number' && Number.isInteger(goal) && goal > 0 ? goal : undefined,
      currency: isCurrencyCode(currency) ? currency : undefined,
    };
  }

  return null;
}
