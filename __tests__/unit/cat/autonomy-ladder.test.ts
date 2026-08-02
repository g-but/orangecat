import {
  toAutonomyLevel,
  fromAutonomyLevel,
  allowedLevelsForRisk,
  AUTONOMY_LEVELS,
} from '@/config/cat-autonomy';
import { CAT_ACTIONS } from '@/config/cat-actions';

/**
 * The autonomy ladder maps three human levels onto the two booleans the
 * database has always stored. Round-tripping must be lossless, and money
 * actions must never be settable to "Automatic" — the UI hides it and the
 * API forces confirmation, so both halves are pinned here.
 */

describe('autonomy level mapping', () => {
  it('round-trips every level', () => {
    for (const level of AUTONOMY_LEVELS) {
      const { granted, requiresConfirmation } = fromAutonomyLevel(level);
      expect(toAutonomyLevel(granted, requiresConfirmation)).toBe(level);
    }
  });

  it('reads stored booleans the way the executor resolves them', () => {
    expect(toAutonomyLevel(false, true)).toBe('off');
    expect(toAutonomyLevel(false, false)).toBe('off');
    expect(toAutonomyLevel(true, true)).toBe('ask');
    expect(toAutonomyLevel(true, false)).toBe('auto');
    // A null requires_confirmation means "fall back to confirming".
    expect(toAutonomyLevel(true, null)).toBe('ask');
    expect(toAutonomyLevel(null, null)).toBe('off');
  });

  it('never offers Automatic for high-risk actions', () => {
    expect(allowedLevelsForRisk('high')).toEqual(['off', 'ask']);
    expect(allowedLevelsForRisk('medium')).toContain('auto');
    expect(allowedLevelsForRisk('low')).toContain('auto');
  });

  it('every money-moving action is high risk (so it always confirms)', () => {
    const moneyMovers = ['send_payment', 'fund_project', 'book_service'];
    for (const id of moneyMovers) {
      expect(CAT_ACTIONS[id]?.riskLevel).toBe('high');
      expect(allowedLevelsForRisk(CAT_ACTIONS[id].riskLevel)).not.toContain('auto');
    }
  });
});
