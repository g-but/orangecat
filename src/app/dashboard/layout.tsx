import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ClientDashboardLayout from '@/components/dashboard/DashboardLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          if (!cookie) return undefined
          return decodeURIComponent(cookie.value)
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({
            name,
            value: encodeURIComponent(value),
            ...options,
          })
        },
        remove(name: string, options: any) {
          cookieStore.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    redirect('/auth?mode=login')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    redirect('/auth?mode=login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <ClientDashboardLayout user={user} profile={profile}>
      {children}
    </ClientDashboardLayout>
  )
} 