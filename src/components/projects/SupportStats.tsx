/**
 * Support Stats Component
 *
 * Displays project support statistics (donations, signatures, messages, reactions).
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created support stats component
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Heart, MessageSquare, PenTool, Coins } from 'lucide-react';
import type { ProjectSupportStats } from '@/services/projects/support/types';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import projectSupportService from '@/services/projects/support';
import { logger } from '@/utils/logger';

interface SupportStatsProps {
  projectId: string;
  className?: string;
}

export function SupportStats({ projectId, className }: SupportStatsProps) {
  const { formatAmount } = useDisplayCurrency();
  const [stats, setStats] = useState<ProjectSupportStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const result = await projectSupportService.getProjectSupportStats(projectId);
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      logger.error('Failed to load support stats', error, 'SupportStats');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading || !stats) {
    return null; // Don't show anything while loading
  }
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Support Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Bitcoin Donations */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Coins className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatAmount(stats.total_bitcoin_sats)}
            </div>
            <div className="text-sm text-gray-500">Donated</div>
          </div>

          {/* Signatures */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <PenTool className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_signatures}</div>
            <div className="text-sm text-gray-500">Signatures</div>
          </div>

          {/* Messages */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.total_messages}</div>
            <div className="text-sm text-gray-500">Messages</div>
          </div>

          {/* Reactions */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.total_reactions}</div>
            <div className="text-sm text-gray-500">Reactions</div>
          </div>
        </div>

        {/* Total Supporters */}
        <div className="mt-4 pt-4 border-t text-center">
          <div className="text-lg font-semibold text-gray-900">
            {stats.total_supporters} Total Supporters
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
