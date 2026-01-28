import { apiSuccessPaginated, handleApiError } from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { DATABASE_TABLES } from '@/config/database-tables';

// GET /api/profiles - List profiles (basic fields)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { supabase } = request;

    const search = request.nextUrl.searchParams.get('search')?.trim() || '';
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 200);
    const page = Math.max(Number(request.nextUrl.searchParams.get('page') || 1), 1);
    const offset = (page - 1) * limit;

    let query = supabase
      .from(DATABASE_TABLES.PROFILES)
      .select(
        `id, username, name, bio, avatar_url, bitcoin_address, lightning_address, created_at, updated_at`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      // Search across username OR name (escape % and _ for LIKE patterns)
      const escapedSearch = search.replace(/[%_]/g, '\\$&');
      query = query.or(`username.ilike.%${escapedSearch}%,name.ilike.%${escapedSearch}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      throw error;
    }

    const profiles = data || [];
    return apiSuccessPaginated(profiles, page, limit, count ?? profiles.length);
  } catch (error) {
    return handleApiError(error);
  }
});
