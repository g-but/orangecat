'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bitcoin } from 'lucide-react';
import Button from '@/components/ui/Button';

// Import our new modular components
import { WalletCard } from './WalletCard';
import { WalletFilters, WalletFilters as WalletFiltersType } from './WalletFilters';
import { walletProviders } from '@/data/walletProviders';

export default function WalletDiscovery() {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<WalletFiltersType>({
    type: [],
    difficulty: [],
    privacy: [],
    custody: [],
    countries: [],
    features: [],
    search: '',
  });

  // Filter wallets based on current filters
  const filteredWallets = useMemo(() => {
    return walletProviders.filter(wallet => {
      // Search filter
      if (
        filters.search &&
        !wallet.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !wallet.description.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(wallet.type)) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(wallet.difficulty)) {
        return false;
      }

      // Privacy filter
      if (filters.privacy.length > 0 && !filters.privacy.includes(wallet.privacyLevel)) {
        return false;
      }

      // Custody filter
      if (filters.custody.length > 0 && !filters.custody.includes(wallet.custody)) {
        return false;
      }

      // Countries filter
      if (
        filters.countries.length > 0 &&
        !filters.countries.some(country => wallet.countries.includes(country))
      ) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const toggleCard = (walletId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(walletId)) {
      newExpanded.delete(walletId);
    } else {
      newExpanded.add(walletId);
    }
    setExpandedCards(newExpanded);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Bitcoin className="w-8 h-8 text-orange-500" />
          Choose Your Bitcoin Wallet
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Find the perfect Bitcoin wallet for your needs. From hardware wallets for maximum security
          to mobile wallets for convenience, we've got you covered.
        </p>
      </div>

      {/* Filters */}
      <WalletFilters filters={filters} onFiltersChange={setFilters} className="mb-8" />

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredWallets.length} of {walletProviders.length} wallets
        </p>
      </div>

      {/* Wallet Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredWallets.map(wallet => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              isExpanded={expandedCards.has(wallet.id)}
              onToggle={() => toggleCard(wallet.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredWallets.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Bitcoin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No wallets found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                type: [],
                difficulty: [],
                privacy: [],
                custody: [],
                countries: [],
                features: [],
                search: '',
              })
            }
          >
            Clear All Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
}
