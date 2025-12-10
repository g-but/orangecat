import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccessPaginated,
  apiUnauthorized,
  handleApiError,
} from '@/lib/api/standardResponse';

// GET /api/profiles - List profiles (basic fields)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    const search = request.nextUrl.searchParams.get('search')?.trim() || '';
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 200);
    const page = Math.max(Number(request.nextUrl.searchParams.get('page') || 1), 1);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
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

    const { data = [], error, count } = await query;
    if (error) {
      throw error;
    }

    return apiSuccessPaginated(data, page, limit, count ?? data.length);
  } catch (error) {
    return handleApiError(error);
  }
}

