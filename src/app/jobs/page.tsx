/**
 * Job Postings Browse Page
 *
 * Public page for browsing job postings from groups.
 * Follows Network State Development Guide - Job Postings feature
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial implementation
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Clock, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/jobs?limit=50');
      if (!response.ok) {
        throw new Error('Failed to load job postings');
      }

      const data = await response.json();
      if (data.success) {
        setJobs(data.data?.jobs || []);
      } else {
        throw new Error(data.error || 'Failed to load job postings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadJobs}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Briefcase className="h-8 w-8" />
          Job Postings
        </h1>
        <p className="text-gray-600">
          Browse employment opportunities from network states and groups
        </p>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No job postings available</p>
            <p className="text-sm text-gray-400">Check back later or create a group to post jobs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                    {job.groups && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Building2 className="h-4 w-4" />
                        <Link href={`/groups/${job.groups.slug}`} className="hover:underline">
                          {job.groups.name}
                        </Link>
                      </div>
                    )}
                    {job.description && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {job.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="default" className="bg-blue-500">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {job.action_data?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.action_data.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <Link href={`/groups/${job.groups?.slug}/proposals/${job.id}`}>
                    <Button>View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
