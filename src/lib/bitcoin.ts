import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory, { BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';

// Initialize bip32 with secp256k1
const bip32 = BIP32Factory(ecc);

export type NetworkName = 'mainnet' | 'testnet';

export type AddressType = 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh';

export interface DerivedAddress {
  address: string;
  path: string;
  chain: 0 | 1;
  index: number;
  addressType: AddressType;
}

export function getBitcoinNetwork(name?: string): bitcoin.Network {
  return name === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
}

/**
 * Detect the extended public key type from its prefix
 * - xpub/tpub: Standard BIP44 (P2PKH - Legacy addresses starting with 1)
 * - ypub/upub: BIP49 (P2SH-P2WPKH - SegWit wrapped, starting with 3)
 * - zpub/vpub: BIP84 (P2WPKH - Native SegWit, starting with bc1q)
 */
export function detectXpubType(xpub: string): {
  addressType: AddressType;
  network: NetworkName;
} {
  const prefix = xpub.substring(0, 4);

  switch (prefix) {
    case 'xpub':
      return { addressType: 'p2pkh', network: 'mainnet' };
    case 'tpub':
      return { addressType: 'p2pkh', network: 'testnet' };
    case 'ypub':
      return { addressType: 'p2sh-p2wpkh', network: 'mainnet' };
    case 'upub':
      return { addressType: 'p2sh-p2wpkh', network: 'testnet' };
    case 'zpub':
      return { addressType: 'p2wpkh', network: 'mainnet' };
    case 'vpub':
      return { addressType: 'p2wpkh', network: 'testnet' };
    default:
      throw new Error(`Unknown extended public key prefix: ${prefix}`);
  }
}

/**
 * Version bytes for different extended key types
 */
const VERSION_BYTES = {
  mainnet: {
    xpub: 0x0488b21e,
    ypub: 0x049d7cb2,
    zpub: 0x04b24746,
  },
  testnet: {
    tpub: 0x043587cf,
    upub: 0x044a5262,
    vpub: 0x045f1cf6,
  },
};

/**
 * Convert ypub/zpub to standard xpub format for BIP32 parsing
 * BIP32 library only understands xpub/tpub format, so we need to convert
 */
export function convertToStandardXpub(xpub: string, network: NetworkName): string {
  const prefix = xpub.substring(0, 4);

  // If already standard format, return as-is
  if (prefix === 'xpub' || prefix === 'tpub') {
    return xpub;
  }

  // Decode the extended key
  const decoded = bitcoin.address.fromBase58Check(xpub);
  const data = decoded.hash;

  // Get the target version bytes
  const targetVersion =
    network === 'mainnet' ? VERSION_BYTES.mainnet.xpub : VERSION_BYTES.testnet.tpub;

  // Create new buffer with standard version
  const buffer = Buffer.alloc(78);
  buffer.writeUInt32BE(targetVersion, 0);
  data.copy(buffer, 4);

  // Re-encode with standard prefix
  return bitcoin.address.toBase58Check(buffer.slice(4), targetVersion >> 24);
}

/**
 * Derive a child node from an extended public key
 */
function deriveChildNode(
  xpub: string,
  chain: 0 | 1,
  index: number,
  network: bitcoin.Network
): BIP32Interface {
  // Convert to standard xpub if needed
  const { network: detectedNetwork } = detectXpubType(xpub);
  const standardXpub = convertToStandardXpub(xpub, detectedNetwork);

  // Parse the extended public key
  const node = bip32.fromBase58(standardXpub, network);

  // Derive: chain / index
  // chain 0 = external (receiving addresses)
  // chain 1 = internal (change addresses)
  return node.derive(chain).derive(index);
}

/**
 * Derive P2PKH (Legacy) address from public key
 * Addresses start with '1' on mainnet, 'm' or 'n' on testnet
 */
function deriveP2PKHAddress(pubkey: Buffer, network: bitcoin.Network): string {
  const { address } = bitcoin.payments.p2pkh({
    pubkey,
    network,
  });

  if (!address) {
    throw new Error('Failed to derive P2PKH address');
  }

  return address;
}

/**
 * Derive P2SH-P2WPKH (SegWit wrapped) address from public key
 * Addresses start with '3' on mainnet, '2' on testnet
 */
function deriveP2SHAddress(pubkey: Buffer, network: bitcoin.Network): string {
  const { address } = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({ pubkey, network }),
    network,
  });

  if (!address) {
    throw new Error('Failed to derive P2SH-P2WPKH address');
  }

  return address;
}

