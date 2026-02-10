'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Bitcoin, Zap, Copy, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import { convert, formatCurrency } from '@/services/currency';

interface AddressCardProps {
  type: 'bitcoin' | 'lightning';
  address: string;
  label: string;
  description: string;
}

function AddressCard({ type, address, label, description }: AddressCardProps) {
  const Icon = type === 'bitcoin' ? Bitcoin : Zap;
  const isBitcoin = type === 'bitcoin';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    toast.success(`${label} address copied to clipboard`);
  };

  // Click address to copy (one click)
  const handleAddressClick = () => {
    copyToClipboard();
  };

  // Open wallet app directly (bitcoin: URI scheme)
  const openInWallet = () => {
    if (isBitcoin) {
      const bitcoinUri = `bitcoin:${address}`;
      window.location.href = bitcoinUri;
      // Fallback: show toast if wallet doesn't open
      setTimeout(() => {
        toast.info("If your wallet didn't open, copy the address and paste it manually");
      }, 500);
    } else {
      // Lightning: copy invoice
      copyToClipboard();
      toast.info('Lightning invoice copied. Paste it in your Lightning wallet');
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 p-6 ${isBitcoin ? 'border-orange-200' : 'border-yellow-200'}`}
      data-bitcoin-card={isBitcoin ? 'true' : undefined}
      data-lightning-card={!isBitcoin ? 'true' : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${isBitcoin ? 'text-orange-600' : 'text-yellow-600'}`} />
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{label}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>

      {/* QR Code - Always Visible */}
      <div className="flex justify-center mb-4">
        <div className="bg-white p-3 rounded-lg border-2 border-gray-200 shadow-sm">
          <QRCodeSVG
            value={isBitcoin ? `bitcoin:${address}` : address}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Address - Clickable to Copy */}
      <div
        className="bg-gray-50 rounded-lg p-3 mb-3 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
        onClick={handleAddressClick}
        title="Click to copy address"
      >
        <code className="text-xs font-mono text-gray-900 break-all select-all">{address}</code>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Primary: Open in Wallet (one click) */}
        {isBitcoin && (
          <Button
            onClick={openInWallet}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Send with Wallet
          </Button>
        )}

        {/* Secondary: Copy Address */}
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className={`w-full ${isBitcoin ? 'border-orange-300 hover:bg-orange-50' : 'border-yellow-300 hover:bg-yellow-50'}`}
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy Address
        </Button>
      </div>
    </div>
  );
}

interface BitcoinDonationCardProps {
  bitcoinAddress?: string;
  lightningAddress?: string;
  balance?: number; // in satoshis
  className?: string;
}

export default function BitcoinDonationCard({
  bitcoinAddress,
  lightningAddress,
  balance,
  className = '',
}: BitcoinDonationCardProps) {
  const userCurrency = useUserCurrency();

  if (!bitcoinAddress && !lightningAddress) {
    return null;
  }

  // Format balance in user's preferred currency
  const formatBalance = (balanceSats: number) => {
    const displayAmount = convert(balanceSats, 'SATS', userCurrency);
    return formatCurrency(displayAmount, userCurrency, { compact: true });
  };

  return (
    <div
      className={`bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-orange-500" />
            Accept Bitcoin Funding
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">Send Bitcoin directly to this profile</p>
        </div>
        {balance !== undefined && balance > 0 && (
          <div className="text-right">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="text-sm font-bold text-gray-900">{formatBalance(balance)}</div>
            <div className="text-xs text-gray-400">
              ≈ {formatCurrency(balance, 'SATS', { compact: true })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {bitcoinAddress && (
          <AddressCard
            type="bitcoin"
            address={bitcoinAddress}
            label="Bitcoin"
            description="On-chain"
          />
        )}
        {lightningAddress && (
          <AddressCard
            type="lightning"
            address={lightningAddress}
            label="Lightning"
            description="Instant payments"
          />
        )}
      </div>
    </div>
  );
}
