'use client';

import { useState } from 'react';
import { Wallet } from '@/types/wallet';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  sourceWallet?: Wallet;
  onTransferComplete?: () => void;
}

export function TransferModal({
  isOpen,
  onClose,
  wallets,
  sourceWallet,
  onTransferComplete,
}: TransferModalProps) {
  const [fromWalletId, setFromWalletId] = useState(sourceWallet?.id || '');
  const [toWalletId, setToWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const BTC_PRICE_USD = 62000;

  const fromWallet = wallets.find(w => w.id === fromWalletId);
  const toWallet = wallets.find(w => w.id === toWalletId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromWalletId || !toWalletId) {
      setError('Please select both source and destination wallets');
      return;
    }

    if (fromWalletId === toWalletId) {
      setError('Cannot transfer to the same wallet');
      return;
    }

    const amountBtc = parseFloat(amount);
    if (isNaN(amountBtc) || amountBtc <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (fromWallet && amountBtc > fromWallet.balance_btc) {
      setError('Insufficient balance');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/wallets/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_wallet_id: fromWalletId,
          to_wallet_id: toWalletId,
          amount_btc: amountBtc,
          note: note || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      // Success!
      onTransferComplete?.();
      onClose();

      // Reset form
      setAmount('');
      setNote('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Transfer Between Wallets</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Wallet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Wallet
            </label>
            <select
              value={fromWalletId}
              onChange={(e) => setFromWalletId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting || !!sourceWallet}
              required
            >
              <option value="">Select wallet</option>
              {wallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.category_icon} {wallet.label} ({wallet.balance_btc.toFixed(8)} BTC)
                </option>
              ))}
            </select>
            {fromWallet && (
              <p className="mt-1 text-sm text-gray-500">
                Available: {fromWallet.balance_btc.toFixed(8)} BTC (~${(fromWallet.balance_btc * BTC_PRICE_USD).toFixed(2)})
              </p>
            )}
          </div>

          {/* To Wallet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Wallet
            </label>
            <select
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            >
              <option value="">Select wallet</option>
              {wallets
                .filter(w => w.id !== fromWalletId)
                .map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.category_icon} {wallet.label} ({wallet.balance_btc.toFixed(8)} BTC)
                  </option>
                ))}
            </select>
            {toWallet && (
              <p className="mt-1 text-sm text-gray-500">
                Current: {toWallet.balance_btc.toFixed(8)} BTC (~${(toWallet.balance_btc * BTC_PRICE_USD).toFixed(2)})
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (BTC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.00000001"
              min="0"
              max={fromWallet?.balance_btc || undefined}
              placeholder="0.00000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            />
            {amount && !isNaN(parseFloat(amount)) && (
              <p className="mt-1 text-sm text-gray-500">
                ≈ ${(parseFloat(amount) * BTC_PRICE_USD).toFixed(2)} USD
              </p>
            )}
            {fromWallet && (
              <button
                type="button"
                onClick={() => setAmount(fromWallet.balance_btc.toFixed(8))}
                className="mt-1 text-sm text-blue-600 hover:text-blue-700"
                disabled={isSubmitting}
              >
                Use max
              </button>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this transfer..."
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-400">{note.length}/500</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Preview */}
          {fromWallet && toWallet && amount && !isNaN(parseFloat(amount)) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900 font-medium mb-2">Transfer Preview:</p>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>{fromWallet.label}:</span>
                  <span>
                    {fromWallet.balance_btc.toFixed(8)} → {(fromWallet.balance_btc - parseFloat(amount)).toFixed(8)} BTC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{toWallet.label}:</span>
                  <span>
                    {toWallet.balance_btc.toFixed(8)} → {(toWallet.balance_btc + parseFloat(amount)).toFixed(8)} BTC
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !fromWalletId || !toWalletId || !amount}
            >
              {isSubmitting ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
