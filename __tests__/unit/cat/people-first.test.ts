/**
 * People-first payee resolution — product guarantee that free models cannot
 * turn "send money to my mother" into Lightning-address homework.
 */

import {
  buildPeopleFirstReply,
  hasConcreteRecipient,
  looksLikeAddressCollectionOpener,
  matchUnresolvedRolePayment,
  rolePayeeKnownInMemories,
  shouldShortCircuitPeopleFirst,
} from '@/services/cat/people-first';

describe('matchUnresolvedRolePayment', () => {
  it('matches the reported failure phrasing', () => {
    expect(matchUnresolvedRolePayment('send money to my mother')?.roleKey).toBe('mother');
    expect(matchUnresolvedRolePayment('send btc to my motehr')).toBeNull(); // typo — no role word
    expect(matchUnresolvedRolePayment('send btc to my mother')?.roleKey).toBe('mother');
    expect(matchUnresolvedRolePayment('Pay my landlord 0.01')?.roleKey).toBe('landlord');
  });

  it('skips when a concrete recipient is already present', () => {
    expect(hasConcreteRecipient('send 0.01 to @maya')).toBe(true);
    expect(matchUnresolvedRolePayment('send btc to my mother @maya')).toBeNull();
    expect(matchUnresolvedRolePayment('send to mom mom@getalby.com')).toBeNull();
  });

  it('ignores unrelated messages', () => {
    expect(matchUnresolvedRolePayment('what should I sell?')).toBeNull();
    expect(matchUnresolvedRolePayment('create a product')).toBeNull();
  });
});

describe('shouldShortCircuitPeopleFirst', () => {
  it('short-circuits when mother is unknown', () => {
    expect(shouldShortCircuitPeopleFirst('send money to my mother', [])?.roleKey).toBe('mother');
  });

  it('does not short-circuit when memory already identifies her', () => {
    expect(
      shouldShortCircuitPeopleFirst('send money to my mother', ['Mother is @maya on OrangeCat'])
    ).toBeNull();
    expect(rolePayeeKnownInMemories('mother', ['Mother is @maya on OrangeCat'])).toBe(true);
  });
});

describe('buildPeopleFirstReply', () => {
  it('never opens with Lightning-address collection', () => {
    const reply = buildPeopleFirstReply({ roleKey: 'mother', roleSurface: 'mother' }, 'en');
    expect(looksLikeAddressCollectionOpener(reply)).toBe(false);
    expect(reply.toLowerCase()).toContain('family');
    expect(reply).toContain('quick_replies');
    expect(reply).toContain('Find her here');
  });

  it('uses Swiss High German without ß', () => {
    const reply = buildPeopleFirstReply({ roleKey: 'mother', roleSurface: 'mutter' }, 'de');
    expect(reply).toContain('weiss');
    expect(reply).not.toMatch(/ß/);
    expect(reply).toContain('Family starten');
    expect(reply).toContain('/send');
  });

  it('deep-links to real money and people surfaces', () => {
    const reply = buildPeopleFirstReply({ roleKey: 'mother', roleSurface: 'mother' }, 'en');
    expect(reply).toContain('/dashboard/people');
    expect(reply).toContain('/discover?type=profiles');
    expect(reply).toContain('/send');
    expect(reply).toContain('Open Send');
  });
});
