/**
 * Economic-profile derived signals — completeness score and gap list.
 * Both derive from one SSOT dimension list, so this guards that they stay consistent
 * and that the score is deterministic and even-weighted.
 */
import {
  economicCompleteness,
  economicProfileGaps,
  isEconomicProfileEmpty,
  suggestedEntityForSkill,
  type EconomicProfile,
} from '@/services/cat/economic-profile';

const empty: EconomicProfile = {
  skills: [],
  assets: [],
  goals: [],
  constraints: [],
  askedFor: [],
  notAvailableFor: [],
  motivation: null,
  stage: null,
};

const full: EconomicProfile = {
  skills: [{ name: 'translation' }],
  assets: [{ name: 'drone' }],
  goals: [{ text: 'earn on the side', kind: 'earn' }],
  constraints: ['only weekends'],
  askedFor: ['clear emails'],
  notAvailableFor: ['full-time roles'],
  motivation: 'earn',
  stage: 'exploring',
};

const TOTAL_DIMENSIONS = 6;

describe('economicCompleteness', () => {
  it('is 0 for null or an empty profile', () => {
    expect(economicCompleteness(null)).toBe(0);
    expect(economicCompleteness(empty)).toBe(0);
  });

  it('is 100 when every dimension is filled', () => {
    expect(economicCompleteness(full)).toBe(100);
  });

  it('is even-weighted across dimensions', () => {
    // 3 of 6 dimensions filled → 50%
    const half: EconomicProfile = {
      ...empty,
      skills: [{ name: 'x' }],
      assets: [{ name: 'y' }],
      goals: [{ text: 'z' }],
    };
    expect(economicCompleteness(half)).toBe(50);
  });
});

describe('economicProfileGaps', () => {
  it('lists every dimension for null/empty, none for full', () => {
    expect(economicProfileGaps(null)).toHaveLength(TOTAL_DIMENSIONS);
    expect(economicProfileGaps(empty)).toHaveLength(TOTAL_DIMENSIONS);
    expect(economicProfileGaps(full)).toEqual([]);
  });

  it('probes the richest signal first', () => {
    expect(economicProfileGaps(empty)[0]).toBe('what people come to them for');
  });

  it('stays consistent with the completeness score', () => {
    const partial: EconomicProfile = { ...empty, skills: [{ name: 'x' }], motivation: 'community' };
    const filled = TOTAL_DIMENSIONS - economicProfileGaps(partial).length;
    expect(economicCompleteness(partial)).toBe(Math.round((filled / TOTAL_DIMENSIONS) * 100));
  });
});

describe('isEconomicProfileEmpty', () => {
  it('matches a 0% score', () => {
    expect(isEconomicProfileEmpty(empty)).toBe(true);
    expect(isEconomicProfileEmpty(full)).toBe(false);
  });
});

describe('suggestedEntityForSkill', () => {
  it('maps sellable artifacts to product', () => {
    expect(suggestedEntityForSkill('ebook writing')).toBe('product');
    expect(suggestedEntityForSkill('Lightroom presets')).toBe('product');
    expect(suggestedEntityForSkill('online course')).toBe('product');
  });

  it('defaults skills to service (time/expertise for hire)', () => {
    expect(suggestedEntityForSkill('photography')).toBe('service');
    expect(suggestedEntityForSkill('translation')).toBe('service');
    expect(suggestedEntityForSkill('coaching')).toBe('service');
  });
});
