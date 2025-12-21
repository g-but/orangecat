/**
 * EVENTS INITIATIVE MODULE
 *
 * Created: 2025-12-05
 * Last Modified: 2025-12-05
 * Last Modified Summary: Created comprehensive events initiative for party, exhibit, and gathering organization
 */

import type { Initiative } from '@/types/initiative';

export const events: Initiative = {
  id: 'events',
  name: 'Events',
  icon: 'Calendar',
  color: {
    primary: 'blue-600',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'blue-100',
    text: 'blue-600',
    border: 'blue-200'
  },
  description: 'Organize parties, art exhibits, meetups, and gatherings with Bitcoin-powered ticketing and seamless event management.',
  longDescription: 'Create memorable events with integrated ticketing, RSVP management, and community engagement. Accept Bitcoin payments for tickets, track attendance, and build lasting connections through shared experiences.',
  status: 'coming-soon',
  timeline: 'Q1 2026',
  routes: {
    landing: '/events',
    demo: '/demo/events',
    comingSoon: '/coming-soon?feature=events'
  },
  features: [
    {
      icon: 'Ticket',
      title: 'Bitcoin Ticketing',
      description: 'Sell event tickets with Bitcoin pricing, instant payments, and automated confirmation.',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      icon: 'Users',
      title: 'RSVP Management',
      description: 'Track attendee responses, manage capacity limits, and send automated updates.',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: 'MapPin',
      title: 'Venue Coordination',
      description: 'Integrate location services, capacity planning, and logistical coordination.',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: 'QrCode',
      title: 'Check-in System',
      description: 'QR code check-in, real-time attendance tracking, and seamless entry management.',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: 'Camera',
      title: 'Event Media',
      description: 'Photo sharing, live updates, and community storytelling during and after events.',
      color: 'text-pink-600 bg-pink-100'
    },
    {
      icon: 'BarChart3',
      title: 'Event Analytics',
      description: 'Track attendance, engagement metrics, and optimize future event planning.',
      color: 'text-cyan-600 bg-cyan-100'
    }
  ],
  types: [
    {
      name: 'Parties & Celebrations',
      icon: 'PartyPopper',
      description: 'Birthday parties, anniversaries, and social gatherings',
      example: 'Surprise birthday party for 50 people',
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    },
    {
      name: 'Art Exhibits',
      icon: 'Palette',
      description: 'Gallery openings, art shows, and creative displays',
      example: 'Contemporary art exhibition',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      name: 'Weekend Getaways',
      icon: 'Tent',
      description: 'Group trips, retreats, and adventure experiences',
      example: 'Mountain hiking weekend for 20 friends',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    {
      name: 'Conferences & Meetups',
      icon: 'Users',
      description: 'Professional conferences, networking events, and community meetups',
      example: 'Bitcoin developer conference',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      name: 'Workshops & Classes',
      icon: 'GraduationCap',
      description: 'Educational workshops, skill-building sessions, and training events',
      example: 'Photography workshop series',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    {
      name: 'Festivals & Fairs',
      icon: 'Music',
      description: 'Music festivals, cultural fairs, and community celebrations',
      example: 'Local food and music festival',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  ],
  capabilities: [
    'Bitcoin-powered ticketing system',
    'RSVP and capacity management',
    'Automated check-in with QR codes',
    'Event promotion and social sharing',
    'Real-time attendance tracking',
    'Post-event analytics and feedback',
    'Multi-day event support',
    'Virtual/hybrid event options',
    'Catering and vendor coordination',
    'Event insurance and liability management'
  ],
  useCases: [
    'Organize birthday parties and celebrations',
    'Host art exhibitions and gallery events',
    'Plan weekend getaways and group trips',
    'Run conferences and professional meetups',
    'Conduct workshops and educational events',
    'Manage festivals and community gatherings'
  ],
  marketTools: [
    {
      name: 'Eventbrite',
      description: 'Popular event ticketing platform',
      url: 'https://eventbrite.com',
      icon: 'Ticket',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      name: 'Meetup',
      description: 'Community event organization',
      url: 'https://meetup.com',
      icon: 'Users',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Cvent',
      description: 'Professional event management',
      url: 'https://cvent.com',
      icon: 'Calendar',
      color: 'bg-green-100 text-green-600'
    }
  ]
};
































