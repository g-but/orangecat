/**
 * APPLICATION MONITORING SERVICE
 *
 * Comprehensive monitoring for application performance, errors, and user behavior.
 * Provides real-time insights and alerting for production systems.
 *
 * Features:
 * - Performance metrics collection
 * - Error tracking and alerting
 * - User behavior analytics
 * - Resource usage monitoring
 * - Custom event tracking
 *
 * Created: 2025-10-17
 * Last Modified: 2025-10-17
 */

import { logger } from '@/utils/logger'

interface MetricPoint {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

interface ErrorEvent {
  error: Error
  context: Record<string, any>
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface PerformanceMetric {
  endpoint: string
  method: string
  duration: number
  statusCode: number
  timestamp: number
  userAgent?: string
  ip?: string
}

export class ApplicationMonitor {
  private static instance: ApplicationMonitor
  private metrics = new Map<string, MetricPoint[]>()
  private errors: ErrorEvent[] = []
  private performanceLogs: PerformanceMetric[] = []
  private maxStoredMetrics = 1000
  private maxStoredErrors = 100
  private maxStoredPerformance = 500

  static getInstance(): ApplicationMonitor {
    if (!ApplicationMonitor.instance) {
      ApplicationMonitor.instance = new ApplicationMonitor()
    }
    return ApplicationMonitor.instance
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricPoint = {
      name,
      value,
      timestamp: Date.now(),
      tags
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metrics = this.metrics.get(name)!
    metrics.push(metric)

    // Keep only recent metrics
    if (metrics.length > this.maxStoredMetrics) {
      metrics.splice(0, metrics.length - this.maxStoredMetrics)
    }

    logger.info(`Metric recorded: ${name}`, { value, tags }, 'ApplicationMonitor')
  }

  /**
   * Record an error event
   */
  recordError(error: Error, context: Record<string, any> = {}, severity: ErrorEvent['severity'] = 'medium'): void {
    const errorEvent: ErrorEvent = {
      error,
      context,
      timestamp: Date.now(),
      severity
    }

    this.errors.push(errorEvent)

    // Keep only recent errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.splice(0, this.errors.length - this.maxStoredErrors)
    }

    // Log based on severity
    const logLevel = severity === 'critical' ? 'error' :
                    severity === 'high' ? 'error' :
                    severity === 'medium' ? 'warn' : 'info'

    logger[logLevel]('Error recorded in monitoring', {
      error: error.message,
      stack: error.stack,
      context,
      severity
    }, 'ApplicationMonitor')

    // Alert for critical errors
    if (severity === 'critical') {
      this.alertCriticalError(error, context)
    }
  }

  /**
   * Record API performance metrics
   */
  recordApiPerformance(metric: PerformanceMetric): void {
    this.performanceLogs.push(metric)

    // Keep only recent performance logs
    if (this.performanceLogs.length > this.maxStoredPerformance) {
      this.performanceLogs.splice(0, this.performanceLogs.length - this.maxStoredPerformance)
    }

    // Log slow requests
    if (metric.duration > 1000) {
      logger.warn('Slow API request detected', {
        endpoint: metric.endpoint,
        method: metric.method,
        duration: metric.duration,
        statusCode: metric.statusCode
      }, 'ApplicationMonitor')
    }
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {}

    // Process metrics
    for (const [name, points] of this.metrics) {
      if (points.length === 0) continue

      const recent = points.filter(p => Date.now() - p.timestamp < 300000) // Last 5 minutes
      if (recent.length === 0) continue

      summary[name] = {
        current: recent[recent.length - 1].value,
        average: recent.reduce((sum, p) => sum + p.value, 0) / recent.length,
        min: Math.min(...recent.map(p => p.value)),
        max: Math.max(...recent.map(p => p.value)),
        count: recent.length
      }
    }

    return summary
  }

