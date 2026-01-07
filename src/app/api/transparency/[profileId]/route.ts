import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiInternalError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';

// GET /api/transparency/[profileId] - Get transparency score for a profile
export async function GET(request: NextRequest, { params }: { params: { profileId: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const { profileId } = params;

    // Get transparency score for the profile
    const { data: transparencyScore, error } = await supabase
      .from('transparency_scores')
      .select('*')
      .eq('entity_type', 'profile')
      .eq('entity_id', profileId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found"
      throw new Error(`Failed to fetch transparency score: ${error.message}`);
    }

    if (!transparencyScore) {
      // Calculate transparency score if it doesn't exist
      const { data: profile, error: profileError } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) {
        return apiNotFound('Profile not found');
      }

      // Call the database function to calculate transparency score
      const { data: calculatedScore, error: calcError } = await supabase.rpc(
        'calculate_profile_transparency_score',
        { profile_id: profileId }
      );

      if (calcError) {
        return apiInternalError(`Failed to calculate transparency score: ${calcError.message}`);
      }

      // Fetch the newly calculated score
      const { data: newScore, error: fetchError } = await supabase
        .from('transparency_scores')
        .select('*')
        .eq('entity_type', 'profile')
        .eq('entity_id', profileId)
        .single();

      if (fetchError) {
        return apiInternalError(
          `Failed to fetch calculated transparency score: ${fetchError.message}`
        );
      }

      return apiSuccess({
        score: newScore.score,
        maxScore: newScore.max_score,
        factors: newScore.factors,
        calculatedAt: newScore.calculated_at,
      });
    }

    return apiSuccess({
      score: transparencyScore.score,
      maxScore: transparencyScore.max_score,
      factors: transparencyScore.factors,
      calculatedAt: transparencyScore.calculated_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
