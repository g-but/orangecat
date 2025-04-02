// Performance monitoring
export const trackPerformance = (metricName: string, value: number) => {
  if (process.env.NODE_ENV === 'production') {
    // Log to Vercel Analytics
    console.log(`[Performance] ${metricName}: ${value}ms`);
  }
};

// Error tracking
export const trackError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    // Log to Vercel Error Tracking
    console.error('[Error]', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }
};

// Page view tracking
export const trackPageView = (path: string) => {
  if (process.env.NODE_ENV === 'production') {
    // Log to Vercel Analytics
    console.log(`[Page View] ${path}`);
  }
};

// Custom event tracking
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    // Log to Vercel Analytics
    console.log(`[Event] ${eventName}`, properties);
  }
}; 