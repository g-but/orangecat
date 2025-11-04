'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import Loading from '@/components/Loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Edit, ExternalLink, Bitcoin, Heart, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { MissingWalletBanner } from '@/components/project/MissingWalletBanner';
import { getUniqueCategories } from '@/utils/project';
import Link from 'next/link';
import Image from 'next/image';
import CampaignShare from '@/components/sharing/CampaignShare';
import ProjectMediaGallery from '@/components/project/ProjectMediaGallery';
import ProjectSummaryRail from '@/components/project/ProjectSummaryRail';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';

interface Project {
  id: string;
  title: string;
  description: string;
  user_id: string;
  goal_amount: number | null;
  currency: string;
  funding_purpose: string | null;
  bitcoin_address: string | null;
  lightning_address: string | null;
  website_url: string | null;
  category: string | null;
  tags: string[] | null;
  status: string;
  raised_amount: number | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  };
}

export default function PublicProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const isOwner = project?.user_id === user?.id;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Project not found');
        }

        // Ensure raised_amount exists
        const projectData = {
          ...result.data,
          raised_amount: result.data.raised_amount ?? 0,
        };

        setProject(projectData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load project';
        setError(errorMessage);
        logger.error('Failed to fetch project', { projectId, error: err }, 'PublicProjectPage');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader className="text-center bg-red-50">
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>Project Not Found</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4">The project you are looking for does not exist.</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = project.goal_amount
    ? Math.min(((project.raised_amount || 0) / project.goal_amount) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={() => router.back()} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {isOwner && user && (
              <div className="flex gap-2">
                <Link href={ROUTES.PROJECTS.EDIT(projectId)}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Project
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareDialog(!showShareDialog)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : project.status === 'draft'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-orange-100 text-orange-700'
              }`}
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500">
              Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Missing Wallet Banner */}
        {!project.bitcoin_address && !project.lightning_address && (
          <MissingWalletBanner projectId={projectId} isOwner={isOwner} className="mb-6" />
        )}

        {/* Layout: main + rail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Gallery */}
            <ProjectMediaGallery projectId={projectId} className="mb-6" />

            {/* Main Project Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-3xl">{project.title}</CardTitle>
                {/* Creator Info */}
                {project.profiles && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {project.profiles.avatar_url ? (
                        <Image
                          src={project.profiles.avatar_url}
                          alt={project.profiles.name || project.profiles.username || 'Creator'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold">
                          {(project.profiles.name || project.profiles.username || 'A')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Created by</p>
                        <Link
                          href={`/profile/${project.profiles.username || project.user_id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                        >
                          {project.profiles.name || project.profiles.username || 'Anonymous'}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                {!project.profiles && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold">
                      ?
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created by</p>
                      <span className="text-sm font-semibold text-gray-900">Anonymous</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
                </div>

                {/* Funding Purpose */}
                {project.funding_purpose && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">What the funds will be used for</h3>
                    <p className="text-gray-700">{project.funding_purpose}</p>
                  </div>
                )}

                {/* Website URL */}
                {project.website_url && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Project Website</h3>
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="underline">{project.website_url}</span>
                    </a>
                  </div>
                )}

                {/* Categories & Tags */}
                {(project.category || (project.tags && project.tags.length > 0)) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {getUniqueCategories(project.category, project.tags).map((category, idx) => (
                        <span
                          key={`${category}-${idx}`}
                          className={`px-3 py-1 rounded-full text-sm ${
                            idx === 0 && project.category === category
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Funding Progress */}
                {project.goal_amount && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">Funding Progress</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-bitcoinOrange">
                          <CurrencyDisplay
                            amount={project.raised_amount || 0}
                            currency={
                              (project.currency || 'CHF') as 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS'
                            }
                          />
                        </div>
                        <div className="text-sm text-gray-500">
                          of{' '}
                          <CurrencyDisplay
                            amount={project.goal_amount}
                            currency={
                              (project.currency || 'CHF') as 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS'
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-bitcoinOrange to-orange-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {progressPercentage.toFixed(1)}% funded
                    </div>
                  </div>
                )}

                {/* Bitcoin Address */}
                {project.bitcoin_address && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Bitcoin className="w-5 h-5 text-bitcoinOrange" />
                      Donate Bitcoin
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-gray-900 break-all">
                          {project.bitcoin_address}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(project.bitcoin_address!);
                            toast.success('Bitcoin address copied to clipboard!');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lightning Address */}
                {project.lightning_address && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-yellow-500" />
                      Lightning Donation
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-gray-900">
                          {project.lightning_address}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(project.lightning_address!);
                            toast.success('Lightning address copied to clipboard!');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Creator Info */}
            {project.profiles && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-bitcoinOrange to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {project.profiles.name?.[0] || project.profiles.username?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {project.profiles.name || 'Anonymous'}
                      </h3>
                      {project.profiles.username && (
                        <p className="text-sm text-gray-600">@{project.profiles.username}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <div>
            <ProjectSummaryRail
              project={{
                id: project.id,
                goal_amount: project.goal_amount,
                currency: project.currency,
                bitcoin_address: project.bitcoin_address,
                // these may be null currently; safe defaults
                bitcoin_balance_btc: (project as any).bitcoin_balance_btc || 0,
                bitcoin_balance_updated_at: (project as any).bitcoin_balance_updated_at || null,
                user_id: project.user_id,
              }}
              isOwner={isOwner}
            />
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && project && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
          <div className="pointer-events-auto mt-20 mr-4">
            <CampaignShare
              projectId={project.id}
              projectTitle={project.title}
              projectDescription={project.description}
              currentUrl={
                typeof window !== 'undefined'
                  ? `${window.location.origin}${ROUTES.PROJECTS.VIEW(project.id)}`
                  : ''
              }
              onClose={() => setShowShareDialog(false)}
              variant="dropdown"
            />
          </div>
        </div>
      )}
    </div>
  );
}
