'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import { ArrowLeft, Bitcoin } from 'lucide-react';
import { MissingWalletBanner } from '@/components/project/MissingWalletBanner';
import CampaignShare from '@/components/sharing/CampaignShare';
import ProjectMediaGallery from '@/components/project/ProjectMediaGallery';
import ProjectSummaryRail from '@/components/project/ProjectSummaryRail';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectContent } from '@/components/project/ProjectContent';
import ProjectTimeline from '@/components/project/ProjectTimeline';
import { ROUTES } from '@/lib/routes';
import { useState, useEffect } from 'react';

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

interface ProjectPageClientProps {
  project: Project;
}

/**
 * Project Page Client Component
 *
 * Handles all client-side interactivity for project pages.
 * The server component handles data fetching and SEO metadata.
 */
export default function ProjectPageClient({ project }: ProjectPageClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  const isOwner = project.user_id === user?.id;
  const projectId = project.id;

  // Show floating CTA on mobile after scrolling past 300px
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCTA(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to donation section
  const scrollToDonation = () => {
    const donationSection = document.getElementById('bitcoin-donation-section');
    if (donationSection) {
      donationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Calculate progress for mobile CTA
  const progressPercentage = project.goal_amount
    ? Math.min(((project.raised_amount || 0) / project.goal_amount) * 100, 100)
    : 0;

  // Get status display info helper
  const getStatusInfo = (status: string) => {
    const normalized = status?.toLowerCase();
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
      active: { label: 'Active', className: 'bg-green-100 text-green-700' },
      paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    };
    return (
      statusMap[normalized] || {
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown',
        className: 'bg-gray-100 text-gray-700',
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="mb-6"
            aria-label="Go back to previous page"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.back();
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back
          </Button>
        </div>

        {/* Layout: main + rail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Project Header */}
            <ProjectHeader
              project={project}
              isOwner={isOwner}
              onShare={() => setShowShareDialog(true)}
              getStatusInfo={getStatusInfo}
            />

            {/* Missing Wallet Banner */}
            {!project.bitcoin_address && !project.lightning_address && (
              <MissingWalletBanner projectId={projectId} isOwner={isOwner} className="mb-6" />
            )}

            {/* Gallery */}
            <ProjectMediaGallery projectId={projectId} className="mb-6" />

            {/* Project Content */}
            <ProjectContent
              project={{
                ...project,
                id: project.id,
                bitcoin_address: project.bitcoin_address,
                lightning_address: project.lightning_address,
                isOwner,
              }}
            />

            {/* Project Timeline */}
            <div className="mt-8">
              <ProjectTimeline
                projectId={project.id}
                projectTitle={project.title}
                isOwner={isOwner}
              />
            </div>
          </div>
          <div>
            <ProjectSummaryRail
              project={{
                id: project.id,
                goal_amount: project.goal_amount,
                currency: project.currency,
                bitcoin_address: project.bitcoin_address,
                bitcoin_balance_btc: (project as any).bitcoin_balance_btc || 0,
                bitcoin_balance_updated_at: (project as any).bitcoin_balance_updated_at || null,
                supporters_count: (project as any).supporters_count || 0,
                last_donation_at: (project as any).last_donation_at || null,
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

      {/* Floating CTA - Mobile Only */}
      {!isOwner && project.bitcoin_address && showFloatingCTA && (
        <div
          className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300 ${
            showFloatingCTA ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">
                  Goal: {formatCurrency(project.goal_amount, project.currency)}
                </div>
                <div className="text-lg font-bold text-gray-900 truncate">
                  {formatCurrency(project.raised_amount || 0, project.currency)}
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-1.5 bg-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              <Button
                onClick={scrollToDonation}
                className="flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 shadow-lg"
              >
                <Bitcoin className="w-4 h-4 mr-2" aria-hidden="true" />
                Donate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format currency
function formatCurrency(amount: number | null, currency: string): string {
  if (!amount) return `0 ${currency}`;

  if (currency === 'BTC') {
    return `${amount.toFixed(8)} BTC`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'CHF',
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
