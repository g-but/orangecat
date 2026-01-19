import { createServerClient } from '@/lib/supabase/server';
import {
  deriveAddressFromXpub,
  deriveAddressBatch,
  isValidXpub,
  getXpubInfo,
  type DerivedAddress,
  type NetworkName,
} from '@/lib/bitcoin';

/**
 * Address Derivation Service
 *
 * Provides cache-aware address derivation from extended public keys.
 * Uses the wallet_addresses table to cache derived addresses for performance.
 */

export interface WalletAddress {
  id: string;
  wallet_id: string;
  address: string;
  derivation_path: string;
  chain: number;
  address_index: number;
  address_type: string;
  is_used: boolean;
  created_at: string;
  updated_at?: string;
}

// Table name constant for wallet_addresses
const WALLET_ADDRESSES_TABLE = 'wallet_addresses';

// Type for insert/update operations (wallet_addresses table may not be in generated types)
type WalletAddressInsert = Omit<WalletAddress, 'id' | 'created_at' | 'updated_at'>;

// Helper type for Supabase query results
type QueryResult<T> = { data: T; error: unknown };

export interface DeriveAddressOptions {
  xpub: string;
  walletId: string;
  chain?: 0 | 1;
  index?: number;
  network?: NetworkName;
  useCache?: boolean;
}

export interface GapLimitOptions {
  xpub: string;
  walletId: string;
  chain?: 0 | 1;
  gapLimit?: number;
  network?: NetworkName;
}

/**
 * Get or derive an address, using cache when available
 */
export async function getOrDeriveAddress(
  options: DeriveAddressOptions
): Promise<DerivedAddress & { cached: boolean }> {
  const { xpub, walletId, chain = 0, index = 0, network, useCache = true } = options;

  // Validate the xpub first
  if (!isValidXpub(xpub)) {
    const info = getXpubInfo(xpub);
    throw new Error(`Invalid extended public key: ${info.error || 'Unknown format'}`);
  }

  const supabase = await createServerClient();

  // Try to get from cache first
  if (useCache) {
    const { data: cachedAddress } = (await supabase
      .from(WALLET_ADDRESSES_TABLE)
      .select('*')
      .eq('wallet_id', walletId)
      .eq('chain', chain)
      .eq('address_index', index)
      .single()) as QueryResult<WalletAddress | null>;

    if (cachedAddress) {
      return {
        address: cachedAddress.address,
        path: cachedAddress.derivation_path,
        chain: cachedAddress.chain as 0 | 1,
        index: cachedAddress.address_index,
        addressType: cachedAddress.address_type as DerivedAddress['addressType'],
        cached: true,
      };
    }
  }

  // Derive the address
  const derived = deriveAddressFromXpub(xpub, chain, index, network);

  // Cache the derived address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(WALLET_ADDRESSES_TABLE) as any).upsert({
    wallet_id: walletId,
    address: derived.address,
    derivation_path: derived.path,
    chain: derived.chain,
    address_index: derived.index,
    address_type: derived.addressType,
    is_used: false,
  } as WalletAddressInsert);

  if (error) {
    console.error('[AddressDerivation] Failed to cache address:', error);
    // Don't throw - address derivation succeeded even if caching failed
  }

  return {
    ...derived,
    cached: false,
  };
}

/**
 * Get the next unused address for a wallet
 * Implements gap limit discovery to find the next unused address
 */
export async function getNextUnusedAddress(
  options: GapLimitOptions
): Promise<DerivedAddress & { cached: boolean }> {
  const { xpub, walletId, chain = 0, network } = options;

  const supabase = await createServerClient();

  // Find the highest used index
  const { data: usedAddresses } = (await supabase
    .from(WALLET_ADDRESSES_TABLE)
    .select('address_index')
    .eq('wallet_id', walletId)
    .eq('chain', chain)
    .eq('is_used', true)
    .order('address_index', { ascending: false })
    .limit(1)) as QueryResult<Pick<WalletAddress, 'address_index'>[] | null>;

  const highestUsedIndex = usedAddresses?.[0]?.address_index ?? -1;
  const startIndex = highestUsedIndex + 1;

  // Check if we have cached addresses beyond the highest used
  const { data: cachedAddresses } = (await supabase
    .from(WALLET_ADDRESSES_TABLE)
    .select('*')
    .eq('wallet_id', walletId)
    .eq('chain', chain)
    .eq('is_used', false)
    .gte('address_index', startIndex)
    .order('address_index', { ascending: true })
    .limit(1)) as QueryResult<WalletAddress[] | null>;

  if (cachedAddresses && cachedAddresses.length > 0) {
    const cached = cachedAddresses[0];
    return {
      address: cached.address,
      path: cached.derivation_path,
      chain: cached.chain as 0 | 1,
      index: cached.address_index,
      addressType: cached.address_type as DerivedAddress['addressType'],
      cached: true,
    };
  }

  // No cached unused address, derive new one
  return getOrDeriveAddress({
    xpub,
    walletId,
    chain,
    index: startIndex,
    network,
    useCache: true,
  });
}

