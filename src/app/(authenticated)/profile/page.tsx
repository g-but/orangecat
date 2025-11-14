/**
 * REDIRECT PAGE: /profile → /profiles/me
 *
 * This route is deprecated in favor of /profiles/me
 * Redirects are handled server-side for better SEO
 */

import { redirect } from 'next/navigation';

export default function ProfileRedirect() {
  // Redirect to the canonical profile URL
  redirect('/profiles/me');
}
