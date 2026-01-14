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

export const calculateTransparencyScore = async (
  data: TransparencyData
): Promise<TransparencyScore> => {
  // Convert boolean values to numbers (1 for true, 0 for false)
  const scores = Object.values(data).map(value => (value ? 1 : 0));

  // Calculate the average score
  const score = scores.reduce((acc: number, curr: number) => acc + curr, 0) / scores.length;

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
