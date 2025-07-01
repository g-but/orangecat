import { logger } from './logger'

// Performance monitoring
export const trackPerformance = (metricName: string, value: number) => {
  if (process.env.NODE_ENV === 'production') {
    // REMOVED: console.log statement
    logger.performance(metricName, value);
  }
};

// Error tracking
export const trackError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    // Log to Vercel Error Tracking
    logger.error('Application error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }
};

// Page view tracking
export const trackPageView = (path: string) => {
  if (process.env.NODE_ENV === 'production') {
    // REMOVED: console.log statement
    logger.info(`Page View: ${path}`, undefined, 'Analytics');
  }
};

// Custom event tracking
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    // REMOVED: console.log statement
    logger.info(`Event: ${eventName}`, properties, 'Analytics');
  }
}; 