  /**
   * Get error summary
   */
  getErrorSummary(): Record<string, any> {
    const recentErrors = this.errors.filter(e => Date.now() - e.timestamp < 3600000) // Last hour

    const summary = {
      total: recentErrors.length,
      bySeverity: {
        critical: recentErrors.filter(e => e.severity === 'critical').length,
        high: recentErrors.filter(e => e.severity === 'high').length,
        medium: recentErrors.filter(e => e.severity === 'medium').length,
        low: recentErrors.filter(e => e.severity === 'low').length
      },
      recentErrors: recentErrors.slice(-10).map(e => ({
        message: e.error.message,
        severity: e.severity,
        timestamp: e.timestamp,
        context: e.context
      }))
    }

    return summary
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): Record<string, any> {
    const recentPerformance = this.performanceLogs.filter(
      p => Date.now() - p.timestamp < 300000 // Last 5 minutes
    )

    if (recentPerformance.length === 0) {
      return { message: 'No recent performance data' }
    }

    const avgDuration = recentPerformance.reduce((sum, p) => sum + p.duration, 0) / recentPerformance.length
    const slowRequests = recentPerformance.filter(p => p.duration > 1000).length

    return {
      totalRequests: recentPerformance.length,
      averageDuration: Math.round(avgDuration),
      slowRequests,
      slowRequestsPercentage: Math.round((slowRequests / recentPerformance.length) * 100),
      byStatusCode: recentPerformance.reduce((acc, p) => {
        acc[p.statusCode] = (acc[p.statusCode] || 0) + 1
        return acc
      }, {} as Record<number, number>),
      topSlowEndpoints: recentPerformance
        .filter(p => p.duration > 500)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(p => ({
          endpoint: p.endpoint,
          method: p.method,
          duration: p.duration,
          statusCode: p.statusCode
        }))
    }
  }

  /**
   * Get comprehensive health check
   */
  async getHealthCheck(): Promise<Record<string, any>> {
    const metrics = this.getMetricsSummary()
    const errors = this.getErrorSummary()
    const performance = this.getPerformanceSummary()

    // Calculate overall health score (0-100)
    let healthScore = 100

    // Deduct points for errors
    if (errors.bySeverity.critical > 0) healthScore -= 50
    if (errors.bySeverity.high > 0) healthScore -= 20
    if (errors.bySeverity.medium > 5) healthScore -= 10

    // Deduct points for performance issues
    if (performance.slowRequestsPercentage > 10) healthScore -= 15
    if (performance.averageDuration > 500) healthScore -= 10

    // Deduct points for missing key metrics
    const requiredMetrics = ['api_requests', 'database_queries', 'error_rate']
    const missingMetrics = requiredMetrics.filter(m => !metrics[m])
    healthScore -= missingMetrics.length * 5

    return {
      status: healthScore > 70 ? 'healthy' : healthScore > 40 ? 'warning' : 'critical',
      score: Math.max(0, healthScore),
      timestamp: Date.now(),
      uptime: process.uptime(),
      metrics,
      errors,
      performance
    }
  }

  /**
   * Alert for critical errors
   */
  private alertCriticalError(error: Error, context: Record<string, any>): void {
    // In production, this would send alerts to:
    // - Slack/Discord channels
    // - Email notifications
    // - PagerDuty/Sentry
    // - SMS for on-call engineers

    logger.error('🚨 CRITICAL ERROR ALERT', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    }, 'ApplicationMonitor')

    // For now, just log - in production this would trigger actual alerts
  }

  /**
   * Export monitoring data for external analysis
   */
  exportData(): Record<string, any> {
    return {
      metrics: Object.fromEntries(this.metrics),
      errors: this.errors,
      performance: this.performanceLogs,
      exportTimestamp: Date.now()
    }
  }

  /**
   * Clear old monitoring data
   */
  clearOldData(maxAge: number = 24 * 3600000): void { // 24 hours
    const cutoff = Date.now() - maxAge

    // Clear old metrics
    for (const [name, points] of this.metrics) {
      const recent = points.filter(p => p.timestamp > cutoff)
      this.metrics.set(name, recent)
    }

    // Clear old errors
    this.errors = this.errors.filter(e => e.timestamp > cutoff)

    // Clear old performance logs
    this.performanceLogs = this.performanceLogs.filter(p => p.timestamp > cutoff)

    logger.info('Old monitoring data cleared', { cutoff }, 'ApplicationMonitor')
  }
}

// Global instance
export const applicationMonitor = ApplicationMonitor.getInstance()

// Convenience functions for easy usage
export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  applicationMonitor.recordMetric(name, value, tags)
}

export function recordError(error: Error, context?: Record<string, any>, severity?: ErrorEvent['severity']): void {
  applicationMonitor.recordError(error, context, severity)
}

export function recordApiPerformance(metric: PerformanceMetric): void {
  applicationMonitor.recordApiPerformance(metric)
}

export function getHealthCheck(): Promise<Record<string, any>> {
  return applicationMonitor.getHealthCheck()
}
