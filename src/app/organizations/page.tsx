'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import {
  Building,
  Users,
  Vote,
  Wallet,
  Link,
  Shield,
  BarChart3,
  Check,
  ArrowRight,
  Network,
  Briefcase,
  TrendingUp,
  Heart,
  Search,
  Zap,
  Target,
  Globe,
  Crown
} from 'lucide-react'

export default function OrganizationsPage() {
  const router = useRouter()
  const { user, session } = useAuth()

  const features = [
    {
      icon: Users,
      title: 'Member Management',
      description: 'Invite members with customizable roles, permissions, and voting rights in a decentralized structure'
    },
    {
      icon: Vote,
      title: 'Democratic Governance',
      description: 'Create proposals, conduct votes, and implement collective decision-making with Bitcoin-weighted voting'
    },
    {
      icon: Wallet,
      title: 'Multi-Signature Treasury',
      description: 'Secure organizational funds with multi-signature wallets and programmable spending controls'
    },
    {
      icon: Link,
      title: 'Project Affiliation',
      description: 'Associate organizations with projects, assets, and community initiatives for collective action'
    },
    {
      icon: Shield,
      title: 'Legal & Compliance',
      description: 'Built-in legal templates and compliance tools for organizational structures and operations'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track organizational health, member engagement, treasury performance, and decision outcomes'
    }
  ]

  const orgTypes = [
    {
      category: 'Decentralized Organizations',
      icon: Network,
      examples: ['DAOs', 'Protocol Communities', 'Open Source Collectives'],
      color: 'bg-purple-100 text-purple-700',
      description: 'Fully decentralized with on-chain governance'
    },
    {
      category: 'Community Cooperatives',
      icon: Users,
      examples: ['Local Meetups', 'Neighborhood Groups', 'Interest Collectives'],
      color: 'bg-blue-100 text-blue-700',
      description: 'Member-owned cooperatives for community projects'
    },
    {
      category: 'Business Collectives',
      icon: Briefcase,
      examples: ['Worker-Owned Companies', 'Freelancer Networks', 'Creative Studios'],
      color: 'bg-green-100 text-green-700',
      description: 'Collaborative business entities and collectives'
    },
    {
      category: 'Investment Syndicates',
      icon: TrendingUp,
      examples: ['Bitcoin Investment Clubs', 'Asset Management Groups', 'Venture Syndicates'],
      color: 'bg-orange-100 text-orange-700',
      description: 'Collective investment and asset management'
    },
    {
      category: 'Non-Profit Foundations',
      icon: Heart,
      examples: ['Education Foundations', 'Charity Organizations', 'Research Institutes'],
      color: 'bg-red-100 text-red-700',
      description: 'Transparent charitable and non-profit entities'
    },
    {
      category: 'Research Consortia',
      icon: Search,
      examples: ['Technical Research Groups', 'Academic Collaborations', 'Innovation Labs'],
      color: 'bg-indigo-100 text-indigo-700',
      description: 'Collaborative research and development organizations'
    }
  ]

  const benefits = [
    'Zero-cost organization formation and governance',
    'Bitcoin-powered treasury with multi-signature security',
    'Democratic decision-making with transparent voting',
    'Global member participation without geographic barriers',
    'Automatic compliance and legal documentation',
    'Real-time analytics and performance tracking',
    'Seamless integration with projects and assets',
    'Scalable governance for growing organizations'
  ]

  const collectiveActionExamples = [
    {
      title: 'Orange Cat Organization',
      description: 'Your Bitcoin crowdfunding platform as a formal organization',
      actions: ['Develop Orange Cat features', 'Manage platform treasury', 'Add team collaborators', 'Govern platform decisions'],
      icon: Target
    },
    {
      title: 'Orange Cat Development Team',
      description: 'Future team structure when you hire developers and designers',
      actions: ['Invite new team members', 'Assign development tasks', 'Vote on technical decisions', 'Manage project milestones'],
      icon: Users
    },
    {
      title: 'Orange Cat Community DAO',
      description: 'Community governance for platform direction and features',
      actions: ['Propose new features', 'Vote on platform changes', 'Fund community initiatives', 'Manage ecosystem growth'],
      icon: Network
    },
    {
      title: 'Orange Cat Treasury',
      description: 'Multi-signature treasury for platform operations and development',
      actions: ['Secure Bitcoin holdings', 'Fund development work', 'Manage operational expenses', 'Distribute to contributors'],
      icon: Wallet
    }
  ]

  const handleGetStarted = () => {
    if (session) {
      router.push('/organizations/create')
    } else {
      router.push('/auth?mode=login&redirect=/organizations/create')
    }
  }

  const handleViewDemo = () => {
    router.push('/demo/organizations')
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Orange Cat Organization"
        description="Establish Orange Cat as a formal Bitcoin-powered organization with governance, treasury management, and the ability to add collaborators for collective development"
      />

      {/* Key Features */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Bitcoin Organizations?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <feature.icon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Orange Cat Organization Section */}
      <PageSection background="orange">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="text-4xl">🟠</div>
            <h2 className="text-3xl font-bold text-gray-900">Orange Cat as an Organization</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform Orange Cat from a personal project into a formal Bitcoin-powered organization.
            Establish governance, add collaborators, and build a sustainable structure for long-term growth.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-orange-200">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-orange-600" />
                Organization Structure
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                  <span><strong>You as Owner:</strong> Full administrative control and decision-making authority</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                  <span><strong>Future Team Members:</strong> Developers, designers, and community managers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                  <span><strong>Community Governance:</strong> Involve users in platform decisions</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                  <span><strong>Multi-sig Treasury:</strong> Secure Bitcoin holdings for operations</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-orange-200">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Growth Path
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-semibold text-orange-700">1</div>
                  <span className="text-gray-700">Create "Orange Cat" organization (you as owner)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-semibold text-orange-700">2</div>
                  <span className="text-gray-700">Add team members when you hire</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-semibold text-orange-700">3</div>
                  <span className="text-gray-700">Establish community governance</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-semibold text-orange-700">4</div>
                  <span className="text-gray-700">Scale to a thriving Bitcoin platform ecosystem</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 border border-orange-200">
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">Orange Cat Organization Preview</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🟠</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Orange Cat</div>
                    <div className="text-sm text-gray-600">@orange-cat</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">Owner</span>
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Description:</strong> Bitcoin-powered crowdfunding platform for transparent funding of projects, events, and community initiatives.
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">1</div>
                  <div className="text-xs text-gray-600">Member</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-600">Projects</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">0 BTC</div>
                  <div className="text-xs text-gray-600">Treasury</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-gray-900">Organization Actions</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-blue-50 text-blue-700 p-2 rounded text-center">Create Project</div>
                  <div className="bg-green-50 text-green-700 p-2 rounded text-center">Invite Member</div>
                  <div className="bg-purple-50 text-purple-700 p-2 rounded text-center">Create Proposal</div>
                  <div className="bg-orange-50 text-orange-700 p-2 rounded text-center">Manage Treasury</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Organization Types */}
      <PageSection background="emerald">
        <h2 className="text-3xl font-bold text-center mb-12">Types of Organizations You Can Create</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgTypes.map((type, index) => (
            <Card key={index} className="p-6">
              <type.icon className={`w-12 h-12 mx-auto mb-4 ${type.color}`} />
              <h3 className="text-lg font-semibold mb-2 text-center">{type.category}</h3>
              <p className="text-sm text-gray-600 mb-4 text-center">{type.description}</p>
              <ul className="text-gray-700 space-y-1">
                {type.examples.map((example, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                    {example}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Collective Action Examples */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Collective Action in Action</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {collectiveActionExamples.map((example, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start gap-4">
                <example.icon className="w-12 h-12 text-emerald-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{example.title}</h3>
                  <p className="text-gray-600 mb-4">{example.description}</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Collective Actions:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {example.actions.map((action, i) => (
                        <li key={i} className="flex items-center">
                          <Check className="w-3 h-3 text-emerald-500 mr-2 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Benefits Section */}
      <PageSection background="gray">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Benefits of Bitcoin Organizations</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <Zap className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Instant</div>
              <div className="text-sm text-gray-600">Formation</div>
            </Card>
            <Card className="p-6 text-center">
              <Globe className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Borderless</div>
              <div className="text-sm text-gray-600">Operations</div>
            </Card>
            <Card className="p-6 text-center">
              <Vote className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Democratic</div>
              <div className="text-sm text-gray-600">Governance</div>
            </Card>
            <Card className="p-6 text-center">
              <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Secure</div>
              <div className="text-sm text-gray-600">Treasury</div>
            </Card>
          </div>
        </div>
      </PageSection>

      {/* Browse Organizations */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Browse Organizations</h2>
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover existing organizations and see how they're using OrangeCat for collective action.
          </p>
          <Button
            onClick={() => router.push('/discover?type=organizations')}
            variant="outline"
            size="lg"
          >
            Browse All Organizations
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </PageSection>

      {/* How It Works */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">How Organizations Work</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-emerald-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Form Organization</h3>
            <p className="text-gray-600">Create your organization with governance structure and initial members</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-emerald-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Set Up Treasury</h3>
            <p className="text-gray-600">Establish multi-signature wallets and spending policies</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-emerald-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Proposals</h3>
            <p className="text-gray-600">Members submit proposals for organizational decisions and actions</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-emerald-600">4</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Vote & Execute</h3>
            <p className="text-gray-600">Conduct votes and implement approved decisions collectively</p>
          </div>
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Form Your Organization?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the future of organizational governance with Bitcoin-powered collectives, DAOs, and community cooperatives
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Create Your Organization
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={handleViewDemo}
              variant="outline"
              size="lg"
            >
              View Interactive Demo
            </Button>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  )
}














