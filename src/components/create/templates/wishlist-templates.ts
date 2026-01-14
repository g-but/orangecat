/**
 * Wishlist Templates
 *
 * Pre-configured templates for different wishlist types and occasions.
 * Includes both registry templates (birthday, wedding, etc.) and
 * common item templates (electronics, home goods, experiences, etc.).
 *
 * Created: 2026-01-06
 * Last Modified: 2026-01-06
 * Last Modified Summary: Initial wishlist templates
 */

import React from 'react';
import {
  Cake,
  PartyPopper,
  Sparkles,
  Heart,
  Plane,
  Home,
  Gem,
  Baby,
  HeartHandshake,
  GraduationCap,
  BookOpen,
  Globe,
  Key,
  Hammer,
  HandHeart,
  Handshake,
  AlertCircle,
  Palmtree,
  Backpack,
  Users,
  Star,
  Target,
  Palette,
  Dumbbell,
  Wrench,
  Siren,
  FileText,
  TreePine,
  Lock,
} from 'lucide-react';
import type { EntityTemplate } from '../types';
import type { WishlistFormData, WishlistItemFormData } from '@/lib/validation';

// ==================== WISHLIST TYPE DEFAULTS ====================

export interface WishlistDefaults extends Partial<WishlistFormData> {
  title: string;
  type: WishlistFormData['type'];
  description?: string;
  visibility?: WishlistFormData['visibility'];
}

// WishlistTemplate matches EntityTemplate structure
export type WishlistTemplate = EntityTemplate<WishlistDefaults>;

// Birthday Wishlists
const birthdayTemplates: WishlistTemplate[] = [
  {
    id: 'birthday-general',
    name: 'Birthday Wishlist',
    tagline: 'General birthday wishlist for gifts and experiences',
    icon: React.createElement(Cake, { className: 'w-4 h-4' }),
    defaults: {
      title: 'My Birthday Wishlist',
      type: 'birthday',
      description: 'Help me celebrate! Here are some things I would love.',
      visibility: 'public',
    },
  },
  {
    id: 'birthday-milestone',
    name: 'Milestone Birthday',
    tagline: 'For special milestone birthdays (30th, 40th, 50th, etc.)',
    icon: React.createElement(PartyPopper, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Milestone Birthday Celebration',
      type: 'birthday',
      description:
        'A special birthday deserves special gifts! Help me make this milestone memorable.',
      visibility: 'public',
    },
  },
  {
    id: 'birthday-kids',
    name: "Kid's Birthday",
    tagline: "Birthday wishlist for children's gifts",
    icon: React.createElement(Sparkles, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Birthday Wishlist',
      type: 'birthday',
      description: 'Gift ideas for the birthday celebration!',
      visibility: 'public',
    },
  },
];

// Wedding & Engagement
const weddingTemplates: WishlistTemplate[] = [
  {
    id: 'wedding-registry',
    name: 'Wedding Registry',
    tagline: 'Traditional wedding gift registry',
    icon: React.createElement(Heart, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Wedding Registry',
      type: 'wedding',
      description: 'Help us start our new life together! We appreciate your love and support.',
      visibility: 'public',
    },
  },
  {
    id: 'wedding-honeymoon',
    name: 'Honeymoon Fund',
    tagline: 'Crowdfund your honeymoon adventure',
    icon: React.createElement(Plane, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Honeymoon Fund',
      type: 'wedding',
      description: 'Instead of traditional gifts, help us create unforgettable honeymoon memories!',
      visibility: 'public',
    },
  },
  {
    id: 'wedding-house',
    name: 'New Home Fund',
    tagline: 'Save for your first home together',
    icon: React.createElement(Home, { className: 'w-4 h-4' }),
    defaults: {
      title: 'New Home Fund',
      type: 'wedding',
      description: 'Help us build our dream home! Every contribution brings us closer.',
      visibility: 'public',
    },
  },
  {
    id: 'engagement-celebration',
    name: 'Engagement Celebration',
    tagline: 'Wishlist for engagement party gifts',
    icon: React.createElement(Gem, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Engagement Wishlist',
      type: 'wedding',
      description: "We're engaged! Here are some things we'd love as we prepare for our big day.",
      visibility: 'public',
    },
  },
];

