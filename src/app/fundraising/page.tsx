'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { 
  Handshake, 
  Bitcoin, 
  Zap, 
  Users, 
  Globe, 
  ArrowRight, 
  Check, 
  BarChart3,
  Heart,
  Target,
  Shield,
  TrendingUp
} from 'lucide-react'

export default function FundraisingPage() {
  const router = useRouter()
  const { user, session } = useAuth()

  const features = [
    {
      icon: Bitcoin,
      title: 'Bitcoin-Native',
      description: 'Accept Bitcoin donations directly to your wallet with no intermediaries or platform fees'
    },
    {
      icon: Zap,
      title: 'Instant Setup',
      description: 'Create your fundraising page in minutes and start receiving donations immediately'
    },
    {
      icon: Users,
      title: 'Global Reach',
      description: 'Connect with Bitcoin supporters worldwide who want to fund your projects'
    },
    {
      icon: Globe,
      title: 'No Limits',
      description: 'Fund any project, from creative works to business ventures, with no restrictions'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track your project performance with detailed insights and donor analytics'
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'All transactions are recorded on the Bitcoin blockchain for complete transparency'
    }
  ]

  const useCases = [
    {
      category: 'Creative Projects',
      examples: ['Art and Music', 'Writing and Books', 'Video Content', 'Podcasts']
    },
    {
      category: 'Business Ventures',
      examples: ['Startups', 'Product Development', 'Research', 'Innovation']
    },
    {
      category: 'Personal Goals',
      examples: ['Education', 'Travel', 'Community Projects', 'Personal Development']
    },
    {
      category: 'Charitable Causes',
      examples: ['Non-profit Organizations', 'Emergency Relief', 'Community Support', 'Social Impact']
    }
  ]

  const benefits = [
    'No platform fees - keep 100% of your donations',
    'Instant Bitcoin payments to your wallet',
    'Global accessibility with no geographic restrictions',
    'Transparent blockchain-based transactions',
    'Professional project pages with customization',
    'Built-in analytics and reporting tools'
  ]

  const handleGetStarted = () => {
    if (session) {
      router.push('/projects/create')
    } else {
      router.push('/auth?mode=login&redirect=/projects/create')
    }
  }

  const handleViewExamples = () => {
    router.push('/browse')
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Fundraising with Bitcoin"
        description="Create powerful fundraising projects and accept Bitcoin donations for any cause, project, or dream"
      />

      {/* Key Features */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Bitcoin Fundraising?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <feature.icon className="w-12 h-12 text-tiffany-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Use Cases */}
      <PageSection background="tiffany">
        <h2 className="text-3xl font-bold text-center mb-12">What Can You Fund?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <Card key={index} className="p-6">
              <h3 className="text-lg font-semibold mb-4">{useCase.category}</h3>
              <ul className="text-gray-600 space-y-2">
                {useCase.examples.map((example, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="w-4 h-4 text-tiffany-500 mr-2 flex-shrink-0" />
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
            <h2 className="text-3xl font-bold mb-6">Why Fundraisers Choose OrangeCat</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-tiffany-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-tiffany-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </Card>
            <Card className="p-6 text-center">
              <Bitcoin className="w-8 h-8 text-tiffany-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">0%</div>
              <div className="text-sm text-gray-600">Platform Fees</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="w-8 h-8 text-tiffany-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Global</div>
              <div className="text-sm text-gray-600">Reach</div>
            </Card>
            <Card className="p-6 text-center">
              <Zap className="w-8 h-8 text-tiffany-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">&lt; 5min</div>
              <div className="text-sm text-gray-600">Setup Time</div>
            </Card>
          </div>
        </div>
      </PageSection>

      {/* How It Works */}
      <PageSection background="gray">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-tiffany-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Your Page</h3>
            <p className="text-gray-600">Set up your fundraising page with your story, goals, and Bitcoin address</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-tiffany-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Share & Promote</h3>
            <p className="text-gray-600">Share your project with your network and the Bitcoin community</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-tiffany-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Receive Donations</h3>
            <p className="text-gray-600">Get Bitcoin donations directly to your wallet with instant notifications</p>
          </div>
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Fundraising?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of successful fundraisers who have raised millions in Bitcoin for their projects
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-tiffany-500 hover:bg-tiffany-600 text-white"
            >
              Start Your Campaign
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={handleViewExamples}
              variant="outline"
              size="lg"
            >
              View Examples
            </Button>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  )
} 
