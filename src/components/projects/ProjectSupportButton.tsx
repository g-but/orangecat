/**
 * Project Support Button Component
 *
 * Main support button that opens the support modal.
 * Shows support stats and provides quick access to support options.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created project support button component
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Heart, Coins } from 'lucide-react';
import { SupportModal } from './SupportModal';
import projectSupportService from '@/services/projects/support';
import type { ProjectSupportStats } from '@/services/projects/support/types';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { logger } from '@/utils/logger';

interface ProjectSupportButtonProps {
  projectId: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
  className?: string;
  onSupportAdded?: () => void;
}

export function ProjectSupportButton({
  projectId,
  variant = 'primary',
  size = 'md',
  showStats = false,
  className,
  onSupportAdded,
}: ProjectSupportButtonProps) {
  const { formatAmount } = useDisplayCurrency();
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState<ProjectSupportStats | null>(null);
  const [_loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const result = await projectSupportService.getProjectSupportStats(projectId);
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      logger.error('Failed to load support stats', error, 'ProjectSupportButton');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (showStats) {
      loadStats();
    }
  }, [showStats, loadStats]);

  const handleSupportAdded = () => {
    if (showStats) {
      loadStats();
    }
    onSupportAdded?.();
  };

  const totalSupport =
    (stats?.total_signatures || 0) + (stats?.total_messages || 0) + (stats?.total_reactions || 0);

  return (
    <>
      <div className={`flex items-center gap-3 ${className}`}>
        <Button
          onClick={() => setModalOpen(true)}
          variant={variant}
          size={size}
          className="flex items-center gap-2"
        >
          <Heart className="h-4 w-4" />
          Support Project
        </Button>

        {showStats && stats && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {stats.total_bitcoin_sats > 0 && (
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-orange-600" />
                <span className="font-medium">{formatAmount(stats.total_bitcoin_sats)}</span>
              </div>
            )}
            {totalSupport > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-red-600" />
                <span>{totalSupport} supporters</span>
              </div>
            )}
          </div>
        )}
      </div>

      <SupportModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        onSuccess={handleSupportAdded}
      />
    </>
  );
}
