/**
 * How a wallet is paid — resolved once, rendered everywhere.
 *
 * A wallet row carries at most one usable public handle: an on-chain address /
 * xpub, a Lightning address, or neither (a wallet connection, whose secret is
 * never public). Surfaces that assumed "there is always an on-chain address"
 * rendered `bitcoin:null` QR codes and empty "Bitcoin Address" blocks for
 * Lightning wallets — on the public profile, to would-be supporters. One
 * resolver, so the dashboard card and the public profile cannot drift.
 */

export type WalletReceiveKind = 'onchain' | 'lightning' | 'connection';

export interface WalletReceiveHandle {
  kind: WalletReceiveKind;
  /** Field label, e.g. "Lightning Address". */
  label: string;
  /** The public handle itself, or null when there is nothing to show or copy. */
  value: string | null;
  /** URI to encode in a QR, or null when there is nothing scannable. */
  qrValue: string | null;
}

interface WalletHandleFields {
  address_or_xpub?: string | null;
  lightning_address?: string | null;
  wallet_type?: string | null;
}

export function getWalletReceiveHandle(wallet: WalletHandleFields): WalletReceiveHandle {
  if (wallet.address_or_xpub) {
    return {
      kind: 'onchain',
      label: wallet.wallet_type === 'xpub' ? 'Extended Public Key' : 'Bitcoin Address',
      value: wallet.address_or_xpub,
      // An xpub is not a payable address — encoding it as bitcoin: would produce
      // a QR that wallets reject, so only a plain address gets one.
      qrValue: wallet.wallet_type === 'xpub' ? null : `bitcoin:${wallet.address_or_xpub}`,
    };
  }

  if (wallet.lightning_address) {
    return {
      kind: 'lightning',
      label: 'Lightning Address',
      value: wallet.lightning_address,
      qrValue: `lightning:${wallet.lightning_address}`,
    };
  }

  return {
    kind: 'connection',
    label: 'Connected wallet',
    value: null,
    qrValue: null,
  };
}
