/**
 * Unit tests for parseReminderDate — the natural-language date parser
 * used by the Cat's set_reminder action.
 */

import { parseReminderDate } from '@/services/cat/action-executor';

describe('parseReminderDate', () => {
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  // Allow a 5-second window for test execution time
  const TOLERANCE_MS = 5000;

  function expectApprox(result: string | null, expectedMs: number) {
    expect(result).not.toBeNull();
    const delta = Math.abs(new Date(result!).getTime() - expectedMs);
    expect(delta).toBeLessThan(TOLERANCE_MS);
  }

  describe('"in N unit" patterns', () => {
    it('parses "in 30 minutes"', () => {
      const expected = Date.now() + 30 * MINUTE;
      expectApprox(parseReminderDate('in 30 minutes'), expected);
    });

    it('parses "in 1 minute" (singular)', () => {
      const expected = Date.now() + MINUTE;
      expectApprox(parseReminderDate('in 1 minute'), expected);
    });

    it('parses "in 2 hours"', () => {
      const expected = Date.now() + 2 * HOUR;
      expectApprox(parseReminderDate('in 2 hours'), expected);
    });

    it('parses "in 1 hour" (singular)', () => {
      const expected = Date.now() + HOUR;
      expectApprox(parseReminderDate('in 1 hour'), expected);
    });

    it('parses "in 3 days"', () => {
      const expected = Date.now() + 3 * DAY;
      expectApprox(parseReminderDate('in 3 days'), expected);
    });

    it('parses "in 1 day" (singular)', () => {
      const expected = Date.now() + DAY;
      expectApprox(parseReminderDate('in 1 day'), expected);
    });

    it('parses "in 2 weeks"', () => {
      const expected = Date.now() + 14 * DAY;
      expectApprox(parseReminderDate('in 2 weeks'), expected);
    });

    it('parses "in 1 week" (singular)', () => {
      const expected = Date.now() + 7 * DAY;
      expectApprox(parseReminderDate('in 1 week'), expected);
    });
  });

  describe('named shortcuts', () => {
    it('parses "tomorrow" as next day at 9 AM', () => {
      const result = parseReminderDate('tomorrow');
      expect(result).not.toBeNull();
      const date = new Date(result!);
      expect(date.getHours()).toBe(9);
      expect(date.getMinutes()).toBe(0);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(date.getDate()).toBe(tomorrow.getDate());
    });

    it('parses "next week" as 7 days out at 9 AM', () => {
      const result = parseReminderDate('next week');
      expect(result).not.toBeNull();
      const date = new Date(result!);
      expect(date.getHours()).toBe(9);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      expect(date.getDate()).toBe(nextWeek.getDate());
    });

    it('parses "next month" as first of next month at 9 AM', () => {
      const result = parseReminderDate('next month');
      expect(result).not.toBeNull();
      const date = new Date(result!);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(9);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      expect(date.getMonth()).toBe(nextMonth.getMonth());
    });
  });

  describe('ISO date strings', () => {
    it('passes through a valid ISO string', () => {
      const iso = '2027-06-15T10:00:00.000Z';
      expect(parseReminderDate(iso)).toBe(new Date(iso).toISOString());
    });

    it('parses a date-only string', () => {
      const result = parseReminderDate('2027-12-31');
      expect(result).not.toBeNull();
      expect(new Date(result!).getFullYear()).toBe(2027);
    });
  });

  describe('invalid inputs', () => {
    it('returns null for empty string', () => {
      expect(parseReminderDate('')).toBeNull();
    });

    it('returns null for unrecognised natural-language strings', () => {
      expect(parseReminderDate('soon')).toBeNull();
      expect(parseReminderDate('eventually')).toBeNull();
      expect(parseReminderDate('when I feel like it')).toBeNull();
    });
  });
});
