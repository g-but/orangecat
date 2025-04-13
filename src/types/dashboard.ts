import { User } from '@supabase/supabase-js'

export type DashboardCard = {
  title: string
  subtitle: string
  description: string
  action: {
    label: string
    href: string
    variant?: 'primary' | 'secondary' | 'outline'
  }
}

export type DashboardState = {
  user: User | null
  loading: boolean
  error: string | null
} 