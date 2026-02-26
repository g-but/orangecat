/**
 * Invoice Generation Service
 *
 * Creates invoices using the resolved payment method:
 * - NWC: make_invoice via Nostr Wallet Connect
 * - Lightning Address: LNURL-pay protocol
 * - On-chain: BIP21 URI
 */

import { NWCClient } from '@/lib/nostr/nwc';
import type { ResolvedWallet } from './types';
import { logger } from '@/utils/logger';

export interface GeneratedInvoice {
  /** BOLT11 invoice string (Lightning) or null (on-chain) */
  bolt11: string | null;
  /** Payment hash for NWC lookups */
  payment_hash: string | null;
  /** On-chain BTC address */
  onchain_address: string | null;
  /** QR code data (bolt11 uppercased, or bitcoin: URI) */
  qr_data: string;
  /** When the invoice expires (ISO string) */
  expires_at: string | null;
}

const LIGHTNING_INVOICE_EXPIRY_SECS = 3600; // 1 hour

/**
 * Generate an invoice for a payment using the resolved wallet.
 */
export async function generateInvoice(
  wallet: ResolvedWallet,
  amountSats: number,
  description: string
): Promise<GeneratedInvoice> {
  switch (wallet.method) {
    case 'nwc':
      return generateNWCInvoice(wallet.nwc_uri!, amountSats, description);

    case 'lightning_address':
      return generateLightningAddressInvoice(wallet.lightning_address!, amountSats, description);

    case 'onchain':
      return generateOnchainInvoice(wallet.onchain_address!, amountSats, description);

    default:
      throw new Error(`Unsupported payment method: ${wallet.method}`);
  }
}

/**
 * NWC: Create invoice via Nostr Wallet Connect relay
 */
async function generateNWCInvoice(
  nwcUri: string,
  amountSats: number,
  description: string
): Promise<GeneratedInvoice> {
  const client = new NWCClient(nwcUri);

  try {
    await client.connect();
    const invoice = await client.makeInvoice(
      amountSats,
      description,
      LIGHTNING_INVOICE_EXPIRY_SECS
    );

    const expiresAt = new Date(Date.now() + LIGHTNING_INVOICE_EXPIRY_SECS * 1000).toISOString();

    return {
      bolt11: invoice.invoice,
      payment_hash: invoice.payment_hash,
      onchain_address: null,
      qr_data: invoice.invoice.toUpperCase(), // Uppercase for QR efficiency
      expires_at: expiresAt,
    };
  } catch (error) {
    logger.error('NWC invoice generation failed', { error });
    throw new Error('Failed to generate Lightning invoice via NWC');
  } finally {
    client.disconnect();
  }
}

/**
 * Lightning Address: Fetch invoice via LNURL-pay protocol
 */
async function generateLightningAddressInvoice(
  lightningAddress: string,
  amountSats: number,
  description: string
): Promise<GeneratedInvoice> {
  // Step 1: Resolve Lightning Address to LNURL-pay endpoint
  // Lightning address format: user@domain.com -> https://domain.com/.well-known/lnurlp/user
  const [user, domain] = lightningAddress.split('@');
  if (!user || !domain) {
    throw new Error(`Invalid Lightning Address: ${lightningAddress}`);
  }

  const lnurlpUrl = `https://${domain}/.well-known/lnurlp/${user}`;

  // Step 2: Fetch LNURL-pay metadata
  const metaResponse = await fetch(lnurlpUrl);
  if (!metaResponse.ok) {
    throw new Error(`LNURL-pay endpoint returned ${metaResponse.status}`);
  }

  const meta = await metaResponse.json();

  if (meta.tag !== 'payRequest') {
    throw new Error('LNURL endpoint is not a pay request');
  }

  const amountMsats = amountSats * 1000;

  // Validate amount is within bounds
  if (amountMsats < meta.minSendable || amountMsats > meta.maxSendable) {
    throw new Error(
      `Amount ${amountSats} sats is outside allowed range: ${meta.minSendable / 1000}-${meta.maxSendable / 1000} sats`
    );
  }

  // Step 3: Request invoice from callback URL
  const callbackUrl = new URL(meta.callback);
  callbackUrl.searchParams.set('amount', amountMsats.toString());
  if (description) {
    callbackUrl.searchParams.set('comment', description);
  }

  const invoiceResponse = await fetch(callbackUrl.toString());
  if (!invoiceResponse.ok) {
    throw new Error(`LNURL callback returned ${invoiceResponse.status}`);
  }

  const invoiceData = await invoiceResponse.json();

  if (!invoiceData.pr) {
    throw new Error('LNURL callback did not return a payment request');
  }

  return {
    bolt11: invoiceData.pr,
    payment_hash: null, // LNURL-pay doesn't always return payment_hash directly
    onchain_address: null,
    qr_data: invoiceData.pr.toUpperCase(),
    expires_at: new Date(Date.now() + LIGHTNING_INVOICE_EXPIRY_SECS * 1000).toISOString(),
  };
}

/**
 * On-chain: Generate BIP21 URI for QR code
 */
async function generateOnchainInvoice(
  address: string,
  amountSats: number,
  description: string
): Promise<GeneratedInvoice> {
  const amountBtc = amountSats / 100_000_000;

  // BIP21 format: bitcoin:<address>?amount=<btc>&label=<description>
  const params = new URLSearchParams();
  params.set('amount', amountBtc.toFixed(8));
  if (description) {
    params.set('label', description);
  }

  const bip21Uri = `bitcoin:${address}?${params.toString()}`;

  return {
    bolt11: null,
    payment_hash: null,
    onchain_address: address,
    qr_data: bip21Uri,
    // On-chain payments don't have a hard expiry, but we set a soft one
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
}
