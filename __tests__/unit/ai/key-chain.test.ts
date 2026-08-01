/**
 * The fallback-chain ordering rule (src/services/ai/key-chain) — previously
 * implemented three times (manager component, settings hook, service) and
 * able to drift. These tests pin the single shared implementation.
 */
import {
  PLATFORM_CHAIN_ID,
  applyOrderToKeys,
  buildChain,
  chainItemId,
  moveChainItem,
  platformPositionFromOrder,
} from '@/services/ai/key-chain';

const keys = [
  { id: 'a', sort_order: 0 },
  { id: 'b', sort_order: 2 },
];

describe('key-chain', () => {
  it('buildChain interleaves keys and the platform default by shared index — gaps included', () => {
    const chain = buildChain(keys, 1);
    expect(chain.map(chainItemId)).toEqual(['a', PLATFORM_CHAIN_ID, 'b']);
  });

  it('moveChainItem returns the new persisted order', () => {
    const chain = buildChain(keys, 1);
    expect(moveChainItem(chain, 2, 0)).toEqual(['b', 'a', PLATFORM_CHAIN_ID]);
  });

  it('moveChainItem rejects no-ops and out-of-range moves', () => {
    const chain = buildChain(keys, 1);
    expect(moveChainItem(chain, 1, 1)).toBeNull();
    expect(moveChainItem(chain, 0, 3)).toBeNull();
    expect(moveChainItem(chain, -1, 0)).toBeNull();
  });

  it('applyOrderToKeys stamps sort_order from array index, skipping the platform slot', () => {
    const reordered = applyOrderToKeys(keys, ['b', PLATFORM_CHAIN_ID, 'a']);
    expect(reordered).toEqual([
      { id: 'b', sort_order: 0 },
      { id: 'a', sort_order: 2 },
    ]);
  });

  it('platformPositionFromOrder finds the platform slot (or -1)', () => {
    expect(platformPositionFromOrder(['b', PLATFORM_CHAIN_ID, 'a'])).toBe(1);
    expect(platformPositionFromOrder(['b', 'a'])).toBe(-1);
  });
});
