import { NextRequest, NextResponse } from 'next/server';
import {
  generateTransparencyReport,
  getTransparencyCriteriaForDisplay,
  type TransparencyData,
} from '@/services/transparency';

const TRANSPARENCY_KEYS: (keyof TransparencyData)[] = [
  'isOpenSource',
  'hasContributionGuidelines',
  'hasIssueTracking',
  'hasMissionStatement',
  'hasKPIs',
  'hasProgressUpdates',
  'hasTransactionHistory',
  'hasTransactionComments',
  'hasFinancialReports',
  'hasPublicChannels',
  'hasCommunityUpdates',
  'isResponsiveToFeedback',
];

/**
 * POST /api/transparency/compute
 * Computes a weighted transparency score from provided boolean criteria.
 * Uses the config-driven weighted calculation from src/config/transparency.ts.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Build TransparencyData from request body, defaulting missing keys to false
    const data: TransparencyData = {} as TransparencyData;
    for (const key of TRANSPARENCY_KEYS) {
      data[key] = Boolean(body[key]);
    }

    const report = await generateTransparencyReport(data);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to compute transparency score' },
      { status: 400 }
    );
  }
}

/**
 * GET /api/transparency/compute
 * Returns the transparency criteria definition (categories, weights, labels).
 * Useful for rendering the criteria checklist in UI.
 */
export async function GET() {
  const criteria = getTransparencyCriteriaForDisplay();

  return NextResponse.json({
    success: true,
    data: { criteria },
  });
}
