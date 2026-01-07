/**
 * Proposal Component Utilities
 *
 * Shared utilities for proposal components to avoid duplication.
 * Follows DRY principle.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial proposal utilities
 */

import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import {
  PROPOSAL_STATUSES,
  PROPOSAL_TYPE_LABELS,
  PROPOSAL_STATUS_CONFIG,
  type ProposalStatus,
  type ProposalType,
} from '@/config/proposal-constants';

/**
 * Get status badge component
 */
export function getStatusBadge(status: ProposalStatus) {
  const config = PROPOSAL_STATUS_CONFIG[status];
  if (!config) {return null;}

  return (
    <Badge variant={config.badgeVariant} className={config.className}>
      {config.label}
    </Badge>
  );
}

/**
 * Get status icon component
 */
export function getStatusIcon(status: ProposalStatus) {
  switch (status) {
    case PROPOSAL_STATUSES.PASSED:
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case PROPOSAL_STATUSES.FAILED:
      return <XCircle className="h-4 w-4 text-red-500" />;
    case PROPOSAL_STATUSES.ACTIVE:
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
}

/**
 * Get type label
 */
export function getTypeLabel(type: ProposalType | string): string {
  return PROPOSAL_TYPE_LABELS[type as ProposalType] || type;
}

