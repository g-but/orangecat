import { profileSchema, coerceCoordinate, normalizeProfileData } from '@/lib/validation/base';

/**
 * Regression for the silent profile-save failure: the location UI registers
 * latitude/longitude as hidden text inputs, so react-hook-form reads their
 * value as the string "" when no coordinate is set. Before the fix, the raw
 * `z.number()` rejected "" with "Expected number, received string", which
 * blocked handleSubmit for EVERY profile without coordinates — with no visible
 * error (the hidden inputs render no FormMessage, so the "Save Profile" button
 * silently did nothing).
 *
 * Fix: coerce the coordinate at the source (ProfileLocationSection registers
 * the inputs with `setValueAs: coerceCoordinate`, so the resolver never sees
 * "") and defend the server path (`normalizeProfileData` runs the same
 * coercion so "" never reaches the numeric DB column). The schema keeps its
 * clean `number | null | undefined` type.
 */
describe('coerceCoordinate', () => {
  it('maps empty / blank / null / undefined to null', () => {
    expect(coerceCoordinate('')).toBeNull();
    expect(coerceCoordinate('   ')).toBeNull();
    expect(coerceCoordinate(null)).toBeNull();
    expect(coerceCoordinate(undefined)).toBeNull();
  });

  it('passes real numbers through and parses numeric strings', () => {
    expect(coerceCoordinate(47.3769)).toBe(47.3769);
    expect(coerceCoordinate('8.5417')).toBe(8.5417);
  });

  it('maps NaN and non-numeric junk to null', () => {
    expect(coerceCoordinate(Number.NaN)).toBeNull();
    expect(coerceCoordinate('not-a-number')).toBeNull();
  });
});

describe('normalizeProfileData — coordinates never reach the DB as ""', () => {
  it('maps empty / blank coordinates to null', () => {
    const out = normalizeProfileData({
      username: 'x',
      latitude: '',
      longitude: '   ',
    }) as Record<string, unknown>;
    expect(out.latitude).toBeNull();
    expect(out.longitude).toBeNull();
  });

  it('passes real numeric coordinates through untouched', () => {
    const out = normalizeProfileData({
      username: 'x',
      latitude: 47.3769,
      longitude: 8.5417,
    }) as Record<string, unknown>;
    expect(out.latitude).toBe(47.3769);
    expect(out.longitude).toBe(8.5417);
  });
});

describe('profileSchema — the server path saves a bare profile with empty coords', () => {
  it('accepts the normalized bare-profile payload (empty coords → null)', () => {
    // The editor submits "" for unset lat/long; the server runs it through
    // normalizeProfileData before parse, which is what must succeed end to end.
    const bareForm = {
      username: 'fresh-maker',
      name: '',
      bio: '',
      latitude: '',
      longitude: '',
      website: '',
      contact_email: 'fresh@example.com',
      current_status: '',
      help_wanted: [],
    };
    expect(profileSchema.safeParse(normalizeProfileData(bareForm)).success).toBe(true);
  });
});
