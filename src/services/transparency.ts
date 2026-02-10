import { TRANSPARENCY_CONFIG, getTransparencyCriteria } from '@/config/transparency';

export interface TransparencyData {
  isOpenSource: boolean;
  hasContributionGuidelines: boolean;
  hasIssueTracking: boolean;
  hasMissionStatement: boolean;
  hasKPIs: boolean;
  hasProgressUpdates: boolean;
  hasTransactionHistory: boolean;
  hasTransactionComments: boolean;
  hasFinancialReports: boolean;
  hasPublicChannels: boolean;
  hasCommunityUpdates: boolean;
  isResponsiveToFeedback: boolean;
}

export interface TransparencyScore {
  score: number;
}

/**
 * Calculates a weighted transparency score using category and criterion weights
 * from the transparency config (SSOT: src/config/transparency.ts).
 *
 * Each category has a weight, and each criterion within it has a weight.
 * The final score is the sum of (categoryWeight * criterionWeight * booleanValue).
 */
export const calculateTransparencyScore = async (
  data: TransparencyData
): Promise<TransparencyScore> => {
  const criteria = getTransparencyCriteria();
  const dataRecord = data as unknown as Record<string, boolean>;

  let score = 0;
  for (const criterion of criteria) {
    if (dataRecord[criterion.key]) {
      score += criterion.effectiveWeight;
    }
  }

  return {
    score: Math.round(score * 100) / 100,
  };
};

export const generateTransparencyReport = async (data: TransparencyData) => {
  const score = await calculateTransparencyScore(data);

  return {
    score: score.score,
    last_updated: new Date().toISOString(),
  };
};

/**
 * Returns labeled criteria grouped by category, for UI display.
 */
export function getTransparencyCriteriaForDisplay() {
  return Object.entries(TRANSPARENCY_CONFIG.categories).map(([key, category]) => ({
    key,
    label: category.label,
    weight: category.weight,
    criteria: category.criteria.map(c => ({
      key: c.key,
      label: c.label,
      description: c.description,
    })),
  }));
}
