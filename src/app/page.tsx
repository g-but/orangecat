import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import HomePublicClient from '@/components/home/HomePublicClient';
import { ProfileService } from '@/services/profile';

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user has completed onboarding
    const profile = await ProfileService.getProfile(user.id);
    if (!profile?.onboarding_completed) {
      redirect('/onboarding');
    }
    redirect('/dashboard');
  }

  return <HomePublicClient />;
}
