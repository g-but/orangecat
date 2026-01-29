'use client';

import { useState, useMemo } from 'react';
import { Smartphone, Monitor, Zap, Shield, ExternalLink, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Wallet data structure
 */
interface Wallet {
  name: string;
  description: string;
  platform: 'mobile' | 'desktop';
  level: 'beginner' | 'advanced';
  lightning: boolean;
  custodial: boolean;
  downloadLinks?: {
    ios?: string;
    android?: string;
  };
  website: string;
  recommended: boolean;
}

/**
 * Filter state
 */
interface Filters {
  platform: ('mobile' | 'desktop')[];
  level: ('beginner' | 'advanced')[];
  lightning: boolean;
}

// Wallet data - defined outside component to prevent recreation on each render
const WALLETS: Wallet[] = [
  {
    name: 'BlueWallet',
    description: 'Best all-around mobile wallet with easy Lightning and on-chain support',
    platform: 'mobile',
    level: 'beginner',
    lightning: true,
    custodial: false,
    downloadLinks: {
      ios: 'https://apps.apple.com/app/bluewallet-bitcoin-wallet/id1376878040',
      android: 'https://play.google.com/store/apps/details?id=io.bluewallet.bluewallet',
    },
    website: 'https://bluewallet.io',
    recommended: true,
  },
  {
    name: 'Phoenix Wallet',
    description: 'Simple mobile Lightning wallet with automatic channel management',
    platform: 'mobile',
    level: 'beginner',
    lightning: true,
    custodial: false,
    downloadLinks: {
      ios: 'https://apps.apple.com/app/phoenix-wallet/id6449854979',
      android: 'https://phoenix.acinq.co',
    },
    website: 'https://phoenix.acinq.co',
    recommended: true,
  },
  {
    name: 'Breez',
    description: 'Non-custodial Lightning wallet with creator tools and instant payments',
    platform: 'mobile',
    level: 'beginner',
    lightning: true,
    custodial: false,
    downloadLinks: {
      ios: 'https://apps.apple.com/app/breez-lightning-client-pos/id1473040547',
      android: 'https://play.google.com/store/apps/details?id=com.breez.client',
    },
    website: 'https://breez.technology',
    recommended: false,
  },
  {
    name: 'Electrum',
    description: 'Powerful, lightweight desktop wallet with advanced features',
    platform: 'desktop',
    level: 'advanced',
    lightning: false,
    custodial: false,
    website: 'https://electrum.org',
    downloadLinks: {},
    recommended: false,
  },
  {
    name: 'Sparrow Wallet',
    description: 'Privacy-focused desktop wallet with CoinJoin and full control',
    platform: 'desktop',
    level: 'advanced',
    lightning: false,
    custodial: false,
    website: 'https://sparrowwallet.com',
    downloadLinks: {},
    recommended: false,
  },
];

/**
 * WalletRecommendationCards Component
 *
 * Displays beautiful, modern cards for recommended non-custodial Bitcoin wallets
 * with built-in filtering UI. All wallets are non-custodial by design.
 *
 * Features:
 * - Real-time filtering by platform, level, and Lightning support
 * - Recommended wallets shown first when no filters active
 * - Responsive grid layout (1 col mobile, 2-3 cols desktop)
 * - Modern Tailwind styling matching OrangeCat's orange/white aesthetic
 */
export default function WalletRecommendationCards() {
  // Filter state
  const [filters, setFilters] = useState<Filters>({
    platform: [],
    level: [],
    lightning: false,
  });

  /**
   * Toggle platform filter
   */
  const togglePlatform = (platform: 'mobile' | 'desktop') => {
    setFilters(prev => ({
      ...prev,
      platform: prev.platform.includes(platform)
        ? prev.platform.filter(p => p !== platform)
        : [...prev.platform, platform],
    }));
  };

  /**
   * Toggle level filter
   */
  const toggleLevel = (level: 'beginner' | 'advanced') => {
    setFilters(prev => ({
      ...prev,
      level: prev.level.includes(level)
        ? prev.level.filter(l => l !== level)
        : [...prev.level, level],
    }));
  };

  /**
   * Toggle Lightning filter
   */
  const toggleLightning = () => {
    setFilters(prev => ({
      ...prev,
      lightning: !prev.lightning,
    }));
  };

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setFilters({
      platform: [],
      level: [],
      lightning: false,
    });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return filters.platform.length > 0 || filters.level.length > 0 || filters.lightning;
  }, [filters]);

  /**
   * Filter and sort wallets
   */
  const filteredWallets = useMemo(() => {
    const result = WALLETS.filter(wallet => {
      // Platform filter
      if (filters.platform.length > 0 && !filters.platform.includes(wallet.platform)) {
        return false;
      }

      // Level filter
      if (filters.level.length > 0 && !filters.level.includes(wallet.level)) {
        return false;
      }

      // Lightning filter
      if (filters.lightning && !wallet.lightning) {
        return false;
      }

      return true;
    });

    // Sort: recommended first when no filters, then alphabetically
    if (!hasActiveFilters) {
      result.sort((a, b) => {
        if (a.recommended && !b.recommended) {
          return -1;
        }
        if (!a.recommended && b.recommended) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [filters, hasActiveFilters]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Find the perfect Bitcoin wallet for receiving funding
        </h2>
        <p className="text-gray-600">
          All recommendations are non-custodial — you control your keys. We connect directly for
          transparent autoposting.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Platform Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Platform:</span>
            <button
              onClick={() => togglePlatform('mobile')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filters.platform.includes('mobile')
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              )}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
            <button
              onClick={() => togglePlatform('desktop')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filters.platform.includes('desktop')
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              )}
            >
              <Monitor className="w-4 h-4" />
              Desktop
            </button>
          </div>

          {/* Level Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Level:</span>
            <button
              onClick={() => toggleLevel('beginner')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filters.level.includes('beginner')
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              )}
            >
              Beginner
            </button>
            <button
              onClick={() => toggleLevel('advanced')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filters.level.includes('advanced')
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              )}
            >
              Advanced
            </button>
          </div>

          {/* Lightning Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Features:</span>
            <button
              onClick={toggleLightning}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filters.lightning
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              )}
            >
              <Zap className="w-4 h-4" />
              Lightning Support
            </button>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              <X className="w-4 h-4" />
              Reset filters
            </button>
          )}
        </div>

        {/* Non-custodial notice */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          All wallets shown are non-custodial — you control your keys
        </p>
      </div>

      {/* Wallet Cards Grid */}
      {filteredWallets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWallets.map(wallet => (
            <Card
              key={wallet.name}
              className={cn(
                'p-6 relative overflow-hidden transition-all duration-300',
                wallet.recommended && 'ring-2 ring-orange-200 border-orange-300'
              )}
            >
              {/* Recommended Ribbon */}
              {wallet.recommended && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Recommended
                </div>
              )}

              <div className="space-y-4">
                {/* Header */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{wallet.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{wallet.description}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      wallet.platform === 'mobile'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    )}
                  >
                    {wallet.platform === 'mobile' ? (
                      <Smartphone className="w-3 h-3 mr-1" />
                    ) : (
                      <Monitor className="w-3 h-3 mr-1" />
                    )}
                    {wallet.platform === 'mobile' ? 'Mobile' : 'Desktop'}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      wallet.level === 'beginner'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}
                  >
                    {wallet.level === 'beginner' ? 'Beginner' : 'Advanced'}
                  </Badge>

                  {wallet.lightning && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Lightning
                    </Badge>
                  )}

                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Non-custodial
                  </Badge>
                </div>

                {/* Download Buttons (Mobile wallets only) */}
                {wallet.downloadLinks &&
                  (wallet.downloadLinks.ios || wallet.downloadLinks.android) && (
                    <div className="flex flex-col gap-2">
                      {wallet.downloadLinks.ios && (
                        <a
                          href={wallet.downloadLinks.ios}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          <Smartphone className="w-4 h-4" />
                          iOS App Store
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {wallet.downloadLinks.android && (
                        <a
                          href={wallet.downloadLinks.android}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          <Smartphone className="w-4 h-4" />
                          Google Play
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                {/* Visit Website Link */}
                <a
                  href={wallet.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  Visit website
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No wallets match your filters.</p>
          <Button onClick={resetFilters} variant="outline" size="sm">
            Reset filters
          </Button>
        </div>
      )}
    </div>
  );
}
