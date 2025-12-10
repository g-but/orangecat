'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Target, TrendingUp, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoansSection() {
  const features = [
    {
      icon: DollarSign,
      title: 'List Your Loans',
      description: 'Add your existing loans from any lender and make them available for refinancing offers.',
    },
    {
      icon: Target,
      title: 'Receive Offers',
      description: 'Get competitive offers from the community to refinance or pay off your loans.',
    },
    {
      icon: TrendingUp,
      title: 'Better Rates',
      description: 'Find lenders willing to offer lower interest rates and better terms.',
    },
    {
      icon: Users,
      title: 'Peer-to-Peer',
      description: 'Connect directly with lenders in a transparent, community-driven marketplace.',
    },
  ];

  const stats = [
    { label: 'Loans Listed', value: '0', icon: DollarSign },
    { label: 'Offers Made', value: '0', icon: Target },
    { label: 'Avg Savings', value: '$0', icon: TrendingUp },
    { label: 'Active Lenders', value: '0', icon: Users },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
            New Feature
          </Badge>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            My Loans - Peer-to-Peer Lending
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            List your loans for refinancing or browse community lending opportunities.
            Beat high-interest lenders with competitive peer-to-peer offers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <stat.icon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Save Money on Your Loans?</h3>
            <p className="text-muted-foreground mb-6">
              Join the peer-to-peer lending revolution. List your loans today and start receiving
              competitive offers from lenders who want to help you save.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/loans">
                <Button size="lg" className="gap-2">
                  <DollarSign className="h-5 w-5" />
                  Explore My Loans
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth?mode=register">
                <Button variant="outline" size="lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="text-lg font-semibold mb-2">List Your Loans</h4>
              <p className="text-muted-foreground">
                Add your existing loans with details like amount, interest rate, and lender information.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="text-lg font-semibold mb-2">Receive Offers</h4>
              <p className="text-muted-foreground">
                Community members review your loans and submit competitive refinancing offers.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="text-lg font-semibold mb-2">Choose & Save</h4>
              <p className="text-muted-foreground">
                Accept the best offer and save money with lower rates and better terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