// Baby & Parenting
const babyTemplates: WishlistTemplate[] = [
  {
    id: 'baby-shower',
    name: 'Baby Shower',
    tagline: 'Registry for expecting parents',
    icon: React.createElement(Baby, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Baby Shower Registry',
      type: 'baby_shower',
      description: "We're expecting! Help us prepare for our new arrival.",
      visibility: 'public',
    },
  },
  {
    id: 'baby-essentials',
    name: 'Baby Essentials',
    tagline: 'Focus on practical baby necessities',
    icon: React.createElement(Baby, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Baby Essentials',
      type: 'baby_shower',
      description: 'Practical items we need for our growing family.',
      visibility: 'public',
    },
  },
  {
    id: 'adoption-fund',
    name: 'Adoption Fund',
    tagline: 'Support for adoption expenses',
    icon: React.createElement(HeartHandshake, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Adoption Journey Fund',
      type: 'baby_shower',
      description: "We're growing our family through adoption. Your support means the world to us.",
      visibility: 'public',
    },
  },
];

// Graduation & Education
const graduationTemplates: WishlistTemplate[] = [
  {
    id: 'graduation-gifts',
    name: 'Graduation Gifts',
    tagline: 'Celebrate academic achievements',
    icon: React.createElement(GraduationCap, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Graduation Wishlist',
      type: 'graduation',
      description: 'I did it! Help me start the next chapter of my life.',
      visibility: 'public',
    },
  },
  {
    id: 'college-fund',
    name: 'College Fund',
    tagline: 'Save for higher education',
    icon: React.createElement(BookOpen, { className: 'w-4 h-4' }),
    defaults: {
      title: 'College Fund',
      type: 'graduation',
      description: 'Investing in my future education. Every contribution helps!',
      visibility: 'public',
    },
  },
  {
    id: 'gap-year-travel',
    name: 'Gap Year Adventure',
    tagline: 'Fund travel and experiences before college',
    icon: React.createElement(Globe, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Gap Year Fund',
      type: 'graduation',
      description: 'Taking time to explore the world before the next chapter. Join my adventure!',
      visibility: 'public',
    },
  },
];

// Housewarming
const housewarmingTemplates: WishlistTemplate[] = [
  {
    id: 'housewarming-general',
    name: 'Housewarming',
    tagline: 'New home gift registry',
    icon: React.createElement(Home, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Housewarming Wishlist',
      type: 'housewarming',
      description: "We've moved! Help us make our new house a home.",
      visibility: 'public',
    },
  },
  {
    id: 'first-apartment',
    name: 'First Apartment',
    tagline: 'Essential items for first-time renters',
    icon: React.createElement(Key, { className: 'w-4 h-4' }),
    defaults: {
      title: 'First Apartment Essentials',
      type: 'housewarming',
      description: 'Moving into my first place! Help me get set up.',
      visibility: 'public',
    },
  },
  {
    id: 'home-renovation',
    name: 'Renovation Fund',
    tagline: 'Crowdfund home improvements',
    icon: React.createElement(Hammer, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Home Renovation Fund',
      type: 'housewarming',
      description: "We're renovating! Help us transform our space.",
      visibility: 'public',
    },
  },
];

