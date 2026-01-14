/**
 * Circle Field Guidance Content
 *
 * Single source of truth for circle creation guidance.
 * Used by DynamicSidebar to provide contextual help.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-04
 * Last Modified Summary: Initial circle guidance content
 */

import React from 'react';
import {
  Users,
  FileText,
  Globe,
  Wallet,
  Target,
  Shield,
  UserPlus,
  CheckCircle2,
  Tag,
  Coins,
  Activity,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type CircleFieldType =
  | 'name'
  | 'description'
  | 'category'
  | 'visibility'
  | 'maxMembers'
  | 'bitcoinAddress'
  | 'walletPurpose'
  | 'memberApproval'
  | 'locationRestricted'
  | 'locationRadius'
  | 'contributionRequired'
  | 'contributionAmount'
  | 'activityLevel'
  | 'meetingFrequency'
  | 'enableProjects'
  | 'enableEvents'
  | 'enableDiscussions'
  | 'requireMemberIntro'
  | null;

export const circleGuidanceContent: Record<NonNullable<CircleFieldType>, GuidanceContent> = {
  name: {
    icon: React.createElement(Users, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Circle Name',
    description: 'Give your circle a memorable name that reflects its purpose or community.',
    tips: [
      'Keep it short and memorable (3-50 characters)',
      'Make it clear what the circle is about',
      'Avoid generic names like "My Circle"',
      'Consider including location or interest keywords',
      'This will be visible to all members',
    ],
    examples: [
      'Zurich Bitcoin Meetup',
      'Family Savings Circle',
      'Swiss Dev Community',
      'Neighborhood Emergency Fund',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Description',
    description: 'Explain what your circle is for, who should join, and what members can expect.',
    tips: [
      'Start with the purpose of the circle',
      'Explain who the ideal members are',
      'Mention any goals or activities',
      'Keep it welcoming and inclusive',
      'Max 500 characters',
    ],
    examples: [
      'A community of Zurich-based Bitcoiners who meet monthly to discuss developments and help each other...',
      'Our family saving circle for shared expenses and emergency funds. Only family members.',
    ],
  },
  category: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Category',
    description: 'Categorize your circle to help others find it and understand its purpose.',
    tips: [
      'Choose the category that best fits your circle',
      'Categories help with discoverability',
      'Common: Family, Friends, Community, Professional',
      'You can always change this later',
    ],
    examples: [
      'Family - For family financial coordination',
      'Community - Local neighborhood groups',
      'Professional - Work or industry circles',
    ],
  },
  visibility: {
    icon: React.createElement(Globe, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Visibility',
    description: 'Control who can see and find your circle.',
    tips: [
      'Public: Anyone can find and request to join',
      'Private: Only invited members can join',
      'Hidden: Circle is invisible to non-members',
      'Private circles still appear in member profiles',
      'Most family circles should be private or hidden',
    ],
    examples: [
      'Public - Open community circles',
      'Private - Invite-only groups',
      'Hidden - Sensitive financial circles',
    ],
  },
  maxMembers: {
    icon: React.createElement(UserPlus, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Maximum Members',
    description: 'Set a limit on how many people can join your circle.',
    tips: [
      'Leave empty for unlimited members',
      'Smaller circles (5-20) are often more cohesive',
      'Larger circles work for communities',
      'You can always increase the limit later',
    ],
    examples: [
      '10 - Small family or friend group',
      '50 - Local community',
      'Unlimited - Open community',
    ],
  },
  bitcoinAddress: {
    icon: React.createElement(Wallet, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Circle Bitcoin Wallet',
    description: 'Connect a Bitcoin wallet for the circle. Members can contribute to shared goals.',
    tips: [
      'Use a dedicated wallet for the circle',
      'Consider multi-signature for added security',
      "This becomes the circle's shared treasury",
      'Members can donate or contribute to this wallet',
      'Keep the private key secure',
    ],
    examples: [
      'bc1q... (Native SegWit - recommended)',
      'Consider using a multi-sig setup',
      'Hardware wallet for large amounts',
    ],
  },
  walletPurpose: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Wallet Purpose',
    description: 'Describe what the circle wallet will be used for.',
    tips: [
      'Be specific about how funds will be used',
      'Members should understand before contributing',
      'Examples: emergency fund, group purchases, charity',
      'Transparency builds trust',
    ],
    examples: [
      'Family emergency fund for unexpected medical expenses',
      'Community project funding for local initiatives',
      'Monthly subscription pool for shared services',
    ],
  },
  memberApproval: {
    icon: React.createElement(Shield, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Member Approval',
    description: 'Choose how new members join your circle.',
    tips: [
      'Auto-approve: Anyone meeting criteria joins instantly',
      'Manual approval: Admin reviews each request',
      'Invite-only: Only invited users can join',
      'For financial circles, manual approval recommended',
    ],
    examples: [
      'Auto - Open community circles',
      'Manual - Vetted membership',
      'Invite - Trusted groups only',
    ],
  },
  locationRestricted: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Location Restrictions',
    description: 'Limit circle membership to people within a specific geographic area.',
    tips: [
      'Great for local community circles',
      'Helps build stronger local connections',
      'Use for neighborhood groups or city meetups',
      'Consider 10-50km radius for most communities',
      'Leave unrestricted for global circles',
    ],
    examples: [
      'Neighborhood mutual aid - 5km radius',
      'City Bitcoin meetup - 25km radius',
      'Global investment circle - No restrictions',
    ],
  },
  locationRadius: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Location Radius',
    description: 'Set the maximum distance members can be from the circle center.',
    tips: [
      'Small radius (5-10km): Very local communities',
      'Medium radius (20-50km): City or regional groups',
      'Large radius (100km+): Regional collaboration',
      'Consider transportation and meeting logistics',
    ],
    examples: [
      '5km - Walkable neighborhood',
      '25km - City-wide community',
      '100km - Regional network',
    ],
  },
  contributionRequired: {
    icon: React.createElement(Coins, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Required Contributions',
    description: 'Require members to contribute financially to participate.',
    tips: [
      'Use for savings or investment circles',
      'Set reasonable amounts members can afford',
      'Clearly communicate how contributions are used',
      'Consider graduated contribution levels',
      'Start small to build trust',
    ],
    examples: [
      'Family emergency fund - Monthly contributions',
      'Investment club - Quarterly investments',
      'Community project - Project-based funding',
    ],
  },
  contributionAmount: {
    icon: React.createElement(Coins, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Contribution Amount',
    description: 'Set the required contribution amount for members.',
    tips: [
      'Amount should be sustainable for all members',
      'Consider different contribution tiers',
      'Be transparent about how funds are used',
      'Start with smaller amounts to build commitment',
      'Regular small contributions build bigger impact',
    ],
    examples: [
      '100 SATS/month - Small family savings',
      '1000 SATS/month - Investment club',
      '500 SATS/event - Activity-based circles',
    ],
  },
  activityLevel: {
    icon: React.createElement(Activity, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Activity Level',
    description: 'Set expectations for how active your circle will be.',
    tips: [
      'Casual: Occasional check-ins and events',
      'Regular: Weekly discussions and monthly events',
      'Intensive: Daily collaboration and frequent meetings',
      'Match activity level to member availability',
      'Be honest about time commitment required',
    ],
    examples: [
      'Casual - Family coordination circle',
      'Regular - Professional networking',
      'Intensive - Startup development team',
    ],
  },
  meetingFrequency: {
    icon: React.createElement(CheckCircle2, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Meeting Frequency',
    description: 'How often does your circle meet or have scheduled activities?',
    tips: [
      'None: Self-organized meetings and activities',
      'Weekly: Regular check-ins and coordination',
      'Monthly: Monthly meetups and planning',
      'Quarterly: Major planning and review sessions',
      'Match frequency to circle purpose and member availability',
    ],
    examples: [
      'Weekly - Investment discussion group',
      'Monthly - Community meetup',
      'Quarterly - Strategic planning circle',
    ],
  },
  enableProjects: {
    icon: React.createElement(CheckCircle2, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Project Collaboration',
    description: 'Allow members to create and manage collaborative projects.',
    tips: [
      'Great for productive circles with shared goals',
      'Enables project tracking and milestone management',
      'Members can volunteer for different roles',
      'Projects can have their own funding goals',
      'Use for community initiatives or business ventures',
    ],
    examples: [
      'Community garden project',
      'Open source software development',
      'Local charity fundraiser',
    ],
  },
  enableEvents: {
    icon: React.createElement(CheckCircle2, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Event Planning',
    description: 'Allow members to organize events and gatherings.',
    tips: [
      'Essential for community and social circles',
      'Members can RSVP and coordinate logistics',
      'Events can be in-person or virtual',
      'Track attendance and feedback',
      'Use for meetups, workshops, and celebrations',
    ],
    examples: [
      'Monthly Bitcoin meetup',
      'Family reunion planning',
      'Professional networking event',
    ],
  },
  enableDiscussions: {
    icon: React.createElement(CheckCircle2, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Discussion Forums',
    description: 'Enable discussion topics and conversation threads.',
    tips: [
      'Foundation for most circle communication',
      'Organize discussions by categories or topics',
      'Members can ask questions and share ideas',
      'Create knowledge base through archived discussions',
      'Moderate to keep conversations productive',
    ],
    examples: [
      'Bitcoin price discussion',
      'Project planning conversations',
      'General announcements and updates',
    ],
  },
  requireMemberIntro: {
    icon: React.createElement(CheckCircle2, { className: 'w-5 h-5 text-purple-600' }),
    title: 'Member Introductions',
    description: 'Require new members to introduce themselves when joining.',
    tips: [
      'Helps build personal connections',
      'Allows members to share backgrounds and interests',
      'Creates welcoming community culture',
      'Can include icebreaker questions',
      'Optional but recommended for social circles',
    ],
    examples: [
      'Share your Bitcoin journey',
      'What brings you to this circle?',
      'Skills or interests to contribute',
    ],
  },
};

export const circleDefaultGuidance: DefaultGuidance = {
  title: 'What is a Circle?',
  description:
    'Circles are groups of people who come together around a shared purpose. Family, friends, community - unite and coordinate with a shared Bitcoin wallet.',
  features: [
    {
      icon: React.createElement(Users, { className: 'w-4 h-4 text-purple-600' }),
      text: 'Create groups for family, friends, or community',
    },
    {
      icon: React.createElement(Wallet, { className: 'w-4 h-4 text-purple-600' }),
      text: 'Share a Bitcoin wallet for collective goals',
    },
    {
      icon: React.createElement(CheckCircle2, { className: 'w-4 h-4 text-purple-600' }),
      text: 'Coordinate and track contributions transparently',
    },
  ],
  hint: '💡 Click on any field to get specific guidance',
};
