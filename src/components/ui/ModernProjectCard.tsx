'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Clock, Target } from 'lucide-react';
import { CurrencyDisplay } from './CurrencyDisplay';
import BTCAmountDisplay from './BTCAmountDisplay';
import { SearchFundingPage } from '@/services/search';
import { useAuth } from '@/hooks/useAuth';

interface ModernProjectCardProps {
  project: SearchFundingPage;
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

function dedupe(values: Array<string | null | undefined>, limit = 3): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach(value => {
    if (!value) {
      return;
    }
    const normalized = value.trim();
    if (!normalized) {
      return;
    }
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  });

  return result.slice(0, limit);
}

function getStatusBadge(status: string) {
  const normalized = status?.toLowerCase();
  switch (normalized) {
    case 'active':
      return {
        label: 'Active',
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      };
    case 'draft':
      return { label: 'Draft', className: 'bg-slate-100 text-slate-600 border border-slate-200' };
    case 'completed':
      return {
        label: 'Completed',
        className: 'bg-orange-100 text-orange-600 border border-orange-200',
      };
    default:
      return null;
  }
}

export default function ModernProjectCard({
  project,
  viewMode = 'grid',
  className = '',
}: ModernProjectCardProps) {
  const { user, profile } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const goalAmount = project.goal_amount ?? 0;
  const currentAmount = project.raised_amount ?? 0;
  const projectCurrency = (project as any).currency || 'SATS';
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
      dedupe([
        project.category,
        ...(Array.isArray((project as any).tags) ? (project as any).tags : []),
      ]),
    [project.category, (project as any).tags]
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

  const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : 'P';
  const statusBadge = getStatusBadge(project.status || 'active');

  const gradient =
    gradientByCategory[categories[0]?.toLowerCase() || 'default'] ?? gradientByCategory.default;
  const iconTone =
    iconColorByCategory[categories[0]?.toLowerCase() || 'default'] ?? iconColorByCategory.default;

  const imageElement =
    ((project as any).banner_url || project.profiles?.avatar_url) && !imageError ? (
      <Image
        src={(project as any).banner_url || project.profiles!.avatar_url!}
        alt={project.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
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
      <motion.div
        className={`flex w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow duration-200 hover:border-gray-200 hover:shadow-lg ${className}`}
        whileHover={{ y: -2 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href={`/projects/${project.id}`} className="flex w-full flex-col gap-4 sm:flex-row">
          <div className="relative h-48 flex-1 overflow-hidden sm:h-auto">
            {imageElement}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
              <motion.div
                className="h-full bg-gradient-to-r from-bitcoinOrange to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
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
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {project.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600">
                    {ownerInitial}
                  </div>
                  <span>{ownerName}</span>
                </div>
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
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow duration-200 hover:border-gray-200 hover:shadow-xl ${className}`}
      whileHover={{ y: -4, scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link href={`/projects/${project.id}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {imageElement}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <motion.button
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur transition-colors duration-200 hover:bg-white/40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              setIsLiked(prev => !prev);
            }}
            aria-label={isLiked ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </motion.button>
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
              <h3 className="text-xl font-semibold leading-snug text-gray-900 line-clamp-2">
                {project.title}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
                  {ownerInitial}
                </div>
                <div className="leading-tight">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Created by</p>
                  <p className="text-sm font-medium text-gray-900">{ownerName}</p>
                </div>
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
    </motion.div>
  );
}
