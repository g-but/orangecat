/**
 * MissingWalletBanner Component
 *
 * Displays a prominent banner on project pages when the Bitcoin address is missing.
 * Prompts the project owner to add their wallet to start receiving funding.
 *
 * Purpose: Convert demo projects into active fundraising campaigns.
 *
 * @module components/project
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Wallet, AlertCircle, X, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';

interface MissingWalletBannerProps {
  projectId: string;
  isOwner: boolean;
  className?: string;
}

/**
 * Banner prompting project owners to add a Bitcoin address
 */
export default function MissingWalletBanner({
  projectId,
  isOwner,
  className = '',
}: MissingWalletBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show to project owners
  if (!isOwner || isDismissed) {
    return null;
  }

  return (
    <div
      className={`bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-5 h-5 text-orange-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Add Your Bitcoin Address to Start Receiving Funding
            </h3>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-700 mb-4">
            Your project is live, but you can't receive funding yet! Add your Bitcoin or Lightning
            address so supporters can contribute.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href={ROUTES.PROJECTS.EDIT(projectId)}>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                <Wallet className="w-4 h-4 mr-2" />
                Add Wallet Address
              </Button>
            </Link>

            <Link href="/wallets" target="_blank">
              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get a Wallet First
              </Button>
            </Link>
          </div>

          {/* Info */}
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
            <p>
              <strong>Self-custodial:</strong> Funding goes directly to your wallet. No KYC, no
              middleman.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
