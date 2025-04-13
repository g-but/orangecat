export type NavItem = {
  name: string
  href: string
  description?: string
}

export const mainNav: NavItem[] = [
  {
    name: 'Create',
    href: '/create',
    description: 'Create your funding page',
  },
  {
    name: 'Fund',
    href: '/fund',
    description: 'Support Orange Cat',
  },
  {
    name: 'About',
    href: '/about',
    description: 'Learn about Orange Cat',
  },
  {
    name: 'Blog',
    href: '/blog',
    description: 'Latest updates and news',
  },
]

export const footerNav = {
  product: [
    {
      name: 'Create',
      href: '/create',
    },
    {
      name: 'Fund',
      href: '/fund',
    },
    {
      name: 'About',
      href: '/about',
    },
    {
      name: 'Blog',
      href: '/blog',
    },
  ],
  legal: [
    {
      name: 'Privacy Policy',
      href: '/privacy',
    },
    {
      name: 'Terms of Service',
      href: '/terms',
    },
  ],
} 