import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import HomePublicClient from '@/components/home/HomePublicClient';

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return <HomePublicClient />;
}
