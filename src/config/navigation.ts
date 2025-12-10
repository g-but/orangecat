import { ComponentType, SVGProps } from 'react';
import { Github, Twitter } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  requiresAuth?: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  description?: string;
}

interface NavigationConfig {
  main: NavigationItem[];
  footer: {
    product: NavigationItem[];
    company: NavigationItem[];
    legal: NavigationItem[];
    social: NavigationItem[];
  };
  user: NavigationItem[];
  auth: NavigationItem[];
}

export const navigation: NavigationConfig = {
  main: [
    { name: 'Discover', href: '/discover' },
    { name: 'Community', href: '/community' },
    { name: 'Channel', href: '/channel' },
    { name: 'About', href: '/about' },
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
  // Simplified user menu - matches sidebar sections
  user: [
    { name: 'Dashboard', href: '/dashboard', requiresAuth: true },
    { name: 'Organizations', href: '/organizations', requiresAuth: true, description: 'Manage Organizations' },
    { name: 'Assets', href: '/assets', requiresAuth: true, description: 'My Valuable Assets' },
    { name: 'Loans', href: '/loans', requiresAuth: true, description: 'Peer-to-Peer Lending' },
    { name: 'Sell', href: '/dashboard/store', requiresAuth: true, description: 'Products & Services' },
    { name: 'Raise', href: '/dashboard/projects', requiresAuth: true, description: 'Projects & Causes' },
    { name: 'Network', href: '/organizations', requiresAuth: true, description: 'Organizations, Circles & People' },
    { name: 'Wallet', href: '/dashboard/wallets', requiresAuth: true },
    { name: 'Settings', href: '/settings', requiresAuth: true },
  ],
  auth: [
    { name: 'Sign In', href: '/auth?mode=login' },
    { name: 'Get Started', href: '/auth?mode=register' },
  ],
};
