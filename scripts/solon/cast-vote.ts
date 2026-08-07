/**
 * Cast the Cat's Bitcoin-signed vote on a Solon session — from this box, with
 * this system's own key. A vote cast here is OrangeCat's attested judgment;
 * the private key never leaves the environment.
 *
 * v1 casts are operator-run. Later policy-driven voting reuses this as its
 * `executed` step — nothing here is throwaway.
 *
 * Usage (on the box, where CAT_SOLON_PRIVKEY is set):
 *   npx tsx scripts/solon/cast-vote.ts --session <sessionId> --choice yes|no|abstain
 */
import { parseArgs } from 'node:util';
import {
  addressFromPrivateKey,
  signBitcoinMessage,
  solonVoteMessage,
} from '../../src/services/solon/bitcoin-message';
import { SOLON_BASE_URL_DEFAULT } from '../../src/config/solon';

const { values } = parseArgs({
  options: {
    session: { type: 'string' },
    choice: { type: 'string' },
  },
});

async function main() {
  const { session, choice } = values;
  if (!session || !choice || !['yes', 'no', 'abstain'].includes(choice)) {
    console.error('required: --session <sessionId> --choice yes|no|abstain');
    process.exit(1);
  }
  const privateKey = process.env.CAT_SOLON_PRIVKEY;
  if (!privateKey) {
    console.error('CAT_SOLON_PRIVKEY is not set — the Cat votes only from its own environment');
    process.exit(1);
  }

  const address = addressFromPrivateKey(privateKey);
  const message = solonVoteMessage({ sessionId: session, choice, memberAddress: address });
  const signature = signBitcoinMessage(message, privateKey);
  const base = process.env.SOLON_BASE_URL || SOLON_BASE_URL_DEFAULT;

  console.log(`voting as ${address} (the Cat) on session ${session}: ${choice}`);
  const res = await fetch(`${base}/api/sessions/${encodeURIComponent(session)}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choice, address, signature }),
  });
  const verdict = await res.json();
  console.log(JSON.stringify(verdict, null, 2));
  if (!verdict.stored) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
