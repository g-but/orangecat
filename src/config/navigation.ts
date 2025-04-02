export type NavItem = {
  name: string
  href: string
  description?: string
}

export const mainNav: NavItem[] = [
  {
    name: 'Create',
    href: '/create',
    description: 'Create your donation page',
  },
  {
    name: 'Donate',
    href: '/donate',
    description: 'Support Palfare',
  },
  {
    name: 'About',
    href: '/about',
    description: 'Learn about Palfare',
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
      name: 'Donate',
      href: '/donate',
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