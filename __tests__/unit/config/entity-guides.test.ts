/**
 * ENTITY_GUIDES must cover every EntityType — meaning SSOT cannot drift
 * from the registry.
 */
import { ENTITY_TYPES } from '@/config/entity-registry';
import { ENTITY_GUIDES, LEGACY_ENTITY_ALIASES } from '@/config/entity-guides';

describe('entity-guides SSOT', () => {
  it('has a guide for every registry entity type', () => {
    for (const type of ENTITY_TYPES) {
      expect(ENTITY_GUIDES[type]).toBeDefined();
      expect(ENTITY_GUIDES[type].summary.length).toBeGreaterThan(10);
      expect(ENTITY_GUIDES[type].whenToUse.length).toBeGreaterThan(0);
    }
  });

  it('maps legacy group names to organization', () => {
    expect(LEGACY_ENTITY_ALIASES.group).toBe('organization');
    expect(LEGACY_ENTITY_ALIASES.org).toBe('organization');
  });

  it('registers organization as an entity type', () => {
    expect(ENTITY_TYPES.includes('organization')).toBe(true);
    expect(ENTITY_TYPES.includes('group' as never)).toBe(false);
  });
});
