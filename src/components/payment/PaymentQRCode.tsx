/**
 * PaymentQRCode — Displays QR code with copy-to-clipboard
 *
 * Shows a QR code for Lightning bolt11 or on-chain BIP21 URI,
 * with a "Copy" button, "Open in wallet" deep link, countdown timer,
 * and fiat equivalent display.
 */

'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ExternalLink, Timer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface PaymentQRCodeProps {
  /** QR data string (bolt11 uppercased or bitcoin: URI) */
  qrData: string;
  /** Human-readable payment method label */
  methodLabel: string;
  /** Amount in sats */
  amountSats: number;
  /** Size of the QR code in pixels */
  size?: number;
  /** Seconds until this invoice expires */
  expiresInSeconds?: number;
}

export function PaymentQRCode({
  qrData,
  methodLabel,
  amountSats,
  size = 256,
  expiresInSeconds,
}: PaymentQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds ?? 0);
  const { formatAmount, prefersFiat } = useDisplayCurrency();

  // Live countdown timer
  useEffect(() => {
    if (!expiresInSeconds || expiresInSeconds <= 0) {
      return;
    }
    setSecondsLeft(expiresInSeconds);

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresInSeconds]);

  const isLightning = qrData.startsWith('LN') || qrData.startsWith('ln');
  const copyText = isLightning ? qrData.toLowerCase() : qrData;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Deep link to open in a Lightning wallet
  const walletLink = isLightning ? `lightning:${qrData.toLowerCase()}` : qrData;

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

      {/* Amount display with fiat equivalent */}
      <div className="text-center">
        <p className="text-lg font-semibold">{amountSats.toLocaleString()} sats</p>
        {prefersFiat && <p className="text-sm text-gray-500">{formatAmount(amountSats)}</p>}
      </div>

      {/* Countdown timer */}
      {expiresInSeconds && secondsLeft > 0 && (
        <p
          className={`flex items-center gap-1 text-xs ${secondsLeft < 60 ? 'text-red-500' : 'text-gray-400'}`}
        >
          <Timer className="h-3 w-3" />
          Expires in {formatCountdown(secondsLeft)}
        </p>
      )}

      {/* Action buttons — wallet link first on mobile (can't scan own screen) */}
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button variant="primary" size="sm" href={walletLink} className="min-h-11 sm:order-2">
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in Wallet
        </Button>

        <Button variant="outline" size="sm" onClick={handleCopy} className="min-h-11 sm:order-1">
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
      </div>
    </div>
  );
}
