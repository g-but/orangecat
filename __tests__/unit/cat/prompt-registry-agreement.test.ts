/**
 * The prompt and the action registry must describe the same action.
 *
 * There are three places an action's shape is written down — the prompt (what
 * Cat is told to emit), CAT_ACTIONS (the declared contract) and the handler
 * (what actually reads the parameters) — and on 2026-08-06 all three disagreed:
 *
 *   send_payment  prompt said `message`, handler reads `params.memo`
 *                 → every note a user dictated was silently dropped and
 *                   replaced with "Payment via My Cat"
 *   create_task   handler supports `priority`, prompt never mentioned it
 *                 → Cat could not set a priority at creation
 *   post_to_timeline  handler reads `visibility`, registry never declared it
 *   send_message / invite_to_group
 *                 registry demanded ids Cat cannot possibly know
 *
 * None of it was detectable at runtime: an unknown parameter is not rejected,
 * it is ignored, so the failure is a missing note rather than an error. This
 * test is the thing that makes the drift visible, because nothing else can.
 */

import { BASE_SYSTEM_PROMPT_FOR_TEST } from '@/services/cat/system-prompt';
import { CAT_ACTIONS } from '@/config/cat-actions';

const prompt = BASE_SYSTEM_PROMPT_FOR_TEST;

/** Parameter names the prompt advertises in a `**id(a, b?, c?)**` signature. */
function advertisedParams(actionId: string): string[] | null {
  const m = prompt.match(new RegExp(`\\*\\*${actionId}\\(([^)]*)\\)\\*\\*`));
  if (!m) {
    return null;
  }
  return m[1]
    .split(',')
    .map(p => p.trim().replace(/\?$/, ''))
    .filter(Boolean);
}

const enabled = Object.values(CAT_ACTIONS).filter(a => a.enabled);
const withSignature = enabled.filter(a => advertisedParams(a.id) !== null);

describe('prompt and registry agree on every action', () => {
  it('finds signatures to check (guards against a vacuous pass)', () => {
    // If the catalog format changes and nothing matches, this test would
    // otherwise "pass" by checking nothing at all.
    expect(withSignature.length).toBeGreaterThan(10);
  });

  it.each(withSignature.map(a => a.id))(
    '%s advertises only parameters the registry declares',
    id => {
      const declared = new Set(CAT_ACTIONS[id].parameters.map(p => p.name));
      const invented = (advertisedParams(id) ?? []).filter(p => !declared.has(p));
      expect(invented).toEqual([]);
    }
  );

  it.each(withSignature.map(a => a.id))('%s advertises every REQUIRED parameter', id => {
    const advertised = new Set(advertisedParams(id) ?? []);
    const missing = CAT_ACTIONS[id].parameters
      .filter(p => p.required)
      .map(p => p.name)
      .filter(name => !advertised.has(name));
    // A required parameter Cat is never told about is a call it cannot make.
    expect(missing).toEqual([]);
  });
});
