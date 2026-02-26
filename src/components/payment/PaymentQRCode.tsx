/**
 * PaymentQRCode — Displays QR code with copy-to-clipboard
 *
 * Shows a QR code for Lightning bolt11 or on-chain BIP21 URI,
 * with a "Copy" button and "Open in wallet" deep link.
 */

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaymentQRCodeProps {
  /** QR data string (bolt11 uppercased or bitcoin: URI) */
  qrData: string;
  /** Human-readable payment method label */
  methodLabel: string;
  /** Amount in sats */
  amountSats: number;
  /** Size of the QR code in pixels */
  size?: number;
}

export function PaymentQRCode({ qrData, methodLabel, amountSats, size = 256 }: PaymentQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const isLightning = qrData.startsWith('LN') || qrData.startsWith('ln');
  const copyText = isLightning ? qrData.toLowerCase() : qrData;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Deep link to open in a Lightning wallet
  const walletLink = isLightning ? `lightning:${qrData.toLowerCase()}` : qrData; // bitcoin: URIs are already deep-linkable

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-500">{methodLabel}</p>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="M"
          includeMargin
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>

      <p className="text-lg font-semibold">{amountSats.toLocaleString()} sats</p>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="min-h-11">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Invoice
            </>
          )}
        </Button>

        <Button variant="outline" size="sm" href={walletLink} className="min-h-11">
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in Wallet
        </Button>
      </div>
    </div>
  );
}
