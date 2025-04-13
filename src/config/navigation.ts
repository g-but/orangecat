import { Github, Twitter } from 'lucide-react'

export const navigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'Create', href: '/create' },
    { name: 'Fund', href: '/fund' },
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
    { name: 'Login', href: '/login' },
    { name: 'Register', href: '/register' },
  ],
} 