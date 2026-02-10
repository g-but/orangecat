/**
 * Transparency Score Configuration — SSOT
 *
 * Defines criteria, categories, and weights for the transparency score calculation.
 * Used by src/services/transparency.ts for weighted scoring.
 */

export interface TransparencyCriterion {
  key: string;
  label: string;
  description: string;
  weight: number;
}

export interface TransparencyCategory {
  label: string;
  weight: number;
  criteria: TransparencyCriterion[];
}

export const TRANSPARENCY_CONFIG = {
  categories: {
    governance: {
      label: 'Governance',
      weight: 0.3,
      criteria: [
        {
          key: 'isOpenSource',
          label: 'Open Source',
          description: 'Source code is publicly available',
          weight: 0.4,
        },
        {
          key: 'hasContributionGuidelines',
          label: 'Contribution Guidelines',
          description: 'Clear guidelines for contributors',
          weight: 0.3,
        },
        {
          key: 'hasIssueTracking',
          label: 'Issue Tracking',
          description: 'Public issue tracker for bugs and features',
          weight: 0.3,
        },
      ],
    },
    financial: {
      label: 'Financial Transparency',
      weight: 0.4,
      criteria: [
        {
          key: 'hasTransactionHistory',
          label: 'Transaction History',
          description: 'On-chain transaction records are visible',
          weight: 0.35,
        },
        {
          key: 'hasTransactionComments',
          label: 'Transaction Comments',
          description: 'Transactions include descriptive comments',
          weight: 0.15,
        },
        {
          key: 'hasFinancialReports',
          label: 'Financial Reports',
          description: 'Periodic financial summaries published',
          weight: 0.25,
        },
        {
          key: 'hasKPIs',
          label: 'Key Performance Indicators',
          description: 'Measurable goals and progress tracking',
          weight: 0.25,
        },
      ],
    },
    community: {
      label: 'Community Engagement',
      weight: 0.3,
      criteria: [
        {
          key: 'hasMissionStatement',
          label: 'Mission Statement',
          description: 'Clear mission and purpose documented',
          weight: 0.25,
        },
        {
          key: 'hasProgressUpdates',
          label: 'Progress Updates',
          description: 'Regular updates shared with supporters',
          weight: 0.25,
        },
        {
          key: 'hasPublicChannels',
          label: 'Public Channels',
          description: 'Accessible communication channels',
          weight: 0.2,
        },
        {
          key: 'hasCommunityUpdates',
          label: 'Community Updates',
          description: 'News and announcements for the community',
          weight: 0.15,
        },
        {
          key: 'isResponsiveToFeedback',
          label: 'Responsive to Feedback',
          description: 'Actively responds to community feedback',
          weight: 0.15,
        },
      ],
    },
  },
} as const satisfies Record<string, Record<string, TransparencyCategory>>;

/** All criterion keys for type safety */
export type TransparencyCriterionKey =
  (typeof TRANSPARENCY_CONFIG.categories)[keyof typeof TRANSPARENCY_CONFIG.categories]['criteria'][number]['key'];

/** Helper to get a flat list of all criteria with their effective weight */
export function getTransparencyCriteria(): Array<
  TransparencyCriterion & { category: string; effectiveWeight: number }
> {
  return Object.entries(TRANSPARENCY_CONFIG.categories).flatMap(([categoryKey, category]) =>
    category.criteria.map(criterion => ({
      ...criterion,
      category: categoryKey,
      effectiveWeight: category.weight * criterion.weight,
    }))
  );
}
