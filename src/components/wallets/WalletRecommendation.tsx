/**
 * WalletRecommendation Component
 *
 * Main component for wallet recommendations.
 * Logic extracted to useWalletRecommendation hook,
 * form and results to separate components.
 */

'use client';

import { Bitcoin } from 'lucide-react';
import { useWalletRecommendation, UserPreferences } from './useWalletRecommendation';
import { WalletPreferencesForm } from './WalletPreferencesForm';
import { WalletResultsView } from './WalletResultsView';

export type { UserPreferences };

export default function WalletRecommendation() {
  const { preferences, updatePreference, showResults, setShowResults, recommendations } =
    useWalletRecommendation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Bitcoin className="w-8 h-8 text-bitcoinOrange" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Wallet Recommendations</h1>
                <p className="text-sm text-gray-600">Find the perfect wallet for your needs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <WalletPreferencesForm
            preferences={preferences}
            onPreferenceChange={updatePreference}
            onSubmit={() => setShowResults(true)}
          />
        ) : (
          <WalletResultsView
            recommendations={recommendations}
            onChangePreferences={() => setShowResults(false)}
          />
        )}
      </div>
    </div>
  );
}
