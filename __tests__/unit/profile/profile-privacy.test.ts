/**
 * Profile field-hide privacy — pure redaction helpers.
 *
 * These gate what a visitor sees, so the invariants matter: an owner sees their
 * whole row; a visitor never receives a hidden field's value NOR the hide-list
 * itself; unknown/legacy keys in the blob never crash or over-redact.
 */

import {
  applyProfilePrivacy,
  getHiddenProfileFields,
  buildPrivacySettings,
  HIDEABLE_PROFILE_FIELD_KEYS,
} from '@/config/profile-privacy';

const baseProfile = {
  id: 'u1',
  username: 'alice',
  name: 'Alice',
  website: 'https://alice.example',
  phone: '+41791234567',
  contact_email: 'hi@alice.example',
  social_links: { links: [{ platform: 'x', value: '@alice' }] },
  privacy_settings: { hidden_fields: ['phone', 'website'] },
};

describe('getHiddenProfileFields', () => {
  it('returns the known hidden keys from a blob', () => {
    expect(getHiddenProfileFields({ hidden_fields: ['phone', 'website'] })).toEqual([
      'phone',
      'website',
    ]);
  });

  it('drops unknown / non-hideable keys and tolerates junk', () => {
    expect(getHiddenProfileFields({ hidden_fields: ['phone', 'name', 'bogus', 42] })).toEqual([
      'phone',
    ]);
    expect(getHiddenProfileFields(null)).toEqual([]);
    expect(getHiddenProfileFields(undefined)).toEqual([]);
    expect(getHiddenProfileFields({})).toEqual([]);
    expect(getHiddenProfileFields({ hidden_fields: 'phone' })).toEqual([]);
  });
});

describe('applyProfilePrivacy', () => {
  it('returns the owner their untouched row (same reference)', () => {
    const result = applyProfilePrivacy(baseProfile, { isOwner: true });
    expect(result).toBe(baseProfile);
    expect(result.phone).toBe('+41791234567');
    expect(result.privacy_settings).toEqual({ hidden_fields: ['phone', 'website'] });
  });

  it('nulls hidden fields for visitors and never leaks the hide-list', () => {
    const result = applyProfilePrivacy(baseProfile, { isOwner: false });
    expect(result.phone).toBeNull();
    expect(result.website).toBeNull();
    // Non-hidden public fields survive.
    expect(result.contact_email).toBe('hi@alice.example');
    expect(result.social_links).toEqual({ links: [{ platform: 'x', value: '@alice' }] });
    // The hide-list itself must not ship to visitors.
    expect(result.privacy_settings).toBeNull();
    // Original is not mutated.
    expect(baseProfile.phone).toBe('+41791234567');
  });

  it('is a no-op redaction when nothing is hidden', () => {
    const open = { ...baseProfile, privacy_settings: { hidden_fields: [] } };
    const result = applyProfilePrivacy(open, { isOwner: false });
    expect(result.phone).toBe('+41791234567');
    expect(result.website).toBe('https://alice.example');
    // privacy_settings is still stripped for visitors even when empty.
    expect(result.privacy_settings).toBeNull();
  });

  it('handles a missing privacy_settings blob', () => {
    const noSettings = { id: 'u2', phone: '+123', privacy_settings: null };
    const result = applyProfilePrivacy(noSettings, { isOwner: false });
    expect(result.phone).toBe('+123');
    expect(result.privacy_settings).toBeNull();
  });
});

describe('buildPrivacySettings', () => {
  it('preserves unrelated keys already in the blob', () => {
    expect(buildPrivacySettings({ theme: 'dark' }, ['phone'])).toEqual({
      theme: 'dark',
      hidden_fields: ['phone'],
    });
  });

  it('overwrites a prior hidden_fields list', () => {
    expect(buildPrivacySettings({ hidden_fields: ['website'] }, ['phone'])).toEqual({
      hidden_fields: ['phone'],
    });
  });

  it('tolerates a null/undefined existing blob', () => {
    expect(buildPrivacySettings(null, ['phone'])).toEqual({ hidden_fields: ['phone'] });
    expect(buildPrivacySettings(undefined, [])).toEqual({ hidden_fields: [] });
  });
});

describe('HIDEABLE_PROFILE_FIELD_KEYS', () => {
  it('covers only optional public fields (never core identity or location)', () => {
    expect([...HIDEABLE_PROFILE_FIELD_KEYS].sort()).toEqual(
      ['contact_email', 'phone', 'social_links', 'website'].sort()
    );
    expect(HIDEABLE_PROFILE_FIELD_KEYS).not.toContain('username');
    expect(HIDEABLE_PROFILE_FIELD_KEYS).not.toContain('name');
    expect(HIDEABLE_PROFILE_FIELD_KEYS).not.toContain('bio');
    expect(HIDEABLE_PROFILE_FIELD_KEYS).not.toContain('location');
  });
});
