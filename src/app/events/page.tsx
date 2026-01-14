'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout';
import {
  Calendar,
  Bitcoin,
  Zap,
  Users,
  Globe,
  ArrowRight,
  Check,
  BarChart3,
  Heart,
  Ticket,
  QrCode,
  Camera,
  PartyPopper,
  Palette,
  Tent,
  Music,
} from 'lucide-react';

export default function EventsPage() {
  const router = useRouter();
  const { user, session } = useAuth();

  const features = [
    {
      icon: Ticket,
      title: 'Bitcoin Ticketing',
      description:
        'Sell tickets with Bitcoin, accept instant payments, and eliminate payment processing fees',
    },
    {
      icon: QrCode,
      title: 'Smart Check-in',
      description:
        'QR code entry system with real-time attendance tracking and automated verification',
    },
    {
      icon: Users,
      title: 'RSVP Management',
      description:
        'Track responses, manage capacity limits, and send automated updates to attendees',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Connect with attendees worldwide through Bitcoin-powered event discovery',
    },
    {
      icon: Camera,
      title: 'Event Media',
      description:
        'Share photos, live updates, and create lasting memories with integrated media tools',
    },
    {
      icon: BarChart3,
      title: 'Event Analytics',
      description: 'Track attendance, engagement, and revenue with comprehensive event insights',
    },
  ];

  const eventTypes = [
    {
      category: 'Social Events',
      icon: PartyPopper,
      examples: [
        'Birthday Parties',
        'Anniversary Celebrations',
        'Graduation Parties',
        'Holiday Gatherings',
      ],
      color: 'bg-pink-100 text-pink-700',
    },
    {
      category: 'Art & Culture',
      icon: Palette,
      examples: ['Art Exhibits', 'Gallery Openings', 'Photography Shows', 'Cultural Festivals'],
      color: 'bg-purple-100 text-purple-700',
    },
    {
      category: 'Adventure & Travel',
      icon: Tent,
      examples: [
        'Weekend Getaways',
        'Group Hiking Trips',
        'Camping Adventures',
        'City Explorations',
      ],
      color: 'bg-green-100 text-green-700',
    },
    {
      category: 'Community & Business',
      icon: Music,
      examples: ['Local Festivals', 'Professional Meetups', 'Workshops', 'Networking Events'],
      color: 'bg-blue-100 text-blue-700',
    },
  ];

  const benefits = [
    'Zero ticket processing fees - keep 100% of revenue',
    'Instant Bitcoin payments directly to your wallet',
    'Global attendee reach with no geographic barriers',
    'Automated check-in and attendance management',
    'Integrated event promotion and social sharing',
    'Real-time analytics and performance tracking',
    'Flexible pricing with Bitcoin and fiat options',
    'Professional event pages with customization',
  ];

  const handleGetStarted = () => {
    if (session) {
      router.push('/events/create');
    } else {
      router.push('/auth?mode=login&redirect=/events/create');
    }
  };

  const handleViewDemo = () => {
    router.push('/demo/events');
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Event Organization with Bitcoin"
        description="Create unforgettable parties, art exhibits, and gatherings with seamless ticketing and Bitcoin-powered event management"
      />

      {/* Key Features */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Bitcoin for Events?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <feature.icon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Event Types */}
      <PageSection background="tiffany">
        <h2 className="text-3xl font-bold text-center mb-12">What Events Can You Organize?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {eventTypes.map((type, index) => (
            <Card key={index} className="p-6">
              <type.icon className={`w-12 h-12 mx-auto mb-4 ${type.color}`} />
              <h3 className="text-lg font-semibold mb-4 text-center">{type.category}</h3>
              <ul className="text-gray-600 space-y-2">
                {type.examples.map((example, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                    {example}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Benefits Section */}
      <PageSection>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Why Event Organizers Choose OrangeCat</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <Bitcoin className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">0%</div>
              <div className="text-sm text-gray-600">Processing Fees</div>
            </Card>
            <Card className="p-6 text-center">
              <Zap className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">&lt; 2min</div>
              <div className="text-sm text-gray-600">Ticket Setup</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Global</div>
              <div className="text-sm text-gray-600">Attendee Reach</div>
            </Card>
            <Card className="p-6 text-center">
              <QrCode className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Instant</div>
              <div className="text-sm text-gray-600">Check-in</div>
            </Card>
          </div>
        </div>
      </PageSection>

      {/* How It Works */}
      <PageSection background="gray">
        <h2 className="text-3xl font-bold text-center mb-12">How Event Organization Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Your Event</h3>
            <p className="text-gray-600">
              Set up your event details, ticket pricing, and Bitcoin payment address
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Promote & Sell</h3>
            <p className="text-gray-600">
              Share your event and sell tickets with instant Bitcoin payments
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Manage Attendees</h3>
            <p className="text-gray-600">
              Track RSVPs, send updates, and manage your attendee list
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">4</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Run the Event</h3>
            <p className="text-gray-600">
              Use QR check-in, track attendance, and create memorable experiences
            </p>
          </div>
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Organize Your Event?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join event organizers worldwide who have created amazing experiences with
            Bitcoin-powered event management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Create Your Event
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={handleViewDemo} variant="outline" size="lg">
              View Interactive Demo
            </Button>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
}



