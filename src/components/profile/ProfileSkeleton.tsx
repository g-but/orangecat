'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';

/**
 * Skeleton loader for profile wallets section
 */
export function WalletsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map(i => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-2 w-full bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-16 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for profile stats sidebar
 */
export function ProfileStatsSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for projects list
 */
export function ProjectsSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border-2 border-gray-200 bg-white overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-32 h-48 sm:h-auto flex-shrink-0 bg-gray-200 animate-pulse" />
              <div className="flex-1 p-4 sm:p-5">
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-2 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete profile skeleton for initial page load
 */
export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Banner Skeleton */}
        <div className="relative mb-8">
          <div className="relative h-48 sm:h-64 lg:h-80 bg-gray-200 rounded-2xl shadow-xl animate-pulse" />
          <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gray-300 border-4 border-white shadow-2xl animate-pulse" />
          </div>
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 sm:gap-3">
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 sm:mt-20">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card Skeleton */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Wallets Skeleton */}
            <WalletsSkeleton />

            {/* Projects Skeleton */}
            <ProjectsSkeleton />
          </div>

          {/* Right Column Skeleton */}
          <div className="space-y-6">
            <ProfileStatsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
