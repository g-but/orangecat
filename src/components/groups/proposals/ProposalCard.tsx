/**
 * Proposal Card Component
 *
 * Displays a proposal in a card format for lists.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial implementation
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { formatRelativeTime } from '@/utils/dates';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getStatusBadge, getStatusIcon, getTypeLabel } from './utils';
import { PROPOSAL_STATUSES, type ProposalStatus } from '@/config/proposal-constants';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

interface ProposalCardProps {
  proposal: {
    id: string;
    title: string;
    description?: string | null;
    proposal_type: string;
    status: ProposalStatus;
    voting_results?: {
      yes_votes: number;
      no_votes: number;
      abstain_votes?: number;
      total_voting_power: number;
      yes_percentage?: number;
      has_passed?: boolean;
    } | null;
    proposer?: {
      name?: string | null;
      avatar_url?: string | null;
    } | null;
    created_at: string;
    voting_ends_at?: string | null;
    groupSlug: string;
  };
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  // Calculate yes_percentage if not provided
  const getYesPercentage = () => {
    if (!proposal.voting_results) {
      return 0;
    }
    if (proposal.voting_results.yes_percentage !== undefined) {
      return proposal.voting_results.yes_percentage;
    }
    if (proposal.voting_results.total_voting_power > 0) {
      return (proposal.voting_results.yes_votes / proposal.voting_results.total_voting_power) * 100;
    }
    return 0;
  };

  const yesPercentage = getYesPercentage();

  return (
    <Card className="oc-card-link">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getStatusIcon(proposal.status as ProposalStatus)}
              {proposal.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {proposal.description ? (
                <span className="line-clamp-2">{proposal.description}</span>
              ) : (
                <span className="text-fg-tertiary">No description</span>
              )}
            </CardDescription>
          </div>
          {getStatusBadge(proposal.status as ProposalStatus)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-fg-secondary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel(proposal.proposal_type)}
                </Badge>
              </span>
              {proposal.proposer && (
                <span className="text-fg-secondary">by {proposal.proposer.name || 'Unknown'}</span>
              )}
            </div>
            <span className="text-fg-tertiary">{formatRelativeTime(proposal.created_at)}</span>
          </div>

          {proposal.status === PROPOSAL_STATUSES.ACTIVE && proposal.voting_results && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-secondary">Voting Progress</span>
                <span className="font-medium">{yesPercentage.toFixed(1)}% Yes</span>
              </div>
              <div className="mt-2 h-2 bg-surface-raised rounded-full overflow-hidden">
                <div
                  className="h-full bg-fg-primary transition-all"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-fg-secondary mt-1">
                <span>
                  {proposal.voting_results.yes_votes} Yes, {proposal.voting_results.no_votes} No
                </span>
                {proposal.voting_ends_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(proposal.voting_ends_at)}
                  </span>
                )}
              </div>
            </div>
          )}

          {(proposal.status === PROPOSAL_STATUSES.PASSED ||
            proposal.status === PROPOSAL_STATUSES.FAILED) &&
            proposal.voting_results && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  {proposal.status === PROPOSAL_STATUSES.PASSED ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-status-positive" />
                      <span className="text-status-positive font-medium">
                        Passed with {yesPercentage.toFixed(1)}% Yes votes
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-status-negative" />
                      <span className="text-status-negative font-medium">
                        Failed with {yesPercentage.toFixed(1)}% Yes votes
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

          <div className="pt-2">
            <Link
              href={`${ENTITY_REGISTRY['organization'].publicBasePath}/${proposal.groupSlug}/proposals/${proposal.id}`}
            >
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
