'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import type { PaymentStatus } from '@/services/bitcoin/types';
import type { Invoice } from './LightningPayment';

interface LightningInvoiceDisplayProps {
  invoice: Invoice;
  paymentStatus: PaymentStatus | 'checking';
  timeLeft: number | null;
  copied: boolean;
  nwcConnected: boolean;
  onCopy: () => void;
  onReset: () => void;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function LightningInvoiceDisplay({
  invoice,
  paymentStatus,
  timeLeft,
  copied,
  nwcConnected,
  onCopy,
  onReset,
}: LightningInvoiceDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Payment Amount */}
      <div className="text-center">
        <CurrencyDisplay
          amount={invoice.amount}
          currency="SATS"
          className="text-xl font-semibold"
        />
        {invoice.description && <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>}
      </div>

      {/* QR Code */}
      {paymentStatus !== 'expired' && (
        <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-lg">
          <QRCodeSVG
            value={invoice.bolt11.toUpperCase()}
            size={200}
            level="M"
            includeMargin={true}
          />
        </div>
      )}

      {/* Invoice String */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Lightning Invoice</label>
        <div className="flex gap-2">
          <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <code className="text-xs text-gray-600 break-all font-mono">{invoice.bolt11}</code>
          </div>
          <Button
            onClick={onCopy}
            variant="outline"
            size="sm"
            className={copied ? 'bg-green-50 text-green-700 border-green-200' : ''}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Open in Wallet */}
      <div className="flex gap-2">
        <Button
          onClick={() => window.open(`lightning:${invoice.bolt11}`, '_blank')}
          className="flex-1"
          disabled={paymentStatus === 'expired'}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in Wallet
        </Button>
      </div>

      {/* Reset Button */}
      {(paymentStatus === 'expired' || paymentStatus === 'failed') && (
        <Button onClick={onReset} variant="outline" className="w-full">
          Generate New Invoice
        </Button>
      )}

      {/* Timer */}
      {timeLeft !== null && timeLeft > 0 && (
        <div className="text-center text-sm text-gray-500">
          Invoice expires in {formatTime(timeLeft)}
        </div>
      )}

      {/* Payment polling indicator */}
      {paymentStatus === 'pending' && nwcConnected && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Waiting for payment...
        </div>
      )}
    </div>
  );
}
