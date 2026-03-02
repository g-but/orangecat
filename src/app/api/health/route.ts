import { apiSuccess, apiServiceUnavailable } from '@/lib/api/standardResponse';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';

const HEALTH_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
};

// GET /api/health - lightweight liveness/readiness endpoint
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.from(DATABASE_TABLES.PROFILES).select('id').limit(1);

    if (error) {
      const response = apiServiceUnavailable('Database connection failed', {
        status: 'unhealthy',
        timestamp,
        services: { api: 'healthy', database: 'unhealthy' },
      });
      response.headers.set('Cache-Control', HEALTH_CACHE_HEADERS['Cache-Control']);
      return response;
    }

    return apiSuccess(
      {
        status: 'healthy',
        timestamp,
        services: { api: 'healthy', database: 'healthy' },
      },
      { headers: HEALTH_CACHE_HEADERS }
    );
  } catch {
    const response = apiServiceUnavailable('Health check exception', {
      status: 'unhealthy',
      timestamp,
      services: { api: 'healthy', database: 'unhealthy' },
    });
    response.headers.set('Cache-Control', HEALTH_CACHE_HEADERS['Cache-Control']);
    return response;
  }
}
