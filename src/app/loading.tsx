import { ContextualLoader } from '@/components/navigation/ContextualLoader';

/**
 * Global Loading UI for Next.js App Router
 *
 * Shows contextual information about what users can do on the page
 * they're navigating to, instead of a generic loading spinner.
 */
export default function Loading() {
  // Render the contextual loader directly to avoid any brief generic fallback flicker
  return <ContextualLoader />;
}
