/**
 * ModernProjectCard Component
 *
 * Displays project information in grid or list view modes.
 * Logic extracted to useProjectCardData hook, metrics to ProjectCardMetrics.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Clock, Target, FolderOpen } from 'lucide-react';
import DefaultAvatar from './DefaultAvatar';
import { ProjectCardMetrics } from './ProjectCardMetrics';
import { useProjectCardData, ExtendedProject } from './useProjectCardData';

interface ModernProjectCardProps {
  project: ExtendedProject;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export default function ModernProjectCard({
  project,
  viewMode = 'grid',
  className = '',
}: ModernProjectCardProps) {
  const router = useRouter();
  const {
    user,
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
    ownerAvatarUrl,
    creatorProfileUrl,
    statusBadge,
    gradient,
    iconTone,
    projectImageUrl,
    hasCreatorAvatarFallback,
  } = useProjectCardData(project);

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

  const navigateToCreator = (e: React.MouseEvent) => {
    if (creatorProfileUrl) {
      e.stopPropagation();
      e.preventDefault();
      router.push(creatorProfileUrl);
    }
  };

  const CreatorInfo = ({ size, showLabel = false }: { size: 32 | 40; showLabel?: boolean }) => {
    const content = (
      <>
        {ownerAvatarUrl ? (
          <Image
            src={ownerAvatarUrl}
            alt={ownerName}
            width={size}
            height={size}
            className="rounded-full object-cover"
          />
        ) : (
          <DefaultAvatar size={size} className="rounded-full" />
        )}
        {showLabel ? (
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-wide text-gray-500">Created by</p>
            <p className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors">
              {ownerName}
            </p>
          </div>
        ) : (
          <span>{ownerName}</span>
        )}
      </>
    );

    if (creatorProfileUrl) {
      return (
        <button
          type="button"
          onClick={navigateToCreator}
          className={`flex items-center gap-${showLabel ? '3' : '2'} ${
            showLabel ? 'hover:opacity-80' : 'text-sm text-gray-600 hover:text-orange-600'
          } transition-colors cursor-pointer`}
        >
          {content}
        </button>
      );
    }

    return (
      <div
        className={`flex items-center gap-${showLabel ? '3' : '2'} ${!showLabel && 'text-sm text-gray-600'}`}
      >
        {content}
      </div>
    );
  };

  const ProjectTypeBadge = () => (
    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0">
      <FolderOpen className="w-3 h-3 mr-1" />
      Project
    </div>
  );

  const CreatedBadge = ({ compact = false }: { compact?: boolean }) => (
    <div
      className={`flex items-center gap-${compact ? '1' : '2'} ${
        compact
          ? 'text-xs font-medium text-orange-600'
          : 'rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600'
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{createdLabel}</span>
    </div>
  );

  const CategoryBadges = ({ max = categories.length }: { max?: number }) => (
    <>
      {categories.slice(0, max).map(category => (
        <span
          key={category}
          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
        >
          {category}
        </span>
      ))}
    </>
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
                  <ProjectTypeBadge />
                </div>
                <CreatorInfo size={32} />
              </div>
              <CreatedBadge compact />
            </div>
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{project.description}</p>
            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <CategoryBadges />
              </div>
            )}
            <ProjectCardMetrics
              currentAmount={currentAmount}
              goalAmount={goalAmount}
              projectCurrency={projectCurrency}
              showProgress={showProgress}
              progressPercentage={progressPercentage}
              compact
            />
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
                <ProjectTypeBadge />
              </div>
              <div className="flex items-center gap-3">
                <CreatorInfo size={40} showLabel />
              </div>
            </div>
            <CreatedBadge />
          </div>

          <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">
            {project.description}
          </p>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <CategoryBadges />
            </div>
          )}

          <ProjectCardMetrics
            currentAmount={currentAmount}
            goalAmount={goalAmount}
            projectCurrency={projectCurrency}
            showProgress={showProgress}
            progressPercentage={progressPercentage}
          />
        </div>
      </Link>
    </div>
  );
}
