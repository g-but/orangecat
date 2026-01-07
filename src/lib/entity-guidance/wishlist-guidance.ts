/**
 * Wishlist Field Guidance Content
 *
 * Single source of truth for wishlist creation guidance.
 * Used by GuidancePanel to provide contextual help and examples.
 *
 * Created: 2026-01-06
 * Last Modified: 2026-01-06
 * Last Modified Summary: Initial wishlist guidance content
 */

import React from 'react';
import {
  Gift,
  FileText,
  Eye,
  Calendar,
  Image,
  Target,
  Link,
  Wallet,
  ThumbsUp,
  Receipt,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type WishlistFieldType =
  | 'title'
  | 'description'
  | 'type'
  | 'visibility'
  | 'event_date'
  | 'cover_image_url'
  | null;

export type WishlistItemFieldType =
  | 'title'
  | 'description'
  | 'target_amount_sats'
  | 'external_url'
  | 'external_source'
  | 'use_dedicated_wallet'
  | 'dedicated_wallet_address'
  | 'priority'
  | 'allow_partial_funding'
  | 'quantity_wanted'
  | null;

export const wishlistGuidanceContent: Record<NonNullable<WishlistFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(Gift, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Wishlist Title',
    description:
      'Give your wishlist a clear, memorable name that tells people what occasion or purpose it serves.',
    tips: [
      "Include the occasion (e.g., '30th Birthday')",
      'Add your name for personal wishlists',
      'Keep it concise but descriptive',
      'Make it easy to share and remember',
    ],
    examples: [
      "Sarah's Wedding Registry",
      'Johnson Family Reunion Fund',
      '2026 Birthday Wishlist',
      'New Apartment Essentials',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Description',
    description:
      'Tell contributors about your wishlist. What is it for? Why does it matter?',
    tips: [
      'Share the story or occasion',
      'Explain how contributions will be used',
      'Be personal and authentic',
      'Thank contributors in advance',
    ],
    examples: [
      "We're getting married! Help us start our new life together with items we'll cherish forever.",
      "I'm saving for a gap year adventure before college. Every contribution brings me closer to this dream!",
    ],
  },
  type: {
    icon: React.createElement(Gift, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Wishlist Type',
    description:
      'Choose the type that best matches your occasion. This helps contributors understand the context.',
    tips: [
      'Birthday - for birthday gifts',
      'Wedding - for wedding registries',
      'Baby Shower - for new parents',
      'Graduation - for graduates',
      'Travel - for trip funding',
      'Personal - for personal goals',
      'Charity - for charitable causes',
    ],
    examples: [
      'Wedding - traditional gift registry',
      'Birthday - birthday wishlist',
      'Personal - equipment or goal funding',
    ],
  },
  visibility: {
    icon: React.createElement(Eye, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Visibility',
    description:
      'Control who can see your wishlist.',
    tips: [
      'Public - anyone can find and view',
      'Unlisted - only people with the link',
      'Private - only you can see it',
      'Choose unlisted for sensitive wishlists',
    ],
    examples: [
      'Public - for wedding registries you want to share widely',
      'Unlisted - for personal wishlists shared with friends',
      'Private - for tracking goals privately',
    ],
  },
  event_date: {
    icon: React.createElement(Calendar, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Event Date',
    description:
      'Optional: Set a date for your event (wedding, birthday, etc.) to create urgency.',
    tips: [
      'Helps contributors know when to give by',
      'Creates a sense of occasion',
      'Optional for ongoing wishlists',
      'Can be updated later',
    ],
    examples: [
      'Wedding date: June 15, 2026',
      'Birthday: March 20, 2026',
      'No date for ongoing savings goals',
    ],
  },
  cover_image_url: {
    icon: React.createElement(Image, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Cover Image',
    description:
      'Add a cover image to make your wishlist more personal and appealing.',
    tips: [
      'Use a relevant, high-quality image',
      'Personal photos work well',
      'Make sure you have rights to the image',
      'Consider the mood and occasion',
    ],
    examples: [
      'Engagement photo for wedding registry',
      'Travel destination for trip fund',
      'Baby ultrasound for baby shower',
    ],
  },
};

export const wishlistItemGuidanceContent: Record<NonNullable<WishlistItemFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(Gift, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Item Title',
    description:
      'Name the specific item you want. Be clear so contributors know exactly what they are funding.',
    tips: [
      'Be specific (brand, model if applicable)',
      'Include size or color if relevant',
      'Make it searchable and clear',
    ],
    examples: [
      'Sony WH-1000XM5 Headphones',
      'KitchenAid Stand Mixer - Empire Red',
      'Honeymoon Flight to Bali',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Item Description',
    description:
      'Explain why you want this item and how it will be used.',
    tips: [
      'Share why this item matters to you',
      'Explain how you will use it',
      'Be personal and authentic',
    ],
    examples: [
      "I've been dreaming of upgrading my coffee setup. This machine makes the perfect espresso!",
      'This will help me work from home more comfortably.',
    ],
  },
  target_amount_sats: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Target Amount',
    description:
      'Set the total amount needed for this item in satoshis.',
    tips: [
      'Research the actual price',
      'Include shipping if applicable',
      'Round up for flexibility',
      'Contributors can fund partially',
    ],
    examples: [
      '500,000 sats (~$50) for headphones',
      '2,000,000 sats (~$200) for appliance',
      '10,000,000 sats (~$1000) for major purchase',
    ],
  },
  external_url: {
    icon: React.createElement(Link, { className: 'w-5 h-5 text-rose-600' }),
    title: 'External URL',
    description:
      'Link to the item on an external website (Amazon, Etsy, any store).',
    tips: [
      'Use the direct product URL',
      'Check that the link works',
      'Include affiliate links if you have them',
      'Update if the item moves',
    ],
    examples: [
      'https://www.amazon.com/dp/B0BSHWSFBP',
      'https://www.etsy.com/listing/123456789',
      'https://example-store.com/product/item',
    ],
  },
  external_source: {
    icon: React.createElement(Link, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Source',
    description:
      'Where is this item from? Helps contributors understand context.',
    tips: [
      'Amazon, Etsy, local store, etc.',
      'Use "custom" for unique items',
      'Helps with transparency',
    ],
    examples: [
      'amazon',
      'etsy',
      'local_store',
      'custom',
    ],
  },
  use_dedicated_wallet: {
    icon: React.createElement(Wallet, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Dedicated Wallet',
    description:
      'Choose whether contributions go to a dedicated address or your main wallet.',
    tips: [
      'Dedicated wallet = separate tracking',
      'Main wallet = simpler management',
      'Use dedicated for large items',
      'Main wallet is fine for most items',
    ],
    examples: [
      'Dedicated wallet for house down payment',
      'Main wallet for small birthday gifts',
    ],
  },
  dedicated_wallet_address: {
    icon: React.createElement(Wallet, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Wallet Address',
    description:
      'If using a dedicated wallet, provide the Bitcoin address.',
    tips: [
      'Use a fresh address for this item',
      'Double-check the address',
      'Consider using a hardware wallet',
      'Keep private keys secure',
    ],
    examples: [
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      'Lightning address for instant payments',
    ],
  },
  priority: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Priority',
    description:
      'Set priority to sort items in your wishlist. Higher = more wanted.',
    tips: [
      'Higher numbers appear first',
      'Use for items you want most',
      'Help contributors choose',
      '0 = normal priority',
    ],
    examples: [
      '10 = highest priority item',
      '5 = medium priority',
      '0 = nice to have',
    ],
  },
  allow_partial_funding: {
    icon: React.createElement(ThumbsUp, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Partial Funding',
    description:
      'Allow contributors to fund part of the item cost.',
    tips: [
      'Enabled by default',
      'Good for expensive items',
      'Multiple people can contribute',
      'Disable for specific amounts only',
    ],
    examples: [
      'Enabled for $500 laptop - many small contributions welcome',
      'Disabled for $50 item - want full purchase in one go',
    ],
  },
  quantity_wanted: {
    icon: React.createElement(Gift, { className: 'w-5 h-5 text-rose-600' }),
    title: 'Quantity',
    description:
      'How many of this item do you want? Default is 1.',
    tips: [
      'Set higher for consumables',
      'Useful for multiples (towels, plates)',
      'Keep at 1 for unique items',
    ],
    examples: [
      '1 for a laptop',
      '4 for a set of wine glasses',
      '12 for monthly subscriptions',
    ],
  },
};

export const wishlistDefaultGuidance: DefaultGuidance = {
  title: 'Create Your Wishlist',
  description:
    'Build a wishlist for any occasion. Add items from OrangeCat or anywhere on the web, and let friends and family contribute directly in Bitcoin.',
  features: [
    {
      icon: React.createElement(Link, { className: 'w-4 h-4 text-rose-600' }),
      text: 'Add items from any website or from OrangeCat',
    },
    {
      icon: React.createElement(Wallet, { className: 'w-4 h-4 text-rose-600' }),
      text: 'Receive contributions directly to your wallet',
    },
    {
      icon: React.createElement(Target, { className: 'w-4 h-4 text-rose-600' }),
      text: 'Flexible funding - partial or full amounts',
    },
    {
      icon: React.createElement(Receipt, { className: 'w-4 h-4 text-rose-600' }),
      text: 'Post proof of purchases for transparency',
    },
    {
      icon: React.createElement(ThumbsUp, { className: 'w-4 h-4 text-rose-600' }),
      text: 'Build trust with community feedback',
    },
  ],
};

export const wishlistProofGuidance = {
  title: 'Proof of Purchase',
  description:
    'After using funds from your wishlist, post proof to show contributors how their money was spent.',
  tips: [
    'Post receipts or screenshots of purchases',
    'Include transaction IDs when relevant',
    'Write a brief description of what you bought',
    'Photos of the actual item work great',
    'Builds trust and increases your score',
  ],
  icon: React.createElement(Receipt, { className: 'w-5 h-5 text-rose-600' }),
};

export const wishlistFeedbackGuidance = {
  title: 'Community Feedback',
  description:
    'Contributors can like or dislike your proof of purchase. Likes increase your trust score; dislikes decrease it.',
  tips: [
    'Likes are easy - no comment required',
    'Dislikes require an explanation (10+ characters)',
    'Feedback is transparent and public',
    'Respond to feedback professionally',
    'Good faith builds community trust',
  ],
  icon: React.createElement(ThumbsUp, { className: 'w-5 h-5 text-rose-600' }),
};
