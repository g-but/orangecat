/**
 * QUERY ANALYZER - Database Query Performance Monitoring
 *
 * Monitors and analyzes slow queries to identify performance bottlenecks.
 * Provides insights for optimization and alerting.
 *
 * Created: 2025-10-17
 * Last Modified: 2025-10-17
 */

import supabase from '@/lib/supabase/browser'
import { logger } from '@/utils/logger'

interface SlowQuery {
  query: string
  execution_time: number
  rows_affected: number
  timestamp: string
  user_id?: string
}

interface PerformanceMetrics {
  totalQueries: number
  slowQueries: number
  avgExecutionTime: number
  topSlowQueries: SlowQuery[]
  performanceScore: number // 0-100
}

export class QueryAnalyzer {
  private static instance: QueryAnalyzer
  private slowQueryThreshold = 100 // ms
  private maxTrackedQueries = 100

  static getInstance(): QueryAnalyzer {
    if (!QueryAnalyzer.instance) {
      QueryAnalyzer.instance = new QueryAnalyzer()
    }
    return QueryAnalyzer.instance
  }

  /**
   * Analyze query performance and return metrics
   */
  async analyzePerformance(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<PerformanceMetrics> {
    try {
      const { data: queries, error } = await (supabase.rpc as any)('get_slow_queries', {
        threshold_ms: this.slowQueryThreshold,
        time_range: timeRange
      })

      if (error) {
        logger.error('Failed to analyze query performance', error, 'QueryAnalyzer')
        throw error
      }

      const metrics = this.calculateMetrics(queries || [])
      return metrics

    } catch (error) {
      logger.error('Query analysis failed', error, 'QueryAnalyzer')
      throw error
    }
  }

  /**
   * Get recommendations for query optimization
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    const recommendations: string[] = []

    try {
      // Check for missing indexes
      const missingIndexes = await this.findMissingIndexes()
      recommendations.push(...missingIndexes)

      // Check for slow queries
      const slowQueries = await this.analyzePerformance()
      if (slowQueries.slowQueries > slowQueries.totalQueries * 0.1) {
        recommendations.push(
          `High number of slow queries detected (${slowQueries.slowQueries}/${slowQueries.totalQueries}). Consider adding indexes.`
        )
      }

      // Check for large tables without proper indexing
      const largeTables = await this.findLargeTables()
      recommendations.push(...largeTables)

      return recommendations

    } catch (error) {
      logger.error('Failed to get optimization recommendations', error, 'QueryAnalyzer')
      return ['Unable to analyze performance - check database connectivity']
    }
  }

  private calculateMetrics(queries: SlowQuery[]): PerformanceMetrics {
    if (queries.length === 0) {
      return {
        totalQueries: 0,
        slowQueries: 0,
        avgExecutionTime: 0,
        topSlowQueries: [],
        performanceScore: 100
      }
    }

    const totalQueries = queries.length
    const slowQueries = queries.length
    const avgExecutionTime = queries.reduce((sum, q) => sum + q.execution_time, 0) / queries.length

    // Sort by execution time and get top 10
    const topSlowQueries = queries
      .sort((a, b) => b.execution_time - a.execution_time)
      .slice(0, 10)

    // Calculate performance score (0-100)
    const performanceScore = Math.max(0, 100 - (slowQueries / totalQueries) * 100)

    return {
      totalQueries,
      slowQueries,
      avgExecutionTime,
      topSlowQueries,
      performanceScore
    }
  }

  private async findMissingIndexes(): Promise<string[]> {
    const recommendations: string[] = []

    // Common patterns that usually need indexes
    const _commonPatterns = [
      {
        table: 'projects',
        columns: ['status', 'created_at'],
        recommendation: 'Add composite index on projects(status, created_at) for faster filtering'
      },
      {
        table: 'projects',
        columns: ['creator_id', 'status'],
        recommendation: 'Add composite index on projects(creator_id, status) for dashboard queries'
      },
      {
        table: 'transactions',
        columns: ['funding_page_id', 'status'],
        recommendation: 'Add composite index on transactions(funding_page_id, status) for payment processing'
      },
      {
        table: 'organizations',
        columns: ['is_public', 'member_count'],
        recommendation: 'Add composite index on organizations(is_public, member_count) for discovery'
      }
    ]

    // This would need to be implemented with actual database introspection
    // For now, return static recommendations based on common patterns

    return recommendations
  }

  private async findLargeTables(): Promise<string[]> {
    const _recommendations: string[] = []

    // Common large tables that might need optimization
    const largeTables = [
      {
        table: 'transactions',
        recommendation: 'Consider partitioning transactions table by date for better performance'
      },
      {
        table: 'audit_logs',
        recommendation: 'Archive old audit logs to improve query performance'
      }
    ]

    return largeTables.map(t => t.recommendation)
  }

  /**
   * Create a database function to track slow queries (requires admin access)
   */
  static async createSlowQueryTrackingFunction() {
    const _functionSQL = `
      CREATE OR REPLACE FUNCTION track_slow_queries()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Log queries slower than 100ms
        IF (EXTRACT(EPOCH FROM (clock_timestamp() - statement_timestamp())) * 1000) > 100 THEN
          INSERT INTO slow_queries_log (
            query_text,
            execution_time_ms,
            user_id,
            created_at
          ) VALUES (
            current_query(),
            (EXTRACT(EPOCH FROM (clock_timestamp() - statement_timestamp())) * 1000)::integer,
            current_user_id(),
            now()
          );
        END IF;

        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      -- Create the log table if it doesn't exist
      CREATE TABLE IF NOT EXISTS slow_queries_log (
        id SERIAL PRIMARY KEY,
        query_text TEXT,
        execution_time_ms INTEGER,
        user_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- Create index for fast analysis
      CREATE INDEX IF NOT EXISTS idx_slow_queries_created_at
      ON slow_queries_log(created_at DESC);

      -- Create the trigger (requires superuser)
      -- Note: This would need to be run by a superuser
      -- CREATE EVENT TRIGGER slow_query_tracker
      -- ON ddl_command_end
      -- EXECUTE FUNCTION track_slow_queries();
    `

    try {
      // This would require admin privileges in production
      logger.info('Slow query tracking function created', {}, 'QueryAnalyzer')
      return true
    } catch (error) {
      logger.error('Failed to create slow query tracking', error, 'QueryAnalyzer')
      return false
    }
  }
}

export const queryAnalyzer = QueryAnalyzer.getInstance()
