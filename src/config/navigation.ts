import { Github, Twitter } from 'lucide-react'

export const navigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'Create', href: '/create', requiresAuth: true },
    { name: 'Fund Us', href: '/fund-us' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
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
  auth: [
    { name: 'Sign In', href: '/auth?mode=login' },
    { name: 'Get Started', href: '/auth?mode=register' },
  ],
  dashboard: [
    { name: 'Dashboard', href: '/dashboard', requiresAuth: true },
  ]
} 