/**
 * Every entity the registry marks canReceiveSupport must expose a payment
 * group (wallet selector) in its create config — otherwise the entity is
 * "supportable" on paper but unpayable in practice. research and wishlist
 * shipped with exactly this gap (July 2026); this test ends the class.
 */

import { getEntityConfig } from '@/config/entity-configs/get-config';
import { ENTITY_REGISTRY, ENTITY_TYPES, type EntityType } from '@/config/entity-registry';
import { WalletSelectorField } from '@/components/create/wallet-selector';
import type { FieldGroup } from '@/components/create/types';

function groupsOf(type: EntityType): FieldGroup[] | null {
  const config = getEntityConfig(type) as {
    groups?: FieldGroup[];
    fieldGroups?: FieldGroup[];
  } | null;
  if (!config) {
    return null;
  }
  return (config.fieldGroups ?? config.groups ?? []) as FieldGroup[];
}

describe('supportable entities expose a wallet/payment group', () => {
  const supportable = (ENTITY_TYPES as readonly EntityType[]).filter(
    type => ENTITY_REGISTRY[type]?.canReceiveSupport && groupsOf(type) !== null
  );

  it('covers at least the known supportable set', () => {
    expect(supportable.length).toBeGreaterThanOrEqual(5);
  });

  it.each(supportable)('%s create config has a wallet selector group', type => {
    const groups = groupsOf(type) ?? [];
    // Detect by the component itself, not the group id — configs use both
    // 'payment' and 'bitcoin' as ids; the selector is what matters.
    const walletGroup = groups.find(g => g.customComponent === WalletSelectorField);
    expect(walletGroup).toBeDefined();
  });
});
