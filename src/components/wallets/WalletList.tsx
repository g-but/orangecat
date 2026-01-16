'use client';

import { useState } from 'react';
import { Wallet, getWalletBehaviorInfo, formatCurrency, calculateProgress } from '@/types/wallet';

interface WalletListProps {
  wallets: Wallet[];
  onRefresh?: () => void;
  onTransfer?: (wallet: Wallet) => void;
}

export function WalletList({ wallets, onRefresh: _onRefresh, onTransfer }: WalletListProps) {
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);

  // Assume BTC price for now (in production, fetch from API)
  const BTC_PRICE_USD = 62000;

  const toggleExpand = (walletId: string) => {
    setExpandedWalletId(expandedWalletId === walletId ? null : walletId);
  };

  const formatBtc = (amount: number) => {
    return amount.toFixed(8);
  };

  const formatUsd = (btc: number) => {
    return formatCurrency(btc * BTC_PRICE_USD, 'USD');
  };

  // Group wallets by behavior type
  const generalWallets = wallets.filter(w => w.behavior_type === 'general');
  const budgetWallets = wallets.filter(w => w.behavior_type === 'recurring_budget');
  const goalWallets = wallets.filter(w => w.behavior_type === 'one_time_goal');

  const renderWalletCard = (wallet: Wallet) => {
    const isExpanded = expandedWalletId === wallet.id;
    const behaviorInfo = getWalletBehaviorInfo(wallet.behavior_type);
    const _usdValue = wallet.balance_btc * BTC_PRICE_USD;

    return (
      <div
        key={wallet.id}
        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleExpand(wallet.id)}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{wallet.category_icon}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{wallet.label}</h3>
                {wallet.is_primary && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Primary
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{behaviorInfo.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">{formatBtc(wallet.balance_btc)} BTC</p>
            <p className="text-sm text-gray-500">{formatUsd(wallet.balance_btc)}</p>
          </div>
        </div>

        {/* Progress bar for goals */}
        {wallet.behavior_type === 'one_time_goal' && wallet.goal_amount && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>
                {formatUsd(wallet.balance_btc)} /{' '}
                {formatCurrency(wallet.goal_amount, wallet.goal_currency || 'USD')}
              </span>
              <span>
                {calculateProgress(wallet.balance_btc * BTC_PRICE_USD, wallet.goal_amount).toFixed(
                  1
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(calculateProgress(wallet.balance_btc * BTC_PRICE_USD, wallet.goal_amount), 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Budget info for recurring budgets */}
        {wallet.behavior_type === 'recurring_budget' && wallet.budget_amount && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Budget: {formatCurrency(wallet.budget_amount, wallet.budget_period || 'USD')}
              </span>
              <span className="text-xs text-gray-500">{wallet.budget_period || 'monthly'}</span>
            </div>
          </div>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {wallet.description && <p className="text-sm text-gray-600">{wallet.description}</p>}

            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Address:</span>
                <span className="font-mono">{wallet.address_or_xpub.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span>
                  {wallet.wallet_type === 'xpub' ? 'Extended Public Key' : 'Single Address'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span>{wallet.category}</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              {onTransfer && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onTransfer(wallet);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Transfer
                </button>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(wallet.address_or_xpub);
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Copy Address
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (wallets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No wallets yet. Create your first wallet to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <p className="text-sm opacity-90">Total Balance Across All Wallets</p>
        <p className="text-3xl font-bold mt-1">
          {formatBtc(wallets.reduce((sum, w) => sum + w.balance_btc, 0))} BTC
        </p>
        <p className="text-lg opacity-90">
          {formatUsd(wallets.reduce((sum, w) => sum + w.balance_btc, 0))}
        </p>
      </div>

      {/* Recurring Budgets */}
      {budgetWallets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🔄</span>
            Recurring Budgets ({budgetWallets.length})
          </h3>
          <div className="space-y-3">{budgetWallets.map(renderWalletCard)}</div>
        </div>
      )}

      {/* Savings Goals */}
      {goalWallets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Savings Goals ({goalWallets.length})
          </h3>
          <div className="space-y-3">{goalWallets.map(renderWalletCard)}</div>
        </div>
      )}

      {/* General Wallets */}
      {generalWallets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">💰</span>
            General Wallets ({generalWallets.length})
          </h3>
          <div className="space-y-3">{generalWallets.map(renderWalletCard)}</div>
        </div>
      )}
    </div>
  );
}
