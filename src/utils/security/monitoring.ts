/**
 * SECURITY MONITORING
 *
 * Security event tracking and reporting.
 */

/**
 * Security event monitoring
 */
export class SecurityMonitor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static events: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: any;
  }> = [];

  /**
   * Log security event
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static logEvent(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any
  ): void {
    const event = {
      type,
      severity,
      timestamp: Date.now(),
      details: {
        ...details,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString(),
      },
    };

    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }

    // In production, send critical events to monitoring service
    if (severity === 'critical') {
    }
  }

  /**
   * Get recent security events
   */
  static getRecentEvents(limit: number = 100): typeof this.events {
    return this.events.slice(-limit);
  }

  /**
   * Get events by severity
   */
  static getEventsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): typeof this.events {
    return this.events.filter(event => event.severity === severity);
  }
}
