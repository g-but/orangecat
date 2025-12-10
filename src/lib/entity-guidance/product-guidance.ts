/**
 * Product Field Guidance Content
 *
 * Single source of truth for product creation guidance.
 * Used by DynamicSidebar to provide contextual help.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 * Last Modified Summary: Initial product guidance content
 */

import React from 'react';
import {
  Package,
  FileText,
  DollarSign,
  Tag,
  Layers,
  Truck,
  Image,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import type { GuidanceContent, DefaultGuidance } from '@/components/create/types';

export type ProductFieldType =
  | 'title'
  | 'description'
  | 'category'
  | 'product_type'
  | 'price_sats'
  | 'currency'
  | 'inventory_count'
  | 'fulfillment_type'
  | 'images'
  | 'tags'
  | null;

export const productGuidanceContent: Record<NonNullable<ProductFieldType>, GuidanceContent> = {
  title: {
    icon: React.createElement(Package, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Product Title',
    description:
      'The title is the first thing buyers see. Make it clear, descriptive, and searchable.',
    tips: [
      'Be specific about what you\'re selling',
      'Include key details (size, color, material)',
      'Keep it under 60 characters for best display',
      'Use words buyers would search for',
      'Avoid ALL CAPS or excessive punctuation',
    ],
    examples: [
      'Handmade Ceramic Coffee Mug - 12oz Blue',
      'Bitcoin Hardware Wallet Carry Case',
      'Organic Swiss Honey - 500g Jar',
    ],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Product Description',
    description:
      'Tell the story of your product. Help buyers understand exactly what they\'re getting.',
    tips: [
      'Start with the most important features',
      'Include dimensions, materials, and specifications',
      'Explain how it\'s made or sourced',
      'Mention what makes it unique or special',
      'Add care instructions if relevant',
    ],
    examples: [
      'This handmade ceramic mug is crafted in my Zurich studio using locally-sourced clay...',
      'Premium leather case designed specifically for hardware wallets. Features...',
    ],
  },
  category: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Category',
    description:
      'Categories help buyers find your product. Choose the most accurate category.',
    tips: [
      'Pick the category that best describes your product',
      'If unsure, think about where buyers would look',
      'You can add tags for additional discoverability',
      'Common categories: Handmade, Digital, Food, Electronics',
    ],
    examples: ['Handmade', 'Digital Products', 'Food & Drinks', 'Electronics'],
  },
  product_type: {
    icon: React.createElement(Layers, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Product Type',
    description:
      'This determines how your product is delivered and what information buyers need.',
    tips: [
      'Physical: Ships to buyer\'s address',
      'Digital: Delivered electronically (files, links)',
      'Service: Work you perform for the buyer',
      'This affects shipping and fulfillment options',
    ],
    examples: [
      'Physical: Clothing, accessories, handmade goods',
      'Digital: E-books, templates, software',
      'Service: Consulting, design work',
    ],
  },
  price_sats: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Price in Satoshis',
    description:
      'Set your price in satoshis (sats). 1 Bitcoin = 100,000,000 sats.',
    tips: [
      'Research similar products to price competitively',
      'Consider your costs, time, and materials',
      'Factor in shipping if you\'re covering it',
      '1000 sats ≈ $1 USD at ~$100k BTC',
      'You can adjust prices anytime',
    ],
    examples: [
      '50,000 sats (~$50) for handmade items',
      '10,000 sats (~$10) for digital products',
      '500,000 sats (~$500) for premium items',
    ],
  },
  currency: {
    icon: React.createElement(DollarSign, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Display Currency',
    description:
      'Choose how to display your price. All payments are in Bitcoin, but you can show equivalent fiat.',
    tips: [
      'SATS is the Bitcoin standard (recommended)',
      'BTC shows whole bitcoin amounts',
      'Price is always paid in Bitcoin',
    ],
    examples: ['50,000 SATS', '0.0005 BTC'],
  },
  inventory_count: {
    icon: React.createElement(BarChart3, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Inventory Count',
    description:
      'Track how many items you have available. Set to -1 for unlimited stock.',
    tips: [
      'Set accurate counts to avoid overselling',
      'Use -1 for digital products or unlimited stock',
      'Inventory updates automatically when sold',
      'You\'ll be notified when stock is low',
    ],
    examples: [
      '10 - Limited edition items',
      '-1 - Unlimited (digital products)',
      '50 - Standard inventory',
    ],
  },
  fulfillment_type: {
    icon: React.createElement(Truck, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Fulfillment Type',
    description:
      'How orders will be fulfilled after payment.',
    tips: [
      'Manual: You handle shipping/delivery yourself',
      'Automatic: System delivers digital files instantly',
      'Digital: Files are sent immediately after payment',
      'Choose based on your product type',
    ],
    examples: [
      'Manual - Physical products you ship',
      'Automatic - Digital files with instant delivery',
      'Digital - E-books, templates, courses',
    ],
  },
  images: {
    icon: React.createElement(Image, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Product Images',
    description:
      'High-quality images significantly increase sales. Show your product from multiple angles.',
    tips: [
      'Use well-lit, high-resolution photos',
      'Show the product from multiple angles',
      'Include scale reference (hand, ruler)',
      'First image is your main thumbnail',
      'Maximum 5 images recommended',
    ],
    examples: [
      'Front view, back view, detail shot',
      'Product in use or context',
      'Packaging and contents',
    ],
  },
  tags: {
    icon: React.createElement(Tag, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Tags',
    description:
      'Tags help buyers discover your product through search.',
    tips: [
      'Add relevant keywords buyers might search',
      'Include material, style, use case',
      'Use 3-5 focused tags',
      'Don\'t repeat category in tags',
    ],
    examples: [
      'handmade, ceramic, coffee, gift',
      'bitcoin, hardware wallet, security',
      'organic, local, swiss, honey',
    ],
  },
};

export const productDefaultGuidance: DefaultGuidance = {
  title: 'What is a Product?',
  description:
    'Products are items you sell on your personal marketplace. Physical goods, digital downloads, or services - all paid in Bitcoin.',
  features: [
    {
      icon: React.createElement(Package, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Sell physical or digital products',
    },
    {
      icon: React.createElement(DollarSign, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Get paid instantly in Bitcoin',
    },
    {
      icon: React.createElement(CheckCircle2, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Manage inventory and fulfillment',
    },
  ],
  hint: '💡 Click on any field to get specific guidance',
};



















