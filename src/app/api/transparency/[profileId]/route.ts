import {
  apiSuccess,
  apiNotFound,
  apiInternalError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { DATABASE_TABLES } from '@/config/database-tables';

interface RouteContext {
  params: Promise<{ profileId: string }>;
}

// GET /api/transparency/[profileId] - Get transparency score for a profile
export const GET = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { profileId } = await context.params;
    const { supabase } = request;

    // Get transparency score for the profile
    const { data: transparencyScore, error } = await (
      supabase
        .from(DATABASE_TABLES.TRANSPARENCY_SCORES)
    )
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
      const { data: _profile, error: profileError } = await (
        supabase
          .from(DATABASE_TABLES.PROFILES)
      )
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) {
        return apiNotFound('Profile not found');
      }

      // Call the database function to calculate transparency score
      const { data: _calculatedScore, error: calcError } = await supabase.rpc(
        'calculate_profile_transparency_score',
        { profile_id: profileId }
      );

      if (calcError) {
        return apiInternalError(`Failed to calculate transparency score: ${calcError.message}`);
      }

      // Fetch the newly calculated score
      const { data: newScore, error: fetchError } = await (
        supabase
          .from(DATABASE_TABLES.TRANSPARENCY_SCORES)
      )
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
});
