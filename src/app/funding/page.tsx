'use client';

import {
  Coins,
  Target,
  Heart,
  Users,
  Zap,
  GitBranch,
  TrendingUp,
  Globe,
  Award,
  Lightbulb,
  Handshake,
  Rocket,
} from 'lucide-react';

// Reusable components
import PageHeader from '@/components/pages/PageHeader';
import ValuePropositionCard from '@/components/pages/ValuePropositionCard';
import FeaturesGrid from '@/components/pages/FeaturesGrid';
import TypesGrid from '@/components/pages/TypesGrid';
import CapabilitiesList from '@/components/pages/CapabilitiesList';
import MarketToolsSection from '@/components/pages/MarketToolsSection';
import UniquePropositionSection from '@/components/pages/UniquePropositionSection';
import CallToActionCard from '@/components/pages/CallToActionCard';

// Data
import {
  fundingTools,
  getRegionalToolsTitle,
  getRegionalToolsDescription,
} from '@/data/marketTools';

const features = [
  {
    icon: Target,
    title: 'Project Funding',
    description:
      'Raise Bitcoin for creative projects, startups, and innovative ideas with global reach.',
    color: 'text-green-600 bg-green-100',
  },
  {
    icon: Heart,
    title: 'Donation Projects',
    description: 'Create fundraising projects for causes, charities, and community initiatives.',
    color: 'text-red-600 bg-red-100',
  },
  {
    icon: Users,
    title: 'Recurring Support',
    description: 'Build sustainable funding through recurring Bitcoin donations and subscriptions.',
    color: 'text-purple-600 bg-purple-100',
  },
  {
    icon: Globe,
    title: 'Global Accessibility',
    description: 'Accept funding from supporters worldwide without traditional banking barriers.',
    color: 'text-blue-600 bg-blue-100',
  },
  {
    icon: Zap,
    title: 'Instant Payments',
    description: 'Receive Bitcoin donations instantly with Lightning Network integration.',
    color: 'text-yellow-600 bg-yellow-100',
  },
  {
    icon: TrendingUp,
    title: 'Transparent Analytics',
    description: 'Track funding progress, donor engagement, and project performance in real-time.',
    color: 'text-teal-600 bg-teal-100',
  },
];

const fundingTypes = [
  {
    name: 'Creative Projects',
    icon: Lightbulb,
    description: 'Art, music, writing, and creative endeavors',
    example: 'Documentary film, music album',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    name: 'Tech Startups',
    icon: Rocket,
    description: 'Early-stage technology ventures',
    example: 'Bitcoin app, fintech startup',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    name: 'Open Source',
    icon: GitBranch,
    description: 'Community-driven software development',
    example: 'Bitcoin tools, developer libraries',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  {
    name: 'Social Causes',
    icon: Heart,
    description: 'Charitable initiatives and community support',
    example: 'Education program, disaster relief',
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    name: 'Content Creation',
    icon: Award,
    description: 'Ongoing content and educational material',
    example: 'Podcast, educational courses',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    name: 'Community Projects',
    icon: Handshake,
    description: 'Local initiatives and community building',
    example: 'Maker space, community garden',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
];

const capabilities = [
  'Customizable funding project pages',
  'Bitcoin and Lightning Network payments',
  'Recurring donation subscriptions',
  'Goal tracking and milestone rewards',
  'Donor management and communication',
  'Social sharing and promotion tools',
  'Real-time analytics and reporting',
  'Multi-currency display (BTC/CHF)',
  'Global accessibility without barriers',
  'Transparent fund distribution',
];

export default function FundingPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <PageHeader
        icon={Coins}
        iconColors="bg-gradient-to-r from-green-100 to-emerald-100"
        title="Funding"
        description="Raise Bitcoin for your projects, causes, and creative endeavors with global reach and zero traditional banking barriers."
      />

      <ValuePropositionCard
        title="Fund Anything, From Anywhere"
        description="Whether you're launching a startup, creating art, or supporting a cause, our Bitcoin-native funding platform connects you with supporters worldwide. No payment processors, no geographic restrictions, just pure peer-to-peer funding."
        bulletPoints={[
          { text: 'Zero payment processor fees with Bitcoin', color: 'bg-green-500' },
          { text: 'Global funding without banking barriers', color: 'bg-green-500' },
          { text: 'Instant payments via Lightning Network', color: 'bg-green-500' },
          { text: 'Transparent and accountable fund management', color: 'bg-green-500' },
        ]}
        cardTitle="Your Funding Campaign"
        cardIcon={Coins}
        cardIconColors="bg-green-100 text-green-600"
        demoFields={[
          { label: 'Funding Goal', value: 50000, type: 'bitcoin' },
          { label: 'Raised So Far', value: 32500, type: 'bitcoin' },
          { label: 'Supporters', value: '127' },
        ]}
        statusIndicator={{
          icon: TrendingUp,
          text: '65% funded',
          colors: 'bg-green-50 text-green-700',
        }}
      />

      <FeaturesGrid
        title="Funding Platform Features"
        subtitle="Everything you need to run successful funding projects"
        features={features}
      />

      <TypesGrid
        title="Any Type of Funding"
        subtitle="From creative projects to tech startups, social causes to open source"
        types={fundingTypes}
      />

      <CapabilitiesList
        title="Complete Funding Suite"
        description="Bitcoin-native fundraising with global reach and transparent operations"
        capabilities={capabilities}
        accentColor="green"
      />

      <MarketToolsSection
        title={getRegionalToolsTitle('funding')}
        description={getRegionalToolsDescription('funding')}
        tools={fundingTools}
        footerMessage="Huge respect to these funding pioneers! We're building on their foundation with native Bitcoin integration, Lightning payments, and true global accessibility 🚀"
      />

      <UniquePropositionSection
        title="Our Unique DNA"
        subtitle="While others facilitate funding, we're pioneering the future of decentralized fundraising"
        bitcoinTitle="Bitcoin-Native"
        bitcoinDescription="True Bitcoin integration from the ground up. Lightning Network for instant micropayments, global accessibility without traditional banking, and sound money for sustainable funding."
        aiTitle="AI-Powered"
        aiDescription="Smart project optimization, intelligent donor matching, automated progress tracking, and AI-driven insights to maximize funding success and engagement."
        openSourceTitle="Open Source"
        openSourceDescription="Transparent fundraising with community governance. Audit our algorithms, contribute features, and help build the future of decentralized peer-to-peer funding."
      />

      <CallToActionCard
        title="Ready to Fund Your Dream?"
        description="Start your funding project today and connect with Bitcoin supporters worldwide who believe in your vision and want to help make it reality."
        primaryButtonText="Start Funding Campaign"
        primaryButtonIcon={Coins}
        gradientColors="bg-gradient-to-r from-green-600 to-emerald-600"
        textColors="text-green-100"
        buttonColors="bg-white text-green-700 hover:bg-gray-100"
      />
    </div>
  );
}
