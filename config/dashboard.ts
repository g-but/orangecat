import { DashboardCard } from '@/types/dashboard';

export const dashboardCards: DashboardCard[] = [
  {
    title: 'Create New Page',
    subtitle: 'Set up a new fundraising page',
    description: 'Create a new page to start accepting Bitcoin funding',
    action: {
      label: 'Create Page',
      href: '/create',
      variant: 'primary',
    },
  },
  {
    title: 'Your Pages',
    subtitle: 'Manage existing pages',
    description: 'View and manage your fundraising pages',
    action: {
      label: 'View Pages',
      href: '/(authenticated)/dashboard/projects',
      variant: 'outline',
    },
  },
  {
    title: 'Funding',
    subtitle: 'Track your funding',
    description: 'View your funding history and analytics',
    action: {
      label: 'View Funding',
      href: '/(authenticated)/dashboard/analytics',
      variant: 'outline',
    },
  },
];
