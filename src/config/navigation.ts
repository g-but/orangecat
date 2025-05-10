import { ComponentType, SVGProps } from 'react'
import { Github, Twitter } from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  requiresAuth?: boolean
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}

interface NavigationConfig {
  main: NavigationItem[]
  footer: {
    product: NavigationItem[]
    company: NavigationItem[]
    legal: NavigationItem[]
    social: NavigationItem[]
  }
  user: NavigationItem[]
  auth: NavigationItem[]
  dashboard: NavigationItem[]
}

export const navigation: NavigationConfig = {
  main: [
    { name: 'Fund Yourself', href: '/create' },
    { name: 'Fund Others', href: '/fund-others' },
    { name: 'Fund Us', href: '/fund-us' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
  ],
  footer: {
    product: [
      { name: 'Features', href: '/docs#features' },
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/docs/api' },
      { name: 'Status', href: '/status' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
      { name: 'Security', href: '/security' },
    ],
    social: [
      {
        name: 'Twitter',
        href: 'https://twitter.com/orangecat',
        icon: Twitter,
      },
      {
        name: 'GitHub',
        href: 'https://github.com/g-but/orangecat',
        icon: Github,
      },
    ],
  },
  user: [
    { name: 'Dashboard', href: '/dashboard', requiresAuth: true },
    { name: 'Profile', href: '/profile', requiresAuth: true },
    { name: 'Settings', href: '/settings', requiresAuth: true },
  ],
  auth: [
    { name: 'Sign In', href: '/auth?mode=login' },
    { name: 'Get Started', href: '/auth?mode=register' },
  ],
  dashboard: [
    { name: 'Dashboard', href: '/dashboard', requiresAuth: true },
  ]
} 