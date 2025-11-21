'use client';

import { useState } from 'react';
import {
  Share2,
  X as XIcon,
  Download,
  QrCode,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { trackEvent } from '@/utils/monitoring';
import ShareContent from './ShareContent';

interface CampaignShareProps {
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  projectImage?: string;
  currentUrl?: string;
  onClose?: () => void;
  variant?: 'modal' | 'dropdown' | 'inline';
  className?: string;
}

/**
 * CampaignShare Component
 * 
 * Wrapper around ShareContent for project/campaign-specific sharing.
 * Extends ShareContent with project-specific features (QR code, analytics).
 * DRY: Uses reusable ShareContent component.
 */
export default function CampaignShare({
  projectId,
  projectTitle,
  projectDescription = '',
  currentUrl,
  onClose,
  variant = 'dropdown',
  className = '',
}: CampaignShareProps) {
  // Construct the project URL
  const projectUrl = currentUrl || `${typeof window !== 'undefined' ? window.location.origin : 'https://orangecat.ch'}/projects/${projectId}`;

  // Create optimized share text
  const shareTitle = `Support: ${projectTitle}`;
  const shareDescription =
    projectDescription || `Check out this amazing Bitcoin fundraising project: ${projectTitle}`;

  // Track share events for analytics
  const trackShareEvent = (platform: string) => {
    trackEvent(`project_share_${platform}`, { projectId, projectTitle });
  };

  // Enhanced onClose that tracks analytics
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Campaign
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <XIcon className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{projectTitle}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{projectDescription}</p>
            </div>
            <ShareContent
              title={shareTitle}
              description={shareDescription}
              url={projectUrl}
              onClose={handleClose}
              showTitle={false}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default dropdown variant - Use ShareContent with project-specific enhancements
  return (
    <div className={className}>
      <ShareContent
        title={shareTitle}
        description={shareDescription}
        url={projectUrl}
        onClose={handleClose}
        titleText="Share Campaign"
      />
    </div>
  );
}
