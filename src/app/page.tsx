import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import HomePublicClient from '@/components/home/HomePublicClient';
import { DATABASE_TABLES } from '@/config/database-tables';

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user has completed onboarding using server client directly
    const { data: profile } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('onboarding_completed')
      .eq('id', user.id)
      .single<{ onboarding_completed: boolean | null }>();

    if (!profile?.onboarding_completed) {
      redirect('/onboarding');
    }
    redirect('/dashboard');
  }

  return <HomePublicClient />;
}
