/**
 * Per-invoice address derivation from an extended public key.
 *
 * An xpub is not an address — it is the key you derive addresses FROM. This
 * module is the derivation that was always meant to exist (`bip32` and
 * `bitcoinjs-lib` sat unused in package.json), and it is what makes on-chain
 * settlement detection sound: matching a payment by (address, amount, time
 * window) can only be trusted when the address is unique to that payment.
 * With a reused static address, a stranger's transaction is indistinguishable
 * from the payment we are waiting for — that exact false-settle happened in
 * production (see bug_onchain_detection_reused_address).
 *
 * The prefix encodes the script type the wallet expects (BIP44/49/84 account
 * conventions). Deriving the wrong type would send money to an address the
 * recipient's wallet never scans, so the mapping is explicit and exhaustive:
 *
 *   xpub → BIP44 P2PKH        (legacy, 1...)
 *   ypub → BIP49 P2SH-P2WPKH  (wrapped segwit, 3...)
 *   zpub → BIP84 P2WPKH       (native segwit, bc1q...)
 *
 * Mainnet only — testnet prefixes (tpub/upub/vpub) are rejected, because a
 * testnet address shown to a mainnet payer is money lost either way.
 *
 * Derivation is public-key-only (non-hardened, external chain 0/index): the
 * platform can mint receiving addresses but can never spend. That is the
 * non-custodial property, preserved by construction.
 */

import { BIP32Factory, type BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

type ExtendedKeyScheme = 'bip44' | 'bip49' | 'bip84';

/**
 * bip32 validates the version bytes against the network it is given, so each
 * prefix gets a network descriptor carrying its SLIP-132 version bytes — no
 * base58 re-encoding needed. Everything except bip32.public/private is
 * irrelevant to parsing and inherited from mainnet.
 */
const SCHEMES: Record<string, { scheme: ExtendedKeyScheme; network: bitcoin.networks.Network }> = {
  xpub: { scheme: 'bip44', network: bitcoin.networks.bitcoin },
  ypub: {
    scheme: 'bip49',
    network: {
      ...bitcoin.networks.bitcoin,
      bip32: { public: 0x049d7cb2, private: 0x049d7878 },
    },
  },
  zpub: {
    scheme: 'bip84',
    network: {
      ...bitcoin.networks.bitcoin,
      bip32: { public: 0x04b24746, private: 0x04b2430c },
    },
  },
};

const bip32 = BIP32Factory(ecc);

function parseAccountKey(extendedKey: string): { node: BIP32Interface; scheme: ExtendedKeyScheme } {
  const entry = SCHEMES[extendedKey.slice(0, 4)];
  if (!entry) {
    throw new Error(
      `Unsupported extended key prefix: ${extendedKey.slice(0, 4)} (mainnet xpub/ypub/zpub only)`
    );
  }
  return { node: bip32.fromBase58(extendedKey, entry.network), scheme: entry.scheme };
}

function addressFor(scheme: ExtendedKeyScheme, publicKey: Uint8Array): string {
  const pubkey = Buffer.from(publicKey);
  switch (scheme) {
    case 'bip44':
      return bitcoin.payments.p2pkh({ pubkey }).address!;
    case 'bip49':
      return bitcoin.payments.p2sh({ redeem: bitcoin.payments.p2wpkh({ pubkey }) }).address!;
    case 'bip84':
      return bitcoin.payments.p2wpkh({ pubkey }).address!;
  }
}

/**
 * Derive receiving address `index` on the external chain (0/index) of an
 * account-level extended public key.
 *
 * Pure and synchronous — index allocation (the stateful part) lives in the
 * database (`allocate_derivation_index`), so two concurrent invoices can never
 * mint the same address.
 */
export function deriveOnchainAddress(extendedKey: string, index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= 0x80000000) {
    throw new Error(`Derivation index out of range: ${index}`);
  }
  const { node, scheme } = parseAccountKey(extendedKey.trim());
  const child = node.derive(0).derive(index);
  return addressFor(scheme, child.publicKey);
}
