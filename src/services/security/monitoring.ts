/**
 * Security Monitoring Module
 *
 * Tracks and analyzes security events for threat detection and incident response.
 * Maintains event history and provides alerting for critical security events.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from security-hardening.ts
 */

import { logger } from '@/utils/logger';
import { AuthenticationSecurity } from './authentication';

export interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  details: Record<string, any>;
}

/**
 * Security Event Monitoring System
 *
 * @example
 * ```typescript
 * // Record security event
 * SecurityMonitor.recordEvent('suspicious_login', 'high', {
 *   ip: '192.168.1.1',
 *   userAgent: 'suspicious-bot'
 * });
 *
 * // Get security statistics
 * const stats = SecurityMonitor.getStats();
 * console.log(`Critical events: ${stats.criticalEvents}`);
 * ```
 */
export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 1000;

  /**
   * Record a security event for monitoring and analysis
   * @param type - Event type identifier
   * @param severity - Event severity level
   * @param details - Additional event context and metadata
   */
  static recordEvent(
    type: string,
    severity: SecurityEvent['severity'],
    details: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      id: AuthenticationSecurity.generateSecureToken(16),
      type,
      severity,
      timestamp: Date.now(),
      details,
    };

    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Alert on critical events
    if (severity === 'critical') {
      this.alertCriticalEvent(event);
    }
  }

  /**
   * Retrieve security events with filtering and limiting
   * @param severity - Optional severity filter
   * @param limit - Maximum number of events to return (default: 100)
   * @returns Array of security events sorted by timestamp (newest first)
   */
  static getEvents(severity?: SecurityEvent['severity'], limit: number = 100): SecurityEvent[] {
    let filtered = this.events;

    if (severity) {
      filtered = this.events.filter(e => e.severity === severity);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Get security statistics
   */
  static getStats(): {
    totalEvents: number;
    eventsBySeverity: Record<string, number>;
    recentEvents: number;
    criticalEvents: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const eventsBySeverity = this.events.reduce(
      (acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalEvents: this.events.length,
      eventsBySeverity,
      recentEvents: this.events.filter(e => e.timestamp > oneHourAgo).length,
      criticalEvents: this.events.filter(e => e.severity === 'critical').length,
    };
  }

  private static alertCriticalEvent(event: SecurityEvent): void {
    logger.error(
      'CRITICAL SECURITY EVENT',
      {
        eventId: event.id,
        type: event.type,
        details: event.details,
      },
      'Security'
    );

    // In production, this would trigger alerts to security team
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with alerting system (email, Slack, PagerDuty, etc.)
    }
  }
}


