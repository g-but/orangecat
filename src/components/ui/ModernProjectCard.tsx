'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Clock, Target, FolderOpen } from 'lucide-react';
import { CurrencyDisplay } from './CurrencyDisplay';
import BTCAmountDisplay from './BTCAmountDisplay';
import DefaultAvatar from './DefaultAvatar';
import { SearchFundingPage } from '@/services/search';
import { useAuth } from '@/hooks/useAuth';
import { getUniqueCategories } from '@/utils/project';
import { ROUTES } from '@/lib/routes';

// Extended project type that includes all possible fields
interface ExtendedProject extends SearchFundingPage {
  currency?: string;
  tags?: string[] | null;
  cover_image_url?: string | null;
}

interface ModernProjectCardProps {
  project: ExtendedProject;
  viewMode?: 'grid' | 'list';
  className?: string;
}

const gradientByCategory: Record<string, string> = {
  education: 'from-blue-500/15 to-indigo-500/10',
  animals: 'from-pink-500/20 to-rose-500/10',
  technology: 'from-purple-500/20 to-violet-500/10',
  environment: 'from-green-500/20 to-emerald-500/10',
  business: 'from-orange-500/20 to-amber-500/10',
  community: 'from-teal-500/20 to-cyan-500/10',
  default: 'from-slate-500/15 to-slate-400/5',
};

const iconColorByCategory: Record<string, string> = {
  education: 'text-blue-600',
  animals: 'text-rose-600',
  technology: 'text-violet-600',
  environment: 'text-emerald-600',
  business: 'text-orange-600',
  community: 'text-teal-600',
  default: 'text-slate-600',
};

// Removed local dedupe function - using centralized utility instead

function getStatusBadge(status: string) {
  const normalized = status?.toLowerCase();
  switch (normalized) {
    case 'draft':
      return { label: 'Draft', className: 'bg-slate-100 text-slate-600 border border-slate-200' };
    case 'active':
      return {
        label: 'Active',
        className: 'bg-green-100 text-green-700 border border-green-200',
      };
    case 'paused':
      return {
        label: 'Paused',
        className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      };
    case 'completed':
      return {
        label: 'Completed',
        className: 'bg-blue-100 text-blue-700 border border-blue-200',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'bg-red-100 text-red-700 border border-red-200',
      };
    default:
      // Fallback for unknown statuses
      return {
        label: normalized || 'Unknown',
        className: 'bg-gray-100 text-gray-700 border border-gray-200',
      };
  }
}

