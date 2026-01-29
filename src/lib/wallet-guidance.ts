/**
 * Wallet Field Guidance Content
 *
 * Single source of truth for wallet creation & editing guidance.
 * Used by DynamicSidebar to provide contextual help on wallet-related pages.
 *
 * created_date: 2025-11-28
 * last_modified_date: 2025-11-28
 * last_modified_summary: Initial wallet guidance content for DynamicSidebar
 */

import React from 'react';
import {
  Wallet,
  Target,
  FileText,
  KeyRound,
  Shield,
  Coins,
  PiggyBank,
  RefreshCcw,
} from 'lucide-react';
import type { FieldGuidanceContent, DefaultContent } from '@/lib/project-guidance';

export type WalletFieldType =
  | 'category'
  | 'label'
  | 'description'
  | 'addressOrXpub'
  | 'goalAmount'
  | 'goalCurrency'
  | null;

export const walletGuidanceContent: Record<NonNullable<WalletFieldType>, FieldGuidanceContent> = {
  category: {
    icon: React.createElement(Wallet, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Wallet Category',
    description:
      'The category tells supporters what this wallet is for – rent, food, emergencies, projects, and more.',
    tips: [
      'Pick the category that best matches how you will actually use these funds',
      'Use "Rent & Housing" for regular rent or housing costs',
      'Use "General" if this wallet does not have a very specific purpose',
      'You can create multiple wallets for different needs instead of mixing everything into one',
    ],
    examples: [
      'Rent & Housing – monthly apartment rent',
      'Food & Groceries – day to day meals',
      'Emergency Fund – unexpected medical or family emergencies',
    ],
  },
  label: {
    icon: React.createElement(Target, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Wallet Name',
    description:
      'The wallet name is how you and your supporters recognise this wallet. Think of it as the title of a funding bucket.',
    tips: [
      'Make it short, clear, and human – not technical',
      'Include the purpose and, if helpful, how often (e.g. "Monthly Rent – 1200 CHF")',
      'Avoid generic names like "Wallet 1" that do not explain anything',
    ],
    examples: ['Rent – Winter 2025', 'Food & Groceries', 'Medical Bills – Maria'],
  },
  description: {
    icon: React.createElement(FileText, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Description',
    description:
      'Use the description to briefly explain what this wallet is for and why you are collecting funds here.',
    tips: [
      'Explain what problem this wallet helps you solve',
      'Share how often this cost appears (one‑time vs every month)',
      'Keep it friendly and honest – 1–3 short sentences are enough',
    ],
    examples: [
      'This wallet is for my monthly rent so I do not fall behind during studies.',
      'Food and basic groceries while I am between jobs.',
      'Emergency medical costs for ongoing treatment.',
    ],
  },
  addressOrXpub: {
    icon: React.createElement(KeyRound, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Bitcoin Address or Extended Public Key',
    description:
      'This is where the Bitcoin actually goes. We recommend using an extended public key (xpub/ypub/zpub) for automatic tracking of all addresses and transactions.',
    tips: [
      'Always paste from your wallet app – never type it manually',
      'Extended public keys (xpub/ypub/zpub) automatically track all addresses your wallet generates',
      'Bitcoin wallets create new addresses after each transaction – xpub tracks them all',
      'Single addresses work but only track that one address, missing change addresses',
      'Never paste your recovery seed here – only public addresses or public keys',
    ],
    examples: [
      'zpub6qgZc... (recommended – tracks all addresses)',
      'bc1qxy2kg... (single address – simpler but limited)',
    ],
  },
  goalAmount: {
    icon: React.createElement(PiggyBank, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Funding Goal (optional)',
    description:
      'The funding goal shows what you are aiming for with this wallet – for example one month of rent or a specific medical bill.',
    tips: [
      'You can leave this empty if you do not want to show a target',
      'If you add a goal, make it realistic and connected to real costs',
      'Supporters understand you better when they see what “fully funded” means',
    ],
    examples: ['1200 CHF for one month of rent', '400 CHF for winter heating costs'],
  },
  goalCurrency: {
    icon: React.createElement(Coins, { className: 'w-5 h-5 text-orange-600' }),
    title: 'Goal Currency',
    description:
      'The currency is only for display – all funding still arrives in Bitcoin, but you can explain your goal in CHF, EUR, USD, BTC, or SATS.',
    tips: [
      'Use CHF if your real‑world costs are in Switzerland',
      'Use EUR or USD if that better matches your situation',
      'BTC or SATS are useful if you think mainly in Bitcoin',
    ],
    examples: ['1200 CHF rent', '0.01 BTC savings goal', '250 EUR monthly groceries'],
  },
};

export const walletDefaultContent: DefaultContent = {
  title: 'What is a Wallet on OrangeCat?',
  description:
    'A wallet on OrangeCat is a funding bucket connected to your own Bitcoin wallet. Each wallet can represent a concrete need such as rent, food, or a savings goal.',
  features: [
    {
      icon: React.createElement(Wallet, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Connect addresses or xpubs from wallets you control',
    },
    {
      icon: React.createElement(PiggyBank, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Create separate wallets for rent, food, emergencies, and projects',
    },
    {
      icon: React.createElement(Shield, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Non‑custodial by design – you always stay in control of your funds',
    },
    {
      icon: React.createElement(RefreshCcw, { className: 'w-4 h-4 text-orange-600' }),
      text: 'Update goals and categories over time as your situation changes',
    },
  ],
  hint: '💡 Click into a field on the left to see focused guidance here.',
};
