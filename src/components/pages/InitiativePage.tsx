'use client';

import { ArrowRight, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Initiative, getIconComponent } from '@/data/initiatives';

// Reusable components
import PageHeader from '@/components/pages/PageHeader';
import ValuePropositionCard from '@/components/pages/ValuePropositionCard';
import FeaturesGrid from '@/components/pages/FeaturesGrid';
import TypesGrid from '@/components/pages/TypesGrid';
import CapabilitiesList from '@/components/pages/CapabilitiesList';
import MarketToolsSection from '@/components/pages/MarketToolsSection';
import UniquePropositionSection from '@/components/pages/UniquePropositionSection';
import CallToActionCard from '@/components/pages/CallToActionCard';
import Button from '@/components/ui/Button';

interface InitiativePageProps {
  initiative: Initiative;
}

export default function InitiativePage({ initiative }: InitiativePageProps) {
  const { user, hydrated } = useAuth();

  // Show loading state while checking auth
  if (!hydrated) {
    return (
      <div className="max-w-6xl mx-auto space-y-12 animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const isAvailable = initiative.status === 'available';
  const IconComponent = getIconComponent(initiative.icon);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Personalized Header for Authenticated Users */}
      {user ? (
        <div
          className={`bg-gradient-to-r from-${initiative.color.bg} to-${initiative.color.bg}/50 border border-${initiative.color.border} rounded-xl p-6 mb-8`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your {initiative.name}</h2>
              <p className="text-gray-600">
                {isAvailable
                  ? `You haven't created any ${initiative.name.toLowerCase()} yet.`
                  : `${initiative.name} is coming ${initiative.timeline || 'soon'}. You're not a member of any ${initiative.name.toLowerCase()} yet.`}
              </p>
            </div>
            <div className="flex gap-3">
              {isAvailable ? (
                <Link href={initiative.routes.create || initiative.routes.landing}>
                  <Button
                    className={`bg-${initiative.color.primary} hover:bg-${initiative.color.primary}/90 text-white`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create {initiative.name.slice(0, -1)}
                  </Button>
                </Link>
              ) : (
                <Link href={initiative.routes.comingSoon}>
                  <Button
                    variant="outline"
                    className={`border-${initiative.color.border} hover:border-${initiative.color.primary}`}
                  >
                    Coming Soon
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Generic Header for Non-Authenticated Users */
        <div className="text-center py-12">
          <div
            className={`bg-gradient-to-r from-${initiative.color.bg} to-${initiative.color.bg}/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            <IconComponent className={`w-10 h-10 text-${initiative.color.text}`} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{initiative.name}</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">{initiative.description}</p>
          <div className="flex gap-4 justify-center">
            {isAvailable ? (
              <Link href={initiative.routes.create || '/auth'}>
                <Button
                  className={`bg-${initiative.color.primary} hover:bg-${initiative.color.primary}/90 text-white`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button
                  className={`bg-${initiative.color.primary} hover:bg-${initiative.color.primary}/90 text-white`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            )}
            <Link href={initiative.routes.comingSoon}>
              <Button variant="outline">Learn More</Button>
            </Link>
            {initiative.routes.demo && (
              <Link href={initiative.routes.demo}>
                <Button variant="outline">View Demo</Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <PageHeader
        icon={getIconComponent(initiative.icon)}
        iconColors={`bg-gradient-to-r from-${initiative.color.bg} to-${initiative.color.bg}/50`}
        title={initiative.name}
        description={initiative.description}
      />

      <ValuePropositionCard
        title={`${initiative.name} Reimagined`}
        description={`Traditional ${initiative.name.toLowerCase()} platforms have limitations. Our Bitcoin-native ${initiative.name.toLowerCase()} platform provides powerful tools with complete transparency and decentralized control.`}
        bulletPoints={[
          {
            text: 'Low fees with Bitcoin and Lightning Network',
            color: `bg-${initiative.color.primary}`,
          },
          {
            text: 'Global reach with instant settlements',
            color: `bg-${initiative.color.primary}`,
          },
          {
            text: 'Complete transparency and user control',
            color: `bg-${initiative.color.primary}`,
          },
          { text: 'Community-driven governance', color: `bg-${initiative.color.primary}` },
        ]}
        cardTitle={`Your ${initiative.name.slice(0, -1)}`}
        cardIcon={getIconComponent(initiative.icon)}
        cardIconColors={`bg-${initiative.color.bg} text-${initiative.color.text}`}
        demoFields={[
          { label: 'Status', value: isAvailable ? 'Available' : 'Coming Soon' },
          { label: 'Timeline', value: initiative.timeline || 'TBD' },
          { label: 'Features', value: initiative.capabilities.length.toString() },
        ]}
        statusIndicator={{
          icon: TrendingUp,
          text: isAvailable ? 'Ready to use' : `Coming ${initiative.timeline || 'soon'}`,
          colors: `bg-${initiative.color.bg} text-${initiative.color.text}`,
        }}
      />

      {initiative.features.length > 0 && (
        <FeaturesGrid
          title={`${initiative.name} Features`}
          subtitle={`Everything you need for ${initiative.name.toLowerCase()}`}
          features={initiative.features.map(feature => ({
            ...feature,
            icon: getIconComponent(feature.icon),
          }))}
        />
      )}

      {initiative.types.length > 0 && (
        <TypesGrid
          title={`Types of ${initiative.name}`}
          subtitle={`From simple to complex ${initiative.name.toLowerCase()}`}
          types={initiative.types.map(type => ({
            ...type,
            icon: getIconComponent(type.icon),
          }))}
        />
      )}

      <CapabilitiesList
        title={`${initiative.name} Capabilities`}
        description={`Complete ${initiative.name.toLowerCase()} management with Bitcoin-native tools`}
        capabilities={initiative.capabilities}
        accentColor={initiative.color.primary.split('-')[0]}
      />

      {initiative.marketTools.length > 0 && (
        <MarketToolsSection
          title={`Current ${initiative.name} Tools`}
          description={`Compare our Bitcoin-native ${initiative.name.toLowerCase()} platform with existing solutions in the market.`}
          tools={initiative.marketTools.map(tool => ({
            ...tool,
            icon: getIconComponent(tool.icon),
          }))}
          footerMessage={`Building on the foundation of these great tools with Bitcoin integration and decentralized features! 🚀`}
        />
      )}

      <UniquePropositionSection
        title="Our Unique DNA"
        subtitle={`While others handle ${initiative.name.toLowerCase()}, we're pioneering the future with three core pillars`}
        bitcoinTitle="Bitcoin-Native"
        bitcoinDescription={`True Bitcoin integration for ${initiative.name.toLowerCase()}. Lightning Network payments, global accessibility, and sound money principles built into every feature.`}
        aiTitle="AI-Powered"
        aiDescription={`Intelligent ${initiative.name.toLowerCase()} optimization, smart recommendations, automated insights, and AI-driven features to enhance your experience.`}
        openSourceTitle="Open Source"
        openSourceDescription={`Transparent ${initiative.name.toLowerCase()} with community governance. Audit our code, contribute features, and help build the future together.`}
      />

      <CallToActionCard
        title={
          isAvailable ? `Start Your ${initiative.name} Journey` : `Get Ready for ${initiative.name}`
        }
        description={
          isAvailable
            ? `Join the Bitcoin-native ${initiative.name.toLowerCase()} platform and experience the future of decentralized coordination.`
            : `Be among the first to access our ${initiative.name.toLowerCase()} platform when it launches ${initiative.timeline || 'soon'}.`
        }
        primaryButtonText={isAvailable ? 'Get Started' : 'Join Waitlist'}
        primaryButtonIcon={getIconComponent(initiative.icon)}
        gradientColors={`bg-gradient-to-r ${initiative.color.gradient}`}
        textColors={`text-${initiative.color.text.replace(initiative.color.primary.split('-')[0], 'white')}`}
        buttonColors={`bg-white text-${initiative.color.primary} hover:bg-gray-100`}
      />
    </div>
  );
}