// Charity & Giving Back
const charityTemplates: WishlistTemplate[] = [
  {
    id: 'charity-instead',
    name: 'Charity in Lieu of Gifts',
    tagline: 'Redirect gifts to charitable causes',
    icon: React.createElement(HandHeart, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Donate to Charity Instead',
      type: 'charity',
      description:
        'Instead of gifts for me, please consider donating to these causes I care about.',
      visibility: 'public',
    },
  },
  {
    id: 'community-cause',
    name: 'Community Cause',
    tagline: 'Support a local community initiative',
    icon: React.createElement(Handshake, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Community Support Fund',
      type: 'charity',
      description: 'Help me support our local community through these initiatives.',
      visibility: 'public',
    },
  },
  {
    id: 'disaster-relief',
    name: 'Disaster Relief',
    tagline: 'Emergency fundraising for those in need',
    icon: React.createElement(AlertCircle, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Emergency Relief Fund',
      type: 'charity',
      description: 'Urgent support needed. Every contribution helps those affected.',
      visibility: 'public',
    },
  },
];

// Travel & Experiences
const travelTemplates: WishlistTemplate[] = [
  {
    id: 'dream-vacation',
    name: 'Dream Vacation',
    tagline: 'Crowdfund your dream trip',
    icon: React.createElement(Palmtree, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Dream Vacation Fund',
      type: 'travel',
      description: "I'm saving for my dream trip! Help me make it happen.",
      visibility: 'public',
    },
  },
  {
    id: 'sabbatical-travel',
    name: 'Sabbatical Journey',
    tagline: 'Extended travel or career break',
    icon: React.createElement(Backpack, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Sabbatical Adventure',
      type: 'travel',
      description: 'Taking time off to explore and recharge. Join my journey!',
      visibility: 'public',
    },
  },
  {
    id: 'family-reunion',
    name: 'Family Reunion Trip',
    tagline: 'Fund a family gathering',
    icon: React.createElement(Users, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Family Reunion Fund',
      type: 'travel',
      description: 'Help us bring the family together for a special reunion.',
      visibility: 'public',
    },
  },
  {
    id: 'bucket-list',
    name: 'Bucket List Experience',
    tagline: 'Once-in-a-lifetime experiences',
    icon: React.createElement(Star, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Bucket List Fund',
      type: 'travel',
      description: 'Life is short! Help me check off these bucket list items.',
      visibility: 'public',
    },
  },
];

// Personal Goals
const personalTemplates: WishlistTemplate[] = [
  {
    id: 'personal-goals',
    name: 'Personal Goals',
    tagline: 'Support personal development and goals',
    icon: React.createElement(Target, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Personal Goals Fund',
      type: 'personal',
      description: "I'm working toward my goals. Your support helps me get there!",
      visibility: 'public',
    },
  },
  {
    id: 'creative-project',
    name: 'Creative Project',
    tagline: 'Fund art, music, or creative endeavors',
    icon: React.createElement(Palette, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Creative Project Fund',
      type: 'personal',
      description: 'Supporting my creative journey and artistic development.',
      visibility: 'public',
    },
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    tagline: 'Medical expenses or wellness goals',
    icon: React.createElement(Dumbbell, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Health & Wellness Fund',
      type: 'personal',
      description: 'Investing in my health and wellbeing. Thank you for your support.',
      visibility: 'unlisted',
    },
  },
  {
    id: 'equipment-upgrade',
    name: 'Equipment Upgrade',
    tagline: 'Upgrade tools or equipment for work/hobby',
    icon: React.createElement(Wrench, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Equipment Upgrade Fund',
      type: 'personal',
      description: 'Saving for better tools to pursue my passion.',
      visibility: 'public',
    },
  },
  {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    tagline: 'Build a financial safety net',
    icon: React.createElement(Siren, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Emergency Fund',
      type: 'personal',
      description: 'Building a safety net for unexpected situations.',
      visibility: 'unlisted',
    },
  },
];

