import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';

// GET /api/health - lightweight liveness/readiness endpoint
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.from(DATABASE_TABLES.PROFILES).select('id').limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp,
          services: {
            api: 'healthy',
            database: 'unhealthy',
          },
          error: 'Database connection failed',
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          },
        }
      );
    }

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp,
        services: {
          api: 'healthy',
          database: 'healthy',
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        services: {
          api: 'healthy',
          database: 'unhealthy',
        },
        error: 'Health check exception',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  }
}
