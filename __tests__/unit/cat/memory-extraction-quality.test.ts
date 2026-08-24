/**
 * Memory extraction quality — the "send btc to my mother" → "Has a mother"
 * regression. Cheap free-pool models will still invent junk; the gate + filter
 * must reject it before insert so it never surfaces as "Cat noted".
 */

import { isWorthRemembering, looksLikeSelfDisclosure, parseFacts } from '@/services/cat/memory';

describe('looksLikeSelfDisclosure', () => {
  it('rejects payment / action requests even when they contain "my"', () => {
    expect(looksLikeSelfDisclosure('send btc to my motehr')).toBe(false);
    expect(looksLikeSelfDisclosure('Send 0.01 BTC to my mother')).toBe(false);
    expect(looksLikeSelfDisclosure('please pay my landlord')).toBe(false);
    expect(looksLikeSelfDisclosure('can you transfer sats to my friend')).toBe(false);
    expect(looksLikeSelfDisclosure('help me send bitcoin to mom')).toBe(false);
    expect(looksLikeSelfDisclosure('I want to send BTC to my mother')).toBe(false);
  });

  it('still accepts real durable disclosures', () => {
    expect(looksLikeSelfDisclosure('I prefer Lightning over on-chain')).toBe(true);
    expect(looksLikeSelfDisclosure('My workshop is in Basel')).toBe(true);
    expect(looksLikeSelfDisclosure('Remember that I speak Italian')).toBe(true);
    expect(looksLikeSelfDisclosure('I prefer Lightning when I send money to family')).toBe(true);
  });

  it('rejects short noise', () => {
    expect(looksLikeSelfDisclosure('hi')).toBe(false);
    expect(looksLikeSelfDisclosure('ok thanks')).toBe(false);
  });
});

describe('isWorthRemembering', () => {
  it('rejects bare kinship existence claims', () => {
    expect(isWorthRemembering('Has a mother')).toBe(false);
    expect(isWorthRemembering('Has a father')).toBe(false);
    expect(isWorthRemembering('Has parents')).toBe(false);
    expect(isWorthRemembering('Has a family')).toBe(false);
    expect(isWorthRemembering('Has a sister')).toBe(false);
  });

  it('rejects transient payment intents', () => {
    expect(isWorthRemembering('Wants to send Bitcoin to mother')).toBe(false);
    expect(isWorthRemembering('Sending payment to mother')).toBe(false);
    expect(isWorthRemembering('Planning to transfer sats')).toBe(false);
  });

  it('keeps named / detailed relationships and real preferences', () => {
    expect(isWorthRemembering('Sister Maya handles bookkeeping')).toBe(true);
    expect(isWorthRemembering('Prefers Lightning over on-chain payments')).toBe(true);
    expect(isWorthRemembering('Based in Zürich')).toBe(true);
    expect(isWorthRemembering('Mother lives in Bern and prefers Lightning')).toBe(true);
  });
});

describe('parseFacts', () => {
  it('drops junk the model emitted for a payment turn', () => {
    expect(parseFacts('["Has a mother", "Wants to send Bitcoin"]')).toEqual([]);
  });

  it('keeps durable facts and drops mixed junk in the same array', () => {
    expect(
      parseFacts('["Has a mother", "Prefers Lightning over on-chain payments", "Based in Zürich"]')
    ).toEqual(['Prefers Lightning over on-chain payments', 'Based in Zürich']);
  });
});
