'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, MapPin, Tag, Globe } from 'lucide-react';
import { Package, Briefcase, Heart, Coins, Bot, Building, Rocket, LucideIcon } from 'lucide-react';
import { ScalableProfile } from '@/types/database';
import Button from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { logger } from '@/utils/logger';
import { EntityType, ENTITY_REGISTRY } from '@/config/entity-registry';

// Icon mapping for entity types
const ENTITY_ICONS: Record<string, LucideIcon> = {
  project: Rocket,
  product: Package,
  service: Briefcase,
  cause: Heart,
  ai_assistant: Bot,
  asset: Building,
  loan: Coins,
  event: Calendar,
};

// Status styling
const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700' },
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
    completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700' },
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  };
  return (
    statusMap[status?.toLowerCase()] || {
      label: status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown',
      className: 'bg-gray-100 text-gray-700',
    }
  );
};

// Format relative time
const getRelativeTime = (date: string) => {
  const created = new Date(date);
  const now = new Date();
  const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  if (days < 30) {
    return `${Math.floor(days / 7)}w ago`;
  }
  return created.toLocaleDateString();
};

interface ProfileEntityTabProps {
  profile: ScalableProfile;
  entityType: EntityType;
  isOwnProfile?: boolean;
}

interface EntityData {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  status?: string;
  created_at: string;
  // Price fields
  price?: number;
  hourly_rate?: number;
  fixed_price?: number;
  ticket_price?: number;
  goal_amount?: number;
  original_amount?: number;
  estimated_value?: number;
  currency?: string;
  is_free?: boolean;
  // Images
  thumbnail_url?: string;
  avatar_url?: string;
  images?: string[];
  // Event specific
  start_date?: string;
  end_date?: string;
  venue_name?: string;
  venue_city?: string;
  is_online?: boolean;
  event_type?: string;
  // Service specific
  pricing_type?: string;
  // Asset specific
  type?: string;
  verification_status?: string;
  // AI Assistant specific
  pricing_model?: string;
}

interface EntityMetadata {
  name: string;
  namePlural: string;
  icon: string;
  colorTheme: string;
}

export default function ProfileEntityTab({
  profile,
  entityType,
  isOwnProfile,
}: ProfileEntityTabProps) {
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [metadata, setMetadata] = useState<EntityMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  // Get paths from ENTITY_REGISTRY (SSOT)
  const entityMeta = ENTITY_REGISTRY[entityType];
  const getDashboardPath = () => entityMeta?.basePath || '/dashboard';
  const getCreatePath = () => entityMeta?.createPath || `${getDashboardPath()}/create`;
  const getViewPath = (id: string) => `${entityMeta?.publicBasePath || `/${entityType}s`}/${id}`;

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profiles/${profile.id}/entities/${entityType}`);
        const result = await response.json();

        if (result.success && result.data) {
          setEntities(result.data.data || []);
          setMetadata(result.data.metadata || null);
        }
      } catch (error) {
        logger.error('Failed to fetch entities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile.id) {
      fetchEntities();
    }
  }, [profile.id, entityType]);

  const Icon = ENTITY_ICONS[entityType] || Package;
  const displayName = metadata?.namePlural || entityType;

  if (loading) {
    return <div className="text-gray-500 text-sm py-8 text-center">Loading {displayName}...</div>;
  }

  if (entities.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No {displayName} Yet</h3>
        <p className="text-gray-500 mb-6">
          {isOwnProfile
            ? `You haven't published any ${displayName.toLowerCase()} yet`
            : `No ${displayName.toLowerCase()} to display`}
        </p>
        {isOwnProfile && (
          <Link href={getCreatePath()}>
            <Button>
              <Icon className="w-4 h-4 mr-2" />
              Create Your First {metadata?.name || entityType}
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Get display title for an entity
  const getTitle = (entity: EntityData) => entity.title || entity.name || 'Untitled';

  // Get thumbnail for an entity
  const getThumbnail = (entity: EntityData) => {
    return (
      entity.thumbnail_url ||
      entity.avatar_url ||
      (entity.images && entity.images.length > 0 ? entity.images[0] : null)
    );
  };

  // Get price display for an entity
  const getPriceDisplay = (entity: EntityData) => {
    if (entity.is_free) {
      return 'Free';
    }

    const priceValue =
      entity.price ||
      entity.hourly_rate ||
      entity.fixed_price ||
      entity.ticket_price ||
      entity.goal_amount ||
      entity.original_amount ||
      entity.estimated_value;

    if (!priceValue) {
      return null;
    }

    const label =
      entityType === 'service' && entity.pricing_type === 'hourly'
        ? '/hr'
        : entityType === 'loan'
          ? ' requested'
          : entityType === 'asset'
            ? ' value'
            : '';

    return (
      <span className="flex items-center gap-1">
        <CurrencyDisplay
          amount={priceValue}
          currency={entity.currency || PLATFORM_DEFAULT_CURRENCY}
          size="sm"
        />
        {label && <span className="text-gray-500 text-xs">{label}</span>}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-orange-500" />
          {entities.length} {entities.length === 1 ? metadata?.name : metadata?.namePlural}
        </h3>
        {isOwnProfile && (
          <Link href={getDashboardPath()}>
            <Button variant="ghost" size="sm">
              Manage All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {/* Entity Grid */}
      <div className="space-y-4">
        {entities.map(entity => {
          const statusInfo = getStatusInfo(entity.status || '');
          const thumbnail = getThumbnail(entity);
          const showStatusBadge =
            entity.status && !['active', 'draft'].includes(entity.status.toLowerCase());

          return (
            <Link
              key={entity.id}
              href={getViewPath(entity.id)}
              className="block overflow-hidden rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg bg-white transition-all duration-200 group"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={getTitle(entity)}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  {entity.category && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-medium text-gray-700">
                        {entity.category}
                      </span>
                    </div>
                  )}
                  {showStatusBadge && (
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1.5 group-hover:text-orange-600 transition-colors line-clamp-1">
                      {getTitle(entity)}
                    </h4>
                    {entity.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {entity.description}
                      </p>
                    )}
                  </div>

                  {/* Entity-specific info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    {/* Event location/date */}
                    {entityType === 'event' && entity.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(entity.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {entityType === 'event' && (entity.venue_city || entity.is_online) && (
                      <span className="flex items-center gap-1">
                        {entity.is_online ? (
                          <>
                            <Globe className="w-3.5 h-3.5" />
                            Online
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5" />
                            {entity.venue_city}
                          </>
                        )}
                      </span>
                    )}

                    {/* Asset type */}
                    {entityType === 'asset' && entity.type && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {entity.type}
                      </span>
                    )}

                    {/* Price */}
                    {getPriceDisplay(entity) && (
                      <span className="font-semibold text-gray-900">{getPriceDisplay(entity)}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>{getRelativeTime(entity.created_at)}</span>
                    {entityType === 'asset' && entity.verification_status === 'verified' && (
                      <span className="text-green-600 font-medium">Verified</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
