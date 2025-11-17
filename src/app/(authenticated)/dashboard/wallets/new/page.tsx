'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { WalletBehaviorType, WalletCategory, WALLET_CATEGORIES, getWalletBehaviorInfo } from '@/types/wallet';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewWalletPage() {
  const { profile } = useAuth();
  const router = useRouter();

  // Form state
  const [behaviorType, setBehaviorType] = useState<WalletBehaviorType>('general');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [addressOrXpub, setAddressOrXpub] = useState('');
  const [category, setCategory] = useState<WalletCategory>('general');

  // Budget fields
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Goal fields
  const [goalAmount, setGoalAmount] = useState('');
  const [goalCurrency, setGoalCurrency] = useState('USD');
  const [goalDeadline, setGoalDeadline] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!profile?.id) {
      setError('You must be logged in to create a wallet');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        profile_id: profile.id,
        label,
        description: description || undefined,
        address_or_xpub: addressOrXpub,
        category,
        behavior_type: behaviorType,
      };

      // Add behavior-specific fields
      if (behaviorType === 'recurring_budget') {
        payload.budget_amount = parseFloat(budgetAmount);
        payload.budget_period = budgetPeriod;
      } else if (behaviorType === 'one_time_goal') {
        payload.goal_amount = parseFloat(goalAmount);
        payload.goal_currency = goalCurrency;
        if (goalDeadline) {
          payload.goal_deadline = goalDeadline;
        }
      }

      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create wallet');
      }

      // Success! Redirect to wallets page
      router.push('/dashboard/wallets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/wallets"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Wallets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Wallet</h1>
          <p className="mt-2 text-gray-600">
            Create a new Bitcoin wallet for your profile
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Wallet Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of wallet do you need?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['general', 'recurring_budget', 'one_time_goal'] as WalletBehaviorType[]).map(type => {
                const info = getWalletBehaviorInfo(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBehaviorType(type)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      behaviorType === type
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{info.icon}</div>
                    <div className="font-semibold text-gray-900 mb-1">{info.label}</div>
                    <div className="text-xs text-gray-600">{info.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wallet Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Name *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Rent Fund, Laptop Savings, General"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WalletCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.entries(WALLET_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this wallet..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">{description.length}/500</p>
          </div>

          {/* Bitcoin Address or xpub */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitcoin Address or Extended Public Key (xpub) *
            </label>
            <input
              type="text"
              value={addressOrXpub}
              onChange={(e) => setAddressOrXpub(e.target.value)}
              placeholder="bc1q... or xpub..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Supports: Legacy (1...), SegWit (3.../bc1q...), Taproot (bc1p...), or xpub for privacy
            </p>
          </div>

          {/* Recurring Budget Fields */}
          {behaviorType === 'recurring_budget' && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Budget Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Amount *
                  </label>
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="500"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={behaviorType === 'recurring_budget'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period *
                  </label>
                  <select
                    value={budgetPeriod}
                    onChange={(e) => setBudgetPeriod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={behaviorType === 'recurring_budget'}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* One-Time Goal Fields */}
          {behaviorType === 'one_time_goal' && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Goal Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Amount *
                  </label>
                  <input
                    type="number"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    placeholder="3000"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={behaviorType === 'one_time_goal'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    value={goalCurrency}
                    onChange={(e) => setGoalCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={behaviorType === 'one_time_goal'}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="BTC">BTC</option>
                    <option value="SATS">Satoshis</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Deadline (optional)
                </label>
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Link
              href="/dashboard/wallets"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Wallet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
