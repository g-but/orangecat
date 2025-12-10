'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import { Plus, Briefcase, Eye, Edit, Trash2, Clock, DollarSign } from 'lucide-react';
import { UserService } from '@/types/database';

export default function ServicesDashboardPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth');
      return;
    }

    if (user?.id) {
      loadServices();
    }
  }, [user, hydrated, isLoading, router]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services?user_id=${user?.id}&limit=50`);
      if (!response.ok) {
        throw new Error('Failed to load services');
      }
      const data = await response.json();
      setServices(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      // Remove from local state
      setServices(services.filter(s => s.id !== serviceId));
    } catch (err) {
      alert('Failed to delete service: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const formatPricing = (service: UserService) => {
    const parts = [];
    if (service.hourly_rate_sats) {
      parts.push(`${service.hourly_rate_sats} sats/hour`);
    }
    if (service.fixed_price_sats) {
      parts.push(`${service.fixed_price_sats} sats`);
    }
    return parts.join(' or ') || 'Contact for pricing';
  };

  const draftServices = services.filter(s => s.status === 'draft');
  const activeServices = services.filter(s => s.status === 'active');

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your services..." />;
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Services</h1>
            <p className="text-gray-600 mt-1">Offer your expertise and skills to the community</p>
          </div>
          <Link href="/dashboard/services/create">
            <Button className="bg-gradient-to-r from-orange-600 to-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Services</p>
                  <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Services</p>
                  <p className="text-2xl font-bold text-gray-900">{activeServices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Service Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(services.map(s => s.category)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Loading message="Loading your services..." />
      ) : error ? (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Services</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadServices} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : services.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No services yet</h3>
            <p className="text-gray-600 mb-6">Share your expertise by creating your first service offering.</p>
            <Link href="/dashboard/services/create">
              <Button className="bg-gradient-to-r from-orange-600 to-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Service
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Services */}
          {activeServices.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Services ({activeServices.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeServices.map(service => (
                  <Card key={service.id} className="shadow-card hover:shadow-card-hover transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{service.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2 flex-shrink-0">
                          Active
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium text-gray-900">{service.category}</span>
                          {service.service_location_type === 'remote' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Remote</span>
                          )}
                          {service.service_location_type === 'onsite' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">On-site</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <DollarSign className="w-4 h-4" />
                          {formatPricing(service)}
                        </div>

                        {service.duration_minutes && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {service.duration_minutes} minutes
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/services/create?edit=${service.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
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

          {/* Draft Services */}
          {draftServices.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Draft Services ({draftServices.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {draftServices.map(service => (
                  <Card key={service.id} className="shadow-card hover:shadow-card-hover transition-all border-orange-200 bg-orange-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{service.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-2 flex-shrink-0">
                          Draft
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium text-gray-900">{service.category}</span>
                          {service.service_location_type === 'remote' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Remote</span>
                          )}
                          {service.service_location_type === 'onsite' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">On-site</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <DollarSign className="w-4 h-4" />
                          {formatPricing(service)}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/services/create?edit=${service.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
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


