export default function ModernProjectCard({
  project,
  viewMode = 'grid',
  className = '',
}: ModernProjectCardProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const goalAmount = project.goal_amount ?? 0;
  const currentAmount = project.raised_amount ?? 0;
  // Get currency from project, default to CHF if not set (more likely for new projects)
  const projectCurrency = (project.currency || 'CHF') as 'USD' | 'EUR' | 'CHF' | 'BTC' | 'SATS';
  const showProgress = goalAmount > 0;
  const progressPercentage = showProgress ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;

  const createdLabel = useMemo(() => {
    const createdDate = new Date(project.created_at);
    const now = new Date();
    const daysSinceCreation = Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation <= 7 ? 'New this week' : `${daysSinceCreation}d ago`;
  }, [project.created_at]);

  const categories = useMemo(
    () =>
      getUniqueCategories(
        project.category,
        project.tags || null,
        { limit: 10 } // Allow more categories for display
      ),
    [project.category, project.tags]
  );

  const ownerName = useMemo(() => {
    if (project.profiles?.name) {
      return project.profiles.name;
    }
    if (project.profiles?.username) {
      return project.profiles.username;
    }
    if (project.user_id && project.user_id === (profile?.id || user?.id)) {
      return profile?.name || profile?.username || 'You';
    }
    return 'Anonymous';
  }, [
    project.profiles,
    project.user_id,
    profile?.id,
    profile?.name,
    profile?.username,
    user?.id,
  ]);

  const ownerUsername = useMemo(() => {
    if (project.profiles?.username) {
      return project.profiles.username;
    }
    if (project.user_id && project.user_id === (profile?.id || user?.id)) {
      return profile?.username;
    }
    return null;
  }, [project.profiles?.username, project.user_id, profile?.id, profile?.username, user?.id]);

  const ownerAvatarUrl = useMemo(() => {
    return project.profiles?.avatar_url || null;
  }, [project.profiles?.avatar_url]);

  const _ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : 'P';
  const creatorProfileUrl = ownerUsername ? ROUTES.PROFILE.VIEW(ownerUsername) : null;
  const statusBadge = getStatusBadge(project.status || 'draft');

  // Check favorite status when component mounts or project changes
  useEffect(() => {
    if (!project.id || !user) {
      setIsLiked(false);
      return;
    }

    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/favorite`);
        if (response.ok) {
          const result = await response.json();
          setIsLiked(result.isFavorited || false);
        }
      } catch {
        // Silently fail - favorite status is optional
      }
    };

    checkFavoriteStatus();
  }, [project.id, user]);

  const handleToggleFavorite = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      return;
    }

    setIsTogglingFavorite(true);
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/projects/${project.id}/favorite`, {
        method,
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const result = await response.json();
      setIsLiked(result.isFavorited);
    } catch {
      // Silently fail - user can try again
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const gradient =
    gradientByCategory[categories[0]?.toLowerCase() || 'default'] ?? gradientByCategory.default;
  const iconTone =
    iconColorByCategory[categories[0]?.toLowerCase() || 'default'] ?? iconColorByCategory.default;

  // Image fallback chain: project image → creator avatar → gradient placeholder
  const getProjectImageUrl = () => {
    // Check cover_image_url first (the actual database column)
    const coverImage = project.cover_image_url;
    if (coverImage && typeof coverImage === 'string' && coverImage.trim() !== '') {
      return coverImage;
    }

    // Then check mapped fields (banner_url/featured_image_url are mapped from cover_image_url for compatibility)
    const bannerUrl = project.banner_url;
    if (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim() !== '') {
      return bannerUrl;
    }

    const featuredImageUrl = project.featured_image_url;
    if (featuredImageUrl && typeof featuredImageUrl === 'string' && featuredImageUrl.trim() !== '') {
      return featuredImageUrl;
    }

    // Only fallback to creator avatar if NO project image exists
    // This ensures project images always take priority
    if (ownerAvatarUrl && typeof ownerAvatarUrl === 'string' && ownerAvatarUrl.trim() !== '') {
      return ownerAvatarUrl;
    }

    return null;
  };

  const projectImageUrl = getProjectImageUrl();
  // Check if we're using creator avatar as fallback (no project image but have creator avatar)
  const coverImage = project.cover_image_url;
  const bannerUrl = project.banner_url;
  const featuredImageUrl = project.featured_image_url;
  const hasProjectImage = 
    (coverImage && typeof coverImage === 'string' && coverImage.trim() !== '') ||
    (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim() !== '') ||
    (featuredImageUrl && typeof featuredImageUrl === 'string' && featuredImageUrl.trim() !== '');
  const hasCreatorAvatarFallback = !hasProjectImage && ownerAvatarUrl && projectImageUrl === ownerAvatarUrl;

  const imageElement =
    projectImageUrl && !imageError ? (
      <Image
        src={projectImageUrl}
        alt={project.title}
        fill
        className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
          hasCreatorAvatarFallback ? 'opacity-40' : ''
        }`}
        onError={() => setImageError(true)}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    ) : (
      <div
        className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
      >
        <Target className={`h-16 w-16 text-white/70 drop-shadow-lg ${iconTone}`} />
      </div>
    );

  const renderMetrics = (compact = false) => (
    <div className={`mt-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Raised</p>
          <p className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
            <CurrencyDisplay amount={currentAmount} currency={projectCurrency} />
          </p>
          <BTCAmountDisplay
            amount={currentAmount}
            currency={projectCurrency}
            className="text-xs text-gray-500"
          />
        </div>
        {showProgress ? (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">Goal</p>
            <p className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              <CurrencyDisplay amount={goalAmount} currency={projectCurrency} />
            </p>
            <p className="text-xs text-gray-500">{progressPercentage.toFixed(0)}% funded</p>
          </div>
        ) : (
          <div className="text-right text-xs text-gray-500 italic">No goal set</div>
        )}
      </div>
      {showProgress && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-bitcoinOrange via-orange-500 to-orange-400"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div
        className={`flex w-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-200 ease-ios shadow-card hover:border-gray-200 hover:shadow-card-hover ${className}`}
      >
        <Link href={`/projects/${project.id}`} className="flex w-full flex-col gap-4 sm:flex-row">
          <div className="relative h-48 flex-1 overflow-hidden sm:h-auto">
            {imageElement}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
              <div
                className="h-full bg-gradient-to-r from-bitcoinOrange to-orange-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {statusBadge && (
              <span
                className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {project.title}
                  </h3>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0">
                    <FolderOpen className="w-3 h-3 mr-1" />
                    Project
                  </div>
                </div>
                {creatorProfileUrl ? (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      router.push(creatorProfileUrl);
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    {ownerAvatarUrl ? (
                      <Image
                        src={ownerAvatarUrl}
                        alt={ownerName}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar size={32} className="rounded-full" />
                    )}
                    <span>{ownerName}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {ownerAvatarUrl ? (
                      <Image
                        src={ownerAvatarUrl}
                        alt={ownerName}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar size={32} className="rounded-full" />
                    )}
                    <span>{ownerName}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-orange-600">
                <Clock className="h-3.5 w-3.5" />
                <span>{createdLabel}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{project.description}</p>
            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map(category => (
                  <span
                    key={category}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            {renderMetrics(true)}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-200 ease-ios shadow-card hover:border-gray-200 hover:shadow-card-hover active:scale-98 ${className}`}
    >
      <Link href={`/projects/${project.id}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {imageElement}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {/* Favorites button */}
          {user && (
            <button
              className="absolute right-3 top-3 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 text-white backdrop-blur-md shadow-button transition-all duration-200 ease-ios hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-50"
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              aria-label={isLiked ? 'Remove from favourites' : 'Add to favourites'}
              title={isLiked ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart
                className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500 animate-heart-beat' : 'text-gray-700'}`}
              />
            </button>
          )}
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            {statusBadge && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            )}
            {categories.slice(0, 1).map(category => (
              <span
                key={category}
                className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold leading-snug text-gray-900 line-clamp-2">
                  {project.title}
                </h3>
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0">
                  <FolderOpen className="w-3 h-3 mr-1" />
                  Project
                </div>
              </div>
              <div className="flex items-center gap-3">
                {creatorProfileUrl ? (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      router.push(creatorProfileUrl);
                    }}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    {ownerAvatarUrl ? (
                      <Image
                        src={ownerAvatarUrl}
                        alt={ownerName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar size={40} className="rounded-full" />
                    )}
                    <div className="leading-tight">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Created by</p>
                      <p className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors">
                        {ownerName}
                      </p>
                    </div>
                  </button>
                ) : (
                  <>
                    {ownerAvatarUrl ? (
                      <Image
                        src={ownerAvatarUrl}
                        alt={ownerName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar size={40} className="rounded-full" />
                    )}
                    <div className="leading-tight">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Created by</p>
                      <p className="text-sm font-medium text-gray-900">{ownerName}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
              <Clock className="h-3.5 w-3.5" />
              <span>{createdLabel}</span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">
            {project.description}
          </p>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <span
                  key={category}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {renderMetrics(false)}
        </div>
      </Link>
    </div>
  );
}
