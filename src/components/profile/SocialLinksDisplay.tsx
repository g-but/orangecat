/**
 * SocialLinksDisplay Component
 *
 * Displays social media links on public profile pages.
 * Reusable component that shows links with platform icons.
 *
 * Created: 2025-11-24
 * Last Modified: 2025-11-24
 * Last Modified Summary: Initial implementation for displaying social links
 */

'use client';

import { SocialLink } from '@/types/social';
import { getPlatformById } from '@/lib/social-platforms';
import { normalizeSocialUrl } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface SocialLinksDisplayProps {
  links: SocialLink[];
  className?: string;
  compact?: boolean;
}

/**
 * Social Links Display Component
 *
 * Shows social media links with platform icons.
 * Clickable links that open in new tab.
 */
export function SocialLinksDisplay({
  links,
  className = '',
  compact = false,
}: SocialLinksDisplayProps) {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {!compact && (
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Social Media & Links</h4>
      )}
      <div className="flex flex-wrap gap-3">
        {links.map(link => {
          const platform = getPlatformById(link.platform);
          const Icon = platform?.icon || ExternalLink;
          const displayLabel =
            link.platform === 'custom' ? link.label : platform?.label || link.platform;
          const displayValue = link.value;
          const normalizedUrl = normalizeSocialUrl(link.platform, displayValue);

          return (
            <a
              key={link.platform + link.value}
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm text-gray-700 hover:text-orange-600"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{displayLabel}</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
