/**
 * Event Field Guidance Content
 *
 * Single source of truth for event creation guidance.
 * Used by DynamicSidebar to provide contextual help.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Initial event guidance content
 */

import React from 'react';
import {
  Calendar,
  FileText,
  DollarSign,
  Tag,
  Clock,
  MapPin,
  Users,
  Ticket,
  Building,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type EventFieldType =
  | 'title'
  | 'description'
  | 'event_type'
  | 'category'
  | 'start_date'
  | 'end_date'
  | 'venue_name'
  | 'venue_address'
  | 'is_online'
  | 'online_url'
  | 'max_attendees'
  | 'requires_rsvp'
  | 'ticket_price'
  | 'funding_goal'
  | 'bitcoin_address'
  | 'asset_id'
  | null;

export const eventGuidanceContent: Record<NonNullable<EventFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(Calendar, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Event Title',
    description: 'Create a clear, engaging title that tells people what your event is about.',
    tips: [
      'Be specific about what the event is',
      'Include the event type if helpful (Meetup, Workshop, etc.)',
      'Keep it concise but descriptive',
      'Make it searchable and memorable',
    ],
    examples: [
      'Bitcoin Meetup Zurich',
      'Art Exhibition Opening Night',
      'Weekend Hiking Trip - Alps',
      'Bitcoin Developer Conference 2025',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Event Description',
    description: 'Describe what will happen at your event, who should attend, and what to expect.',
    tips: [
      'Explain the event format and activities',
      'Mention who the event is for',
      'Include what attendees will learn or experience',
      'Add any special requirements or preparations',
      'Be enthusiastic and welcoming',
    ],
    examples: [
      'Join us for an evening of Bitcoin discussions, networking, and pizza. All levels welcome...',
      'Explore contemporary art in this exclusive gallery opening. Meet the artists...',
    ],
  },
  event_type: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Event Type',
    description:
      'Choose the category that best describes your event. This helps people find relevant events.',
    tips: [
      'Meetup: Casual gatherings, networking',
      'Conference: Formal multi-day events',
      'Workshop: Hands-on learning sessions',
      'Party: Celebrations, social events',
      'Exhibition: Art shows, displays',
      'Festival: Multi-day cultural events',
      'Retreat: Getaways, focused experiences',
    ],
    examples: [
      'Meetup - Regular community gatherings',
      'Workshop - Skill-building sessions',
      'Conference - Professional events',
    ],
  },
  category: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Category',
    description: 'Further categorize your event to help people discover it.',
    tips: [
      'Choose the most relevant category',
      'Helps with event discovery',
      'Can be combined with event type',
    ],
    examples: [
      'Technology - For tech-related events',
      'Arts & Culture - For creative events',
      'Business - For professional networking',
    ],
  },
  start_date: {
    icon: React.createElement(Clock, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Start Date & Time',
    description: 'When does your event begin? Be specific with date and time.',
    tips: [
      'Set a clear start time',
      'Consider timezone for global audiences',
      'Allow enough time for setup',
      'Be realistic about timing',
    ],
    examples: ['2025-02-15 at 18:00 - Evening meetup', '2025-03-01 at 09:00 - Morning workshop'],
  },
  end_date: {
    icon: React.createElement(Clock, { className: 'w-5 h-5 text-blue-600' }),
    title: 'End Date & Time',
    description: 'When does your event end? Leave empty for single-day events.',
    tips: [
      'Optional for single-day events',
      'Required for multi-day events',
      'Helps attendees plan their schedule',
    ],
    examples: ['2025-02-15 at 21:00 - 3-hour event', '2025-03-03 at 17:00 - Multi-day conference'],
  },
  venue_name: {
    icon: React.createElement(Building, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Venue Name',
    description: 'The name of the venue or location where your event will take place.',
    tips: [
      'Use the official venue name',
      "Be specific if it's a well-known location",
      'Include building or room number if relevant',
    ],
    examples: ['Community Center Zurich', 'Art Gallery Basel', 'Co-working Space Geneva'],
  },
  venue_address: {
    icon: React.createElement(MapPin, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Venue Address',
    description: 'The full street address where attendees should go.',
    tips: [
      'Include street name and number',
      'Complete address helps with navigation',
      'Consider parking availability',
    ],
    examples: ['Bahnhofstrasse 1', 'Rue du Rhône 5'],
  },
  is_online: {
    icon: React.createElement(Globe, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Online Event',
    description: 'Check this if your event will be held online (virtual event).',
    tips: [
      'Online events can reach global audiences',
      'No venue needed',
      'Requires online URL (Zoom, Jitsi, etc.)',
      'Can be hybrid (both online and in-person)',
    ],
    examples: ['Virtual meetup via Zoom', 'Online workshop via Jitsi'],
  },
  online_url: {
    icon: React.createElement(Globe, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Online Event URL',
    description: 'The link where people can join your online event.',
    tips: [
      'Use Zoom, Jitsi, Google Meet, or similar',
      'Test the link before publishing',
      'Consider password protection',
      'Required for online events',
    ],
    examples: ['https://zoom.us/j/123456789', 'https://meet.jit.si/YourEventName'],
  },
  max_attendees: {
    icon: React.createElement(Users, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Maximum Attendees',
    description: 'How many people can attend? Leave empty for unlimited capacity.',
    tips: [
      'Consider venue capacity',
      'Think about optimal group size',
      'Leave empty for unlimited events',
      'Can help create exclusivity',
    ],
    examples: ['50 - Medium-sized meetup', '200 - Large conference', '20 - Intimate workshop'],
  },
  requires_rsvp: {
    icon: React.createElement(CheckCircle2, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Requires RSVP',
    description: 'Should people register in advance? Recommended for most events.',
    tips: [
      'Helps you plan and prepare',
      'Allows you to communicate with attendees',
      'Essential for capacity-limited events',
      'Enables check-in management',
    ],
    examples: ['Yes - For organized events', 'No - For open, drop-in events'],
  },
  ticket_price: {
    icon: React.createElement(Ticket, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Ticket Price',
    description:
      'How much does it cost to attend? Set to 0 or mark as free for free events. Enter in your preferred currency.',
    tips: [
      'Research similar events for pricing',
      'Consider covering costs (venue, food, etc.)',
      'Can be free if sponsored or community-funded',
      'All transactions settle in Bitcoin',
      'Enter amount in your preferred currency (USD, CHF, EUR, BTC, or SATS)',
    ],
    examples: ['$50 - Small meetup', '$200 - Workshop with materials', 'Free - Community event'],
  },
  funding_goal: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Funding Goal',
    description:
      'Optional: Set a funding goal to cover event costs (venue rental, catering, etc.). System monitors your Bitcoin address and notifies you when goal is reached.',
    tips: [
      'Useful for covering upfront costs',
      'Can be separate from ticket sales',
      'Allows community support',
      'Transparent cost breakdown',
      'Fiat goals (USD/CHF/EUR) can be reached via funding OR Bitcoin price appreciation',
      'BTC/SATS goals can only be reached via funding',
      'Enter amount in your preferred currency',
    ],
    examples: ['$10,000 - Venue rental + catering', '$5,000 - Materials and supplies'],
  },
  bitcoin_address: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Bitcoin Address',
    description: 'Where should ticket payments and funding be sent?',
    tips: [
      'Use a dedicated address for the event',
      'Can be your wallet or organization wallet',
      'Lightning address recommended for instant payments',
      'Keep track of payments',
    ],
    examples: ['bc1q... - On-chain Bitcoin address', 'Use Lightning for faster payments'],
  },
  asset_id: {
    icon: React.createElement(Building, { className: 'w-5 h-5 text-blue-600' }),
    title: 'Link to Asset',
    description: "If you're renting a venue from the assets marketplace, link it here.",
    tips: [
      'Connects event to rented asset',
      'Helps with resource management',
      'Shows transparency in venue costs',
      'Optional - only if using asset marketplace',
    ],
    examples: ['Link to rented community space', 'Link to rented conference room'],
  },
};

export const eventDefaultGuidance: DefaultGuidance = {
  title: 'What is an Event?',
  description:
    'Events are in-person gatherings, meetups, and experiences. Organize parties, conferences, workshops, and more with Bitcoin-powered ticketing and RSVP management.',
  features: [
    {
      icon: React.createElement(Calendar, { className: 'w-4 h-4 text-blue-600' }),
      text: 'Organize in-person gatherings',
    },
    {
      icon: React.createElement(Users, { className: 'w-4 h-4 text-blue-600' }),
      text: 'Manage RSVPs and attendance',
    },
    {
      icon: React.createElement(Ticket, { className: 'w-4 h-4 text-blue-600' }),
      text: 'Sell tickets with Bitcoin',
    },
    {
      icon: React.createElement(Building, { className: 'w-4 h-4 text-blue-600' }),
      text: 'Link to assets for venue rental',
    },
  ],
  hint: '💡 Click on any field to get specific guidance',
};
