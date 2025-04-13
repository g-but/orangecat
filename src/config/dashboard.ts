import { DashboardCard } from '@/types/dashboard'

export const dashboardCards: DashboardCard[] = [
  {
    title: 'Create New Page',
    subtitle: 'Set up a new funding page',
    description: 'Create a new page to start accepting Bitcoin donations',
    action: {
      label: 'Create Page',
      href: '/create',
      variant: 'primary'
    }
  },
  {
    title: 'Your Pages',
    subtitle: 'Manage existing pages',
    description: 'View and manage your funding pages',
    action: {
      label: 'View Pages',
      href: '/pages',
      variant: 'outline'
    }
  },
  {
    title: 'Donations',
    subtitle: 'Track your donations',
    description: 'View your donation history and analytics',
    action: {
      label: 'View Donations',
      href: '/donations',
      variant: 'outline'
    }
  }
] 