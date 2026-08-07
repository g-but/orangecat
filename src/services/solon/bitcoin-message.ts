/**
 * Bitcoin signed-message VERIFICATION — OrangeCat's independent port of
 * Solon's src/lib/bitcoin/message.ts (verify side only; OrangeCat never
 * signs). This must exist here, not be fetched from Solon: the whole point of
 * decision verification is that OrangeCat checks signatures with its own
 * code against its own pinned keys. Pinned to Solon's implementation by a
 * fixed test vector generated there (__tests__/unit/solon/decision-verify).
 *
 * Format (Bitcoin Core / Electrum "Signed Message"):
 *   magic    = "\x18Bitcoin Signed Message:\n"
 *   preimage = magic || varint(len(msg)) || msg
 *   digest   = sha256(sha256(preimage))
 *   sig      = base64( header(1) || r(32) || s(32) ), BIP137 headers 27–42.
 * For compressed keys the claimed address is matched against P2PKH, P2WPKH
 * (bech32) and P2SH-P2WPKH derivations — covers Sparrow/Core segwit headers
 * AND Electrum's legacy-header-on-segwit quirk.
 */
import * as secp from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { bech32 } from '@scure/base';
import bs58check from 'bs58check';

const MAGIC = new TextEncoder().encode('Bitcoin Signed Message:\n');

function varint(n: number): Uint8Array {
  if (n < 0xfd) {
    return Uint8Array.of(n);
  }
  if (n <= 0xffff) {
    return Uint8Array.of(0xfd, n & 0xff, (n >> 8) & 0xff);
  }
  return Uint8Array.of(0xfe, n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff);
}

function messageDigest(message: string): Uint8Array {
  const msg = new TextEncoder().encode(message);
  const preimage = secp.etc.concatBytes(
    Uint8Array.of(MAGIC.length),
    MAGIC,
    varint(msg.length),
    msg
  );
  return sha256(sha256(preimage));
}

function hash160(bytes: Uint8Array): Uint8Array {
  return ripemd160(sha256(bytes));
}

function p2pkhAddress(pubkey: Uint8Array): string {
  return bs58check.encode(secp.etc.concatBytes(Uint8Array.of(0x00), hash160(pubkey)));
}

function p2wpkhAddress(pubkey: Uint8Array): string {
  const words = [0, ...bech32.toWords(hash160(pubkey))];
  return bech32.encode('bc', words);
}

function p2shP2wpkhAddress(pubkey: Uint8Array): string {
  const redeemScript = secp.etc.concatBytes(Uint8Array.of(0x00, 0x14), hash160(pubkey));
  return bs58check.encode(secp.etc.concatBytes(Uint8Array.of(0x05), hash160(redeemScript)));
}

export interface VerifyResult {
  valid: boolean;
  recoveredAddress?: string;
  reason?: string;
}

export function verifyBitcoinMessage(
  message: string,
  address: string,
  signatureBase64: string
): VerifyResult {
  let raw: Buffer;
  try {
    raw = Buffer.from(signatureBase64, 'base64');
  } catch {
    return { valid: false, reason: 'signature is not valid base64' };
  }
  if (raw.length !== 65) {
    return { valid: false, reason: `signature must be 65 bytes, got ${raw.length}` };
  }

  const header = raw[0];
  if (header < 27 || header > 42) {
    return { valid: false, reason: `invalid header byte ${header}` };
  }
  const compressed = header >= 31;
  const recovery = (header - 27) & 0x03;

  try {
    const digest = messageDigest(message);
    const sig = secp.Signature.fromCompact(raw.subarray(1)).addRecoveryBit(recovery);
    const point = sig.recoverPublicKey(digest);
    const pub = point.toRawBytes(compressed);

    const candidates = compressed
      ? [p2pkhAddress(pub), p2wpkhAddress(pub), p2shP2wpkhAddress(pub)]
      : [p2pkhAddress(pub)];
    const valid = candidates.includes(address);
    return {
      valid,
      recoveredAddress: candidates[0],
      ...(valid ? {} : { reason: 'recovered key does not derive the claimed address' }),
    };
  } catch (e) {
    return { valid: false, reason: e instanceof Error ? e.message : 'recovery failed' };
  }
}

/**
 * The canonical vote message a Solon member signs — must stay byte-identical
 * to Solon's voteMessage() (pinned by the shared test vector). Re-deriving it
 * here (instead of trusting the document's signedMessage string alone) is what
 * binds a vote to THIS session, THIS choice, and THIS voter.
 */
export function solonVoteMessage(params: {
  sessionId: string;
  choice: string;
  memberAddress: string;
}): string {
  return `Solon vote\nsession:${params.sessionId}\nchoice:${params.choice}\nvoter:${params.memberAddress}`;
}
