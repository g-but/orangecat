/**
 * Cat groundedness + agent-core mirror integrity.
 *
 * Two jobs:
 *
 * 1. Assert the mirror in src/services/agent-core/ is byte-identical to
 *    FleetCrown's canonical copy. The harness is duplicated rather than
 *    packaged (see agent-core/README.md); duplication is only safe if
 *    divergence cannot be committed by accident. Two copies of "what counts as
 *    grounded", quietly disagreeing, would make the two assistants wrong in
 *    different ways — worse than the single failure this all exists to fix.
 *    Skipped when FleetCrown is not checked out beside this repo (CI clones one
 *    repo at a time), which is why the same gate exists on the FleetCrown side.
 *
 * 2. Assert Cat's grounding mode does the two things it must do at once: catch
 *    an invented attribute about one of the USER'S OWN records, while leaving
 *    general economic knowledge alone. A check that flags "Lightning" gets
 *    switched off within a week, and then protects nothing.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { verifyAnswer } from '@/services/agent-core/verify';
import { buildAssistantRules, NO_BASIS } from '@/services/agent-core/contract';

const MIRROR = join(process.cwd(), 'src', 'services', 'agent-core');
const CANONICAL =
  process.env.FLEETCROWN_DIR ??
  join(process.cwd(), '..', 'fleetcrown', 'src', 'lib', 'agent', 'core');

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

describe('agent-core mirror', () => {
  const canonicalPresent = existsSync(CANONICAL);
  const testIfPresent = canonicalPresent ? it : it.skip;

  testIfPresent('is byte-identical to FleetCrown’s canonical copy', () => {
    const mirrorFiles = readdirSync(MIRROR).sort();
    const canonicalFiles = readdirSync(CANONICAL).sort();
    expect(mirrorFiles).toEqual(canonicalFiles);
    for (const f of canonicalFiles) {
      expect({ file: f, hash: sha(readFileSync(join(MIRROR, f), 'utf8')) }).toEqual({
        file: f,
        hash: sha(readFileSync(join(CANONICAL, f), 'utf8')),
      });
    }
  });
});

describe('Cat grounding rules', () => {
  it('forbids inferring an affiliation and claiming research', () => {
    const rules = buildAssistantRules({
      subjectNoun: 'profile, entities, contacts and transactions',
    });
    expect(rules).toMatch(/not their employer/i);
    expect(rules).toMatch(/have not browsed the web/i);
    expect(rules).toContain(NO_BASIS);
  });

  it('explicitly permits general economic knowledge', () => {
    const rules = buildAssistantRules({ subjectNoun: 'entities' });
    expect(rules).toMatch(/General knowledge/);
  });
});

describe('Cat groundedness check (entity-attribution mode)', () => {
  // Stand-ins for what prepareCatChat passes: the rendered context as evidence,
  // and the user's own record names as subjects.
  const subjects = ['Elena Weber SINGA Switzerland', 'Coffee Roastery'];
  const evidence = [
    'CONTACTS: Elena Weber SINGA Switzerland (whatsapp +41774730093)\nENTITIES: Coffee Roastery (product, 0.001 BTC)',
  ];

  it('passes general payment advice that names no user record', () => {
    const r = verifyAnswer({
      answer:
        'You can accept Bitcoin over the Lightning Network. Twint is common in Switzerland, and PayPal works internationally.',
      facts: [],
      userMessage: 'how should I accept payment?',
      extraEvidence: evidence,
      mode: 'entity-attribution',
      subjects,
    });
    expect(r.violations).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('catches an invented employer for one of the user’s contacts', () => {
    const r = verifyAnswer({
      answer: 'Elena Weber SINGA Switzerland is a Program Manager at Impact Hub Zurich — ask her.',
      facts: [],
      userMessage: 'who should I ask about funding?',
      extraEvidence: evidence,
      mode: 'entity-attribution',
      subjects,
    });
    expect(r.ok).toBe(false);
    expect(r.violations.some(v => /Impact Hub/i.test(v.text))).toBe(true);
  });

  it('passes a claim that quotes what the context actually stores', () => {
    const r = verifyAnswer({
      answer: `Elena Weber SINGA Switzerland — whatsapp +41774730093. Her role: ${NO_BASIS}`,
      facts: [],
      userMessage: 'who should I ask about funding?',
      extraEvidence: evidence,
      mode: 'entity-attribution',
      subjects,
    });
    expect(r.violations).toEqual([]);
  });
});
