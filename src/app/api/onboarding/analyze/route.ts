import { logger } from '@/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface AnalysisRequest {
  description: string;
}

interface AnalysisResponse {
  isOrganization: boolean;
  isPersonal: boolean;
  needsCollective: boolean;
  isBusiness: boolean;
  isCharity: boolean;
  needsFunding: boolean;
  confidence: number;
  recommendation: string;
  suggestedSetup: 'personal' | 'organization';
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
    organization: 0,
    personal: 0,
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

  // Determine setup type
  const isOrganization = scores.organization > scores.personal;
  const isCharity = scores.charity > 0;
  const isBusiness = scores.business > 0;
  const isPersonal = !isOrganization;
  const needsCollective = scores.community > 0 || scores.organization > 0;
  const isOpenSource = scores.openSource > 0;
  const needsFunding = scores.funding > 0;

  // Calculate confidence score
  let confidence = 0;

  // Base confidence from keyword matches
  confidence += Math.min(scores.organization, 50); // Cap at 50
  confidence += Math.min(scores.personal, 30);
  confidence += Math.min(scores.charity, 20);
  confidence += Math.min(scores.business, 20);
  confidence += Math.min(scores.community, 30);

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
  let suggestedSetup: 'personal' | 'organization' = 'personal';
  let recommendation = '';

  if (isOrganization) {
    suggestedSetup = 'organization';
    if (isCharity) {
      recommendation =
        "Based on your description, you're working with a charitable cause that involves multiple people or a community. An organization setup would allow collective management of funds and transparent governance.";
    } else if (isOpenSource) {
      recommendation =
        'Your open source project would benefit from an organization structure to manage collective contributions and shared decision-making among developers.';
    } else if (isBusiness && needsCollective) {
      recommendation =
        'Your business venture involves a team or group. An organization allows shared management of the Bitcoin treasury with role-based access control.';
    } else {
      recommendation =
        'Your described need suggests a collective approach. An organization setup enables multiple people to manage funds together with transparent governance.';
    }
  } else {
    suggestedSetup = 'personal';
    if (isCharity) {
      recommendation =
        'Your charitable cause can be effectively managed through a personal project. This allows you to directly control how funds are used while maintaining transparency.';
    } else if (isBusiness) {
      recommendation =
        'A personal project is perfect for your business or project. You maintain full control while being transparent with your supporters about how funds are used.';
    } else {
      recommendation =
        "A personal project is the ideal fit for your needs. It's quick to set up and gives you direct control over your Bitcoin fundraising.";
    }
  }

  return {
    isOrganization,
    isPersonal,
    needsCollective,
    isBusiness,
    isCharity,
    needsFunding,
    confidence: Math.round(confidence),
    recommendation,
    suggestedSetup,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { description } = body;

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const analysis = analyzeDescription(description);

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    logger.error('Error analyzing description:', error);
    return NextResponse.json({ error: 'Failed to analyze description' }, { status: 500 });
  }
}
