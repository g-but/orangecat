'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import WalletRecommendationCards from '@/components/wallets/WalletRecommendationCards';

/**
 * Wallets Page
 *
 * Public page helping users find and get a Bitcoin wallet.
 * Features the new WalletRecommendationCards component with filtering.
 */
export default function WalletsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Get a Bitcoin Wallet</h1>
        <p className="text-gray-600 mt-2">
          No wallet yet? Start here. Pick a beginner-friendly option and you'll be ready in minutes.
        </p>
      </div>

      {/* Wallet Recommendation Cards with Filtering */}
      <WalletRecommendationCards />

      {/* Educational Section */}
      <div className="mt-10 p-6 rounded-lg bg-orange-50 border border-orange-200">
        <h4 className="font-semibold text-gray-900 mb-2">What is a wallet?</h4>
        <p className="text-sm text-gray-700 mb-3">
          A Bitcoin wallet lets you receive donations. It gives you a Bitcoin address (looks like
          bc1...) and often a Lightning address (looks like email). You control it. We don't keep
          your funds.
        </p>
        <div className="text-sm text-gray-700">
          <div className="mb-1">
            • On-chain address: starts with bc1, slower, best for larger amounts.
          </div>
          <div className="mb-1">
            • Lightning address: looks like email, instant and low-fee, great for small donations.
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 text-center">
        <Link href="/create">
          <Button>Done — Create my project</Button>
        </Link>
      </div>
    </div>
  );
}

