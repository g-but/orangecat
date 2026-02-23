'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ENTITY_REGISTRY, type EntityType } from '@/config/entity-registry';
import ShareContent from './ShareContent';

interface EntityShareProps {
  entityType: EntityType;
  entityId: string;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Generic share wrapper for any entity type.
 * Derives the share URL from ENTITY_REGISTRY (SSOT).
 */
export default function EntityShare({
  entityType,
  entityId,
  title,
  description,
  className = '',
}: EntityShareProps) {
  const [isOpen, setIsOpen] = useState(false);

  const entityMeta = ENTITY_REGISTRY[entityType];
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://orangecat.ch';
  const shareUrl = `${origin}${entityMeta.publicBasePath}/${entityId}`;
  const shareTitle = title;
  const shareDescription = description || `Check out ${title} on OrangeCat`;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors ${className}`}
        aria-label={`Share ${title}`}
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <ShareContent
        title={shareTitle}
        description={shareDescription}
        url={shareUrl}
        onClose={() => setIsOpen(false)}
        titleText={`Share ${entityMeta.name}`}
      />
    </div>
  );
}
