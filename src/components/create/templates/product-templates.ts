/**
 * Product Templates
 *
 * Template definitions for product creation.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import React from 'react';
import { FileDigit, ShoppingBag, Music, Ticket } from 'lucide-react';
import type { EntityTemplate } from '../types';
import type { UserProductFormData } from '@/lib/validation';

export const PRODUCT_TEMPLATES: EntityTemplate<UserProductFormData>[] = [
  {
    id: 'digital-download',
    icon: React.createElement(FileDigit, { className: 'w-4 h-4' }),
    name: 'Digital Download',
    tagline: 'One file, instant delivery.',
    defaults: {
      title: 'Digital Download (guide or asset)',
      description: 'A concise digital resource delivered immediately after purchase.',
      category: 'Digital',
      product_type: 'digital',
      price_sats: 25000,
      currency: 'SATS',
      inventory_count: -1,
      fulfillment_type: 'digital',
      status: 'draft',
    },
  },
  {
    id: 'limited-merch',
    icon: React.createElement(ShoppingBag, { className: 'w-4 h-4' }),
    name: 'Limited Merch Drop',
    tagline: 'Small-batch physical item.',
    defaults: {
      title: 'Limited Merch Drop',
      description: 'A small-batch, high-quality item. Ships in 7–10 days.',
      category: 'Merch',
      product_type: 'physical',
      price_sats: 120000,
      currency: 'SATS',
      inventory_count: 25,
      fulfillment_type: 'manual',
      status: 'draft',
    },
  },
  {
    id: 'event-ticket',
    icon: React.createElement(Ticket, { className: 'w-4 h-4' }),
    name: 'Event Ticket',
    tagline: 'Simple admission with capped quantity.',
    defaults: {
      title: 'Event Ticket',
      description: 'Admission to a single event. Send confirmation and instructions on purchase.',
      category: 'Events',
      product_type: 'digital',
      price_sats: 50000,
      currency: 'SATS',
      inventory_count: 50,
      fulfillment_type: 'digital',
      status: 'draft',
    },
  },
  {
    id: 'music-pack',
    icon: React.createElement(Music, { className: 'w-4 h-4' }),
    name: 'Music Pack',
    tagline: 'Bundle of tracks with commercial rights.',
    defaults: {
      title: 'Music Pack (5 tracks)',
      description: 'A bundle of 5 tracks with light commercial licensing.',
      category: 'Music',
      product_type: 'digital',
      price_sats: 90000,
      currency: 'SATS',
      inventory_count: -1,
      fulfillment_type: 'digital',
      status: 'draft',
    },
  },
];


