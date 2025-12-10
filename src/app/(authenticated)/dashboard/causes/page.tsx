'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import { Plus, Heart, Eye, Edit, Trash2, Target, TrendingUp } from 'lucide-react';
import { UserCause } from '@/types/database';

export default function CausesDashboardPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();
  const [causes, setCauses] = useState<UserCause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth');
      return;
    }

    if (user?.id) {
      loadCauses();
    }
  }, [user, hydrated, isLoading, router]);

  const loadCauses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/causes?user_id=${user?.id}&limit=50`);
      if (!response.ok) {
        throw new Error('Failed to load causes');
      }
      const data = await response.json();
      setCauses(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load causes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCause = async (causeId: string) => {
    if (!confirm('Are you sure you want to delete this cause?')) {
      return;
    }

    try {
      const response = await fetch(`/api/causes/${causeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete cause');
      }

      // Remove from local state
      setCauses(causes.filter(c => c.id !== causeId));
    } catch (err) {
      alert('Failed to delete cause: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const draftCauses = causes.filter(c => c.status === 'draft');
  const activeCauses = causes.filter(c => c.status === 'active');
  const completedCauses = causes.filter(c => c.status === 'completed');

  const getProgressPercentage = (cause: UserCause) => {
    if (!cause.goal_sats || cause.goal_sats === 0) {
      return 0;
    }
    return Math.min((cause.total_raised_sats / cause.goal_sats) * 100, 100);
  };

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your causes..." />;
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Causes</h1>
            <p className="text-gray-600 mt-1">Create and manage charitable fundraising campaigns</p>
          </div>
          <Link href="/dashboard/causes/create">
            <Button className="bg-gradient-to-r from-orange-600 to-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Cause
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Causes</p>
                  <p className="text-2xl font-bold text-gray-900">{causes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Causes</p>
                  <p className="text-2xl font-bold text-gray-900">{activeCauses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedCauses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Raised</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {causes.reduce((sum, c) => sum + c.total_raised_sats, 0).toLocaleString()} sats
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Loading message="Loading your causes..." />
      ) : error ? (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Causes</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadCauses} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : causes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No causes yet</h3>
            <p className="text-gray-600 mb-6">Start making a difference by creating your first charitable cause.</p>
            <Link href="/dashboard/causes/create">
              <Button className="bg-gradient-to-r from-orange-600 to-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Cause
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Causes */}
          {activeCauses.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Causes ({activeCauses.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeCauses.map(cause => (
                  <Card key={cause.id} className="shadow-card hover:shadow-card-hover transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{cause.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{cause.description}</CardDescription>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2 flex-shrink-0">
                          Active
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {cause.cause_category}
                          </span>
                        </div>

                        {cause.goal_sats && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-gray-900">
                                {cause.total_raised_sats.toLocaleString()} / {cause.goal_sats.toLocaleString()} sats
                              </span>
                              <span className="text-gray-600">
                                {getProgressPercentage(cause).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-tiffany-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getProgressPercentage(cause)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/causes/create?edit=${cause.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCause(cause.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Causes */}
          {completedCauses.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Causes ({completedCauses.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedCauses.map(cause => (
                  <Card key={cause.id} className="shadow-card hover:shadow-card-hover transition-all border-green-200 bg-green-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{cause.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{cause.description}</CardDescription>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2 flex-shrink-0">
                          Completed
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {cause.cause_category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                          <Target className="w-4 h-4" />
                          Goal Reached!
                        </div>

                        <div className="text-sm text-gray-600">
                          Raised: {cause.total_raised_sats.toLocaleString()} sats
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/causes/create?edit=${cause.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCause(cause.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Draft Causes */}
          {draftCauses.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Draft Causes ({draftCauses.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {draftCauses.map(cause => (
                  <Card key={cause.id} className="shadow-card hover:shadow-card-hover transition-all border-orange-200 bg-orange-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{cause.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{cause.description}</CardDescription>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-2 flex-shrink-0">
                          Draft
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {cause.cause_category}
                          </span>
                        </div>

                        {cause.goal_sats && (
                          <div className="text-sm text-gray-600">
                            Goal: {cause.goal_sats.toLocaleString()} sats
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/causes/create?edit=${cause.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCause(cause.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