/**
 * Derive P2WPKH (Native SegWit) address from public key
 * Addresses start with 'bc1q' on mainnet, 'tb1q' on testnet
 */
function deriveP2WPKHAddress(pubkey: Buffer, network: bitcoin.Network): string {
  const { address } = bitcoin.payments.p2wpkh({
    pubkey,
    network,
  });

  if (!address) {
    throw new Error('Failed to derive P2WPKH address');
  }

  return address;
}

/**
 * Main function to derive an address from an extended public key
 * Automatically detects the address type from the xpub prefix
 *
 * @param xpub - Extended public key (xpub, ypub, zpub, tpub, upub, vpub)
 * @param chain - 0 for external (receiving), 1 for internal (change)
 * @param index - Address index
 * @param networkName - Optional network override (defaults to detected from prefix)
 * @returns Derived address object with address, path, and metadata
 */
export function deriveAddressFromXpub(
  xpub: string,
  chain: 0 | 1,
  index: number,
  networkName?: NetworkName
): DerivedAddress {
  // Detect type and network from prefix
  const { addressType, network: detectedNetwork } = detectXpubType(xpub);
  const network = getBitcoinNetwork(networkName ?? detectedNetwork);

  // Derive the child node
  const childNode = deriveChildNode(xpub, chain, index, network);
  // Convert Uint8Array to Buffer for bitcoinjs-lib compatibility
  const pubkey = Buffer.from(childNode.publicKey);

  // Derive the appropriate address type
  let address: string;

  switch (addressType) {
    case 'p2pkh':
      address = deriveP2PKHAddress(pubkey, network);
      break;
    case 'p2sh-p2wpkh':
      address = deriveP2SHAddress(pubkey, network);
      break;
    case 'p2wpkh':
      address = deriveP2WPKHAddress(pubkey, network);
      break;
  }

  return {
    address,
    path: `m/${chain}/${index}`,
    chain,
    index,
    addressType,
  };
}

/**
 * Derive P2WPKH address from xpub (backward compatibility)
 * For zpub keys, this will work correctly
 * For xpub/ypub keys, it will derive native SegWit regardless of prefix
 */
export function deriveP2WPKHFromXpub(
  xpub: string,
  chain: 0 | 1,
  index: number,
  networkName?: NetworkName
): string {
  const { network: detectedNetwork } = detectXpubType(xpub);
  const network = getBitcoinNetwork(networkName ?? detectedNetwork);

  // Derive the child node
  const childNode = deriveChildNode(xpub, chain, index, network);

  // Always derive P2WPKH regardless of xpub type
  // Convert Uint8Array to Buffer for bitcoinjs-lib compatibility
  return deriveP2WPKHAddress(Buffer.from(childNode.publicKey), network);
}

/**
 * Batch derive multiple addresses from an extended public key
 * Useful for gap limit discovery and address scanning
 *
 * @param xpub - Extended public key
 * @param chain - 0 for external (receiving), 1 for internal (change)
 * @param startIndex - Starting index
 * @param count - Number of addresses to derive
 * @param networkName - Optional network override
 * @returns Array of derived addresses
 */
export function deriveAddressBatch(
  xpub: string,
  chain: 0 | 1,
  startIndex: number,
  count: number,
  networkName?: NetworkName
): DerivedAddress[] {
  const addresses: DerivedAddress[] = [];

  for (let i = 0; i < count; i++) {
    addresses.push(deriveAddressFromXpub(xpub, chain, startIndex + i, networkName));
  }

  return addresses;
}

/**
 * Validate an extended public key format
 */
export function isValidXpub(xpub: string): boolean {
  try {
    detectXpubType(xpub);
    const { network: detectedNetwork } = detectXpubType(xpub);
    const standardXpub = convertToStandardXpub(xpub, detectedNetwork);
    const network = getBitcoinNetwork(detectedNetwork);
    bip32.fromBase58(standardXpub, network);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get information about an extended public key
 */
export function getXpubInfo(xpub: string): {
  isValid: boolean;
  addressType?: AddressType;
  network?: NetworkName;
  error?: string;
} {
  try {
    const { addressType, network } = detectXpubType(xpub);
    const standardXpub = convertToStandardXpub(xpub, network);
    const bitcoinNetwork = getBitcoinNetwork(network);
    bip32.fromBase58(standardXpub, bitcoinNetwork);

    return {
      isValid: true,
      addressType,
      network,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
