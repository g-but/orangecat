/**
 * EVENTS INITIATIVE MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from main initiatives.ts (901 lines) for modular architecture
 */

import type { Initiative } from '@/types/initiative';

export const events: Initiative = {
  id: 'events',
  name: 'Events',
  icon: 'Calendar',
  color: {
    primary: 'blue-600',
    gradient: 'from-blue-500 to-teal-500',
    bg: 'blue-100',
    text: 'blue-600',
    border: 'blue-200'
  },
  description: 'Organize and fundraise for conferences, parties, and community gatherings with Bitcoin-powered ticketing and coordination tools.',
  longDescription: 'Plan events, sell tickets with Bitcoin, manage attendee communications, coordinate logistics, and create memorable experiences for your Bitcoin community.',
  status: 'coming-soon',
  timeline: 'Q2 2026',
  routes: {
    landing: '/events',
    demo: '/demo/events',
    comingSoon: '/coming-soon?feature=events'
  },
  features: [
    {
      icon: 'Calendar',
      title: 'Event Creation',
      description: 'Create and manage events from intimate gatherings to large conferences with ease.',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: 'Ticket',
      title: 'Bitcoin Ticketing',
      description: 'Sell tickets with Bitcoin payments, eliminating payment processor fees and chargebacks.',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      icon: 'Users',
      title: 'Attendee Management',
      description: 'Track RSVPs, manage guest lists, and communicate with attendees seamlessly.',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: 'MapPin',
      title: 'Venue Coordination',
      description: 'Manage venues, logistics, and coordinate with local service providers.',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: 'Clock',
      title: 'Real-time Updates',
      description: 'Send instant updates to attendees about schedule changes or important announcements.',
      color: 'text-red-600 bg-red-100'
    },
    {
      icon: 'Target',
      title: 'Event Analytics',
      description: 'Track attendance, engagement metrics, and gather feedback for future events.',
      color: 'text-teal-600 bg-teal-100'
    }
  ],
  types: [
    { 
      name: 'Conferences', 
      icon: 'Users',
      description: 'Professional conferences and seminars',
      example: 'Bitcoin Conference Zurich',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    { 
      name: 'Meetups', 
      icon: 'Coffee',
      description: 'Casual community gatherings',
      example: 'Local Bitcoin meetup',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    { 
      name: 'Workshops', 
      icon: 'Users',
      description: 'Educational and skill-building sessions',
      example: 'Lightning Network workshop',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    { 
      name: 'Social Events', 
      icon: 'Heart',
      description: 'Parties and social gatherings',
      example: 'Community celebration',
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    },
    { 
      name: 'Concerts', 
      icon: 'Music',
      description: 'Musical performances and festivals',
      example: 'Bitcoin music festival',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    { 
      name: 'Gaming Events', 
      icon: 'Target',
      description: 'Gaming tournaments and competitions',
      example: 'Esports tournament',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
  ],
  capabilities: [
    'Event creation and management',
    'Bitcoin ticket sales',
    'Attendee management',
    'Event fundraising projects',
    'Real-time communication',
    'Post-event analytics',
    'Venue coordination',
    'Speaker management',
    'Sponsorship tracking',
    'Social media integration'
  ],
  useCases: [
    'Bitcoin conferences and meetups',
    'Community gatherings',
    'Educational workshops',
    'Social events and parties'
  ],
  marketTools: [
    {
      name: 'Eventbrite',
      description: 'Event management and ticketing',
      url: 'https://eventbrite.com',
      icon: 'Calendar',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      name: 'Meetup',
      description: 'Community meetup organization',
      url: 'https://meetup.com',
      icon: 'Coffee',
      color: 'bg-red-100 text-red-600'
    },
    {
      name: 'Zoom Events',
      description: 'Virtual event platform',
      url: 'https://zoom.us',
      icon: 'Users',
      color: 'bg-blue-100 text-blue-600'
    }
  ]
}; 