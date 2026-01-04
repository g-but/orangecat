/**
 * Wallets Mobile Guidance
 *
 * Mobile guidance modal and floating help button.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { HelpCircle } from 'lucide-react';
import { DynamicSidebar } from '@/components/create/DynamicSidebar';
import {
  walletGuidanceContent,
  walletDefaultContent,
  type WalletFieldType,
} from '@/lib/wallet-guidance';

interface WalletsMobileGuidanceProps {
  focusedField: WalletFieldType;
  showMobileGuidance: boolean;
  onShowMobileGuidance: (show: boolean) => void;
}

export function WalletsMobileGuidance({
  focusedField,
  showMobileGuidance,
  onShowMobileGuidance,
}: WalletsMobileGuidanceProps) {
  if (!focusedField) {
    return null;
  }

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => onShowMobileGuidance(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-bitcoinOrange to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        aria-label="Get help with this field"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Guidance Modal */}
      {showMobileGuidance && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
          onClick={() => onShowMobileGuidance(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Wallet Help & Guidance</h3>
              <button
                onClick={() => onShowMobileGuidance(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <DynamicSidebar<NonNullable<WalletFieldType>>
                activeField={focusedField}
                guidanceContent={walletGuidanceContent}
                defaultContent={walletDefaultContent}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}


