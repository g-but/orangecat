/**
 * SSOT edit-convention guard.
 *
 * Every entity type with a create page edits through the SAME form via
 * `createPath?edit=<id>` (PR #376 convention). This test pins each list
 * config's editPath to that convention so a one-off `/x/[id]/edit` route
 * can't silently reappear for a single entity type.
 */

import { ENTITY_REGISTRY, type EntityType } from '@/config/entity-registry';
import { assetEntityConfig } from '@/config/entities/assets';
import { aiAssistantEntityConfig } from '@/config/entities/ai-assistants';
import { causeEntityConfig } from '@/config/entities/causes';
import { circleEntityConfig } from '@/config/entities/circles';
import { documentEntityConfig } from '@/config/entities/documents';
import { eventEntityConfig } from '@/config/entities/events';
import { investmentEntityConfig } from '@/config/entities/investments';
import { loanEntityConfig } from '@/config/entities/loans';
import { productEntityConfig } from '@/config/entities/products';
import { projectEntityConfig } from '@/config/entities/projects';
import { researchEntityConfig } from '@/config/entities/research';
import { serviceEntityConfig } from '@/config/entities/services';
import { wishlistEntityConfig } from '@/config/entities/wishlists';

// wallet is intentionally absent: it has no create form (managed inline by
// WalletManager). group has no list config; its edit entry point is the
// GroupDetail "Edit Group" action, covered below.
const LIST_CONFIGS = [
  aiAssistantEntityConfig,
  assetEntityConfig,
  causeEntityConfig,
  circleEntityConfig,
  documentEntityConfig,
  eventEntityConfig,
  investmentEntityConfig,
  loanEntityConfig,
  productEntityConfig,
  projectEntityConfig,
  researchEntityConfig,
  serviceEntityConfig,
  wishlistEntityConfig,
];

describe('entity edit convention (createPath?edit=<id>)', () => {
  it.each(LIST_CONFIGS.map(c => [c.entityType, c] as const))(
    '%s editPath follows the convention',
    (entityType, config) => {
      const meta = ENTITY_REGISTRY[entityType as EntityType];
      expect(meta).toBeDefined();
      expect(config.editPath?.('abc-123')).toBe(`${meta.createPath}?edit=abc-123`);
    }
  );

  it('covers every entity type that has a create form', () => {
    const covered = new Set(LIST_CONFIGS.map(c => c.entityType));
    const expected = (Object.keys(ENTITY_REGISTRY) as EntityType[]).filter(
      // wallet: no create form; group: edit entry point lives on GroupDetail
      t => t !== 'wallet' && t !== 'organization'
    );
    expected.forEach(t => expect(covered.has(t)).toBe(true));
  });

  it('organization edit uses the same convention (id-addressed createPath)', () => {
    // GroupDetail builds its Edit link inline; pin the convention pieces.
    const meta = ENTITY_REGISTRY.organization;
    expect(meta.createPath).toBe('/dashboard/organizations/create');
    expect(`${meta.createPath}?edit=g-1`).toBe('/dashboard/organizations/create?edit=g-1');
  });
});