// General Wishlists
const generalTemplates: WishlistTemplate[] = [
  {
    id: 'general-wishlist',
    name: 'General Wishlist',
    tagline: 'A simple wishlist for any occasion',
    icon: React.createElement(FileText, { className: 'w-4 h-4' }),
    defaults: {
      title: 'My Wishlist',
      type: 'general',
      description: 'Things I would love to have!',
      visibility: 'public',
    },
  },
  {
    id: 'holiday-wishlist',
    name: 'Holiday Wishlist',
    tagline: 'Gift ideas for the holiday season',
    icon: React.createElement(TreePine, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Holiday Wishlist',
      type: 'general',
      description: 'Gift ideas for the holiday season!',
      visibility: 'public',
    },
  },
  {
    id: 'private-list',
    name: 'Private Wishlist',
    tagline: 'A private list just for you',
    icon: React.createElement(Lock, { className: 'w-4 h-4' }),
    defaults: {
      title: 'Private Wishlist',
      type: 'general',
      description: 'My personal wishlist.',
      visibility: 'private',
    },
  },
];

// ==================== WISHLIST ITEM TEMPLATES ====================

export interface WishlistItemDefaults extends Partial<WishlistItemFormData> {
  title: string;
  description?: string;
  target_amount_sats: number;
  external_source?: string;
}

export interface WishlistItemTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaults: WishlistItemDefaults;
}

