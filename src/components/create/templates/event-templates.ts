/**
 * Event Templates
 *
 * Template definitions for event creation.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import React from 'react';
import { Calendar, Palette, Briefcase, Globe2 } from 'lucide-react';
import type { EntityTemplate } from '../types';
import type { EventFormData } from '@/lib/validation';

export const EVENT_TEMPLATES: EntityTemplate<EventFormData>[] = [
  {
    id: 'bitcoin-meetup',
    icon: React.createElement(Calendar, { className: 'w-4 h-4' }),
    name: 'Bitcoin Meetup',
    tagline: 'Community gathering for Bitcoin enthusiasts',
    defaults: {
      title: 'Bitcoin Meetup Zurich',
      description:
        'Join us for an evening of Bitcoin discussions, networking, and pizza. All levels welcome - from beginners to experts.',
      event_type: 'meetup',
      category: 'Technology',
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours later
      timezone: 'Europe/Zurich',
      is_all_day: false,
      is_online: false,
      venue_name: 'Community Center',
      venue_city: 'Zurich',
      venue_country: 'Switzerland',
      max_attendees: 50,
      requires_rsvp: true,
      is_free: true,
      status: 'draft',
    },
  },
  {
    id: 'art-exhibition',
    icon: React.createElement(Palette, { className: 'w-4 h-4' }),
    name: 'Art Exhibition',
    tagline: 'Gallery opening with artist meet & greet',
    defaults: {
      title: 'Contemporary Art Exhibition Opening',
      description:
        'Exclusive gallery opening featuring local artists. Meet the creators, enjoy refreshments, and explore contemporary works.',
      event_type: 'exhibition',
      category: 'Arts & Culture',
      start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
      timezone: 'Europe/Zurich',
      is_all_day: false,
      is_online: false,
      venue_name: 'Art Gallery',
      venue_city: 'Basel',
      venue_country: 'Switzerland',
      max_attendees: 100,
      requires_rsvp: true,
      ticket_price_sats: 50000,
      is_free: false,
      status: 'draft',
    },
  },
  {
    id: 'workshop',
    icon: React.createElement(Briefcase, { className: 'w-4 h-4' }),
    name: 'Workshop',
    tagline: 'Hands-on learning session',
    defaults: {
      title: 'Bitcoin Development Workshop',
      description:
        'Learn to build Bitcoin applications. Hands-on coding session with experienced developers. Bring your laptop!',
      event_type: 'workshop',
      category: 'Education',
      start_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
      end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // 6 hours later
      timezone: 'Europe/Zurich',
      is_all_day: false,
      is_online: false,
      venue_name: 'Co-working Space',
      venue_city: 'Geneva',
      venue_country: 'Switzerland',
      max_attendees: 20,
      requires_rsvp: true,
      ticket_price_sats: 200000,
      is_free: false,
      funding_goal_sats: 1000000,
      status: 'draft',
    },
  },
  {
    id: 'online-meetup',
    icon: React.createElement(Globe2, { className: 'w-4 h-4' }),
    name: 'Online Meetup',
    tagline: 'Virtual gathering for global participants',
    defaults: {
      title: 'Global Bitcoin Discussion',
      description:
        'Join Bitcoin enthusiasts from around the world for an online discussion. No travel needed!',
      event_type: 'meetup',
      category: 'Technology',
      start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      timezone: 'UTC',
      is_all_day: false,
      is_online: true,
      online_url: 'https://meet.jit.si/BitcoinGlobal',
      max_attendees: null,
      requires_rsvp: true,
      is_free: true,
      status: 'draft',
    },
  },
];


