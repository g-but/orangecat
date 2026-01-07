/**
 * Wishlist Donation Tiers Component
 *
 * Fetches and displays wishlist items as preset donation tiers.
 * Displays amounts in user's preferred currency while transactions use BTC.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Added currency conversion for user's preferred display currency
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import BitcoinPaymentModal from '@/components/bitcoin/BitcoinPaymentModal';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import { convertFromSats, formatCurrency, formatSatsAuto } from '@/services/currency';

interface WishlistItem {
  id: string;
  title: string;
  target_amount_sats: number;
  funded_amount_sats: number;
  image_url?: string;
}

interface WishlistDonationTiersProps {
  userId: string;
  projectId?: string;
  projectTitle?: string;
  recipientAddress?: string;
}

export function WishlistDonationTiers({
  userId,
  projectId,
  projectTitle = 'Project',
  recipientAddress,
}: WishlistDonationTiersProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const userCurrency = useUserCurrency();

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/profiles/${userId}/wishlist-tiers`);
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch wishlist tiers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchTiers();
    }
  }, [userId]);

  const handleTierClick = (item: WishlistItem) => {
    setSelectedItem(item);
    setIsPaymentModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return null; // Don't show anything if no wishlist items
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="h-5 w-5 text-rose-500" />
        <h4 className="font-semibold text-gray-900">Support a specific goal:</h4>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const remaining = item.target_amount_sats - item.funded_amount_sats;
          const displayAmount = convertFromSats(item.target_amount_sats, userCurrency);
          const formattedAmount = formatCurrency(displayAmount, userCurrency, { compact: true });
          const satsDisplay = formatSatsAuto(item.target_amount_sats);

          return (
            <button
              key={item.id}
              onClick={() => handleTierClick(item)}
              className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
            >
              <span className="text-sm font-bold text-gray-900 group-hover:text-orange-700">
                {formattedAmount}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">
                ≈ {satsDisplay}
              </span>
              <span className="text-xs text-gray-600 mt-1 line-clamp-1">
                {item.title}
              </span>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-3">
                <div
                  className="bg-orange-500 h-1 rounded-full"
                  style={{
                    width: `${Math.min(100, (item.funded_amount_sats / item.target_amount_sats) * 100)}%`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {selectedItem && (
        <BitcoinPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          projectId={projectId || ''}
          projectTitle={`${projectTitle} - ${selectedItem.title}`}
          suggestedAmount={selectedItem.target_amount_sats}
          recipientAddress={recipientAddress}
        />
      )}
    </div>
  );
}
