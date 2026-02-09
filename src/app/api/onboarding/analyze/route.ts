import { logger } from '@/utils/logger';
import { withOptionalAuth } from '@/lib/api/withAuth';
import { apiSuccess, apiValidationError, handleApiError } from '@/lib/api/standardResponse';
import { z } from 'zod';

const analysisRequestSchema = z.object({
  description: z.string().min(1).max(5000),
});

interface AnalysisResponse {
  isPersonal: boolean;
  isBusiness: boolean;
  isCharity: boolean;
  needsFunding: boolean;
  confidence: number;
  recommendation: string;
}

// Comprehensive keyword sets for analysis
const KEYWORDS = {
  organization: [
    'organization',
    'group',
    'team',
    'collective',
    'community',
    'association',
    'foundation',
    'company',
    'business',
    'startup',
    'nonprofit',
    'non-profit',
    'coalition',
    'alliance',
    'network',
    'cooperative',
    'co-op',
  ],
  personal: ['i', 'my', 'me', 'personal', 'individual', 'solo', 'freelance', 'myself'],
  charity: [
    'charity',
    'non-profit',
    'nonprofit',
    'donation',
    'help',
    'support',
    'aid',
    'relief',
    'shelter',
    'rescue',
    'volunteer',
    'community service',
    'social cause',
    'philanthropy',
  ],
  business: [
    'business',
    'startup',
    'company',
    'product',
    'service',
    'development',
    'build',
    'create',
    'revenue',
    'profit',
    'enterprise',
    'commercial',
    'venture',
  ],
  community: [
    'community',
    'members',
    'event',
    'gathering',
    'meetup',
    'conference',
    'workshop',
    'collaborative',
    'together',
    'collective',
    'shared',
  ],
  openSource: [
    'open source',
    'opensource',
    'github',
    'software',
    'code',
    'development',
    'library',
    'framework',
    'tool',
    'api',
    'sdk',
  ],
  funding: [
    'fund',
    'money',
    'bitcoin',
    'donate',
    'support',
    'help',
    'need',
    'require',
    'raise',
    'goal',
    'amount',
    'investment',
  ],
};

function analyzeDescription(description: string): AnalysisResponse {
  const text = description.toLowerCase();
  const scores = {
    personal: 0,
    organization: 0,
    charity: 0,
    business: 0,
    community: 0,
    openSource: 0,
    funding: 0,
  };

  // Count keyword matches
  Object.entries(KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        scores[category as keyof typeof scores]++;
      }
    });
  });

  // Determine project characteristics
  const isCharity = scores.charity > 0;
  const isBusiness = scores.business > 0;
  const isPersonal = scores.personal >= scores.organization;
  const isOpenSource = scores.openSource > 0;
  const needsFunding = scores.funding > 0;

  // Calculate confidence score
  let confidence = 0;

  // Base confidence from keyword matches
  confidence += Math.min(scores.personal, 30);
  confidence += Math.min(scores.charity, 20);
  confidence += Math.min(scores.business, 20);
  confidence += Math.min(scores.community, 20);
  confidence += Math.min(scores.openSource, 20);

  // Boost confidence based on description quality
  if (description.length > 100) {
    confidence += 15;
  }
  if (description.length > 200) {
    confidence += 10;
  }
  if (description.split('\n').length > 2) {
    confidence += 10;
  }

  // Cap confidence at 100
  confidence = Math.min(confidence, 100);

  // Generate recommendation
  let recommendation = '';

  if (isCharity) {
    recommendation =
      'Your charitable cause can be effectively managed through a personal project. This allows you to directly control how funds are used while maintaining transparency with your supporters.';
  } else if (isBusiness) {
    recommendation =
      'A personal project is perfect for your business venture. You maintain full control while being transparent with your supporters about how funds are used.';
  } else if (isOpenSource) {
    recommendation =
      'Your open source project is a great fit for a personal fundraising campaign. You can share your vision and get direct support from the Bitcoin community.';
  } else {
    recommendation =
      "A personal project is the ideal fit for your needs. It's quick to set up and gives you direct control over your Bitcoin fundraising.";
  }

  return {
    isPersonal,
    isBusiness,
    isCharity,
    needsFunding,
    confidence: Math.round(confidence),
    recommendation,
  };
}

export const POST = withOptionalAuth(async req => {
  try {
    const body = await req.json();
    const validation = analysisRequestSchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError('Invalid request data', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { description } = validation.data;

    if (!description || description.trim().length === 0) {
      return apiValidationError('Description is required');
    }

    const analysis = analyzeDescription(description);

    return apiSuccess(analysis);
  } catch (error) {
    logger.error('Error analyzing description', { error }, 'Onboarding');
    return handleApiError(error);
  }
});
