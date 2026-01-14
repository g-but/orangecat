/**
 * TASK DEFINITIONS - SINGLE SOURCE OF TRUTH
 *
 * All recommended tasks are defined here. Tasks are evaluated dynamically
 * based on user context. No hardcoded tasks in components.
 *
 * PRINCIPLES:
 * - Each task has a condition function
 * - Tasks are prioritized by importance
 * - Categories group related tasks
 * - All strings and logic in one place
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 */

import {
  Star,
  Wallet,
  Edit3,
  Rocket,
  Package,
  Briefcase,
  Heart,
  Gift,
  Users,
  Globe,
  Share2,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import type { TaskDefinition, SmartQuestion, UserContext } from './types';

/**
 * PROFILE COMPLETION FIELDS
 * Used to calculate profile completion percentage
 */
export const PROFILE_FIELDS = [
  'username',
  'display_name',
  'bio',
  'avatar_url',
  'bitcoin_address',
  'lightning_address',
  'website',
  'location',
  'preferred_currency',
] as const;

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(profile: UserContext['profile']): number {
  if (!profile) {
    return 0;
  }

  const filledFields = PROFILE_FIELDS.filter(field => {
    const value = profile[field as keyof typeof profile];
    return value !== null && value !== undefined && value !== '';
  });

  return Math.round((filledFields.length / PROFILE_FIELDS.length) * 100);
}

/**
 * TASK DEFINITIONS
 *
 * Organized by priority within category:
 * - Critical: Blocking issues that prevent core functionality
 * - High: Important for full platform experience
 * - Medium: Enhance engagement
 * - Low: Growth and exploration
 */
export const TASK_DEFINITIONS: TaskDefinition[] = [
  // ==================== CRITICAL: Profile Setup ====================
  {
    id: 'set-username',
    title: 'Set Your Username',
    description: 'Choose a unique username for your profile URL',
    priority: 'critical',
    category: 'setup',
    action: { label: 'Set Username', href: '/dashboard/info/edit' },
    icon: Star,
    condition: ctx => !ctx.profile.username,
  },
  {
    id: 'add-wallet',
    title: 'Add Bitcoin Wallet',
    description: 'Connect a wallet to receive Bitcoin payments and donations',
    priority: 'critical',
    category: 'setup',
    action: { label: 'Manage Wallets', href: '/dashboard/wallets' },
    icon: Wallet,
    condition: ctx => !ctx.hasWallet,
  },

  // ==================== HIGH: Complete Profile ====================
  {
    id: 'add-bio',
    title: 'Add Your Bio',
    description: 'Tell people about yourself and your mission',
    priority: 'high',
    category: 'setup',
    action: { label: 'Add Bio', href: '/dashboard/info/edit' },
    icon: Edit3,
    condition: ctx => !ctx.profile.bio && !!ctx.profile.username,
  },
  {
    id: 'add-avatar',
    title: 'Upload Profile Photo',
    description: 'Add a profile photo to build trust with supporters',
    priority: 'high',
    category: 'setup',
    action: { label: 'Upload Photo', href: '/dashboard/info/edit' },
    icon: Star,
    condition: ctx => !ctx.profile.avatar_url && !!ctx.profile.username,
  },

  // ==================== HIGH: First Entity Creation ====================
  {
    id: 'create-first-project',
    title: 'Launch Your First Project',
    description: 'Start crowdfunding with Bitcoin in just a few minutes',
    priority: 'high',
    category: 'create',
    action: { label: 'Create Project', href: ENTITY_REGISTRY.project.createPath },
    icon: Rocket,
    relatedEntities: ['project'],
    condition: ctx =>
      ctx.hasWallet && ctx.profileCompletion >= 50 && (ctx.entityCounts.project ?? 0) === 0,
  },
  {
    id: 'create-first-product',
    title: 'List Your First Product',
    description: 'Start selling goods and services for Bitcoin',
    priority: 'high',
    category: 'create',
    action: { label: 'Create Product', href: ENTITY_REGISTRY.product.createPath },
    icon: Package,
    relatedEntities: ['product'],
    condition: ctx =>
      ctx.hasWallet &&
      ctx.profileCompletion >= 50 &&
      (ctx.entityCounts.product ?? 0) === 0 &&
      (ctx.entityCounts.project ?? 0) > 0, // After they have a project
  },
  {
    id: 'create-first-service',
    title: 'Offer Your First Service',
    description: 'Monetize your skills and expertise',
    priority: 'high',
    category: 'create',
    action: { label: 'Create Service', href: ENTITY_REGISTRY.service.createPath },
    icon: Briefcase,
    relatedEntities: ['service'],
    condition: ctx =>
      ctx.hasWallet &&
      ctx.profileCompletion >= 50 &&
      (ctx.entityCounts.service ?? 0) === 0 &&
      (ctx.entityCounts.project ?? 0) > 0,
  },

  // ==================== MEDIUM: Engagement ====================
  {
    id: 'create-wishlist',
    title: 'Create a Wishlist',
    description: 'Let supporters fund specific items you need',
    priority: 'medium',
    category: 'create',
    action: { label: 'Create Wishlist', href: ENTITY_REGISTRY.wishlist.createPath },
    icon: Gift,
    relatedEntities: ['wishlist'],
    condition: ctx => ctx.profileCompletion >= 75 && (ctx.entityCounts.wishlist ?? 0) === 0,
  },
  {
    id: 'add-wishlist-items',
    title: 'Add Items to Your Wishlist',
    description: 'Your wishlist is empty. Add items supporters can fund.',
    priority: 'medium',
    category: 'engage',
    action: { label: 'Add Items', href: '/dashboard/wishlists' },
    icon: Gift,
    condition: ctx => (ctx.entityCounts.wishlist ?? 0) > 0 && ctx.wishlistItemCount === 0,
  },
  {
    id: 'create-cause',
    title: 'Support a Cause',
    description: 'Create a cause page to raise funds for something you believe in',
    priority: 'medium',
    category: 'create',
    action: { label: 'Create Cause', href: ENTITY_REGISTRY.cause.createPath },
    icon: Heart,
    relatedEntities: ['cause'],
    condition: ctx =>
      ctx.profileCompletion === 100 &&
      (ctx.entityCounts.cause ?? 0) === 0 &&
      ctx.hasPublishedEntities,
  },
  {
    id: 'join-group',
    title: 'Join or Create a Group',
    description: 'Connect with like-minded people and collaborate',
    priority: 'medium',
    category: 'engage',
    action: { label: 'Explore Groups', href: '/discover?type=groups' },
    icon: Users,
    condition: ctx => ctx.profileCompletion >= 75 && (ctx.entityCounts.group ?? 0) === 0,
  },
  {
    id: 'create-event',
    title: 'Organize an Event',
    description: 'Host a meetup or gathering for your community',
    priority: 'medium',
    category: 'create',
    action: { label: 'Create Event', href: ENTITY_REGISTRY.event.createPath },
    icon: Calendar,
    relatedEntities: ['event'],
    condition: ctx =>
      ctx.profileCompletion === 100 &&
      (ctx.entityCounts.event ?? 0) === 0 &&
      ctx.hasPublishedEntities,
  },

  // ==================== LOW: Growth & Exploration ====================
  {
    id: 'explore-projects',
    title: 'Explore Other Projects',
    description: 'Discover and support projects in the community',
    priority: 'low',
    category: 'grow',
    action: { label: 'Explore', href: '/discover' },
    icon: Globe,
    condition: ctx => ctx.profileCompletion >= 50,
  },
  {
    id: 'share-profile',
    title: 'Share Your Profile',
    description: 'Let your network know about your Bitcoin profile',
    priority: 'low',
    category: 'grow',
    action: {
      label: 'View Profile',
      href: '/profile/me', // Will redirect to actual username
    },
    icon: Share2,
    condition: ctx => ctx.profileCompletion === 100,
  },
  {
    id: 'find-collaborators',
    title: 'Find Collaborators',
    description: 'Connect with people who can help grow your projects',
    priority: 'low',
    category: 'grow',
    action: { label: 'Find People', href: '/discover?type=people' },
    icon: Users,
    condition: ctx => (ctx.entityCounts.project ?? 0) > 0 && ctx.hasPublishedEntities,
  },
  {
    id: 'post-update',
    title: 'Post an Update',
    description: 'Keep your supporters informed about your progress',
    priority: 'low',
    category: 'engage',
    action: { label: 'Create Post', href: '/timeline/compose' },
    icon: MessageSquare,
    condition: ctx =>
      ctx.hasPublishedEntities &&
      (ctx.daysSinceLastActivity === null || ctx.daysSinceLastActivity > 7),
  },
];

/**
 * SMART QUESTIONS
 *
 * Contextual questions shown when profile is 100% complete
 * These encourage deeper engagement with specific features
 */
export const SMART_QUESTIONS: SmartQuestion[] = [
  {
    id: 'find-collaborators-q',
    question: 'You have projects live. Want to find collaborators?',
    action: { label: 'Find People', href: '/discover?type=people' },
    condition: ctx => ctx.profileCompletion === 100 && (ctx.entityCounts.project ?? 0) > 0,
  },
  {
    id: 'share-wishlist-q',
    question: 'Your wishlist has items. Share it with supporters?',
    action: { label: 'Share Wishlist', href: '/dashboard/wishlists' },
    condition: ctx => ctx.profileCompletion === 100 && ctx.wishlistItemCount > 0,
  },
  {
    id: 'update-supporters-q',
    question: "It's been a while since your last post. Update your supporters?",
    action: { label: 'Create Post', href: '/timeline/compose' },
    condition: ctx =>
      ctx.profileCompletion === 100 &&
      ctx.hasPublishedEntities &&
      ctx.daysSinceLastActivity !== null &&
      ctx.daysSinceLastActivity > 7,
  },
  {
    id: 'explore-funding-q',
    question: 'Ready to explore funding opportunities?',
    action: { label: 'Browse Projects', href: '/discover?type=projects' },
    condition: ctx => ctx.profileCompletion === 100 && ctx.hasWallet && !ctx.hasPublishedEntities,
  },
  {
    id: 'grow-network-q',
    question: 'Want to grow your network? Join a group!',
    action: { label: 'Find Groups', href: '/discover?type=groups' },
    condition: ctx => ctx.profileCompletion === 100 && (ctx.entityCounts.group ?? 0) === 0,
  },
  {
    id: 'try-ai-q',
    question: 'Have you tried creating an AI assistant to monetize?',
    action: { label: 'Create AI Assistant', href: ENTITY_REGISTRY.ai_assistant.createPath },
    condition: ctx =>
      ctx.profileCompletion === 100 &&
      ctx.hasPublishedEntities &&
      (ctx.entityCounts.ai_assistant ?? 0) === 0,
  },
];

/**
 * CELEBRATION MESSAGES
 *
 * Shown when user completes different milestones
 */
export const CELEBRATION_MESSAGES = {
  profileComplete: {
    title: 'Profile Complete! 🎉',
    description: "Your profile is 100% complete. You're ready to make the most of OrangeCat!",
  },
  firstEntity: {
    title: 'First Creation! 🚀',
    description: "Congratulations on creating your first listing! You're on your way.",
  },
  allSetupComplete: {
    title: 'All Set! ✨',
    description: "You've completed all recommended setup tasks. Now let's grow!",
  },
  engagementMaster: {
    title: 'Engagement Pro! 🏆',
    description: 'You have a thriving presence on OrangeCat. Keep up the great work!',
  },
};
