/**
 * Analytics Service for OrangeCat
 *
 * Provides a unified interface for tracking user events.
 * Currently logs to console in development, ready for production integration.
 *
 * To integrate with a real analytics provider:
 * 1. Set NEXT_PUBLIC_ANALYTICS_PROVIDER in .env (e.g., 'mixpanel', 'amplitude', 'plausible')
 * 2. Add provider-specific initialization in initAnalytics()
 * 3. Add provider-specific tracking in trackEvent()
 */

// Event types for type safety
export type AnalyticsEvent =
  // Registration funnel
  | 'page_view'
  | 'registration_started'
  | 'registration_form_submitted'
  | 'registration_success'
  | 'registration_error'
  | 'email_confirmation_sent'
  | 'email_confirmed'
  | 'login_started'
  | 'login_success'
  | 'login_error'
  // Onboarding funnel
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_skipped'
  | 'onboarding_completed'
  // Key actions
  | 'wallet_address_added'
  | 'project_created'
  | 'project_published'
  | 'project_draft_saved'
  | 'first_donation_received'
  | 'profile_updated'
  | 'timeline_post_created'
  // Retention events
  | 'session_started'
  | 'feature_used'
  | 'share_clicked';

interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined | null;
}

interface UserProperties {
  userId?: string;
  email?: string;
  username?: string;
  hasBitcoinAddress?: boolean;
  projectCount?: number;
  onboardingCompleted?: boolean;
  [key: string]: string | number | boolean | undefined | null;
}

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Analytics provider (can be expanded for Mixpanel, Amplitude, etc.)
const analyticsProvider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || 'console';

/**
 * Initialize analytics - call this once in your app layout
 */
export function initAnalytics() {
  if (typeof window === 'undefined') {return;}

  switch (analyticsProvider) {
    case 'mixpanel':
      // TODO: Initialize Mixpanel
      // mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN);
      break;
    case 'amplitude':
      // TODO: Initialize Amplitude
      // amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_KEY);
      break;
    case 'plausible':
      // Plausible is initialized via script tag
      break;
    default:
      if (isDev) {
        // eslint-disable-next-line no-console -- Intentional dev-only analytics logging
        console.log('📊 Analytics initialized (console mode)');
      }
  }
}

/**
 * Track an analytics event
 */
export function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties) {
  if (typeof window === 'undefined') {return;}

  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
    referrer: document.referrer || undefined,
  };

  switch (analyticsProvider) {
    case 'mixpanel':
      // TODO: Send to Mixpanel
      // mixpanel.track(event, enrichedProperties);
      break;
    case 'amplitude':
      // TODO: Send to Amplitude
      // amplitude.track(event, enrichedProperties);
      break;
    case 'plausible':
      // TODO: Send to Plausible
      // plausible(event, { props: enrichedProperties });
      break;
    default:
      // Console logging for development
      if (isDev) {
        // eslint-disable-next-line no-console -- Intentional dev-only analytics logging
        console.log(`📊 [${event}]`, enrichedProperties);
      }
  }

  // Also store in localStorage for debugging
  try {
    const events = JSON.parse(localStorage.getItem('orangecat_analytics') || '[]');
    events.push({ event, properties: enrichedProperties });
    // Keep only last 100 events
    if (events.length > 100) {events.shift();}
    localStorage.setItem('orangecat_analytics', JSON.stringify(events));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Identify a user for analytics
 */
export function identifyUser(properties: UserProperties) {
  if (typeof window === 'undefined') {return;}

  switch (analyticsProvider) {
    case 'mixpanel':
      // TODO: Identify in Mixpanel
      // if (properties.userId) mixpanel.identify(properties.userId);
      // mixpanel.people.set(properties);
      break;
    case 'amplitude':
      // TODO: Identify in Amplitude
      // if (properties.userId) amplitude.setUserId(properties.userId);
      // amplitude.setUserProperties(properties);
      break;
    default:
      if (isDev) {
        // eslint-disable-next-line no-console -- Intentional dev-only analytics logging
        console.log('📊 User identified:', properties);
      }
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, properties?: AnalyticsProperties) {
  trackEvent('page_view', { page: pageName, ...properties });
}

/**
 * Track registration funnel events
 */
export const registrationEvents = {
  started: (properties?: AnalyticsProperties) =>
    trackEvent('registration_started', properties),
  formSubmitted: (properties?: AnalyticsProperties) =>
    trackEvent('registration_form_submitted', properties),
  success: (properties?: AnalyticsProperties) =>
    trackEvent('registration_success', properties),
  error: (error: string, properties?: AnalyticsProperties) =>
    trackEvent('registration_error', { error, ...properties }),
  emailSent: (properties?: AnalyticsProperties) =>
    trackEvent('email_confirmation_sent', properties),
  emailConfirmed: (properties?: AnalyticsProperties) =>
    trackEvent('email_confirmed', properties),
};

/**
 * Track onboarding funnel events
 */
export const onboardingEvents = {
  started: (userId?: string) =>
    trackEvent('onboarding_started', { userId }),
  stepViewed: (step: number, stepName: string, userId?: string) =>
    trackEvent('onboarding_step_viewed', { step, stepName, userId }),
  stepCompleted: (step: number, stepName: string, userId?: string) =>
    trackEvent('onboarding_step_completed', { step, stepName, userId }),
  skipped: (atStep: number, userId?: string) =>
    trackEvent('onboarding_skipped', { atStep, userId }),
  completed: (userId?: string) =>
    trackEvent('onboarding_completed', { userId }),
};

/**
 * Track key user actions
 */
export const userActions = {
  walletAdded: (userId?: string) =>
    trackEvent('wallet_address_added', { userId }),
  projectCreated: (projectId: string, userId?: string) =>
    trackEvent('project_created', { projectId, userId }),
  projectPublished: (projectId: string, userId?: string) =>
    trackEvent('project_published', { projectId, userId }),
  profileUpdated: (fields: string[], userId?: string) =>
    trackEvent('profile_updated', { fields: fields.join(','), userId }),
  postCreated: (userId?: string) =>
    trackEvent('timeline_post_created', { userId }),
};

/**
 * Debug function to view stored analytics events
 */
export function getStoredEvents(): Array<{ event: string; properties: AnalyticsProperties }> {
  if (typeof window === 'undefined') {return [];}
  try {
    return JSON.parse(localStorage.getItem('orangecat_analytics') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored analytics events
 */
export function clearStoredEvents() {
  if (typeof window === 'undefined') {return;}
  localStorage.removeItem('orangecat_analytics');
}