// Electronics & Tech
const electronicsItemTemplates: WishlistItemTemplate[] = [
  {
    id: 'item-laptop',
    name: 'Laptop',
    description: 'New laptop or computer',
    icon: '💻',
    defaults: {
      title: 'Laptop',
      description: 'A new laptop for work and productivity.',
      target_amount_sats: 50000000, // ~$500
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-phone',
    name: 'Smartphone',
    description: 'New smartphone',
    icon: '📱',
    defaults: {
      title: 'Smartphone',
      description: 'Upgrade to a new phone.',
      target_amount_sats: 40000000, // ~$400
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-tablet',
    name: 'Tablet',
    description: 'iPad or Android tablet',
    icon: '📲',
    defaults: {
      title: 'Tablet',
      description: 'A tablet for reading, drawing, and entertainment.',
      target_amount_sats: 30000000, // ~$300
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-headphones',
    name: 'Headphones',
    description: 'Quality headphones or earbuds',
    icon: '🎧',
    defaults: {
      title: 'Headphones',
      description: 'Quality headphones for music and calls.',
      target_amount_sats: 15000000, // ~$150
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-gaming-console',
    name: 'Gaming Console',
    description: 'PlayStation, Xbox, or Nintendo Switch',
    icon: '🎮',
    defaults: {
      title: 'Gaming Console',
      description: 'A gaming console for entertainment.',
      target_amount_sats: 35000000, // ~$350
      allow_partial_funding: true,
    },
  },
];

// Home & Kitchen
const homeItemTemplates: WishlistItemTemplate[] = [
  {
    id: 'item-coffee-machine',
    name: 'Coffee Machine',
    description: 'Quality espresso or coffee maker',
    icon: '☕',
    defaults: {
      title: 'Coffee Machine',
      description: 'A quality coffee machine for the perfect morning brew.',
      target_amount_sats: 20000000, // ~$200
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-kitchen-appliance',
    name: 'Kitchen Appliance',
    description: 'Blender, mixer, or other appliance',
    icon: '🍳',
    defaults: {
      title: 'Kitchen Appliance',
      description: 'A useful appliance for the kitchen.',
      target_amount_sats: 15000000, // ~$150
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-furniture',
    name: 'Furniture Piece',
    description: 'Sofa, bed, desk, or other furniture',
    icon: '🛋️',
    defaults: {
      title: 'Furniture',
      description: 'A quality piece of furniture for the home.',
      target_amount_sats: 50000000, // ~$500
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-bedding',
    name: 'Bedding Set',
    description: 'Quality sheets, pillows, or comforter',
    icon: '🛏️',
    defaults: {
      title: 'Bedding Set',
      description: 'Comfortable bedding for better sleep.',
      target_amount_sats: 15000000, // ~$150
      allow_partial_funding: true,
    },
  },
];

// Fashion & Accessories
const fashionItemTemplates: WishlistItemTemplate[] = [
  {
    id: 'item-watch',
    name: 'Watch',
    description: 'A quality timepiece',
    icon: '⌚',
    defaults: {
      title: 'Watch',
      description: 'A beautiful watch for everyday wear.',
      target_amount_sats: 30000000, // ~$300
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-jewelry',
    name: 'Jewelry',
    description: 'Ring, necklace, or other jewelry',
    icon: '💎',
    defaults: {
      title: 'Jewelry',
      description: 'A special piece of jewelry.',
      target_amount_sats: 25000000, // ~$250
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-designer-bag',
    name: 'Designer Bag',
    description: 'Quality handbag or backpack',
    icon: '👜',
    defaults: {
      title: 'Designer Bag',
      description: 'A quality bag that will last.',
      target_amount_sats: 40000000, // ~$400
      allow_partial_funding: true,
    },
  },
];

// Experiences
const experienceItemTemplates: WishlistItemTemplate[] = [
  {
    id: 'item-concert-tickets',
    name: 'Concert Tickets',
    description: 'Tickets to a live show',
    icon: '🎵',
    defaults: {
      title: 'Concert Tickets',
      description: 'Tickets to see my favorite artist live!',
      target_amount_sats: 15000000, // ~$150
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-spa-day',
    name: 'Spa Day',
    description: 'Relaxation and pampering',
    icon: '💆',
    defaults: {
      title: 'Spa Day',
      description: 'A day of relaxation and self-care.',
      target_amount_sats: 10000000, // ~$100
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-restaurant',
    name: 'Restaurant Experience',
    description: 'Fine dining experience',
    icon: '🍽️',
    defaults: {
      title: 'Restaurant Experience',
      description: 'A special dining experience.',
      target_amount_sats: 15000000, // ~$150
      allow_partial_funding: true,
    },
  },
  {
    id: 'item-class-course',
    name: 'Class or Course',
    description: 'Educational course or workshop',
    icon: '📖',
    defaults: {
      title: 'Course Enrollment',
      description: 'A class or course to learn something new.',
      target_amount_sats: 20000000, // ~$200
      allow_partial_funding: true,
    },
  },
];

// Subscriptions
const subscriptionItemTemplates: WishlistItemTemplate[] = [
  {
    id: 'item-streaming',
    name: 'Streaming Subscription',
    description: 'Netflix, Spotify, or similar',
    icon: '📺',
    defaults: {
      title: 'Streaming Subscription',
      description: '1 year of streaming service.',
      target_amount_sats: 12000000, // ~$120 annual
      allow_partial_funding: true,
      external_source: 'subscription',
    },
  },
  {
    id: 'item-software',
    name: 'Software Subscription',
    description: 'Creative Cloud, Office 365, etc.',
    icon: '🖥️',
    defaults: {
      title: 'Software Subscription',
      description: 'Annual software subscription for productivity.',
      target_amount_sats: 20000000, // ~$200 annual
      allow_partial_funding: true,
      external_source: 'subscription',
    },
  },
  {
    id: 'item-gym-membership',
    name: 'Gym Membership',
    description: 'Annual fitness membership',
    icon: '🏋️',
    defaults: {
      title: 'Gym Membership',
      description: 'Annual gym membership for fitness goals.',
      target_amount_sats: 30000000, // ~$300 annual
      allow_partial_funding: true,
      external_source: 'subscription',
    },
  },
];

// Big Purchases
const bigPurchaseItemTemplates: WishlistItemTemplate[] = [
  {
    id: 'item-car-fund',
    name: 'Car Fund',
    description: 'Contribution toward a vehicle',
    icon: '🚗',
    defaults: {
      title: 'Car Fund',
      description: 'Saving for a reliable vehicle.',
      target_amount_sats: 500000000, // ~$5000
      allow_partial_funding: true,
      external_source: 'vehicle',
    },
  },
  {
    id: 'item-house-down-payment',
    name: 'House Down Payment',
    description: 'Contribution toward home purchase',
    icon: '🏠',
    defaults: {
      title: 'House Down Payment',
      description: 'Saving for a home down payment.',
      target_amount_sats: 1000000000, // ~$10000
      allow_partial_funding: true,
      external_source: 'real_estate',
    },
  },
  {
    id: 'item-motorcycle',
    name: 'Motorcycle',
    description: 'Motorbike or scooter',
    icon: '🏍️',
    defaults: {
      title: 'Motorcycle',
      description: 'A motorcycle for commuting and adventure.',
      target_amount_sats: 300000000, // ~$3000
      allow_partial_funding: true,
      external_source: 'vehicle',
    },
  },
];

// External Items (not on platform)
const externalItemTemplates: WishlistItemTemplate[] = [
  {
    id: 'item-amazon',
    name: 'Amazon Item',
    description: 'Item from Amazon',
    icon: '📦',
    defaults: {
      title: 'Amazon Wishlist Item',
      description: 'An item from my Amazon wishlist.',
      target_amount_sats: 5000000, // ~$50
      allow_partial_funding: true,
      external_source: 'amazon',
    },
  },
  {
    id: 'item-etsy',
    name: 'Etsy Item',
    description: 'Handmade or vintage item from Etsy',
    icon: '🎨',
    defaults: {
      title: 'Etsy Item',
      description: 'A unique handmade item from Etsy.',
      target_amount_sats: 5000000, // ~$50
      allow_partial_funding: true,
      external_source: 'etsy',
    },
  },
  {
    id: 'item-custom-external',
    name: 'Custom External Item',
    description: 'Any item from any website',
    icon: '🔗',
    defaults: {
      title: 'External Item',
      description: 'An item from an external website.',
      target_amount_sats: 5000000, // ~$50
      allow_partial_funding: true,
      external_source: 'custom',
    },
  },
];

// ==================== EXPORTS ====================

// All wishlist templates organized by category
export const WISHLIST_TEMPLATE_CATEGORIES = {
  Birthday: birthdayTemplates,
  'Wedding & Engagement': weddingTemplates,
  'Baby & Parenting': babyTemplates,
  Graduation: graduationTemplates,
  Housewarming: housewarmingTemplates,
  Charity: charityTemplates,
  Travel: travelTemplates,
  Personal: personalTemplates,
  General: generalTemplates,
} as const;

// All item templates organized by category
export const WISHLIST_ITEM_TEMPLATE_CATEGORIES = {
  Electronics: electronicsItemTemplates,
  'Home & Kitchen': homeItemTemplates,
  Fashion: fashionItemTemplates,
  Experiences: experienceItemTemplates,
  Subscriptions: subscriptionItemTemplates,
  'Big Purchases': bigPurchaseItemTemplates,
  'External Items': externalItemTemplates,
} as const;

// Flat array of all wishlist templates
export const WISHLIST_TEMPLATES: WishlistTemplate[] = [
  ...birthdayTemplates,
  ...weddingTemplates,
  ...babyTemplates,
  ...graduationTemplates,
  ...housewarmingTemplates,
  ...charityTemplates,
  ...travelTemplates,
  ...personalTemplates,
  ...generalTemplates,
];

// Flat array of all item templates
export const WISHLIST_ITEM_TEMPLATES: WishlistItemTemplate[] = [
  ...electronicsItemTemplates,
  ...homeItemTemplates,
  ...fashionItemTemplates,
  ...experienceItemTemplates,
  ...subscriptionItemTemplates,
  ...bigPurchaseItemTemplates,
  ...externalItemTemplates,
];

// Category type exports
export type WishlistTemplateCategory = keyof typeof WISHLIST_TEMPLATE_CATEGORIES;
export type WishlistItemTemplateCategory = keyof typeof WISHLIST_ITEM_TEMPLATE_CATEGORIES;
