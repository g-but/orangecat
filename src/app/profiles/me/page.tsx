/**
 * /profiles/me — redirects to the current user's public profile.
 * Used by the sidebar "Profile" link which can't resolve username at build time.
 */

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';

export default async function MyProfilePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?mode=login');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
    .select('username')
    .eq('id', user.id)
    .maybeSingle();

  const username = profile?.username || user.id;
  redirect(`/profiles/${username}`);
}
