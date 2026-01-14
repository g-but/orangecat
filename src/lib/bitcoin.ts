import * as bitcoin from 'bitcoinjs-lib'

export type NetworkName = 'mainnet' | 'testnet'

export function getBitcoinNetwork(name?: string) {
  return name === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
}

/**
 * Derive P2WPKH address from xpub
 * Note: This function requires the 'bip32' and 'tiny-secp256k1' packages
 * which are not currently installed. Install them with:
 * npm install bip32 tiny-secp256k1
 */
export function deriveP2WPKHFromXpub(
  _xpub: string,
  _chain: 0 | 1,
  _index: number,
  _networkName?: NetworkName
): string {
  // TODO: Install bip32 and tiny-secp256k1 packages to enable this functionality
  // In bitcoinjs-lib v6+, bip32 is a separate package
  throw new Error(
    'deriveP2WPKHFromXpub is not available. Install bip32 and tiny-secp256k1 packages.'
  )
}

