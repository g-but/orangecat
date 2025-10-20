import * as bitcoin from 'bitcoinjs-lib'

export type NetworkName = 'mainnet' | 'testnet'

export function getBitcoinNetwork(name?: string) {
  return name === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
}

export function deriveP2WPKHFromXpub(xpub: string, chain: 0 | 1, index: number, networkName?: NetworkName) {
  const network = getBitcoinNetwork(networkName)
  const node = bitcoin.bip32.fromBase58(xpub, network)
  const child = node.derive(chain).derive(index)
  const payment = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network })
  if (!payment.address) throw new Error('Failed to derive address')
  return payment.address
}

