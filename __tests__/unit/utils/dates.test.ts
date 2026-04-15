import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
} from '@/utils/dates';

describe('formatDate', () => {
  it('formats a Date object to "MMM d, yyyy"', () => {
    expect(formatDate(new Date('2025-01-15T12:00:00'))).toBe('Jan 15, 2025');
  });

  it('formats a date string to "MMM d, yyyy"', () => {
    expect(formatDate('2024-07-04T00:00:00')).toBe('Jul 4, 2024');
  });

  it('handles end-of-year dates', () => {
    expect(formatDate(new Date('2023-12-31T00:00:00'))).toBe('Dec 31, 2023');
  });
});

describe('formatTime', () => {
  it('formats a Date object to 12-hour time with am/pm', () => {
    // 09:05 am
    expect(formatTime(new Date('2025-01-15T09:05:00'))).toBe('9:05 AM');
  });

  it('formats afternoon time', () => {
    expect(formatTime(new Date('2025-01-15T14:30:00'))).toBe('2:30 PM');
  });

  it('formats midnight as 12:00 AM', () => {
    expect(formatTime(new Date('2025-01-15T00:00:00'))).toBe('12:00 AM');
  });

  it('formats a time string', () => {
    expect(formatTime('2025-06-01T18:45:00')).toBe('6:45 PM');
  });
});

describe('formatDateTime', () => {
  it('formats a Date object to "MMM d, yyyy h:mm a"', () => {
    expect(formatDateTime(new Date('2025-01-15T09:05:00'))).toBe('Jan 15, 2025 9:05 AM');
  });

  it('formats a date string', () => {
    expect(formatDateTime('2024-07-04T14:30:00')).toBe('Jul 4, 2024 2:30 PM');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date();

  function ago(ms: number): Date {
    return new Date(now.getTime() - ms);
  }

  it('returns "1 minute ago" or "less than a minute ago" for 30 seconds ago', () => {
    const result = formatRelativeTime(ago(30_000));
    // date-fns rounds 30s to "1 minute ago" in some versions; either is acceptable
    expect(result).toMatch(/(?:less than a minute|1 minute) ago/i);
  });

  it('returns "5 minutes ago" for 5 minutes ago', () => {
    const result = formatRelativeTime(ago(5 * 60 * 1000));
    expect(result).toMatch(/5 minutes ago/i);
  });

  it('returns "about 2 hours ago" for 2 hours ago', () => {
    const result = formatRelativeTime(ago(2 * 60 * 60 * 1000));
    expect(result).toMatch(/about 2 hours ago/i);
  });

  it('returns "2 days ago" for 2 days ago', () => {
    const result = formatRelativeTime(ago(2 * 24 * 60 * 60 * 1000));
    expect(result).toMatch(/2 days ago/i);
  });

  it('returns "14 days ago" or "about 2 weeks ago" for 2 weeks ago', () => {
    const result = formatRelativeTime(ago(14 * 24 * 60 * 60 * 1000));
    // date-fns may return "14 days ago" or "about 2 weeks ago" depending on version
    expect(result).toMatch(/(?:14 days|about 2 weeks) ago/i);
  });

  it('returns "3 months ago" for ~90 days ago', () => {
    const result = formatRelativeTime(ago(90 * 24 * 60 * 60 * 1000));
    expect(result).toMatch(/3 months ago/i);
  });

  it('accepts a date string', () => {
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const result = formatRelativeTime(tenMinutesAgo);
    expect(result).toMatch(/10 minutes ago/i);
  });
});
