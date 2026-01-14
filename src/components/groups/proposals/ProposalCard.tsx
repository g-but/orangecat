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
import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getStatusBadge, getStatusIcon, getTypeLabel } from './utils';
import { PROPOSAL_STATUSES, type ProposalStatus } from '@/config/proposal-constants';

interface ProposalCardProps {
  proposal: {
    id: string;
    title: string;
    description?: string | null;
    proposal_type: string;
    status: 'draft' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
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
    if (!proposal.voting_results) {return 0;}
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
    <Card className="hover:shadow-md transition-shadow">
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
                <span className="text-gray-400">No description</span>
              )}
            </CardDescription>
          </div>
          {getStatusBadge(proposal.status as ProposalStatus)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel(proposal.proposal_type)}
                </Badge>
              </span>
              {proposal.proposer && (
                <span className="text-gray-500">
                  by {proposal.proposer.name || 'Unknown'}
                </span>
              )}
            </div>
            <span className="text-gray-400">
              {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
            </span>
          </div>

          {proposal.status === PROPOSAL_STATUSES.ACTIVE && proposal.voting_results && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Voting Progress</span>
                <span className="font-medium">
                  {yesPercentage.toFixed(1)}% Yes
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>
                  {proposal.voting_results.yes_votes} Yes, {proposal.voting_results.no_votes} No
                </span>
                {proposal.voting_ends_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(proposal.voting_ends_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          )}

          {(proposal.status === PROPOSAL_STATUSES.PASSED || proposal.status === PROPOSAL_STATUSES.FAILED) &&
            proposal.voting_results && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  {proposal.status === PROPOSAL_STATUSES.PASSED ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">
                        Passed with {yesPercentage.toFixed(1)}% Yes votes
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium">
                        Failed with {yesPercentage.toFixed(1)}% Yes votes
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

          <div className="pt-2">
            <Link href={`/groups/${proposal.groupSlug}/proposals/${proposal.id}`}>
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

