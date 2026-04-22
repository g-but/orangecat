/**
 * Onboarding Description Analyzer
 *
 * Pure keyword-based analysis of user descriptions for onboarding recommendations.
 */

const KEYWORDS = {
  organization: [
    'organization', 'group', 'team', 'collective', 'community', 'association', 'foundation',
    'company', 'business', 'startup', 'nonprofit', 'non-profit', 'coalition', 'alliance',
    'network', 'cooperative', 'co-op',
  ],
  personal: ['i', 'my', 'me', 'personal', 'individual', 'solo', 'freelance', 'myself'],
  charity: [
    'charity', 'non-profit', 'nonprofit', 'donation', 'help', 'support', 'aid', 'relief',
    'shelter', 'rescue', 'volunteer', 'community service', 'social cause', 'philanthropy',
  ],
  business: [
    'business', 'startup', 'company', 'product', 'service', 'development', 'build', 'create',
    'revenue', 'profit', 'enterprise', 'commercial', 'venture',
  ],
  community: [
    'community', 'members', 'event', 'gathering', 'meetup', 'conference', 'workshop',
    'collaborative', 'together', 'collective', 'shared',
  ],
  openSource: [
    'open source', 'opensource', 'github', 'software', 'code', 'development', 'library',
    'framework', 'tool', 'api', 'sdk',
  ],
  funding: [
    'fund', 'money', 'bitcoin', 'donate', 'support', 'help', 'need', 'require', 'raise',
    'goal', 'amount', 'investment',
  ],
};

export interface AnalysisResponse {
  isPersonal: boolean;
  isBusiness: boolean;
  isCharity: boolean;
  needsFunding: boolean;
  confidence: number;
  recommendation: string;
}

export function analyzeDescription(description: string): AnalysisResponse {
  const text = description.toLowerCase();
  const scores = { personal: 0, organization: 0, charity: 0, business: 0, community: 0, openSource: 0, funding: 0 };

  Object.entries(KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      const match = keyword.length <= 3 ? new RegExp(`\\b${keyword}\\b`).test(text) : text.includes(keyword);
      if (match) {scores[category as keyof typeof scores]++;}
    });
  });

  const isCharity = scores.charity > 0;
  const isBusiness = scores.business > 0;
  const isPersonal = scores.personal >= scores.organization;
  const isOpenSource = scores.openSource > 0;
  const needsFunding = scores.funding > 0;

  let confidence = Math.min(scores.personal, 30) + Math.min(scores.charity, 20) +
    Math.min(scores.business, 20) + Math.min(scores.community, 20) + Math.min(scores.openSource, 20);
  if (description.length > 100) {confidence += 15;}
  if (description.length > 200) {confidence += 10;}
  if (description.split('\n').length > 2) {confidence += 10;}
  confidence = Math.min(confidence, 100);

  let recommendation = "A personal project is the ideal fit for your needs. It's quick to set up and gives you direct control over your Bitcoin fundraising.";
  if (isCharity) {
    recommendation = 'Your charitable cause can be effectively managed through a personal project. This allows you to directly control how funds are used while maintaining transparency with your supporters.';
  } else if (isBusiness) {
    recommendation = 'A personal project is perfect for your business venture. You maintain full control while being transparent with your supporters about how funds are used.';
  } else if (isOpenSource) {
    recommendation = 'Your open source project is a great fit for a personal fundraising campaign. You can share your vision and get direct support from the Bitcoin community.';
  }

  return { isPersonal, isBusiness, isCharity, needsFunding, confidence: Math.round(confidence), recommendation };
}
