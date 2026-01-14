/**
 * Wall of Support Component
 *
 * Visual display of all project supporters (signatures, messages, reactions).
 * Creates a community feeling and shows engagement.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created wall of support component
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Heart, MessageSquare, PenTool, Coins, Trash2 } from 'lucide-react';
import type { ProjectSupportWithUser } from '@/services/projects/support/types';
import projectSupportService from '@/services/projects/support';
import { formatSats, getSupportTypeLabel } from '@/services/projects/support/helpers';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { logger } from '@/utils/logger';

interface WallOfSupportProps {
  projectId: string;
  className?: string;
}

export function WallOfSupport({ projectId, className }: WallOfSupportProps) {
  const { user } = useAuth();
  const [supports, setSupports] = useState<ProjectSupportWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSupports = useCallback(async () => {
    try {
      setLoading(true);
      const result = await projectSupportService.getProjectSupport(projectId, {
        is_anonymous: false, // Only show non-anonymous support
      });
      setSupports(result.supports || []);
    } catch (error) {
      logger.error('Failed to load supports', error, 'WallOfSupport');
      toast.error('Failed to load support');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadSupports();
  }, [loadSupports]);

  const handleDelete = async (supportId: string) => {
    try {
      setDeletingId(supportId);
      const result = await projectSupportService.deleteProjectSupport(supportId);

      if (result.success) {
        toast.success('Support removed');
        loadSupports(); // Reload list
      } else {
        toast.error(result.error || 'Failed to remove support');
      }
    } catch (error) {
      logger.error('Failed to delete support', error, 'WallOfSupport');
      toast.error('Failed to remove support');
    } finally {
      setDeletingId(null);
    }
  };

  const getSupportIcon = (supportType: string) => {
    switch (supportType) {
      case 'bitcoin_donation':
        return <Coins className="h-4 w-4 text-orange-600" />;
      case 'signature':
        return <PenTool className="h-4 w-4 text-blue-600" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'reaction':
        return <Heart className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Loading support...</div>
        </CardContent>
      </Card>
    );
  }

  if (supports.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Wall of Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No support yet. Be the first to show your support!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Wall of Support</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {supports.map(support => {
            const displayName =
              support.display_name || support.user?.name || support.user?.username || 'Anonymous';
            const avatarUrl = support.user?.avatar_url;

            return (
              <div
                key={support.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center border-2 border-orange-300">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{displayName}</span>
                    {getSupportIcon(support.support_type)}
                    <span className="text-xs text-gray-500">
                      {getSupportTypeLabel(support.support_type)}
                    </span>
                  </div>

                  {/* Message */}
                  {support.message && (
                    <p className="text-sm text-gray-700 mb-2">{support.message}</p>
                  )}

                  {/* Reaction */}
                  {support.reaction_emoji && (
                    <div className="text-2xl mb-2">{support.reaction_emoji}</div>
                  )}

                  {/* Bitcoin Donation */}
                  {support.amount_sats && support.amount_sats > 0 && (
                    <div className="text-sm font-medium text-orange-600 mb-2">
                      {formatSats(support.amount_sats)}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-400">
                    {new Date(support.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Delete button (if user owns this support) */}
                {user?.id === support.user_id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(support.id)}
                    disabled={deletingId === support.id}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
