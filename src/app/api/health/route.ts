import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { compose } from '@/lib/api/compose';
import { withRequestId } from '@/lib/api/withRequestId';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { apiSuccess } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

// GET /api/health - Health check endpoint
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (_request: NextRequest) => {
  try {
    const supabase = await createServerClient();

    // Test database connection
    // Note: Direct query is acceptable here as this is a health check endpoint
    // that needs to verify database connectivity
    const { error } = await supabase.from(DATABASE_TABLES.PROFILES).select('id').limit(1);

    if (error) {
      logger.warn('Health check: Database connection failed', { error: error.message }, 'Health');
      return apiSuccess(
        {
          status: 'unhealthy',
          error: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          },
        }
      );
    }

    return apiSuccess(
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
    logger.error('Health check failed', { error }, 'Health');
    return apiSuccess(
      {
        status: 'unhealthy',
        error: 'Health check exception',
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  }
});
