/**
 * PROFILE WIZARD CONSTANTS
 * Step definitions and configuration
 */

import { User, MapPin, Star, Wallet } from 'lucide-react';
import type { WizardStep } from './types';

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basics',
    title: '👋 Basic Info',
    description: 'Just your username and name to get started',
    icon: User,
    fields: ['username', 'name'],
    required: true,
    priority: 'high',
  },
  {
    id: 'location',
    title: '📍 Your Location',
    description: 'Help local supporters find you',
    icon: MapPin,
    fields: ['location_search', 'location_country', 'location_city', 'location_zip'],
    required: false,
    priority: 'medium',
  },
  {
    id: 'bio',
    title: '📖 About You',
    description: 'Tell your story and what inspires you',
    icon: Star,
    fields: ['bio', 'background', 'inspiration_statement'],
    required: false,
    priority: 'medium',
  },
  {
    id: 'wallets',
    title: '₿ Bitcoin Wallets',
    description: "Set up funding (we'll help you get started)",
    icon: Wallet,
    fields: ['bitcoin_address', 'lightning_address'],
    required: false,
    priority: 'low',
  },
];
