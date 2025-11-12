/**
 * ProjectDonationSection Component
 *
 * Displays Bitcoin and Lightning donation addresses with copy functionality
 * Also includes favorite functionality for easy project saving
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-30
 * Last Modified Summary: Added favorite functionality integrated with donation section
 */

'use client';

import { Bitcoin, ExternalLink, Heart } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/utils/logger';

interface ProjectDonationSectionProps {
  projectId: string;
  bitcoinAddress: string | null;
  lightningAddress: string | null;
  isOwner?: boolean;
}

export function ProjectDonationSection({
  projectId,
  bitcoinAddress,
  lightningAddress,
  isOwner = false,
}: ProjectDonationSectionProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Check favorite status when project loads
  useEffect(() => {
    if (!projectId || !user) {
      setIsFavorited(false);
      return;
    }

    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/favorite`);
        if (response.ok) {
          const result = await response.json();
          setIsFavorited(result.isFavorited || false);
        }
      } catch (error) {
        // Silently fail - favorite status is optional
        logger.error(
          'Failed to check favorite status',
          { projectId, error },
          'ProjectDonationSection'
        );
      }
    };

    checkFavoriteStatus();
  }, [projectId, user]);

  const handleToggleFavorite = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to favorite projects');
      return;
    }

    // Optimistic update
    const previousState = isFavorited;
    setIsFavorited(!isFavorited);
    setIsTogglingFavorite(true);

    try {
      const method = previousState ? 'DELETE' : 'POST';
      const response = await fetch(`/api/projects/${projectId}/favorite`, {
        method,
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const result = await response.json();
      setIsFavorited(result.isFavorited);

      toast.success(result.isFavorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      // Revert optimistic update on error
      setIsFavorited(previousState);
      logger.error('Failed to toggle favorite', { projectId, error }, 'ProjectDonationSection');
      toast.error('Failed to update favorite. Please try again.');
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [projectId, user, isFavorited]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <>
      {/* Support Actions - Favorite and Donate */}
      <section className="border-t pt-6" aria-labelledby="support-heading">
        <h3 id="support-heading" className="text-lg font-semibold mb-4">
          Support this Project
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Favorite Button */}
          {user ? (
            <Button
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              variant={isFavorited ? 'primary' : 'outline'}
              className={`flex-1 flex items-center justify-center gap-2 ${
                isFavorited
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  : 'border-gray-300 hover:border-red-300 hover:text-red-600'
              }`}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isTogglingFavorite ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>{isFavorited ? 'Removing...' : 'Adding...'}</span>
                </>
              ) : (
                <>
                  <Heart
                    className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              href="/auth?from=favorite"
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2 border-gray-300 hover:border-red-300 hover:text-red-600"
              aria-label="Sign in to favorite this project"
            >
              <Heart className="w-4 h-4" aria-hidden="true" />
              <span>Sign in to Favorite</span>
            </Button>
          )}

          {/* Donate Button - Scrolls to donation addresses */}
          {(bitcoinAddress || lightningAddress) && (
            <Button
              onClick={() => {
                const donationSection = document.getElementById('bitcoin-donation-section');
                if (donationSection) {
                  donationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              aria-label="Scroll to donation addresses"
            >
              <Bitcoin className="w-4 h-4 mr-2" aria-hidden="true" />
              Donate Bitcoin
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          {user
            ? isFavorited
              ? 'You can find this project in your Favorites to donate later.'
              : 'Save this project to your favorites to donate later, or donate now.'
            : 'Sign in to save this project to your favorites and donate later.'}
        </p>
      </section>

      {/* Bitcoin Address */}
      {bitcoinAddress && (
        <section
          id="bitcoin-donation-section"
          className="border-t pt-6"
          aria-labelledby="bitcoin-heading"
        >
          <h3 id="bitcoin-heading" className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-bitcoinOrange" aria-hidden="true" />
            Donate Bitcoin
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <code
                className="text-sm font-mono text-gray-900 break-all"
                aria-label={`Bitcoin address: ${bitcoinAddress}`}
              >
                {bitcoinAddress}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(bitcoinAddress, 'Bitcoin address')}
                aria-label="Copy Bitcoin address to clipboard"
              >
                Copy
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Lightning Address */}
      {lightningAddress && (
        <section className="mt-6" aria-labelledby="lightning-heading">
          <h3 id="lightning-heading" className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-yellow-500" aria-hidden="true" />
            Lightning Donation
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <code
                className="text-sm font-mono text-gray-900 break-all"
                aria-label={`Lightning address: ${lightningAddress}`}
              >
                {lightningAddress}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(lightningAddress, 'Lightning address')}
                aria-label="Copy Lightning address to clipboard"
              >
                Copy
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
