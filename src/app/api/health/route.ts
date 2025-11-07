import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Test database connection
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      return Response.json(
        {
          status: 'unhealthy',
          error: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return Response.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          api: 'healthy',
        },
      },
      {
        headers: {
          // Cache health check for 10 seconds (doesn't need to be real-time)
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
