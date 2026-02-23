/**
 * useProjectCardData Hook
 *
 * Manages project card data calculations and derived values.
 * Extracted from ModernProjectCard for better separation of concerns.
 */

'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUniqueCategories } from '@/utils/project';
import { ROUTES } from '@/lib/routes';
import { SearchFundingPage } from '@/services/search';

// Extended project type that includes all possible fields
export interface ExtendedProject extends SearchFundingPage {
  currency?: string;
  tags?: string[] | null;
  cover_image_url?: string | null;
}

export interface ProjectCardDataResult {
  // Auth
  user: ReturnType<typeof useAuth>['user'];
  profile: ReturnType<typeof useAuth>['profile'];

  // Favorite state
  isLiked: boolean;
  isTogglingFavorite: boolean;
  handleToggleFavorite: (event: React.MouseEvent) => Promise<void>;

  // Image state
  imageError: boolean;
  setImageError: (error: boolean) => void;

  // Computed values
  goalAmount: number;
  currentAmount: number;
  projectCurrency: 'USD' | 'EUR' | 'CHF' | 'BTC' | 'SATS';
  showProgress: boolean;
  progressPercentage: number;
  createdLabel: string;
  categories: string[];
  ownerName: string;
  ownerUsername: string | null;
  ownerAvatarUrl: string | null;
  creatorProfileUrl: string | null;
  statusBadge: { label: string; className: string };
  gradient: string;
  iconTone: string;
  projectImageUrl: string | null;
  hasCreatorAvatarFallback: boolean;
}

export const STATUS_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700 border border-green-200' },
  paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
};

export const GRADIENT_BY_CATEGORY: Record<string, string> = {
  education: 'from-blue-500/15 to-indigo-500/10',
  animals: 'from-pink-500/20 to-rose-500/10',
  technology: 'from-purple-500/20 to-violet-500/10',
  environment: 'from-green-500/20 to-emerald-500/10',
  business: 'from-orange-500/20 to-amber-500/10',
  community: 'from-teal-500/20 to-cyan-500/10',
  default: 'from-slate-500/15 to-slate-400/5',
};

export const ICON_COLOR_BY_CATEGORY: Record<string, string> = {
  education: 'text-blue-600',
  animals: 'text-rose-600',
  technology: 'text-violet-600',
  environment: 'text-emerald-600',
  business: 'text-orange-600',
  community: 'text-teal-600',
  default: 'text-gray-600',
};

function getStatusBadge(status: string) {
  const normalized = status?.toLowerCase();
  return (
    STATUS_BADGE_CONFIG[normalized] || {
      label: normalized || 'Unknown',
      className: 'bg-gray-100 text-gray-700 border border-gray-200',
    }
  );
}

export function useProjectCardData(project: ExtendedProject): ProjectCardDataResult {
  const { user, profile } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const goalAmount = project.goal_amount ?? 0;
  const currentAmount = project.raised_amount ?? 0;
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
    () => getUniqueCategories(project.category, project.tags || null, { limit: 10 }),
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
  }, [project.profiles, project.user_id, profile?.id, profile?.name, profile?.username, user?.id]);

  const ownerUsername = useMemo(() => {
    if (project.profiles?.username) {
      return project.profiles.username;
    }
    if (project.user_id && project.user_id === (profile?.id || user?.id)) {
      return profile?.username ?? null;
    }
    return null;
  }, [project.profiles?.username, project.user_id, profile?.id, profile?.username, user?.id]);

  const ownerAvatarUrl = useMemo(() => {
    return project.profiles?.avatar_url || null;
  }, [project.profiles?.avatar_url]);

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
      } catch (e) {
        console.debug('[useProjectCardData] Failed to check favorite status:', e);
      }
    };

    checkFavoriteStatus();
  }, [project.id, user]);

  const handleToggleFavorite = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!user) {
        return;
      }

      setIsTogglingFavorite(true);
      try {
        const method = isLiked ? 'DELETE' : 'POST';
        const response = await fetch(`/api/projects/${project.id}/favorite`, { method });

        if (!response.ok) {
          throw new Error('Failed to toggle favorite');
        }

        const result = await response.json();
        setIsLiked(result.isFavorited);
      } catch (e) {
        console.warn('[useProjectCardData] Failed to toggle favorite:', e);
      } finally {
        setIsTogglingFavorite(false);
      }
    },
    [user, isLiked, project.id]
  );

  const gradient =
    GRADIENT_BY_CATEGORY[categories[0]?.toLowerCase() || 'default'] ?? GRADIENT_BY_CATEGORY.default;
  const iconTone =
    ICON_COLOR_BY_CATEGORY[categories[0]?.toLowerCase() || 'default'] ??
    ICON_COLOR_BY_CATEGORY.default;

  // Image fallback chain: project image → creator avatar → gradient placeholder
  const projectImageUrl = useMemo(() => {
    const coverImage = project.cover_image_url;
    if (coverImage && typeof coverImage === 'string' && coverImage.trim() !== '') {
      return coverImage;
    }

    const bannerUrl = project.banner_url;
    if (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim() !== '') {
      return bannerUrl;
    }

    const featuredImageUrl = project.featured_image_url;
    if (
      featuredImageUrl &&
      typeof featuredImageUrl === 'string' &&
      featuredImageUrl.trim() !== ''
    ) {
      return featuredImageUrl;
    }

    if (ownerAvatarUrl && typeof ownerAvatarUrl === 'string' && ownerAvatarUrl.trim() !== '') {
      return ownerAvatarUrl;
    }

    return null;
  }, [project.cover_image_url, project.banner_url, project.featured_image_url, ownerAvatarUrl]);

  const hasCreatorAvatarFallback = useMemo(() => {
    const coverImage = project.cover_image_url;
    const bannerUrl = project.banner_url;
    const featuredImageUrl = project.featured_image_url;
    const hasProjectImage =
      (coverImage && typeof coverImage === 'string' && coverImage.trim() !== '') ||
      (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim() !== '') ||
      (featuredImageUrl && typeof featuredImageUrl === 'string' && featuredImageUrl.trim() !== '');
    return !hasProjectImage && ownerAvatarUrl !== null && projectImageUrl === ownerAvatarUrl;
  }, [
    project.cover_image_url,
    project.banner_url,
    project.featured_image_url,
    ownerAvatarUrl,
    projectImageUrl,
  ]);

  return {
    user,
    profile,
    isLiked,
    isTogglingFavorite,
    handleToggleFavorite,
    imageError,
    setImageError,
    goalAmount,
    currentAmount,
    projectCurrency,
    showProgress,
    progressPercentage,
    createdLabel,
    categories,
    ownerName,
    ownerUsername,
    ownerAvatarUrl,
    creatorProfileUrl,
    statusBadge,
    gradient,
    iconTone,
    projectImageUrl,
    hasCreatorAvatarFallback,
  };
}
