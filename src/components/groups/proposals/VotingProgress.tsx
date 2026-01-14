/**
 * Voting Progress Component
 *
 * Displays voting progress for a proposal with visual indicators.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial implementation
 */

'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle2, XCircle } from 'lucide-react';

interface VotingProgressProps {
  votingResults: {
    yes_votes: number;
    no_votes: number;
    abstain_votes?: number;
    total_voting_power: number;
    yes_percentage?: number;
    has_passed?: boolean;
  };
  threshold: number;
  totalMembers?: number;
}

export function VotingProgress({ votingResults, threshold, totalMembers }: VotingProgressProps) {
  // Calculate yes_percentage if not provided
  const yesPercentage =
    votingResults.yes_percentage ??
    (votingResults.total_voting_power > 0
      ? (votingResults.yes_votes / votingResults.total_voting_power) * 100
      : 0);

  // Calculate has_passed if not provided
  const hasPassed = votingResults.has_passed ?? yesPercentage >= threshold;

  const noPercentage =
    votingResults.total_voting_power > 0
      ? (votingResults.no_votes / votingResults.total_voting_power) * 100
      : 0;

  const participationRate = totalMembers
    ? (votingResults.total_voting_power / totalMembers) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voting Results</CardTitle>
        <CardDescription>
          {hasPassed ? (
            <span className="text-green-600 font-medium">Proposal has passed!</span>
          ) : (
            <span>
              Needs {threshold}% Yes votes to pass (currently {yesPercentage.toFixed(1)}%)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Yes Votes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">Yes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{yesPercentage.toFixed(1)}%</span>
              <span className="text-gray-500">({votingResults.yes_votes} votes)</span>
            </div>
          </div>
          <Progress value={yesPercentage} className="h-2" />
        </div>

        {/* No Votes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium">No</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{noPercentage.toFixed(1)}%</span>
              <span className="text-gray-500">({votingResults.no_votes} votes)</span>
            </div>
          </div>
          <Progress value={noPercentage} className="h-2" />
        </div>

        {/* Participation */}
        {totalMembers && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Participation</span>
              <span className="font-medium">{participationRate.toFixed(1)}%</span>
            </div>
            <Progress value={participationRate} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {votingResults.total_voting_power} of {totalMembers} members have voted
            </p>
          </div>
        )}

        {/* Threshold Indicator */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Required Threshold</span>
            <span className="font-medium">{threshold}%</span>
          </div>
          {yesPercentage >= threshold ? (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Threshold met - Proposal will pass
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Need {((threshold - yesPercentage) / 100) * votingResults.total_voting_power} more Yes
              votes
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