/**
 * Pre-derive addresses up to a certain index for gap limit compliance
 */
export async function preDeriveAddresses(options: GapLimitOptions): Promise<DerivedAddress[]> {
  const { xpub, walletId, chain = 0, gapLimit = 20, network } = options;

  if (!isValidXpub(xpub)) {
    throw new Error('Invalid extended public key');
  }

  const supabase = await createServerClient();

  // Find existing highest index
  const { data: existingAddresses } = (await supabase
    .from(WALLET_ADDRESSES_TABLE)
    .select('address_index')
    .eq('wallet_id', walletId)
    .eq('chain', chain)
    .order('address_index', { ascending: false })
    .limit(1)) as QueryResult<Pick<WalletAddress, 'address_index'>[] | null>;

  const startIndex = (existingAddresses?.[0]?.address_index ?? -1) + 1;

  // Batch derive addresses
  const derivedAddresses = deriveAddressBatch(xpub, chain, startIndex, gapLimit, network);

  // Batch insert into cache
  const addressRecords: WalletAddressInsert[] = derivedAddresses.map(addr => ({
    wallet_id: walletId,
    address: addr.address,
    derivation_path: addr.path,
    chain: addr.chain,
    address_index: addr.index,
    address_type: addr.addressType,
    is_used: false,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(WALLET_ADDRESSES_TABLE) as any).upsert(addressRecords, {
    onConflict: 'wallet_id,chain,address_index',
  });

  if (error) {
    console.error('[AddressDerivation] Failed to cache batch addresses:', error);
  }

  return derivedAddresses;
}

/**
 * Mark an address as used
 */
export async function markAddressUsed(walletId: string, address: string): Promise<void> {
  const supabase = await createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(WALLET_ADDRESSES_TABLE) as any)
    .update({ is_used: true, updated_at: new Date().toISOString() })
    .eq('wallet_id', walletId)
    .eq('address', address);

  if (error) {
    console.error('[AddressDerivation] Failed to mark address as used:', error);
    throw new Error('Failed to mark address as used');
  }
}

/**
 * Get all addresses for a wallet
 */
export async function getWalletAddresses(
  walletId: string,
  chain?: 0 | 1
): Promise<WalletAddress[]> {
  const supabase = await createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from(WALLET_ADDRESSES_TABLE) as any)
    .select('*')
    .eq('wallet_id', walletId)
    .order('chain', { ascending: true })
    .order('address_index', { ascending: true });

  if (chain !== undefined) {
    query = query.eq('chain', chain);
  }

  const { data, error } = (await query) as QueryResult<WalletAddress[] | null>;

  if (error) {
    console.error('[AddressDerivation] Failed to get wallet addresses:', error);
    throw new Error('Failed to get wallet addresses');
  }

  return data || [];
}

/**
 * Check if an address belongs to a wallet
 */
export async function isWalletAddress(walletId: string, address: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data } = (await supabase
    .from(WALLET_ADDRESSES_TABLE)
    .select('id')
    .eq('wallet_id', walletId)
    .eq('address', address)
    .single()) as QueryResult<Pick<WalletAddress, 'id'> | null>;

  return !!data;
}

/**
 * Get address details by address string
 */
export async function getAddressByString(address: string): Promise<WalletAddress | null> {
  const supabase = await createServerClient();

  const { data, error } = (await supabase
    .from(WALLET_ADDRESSES_TABLE)
    .select('*')
    .eq('address', address)
    .single()) as QueryResult<WalletAddress | null>;

  if (error || !data) {
    return null;
  }

  return data;
}
