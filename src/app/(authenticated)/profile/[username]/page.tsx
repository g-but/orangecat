/**
 * REDIRECT PAGE: /profile/[username] → /profiles/[username]
 *
 * This route is deprecated in favor of /profiles/[username]
 * Redirects are handled server-side for better SEO
 */

import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfileUsernameRedirect({ params }: PageProps) {
  const { username } = await params;

  // Redirect to the canonical profile URL
  redirect(`/profiles/${username}`);
}
