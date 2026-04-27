'use client';

import { useState } from 'react';
import { BookOpen, Wallet, Target } from 'lucide-react';
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout';
import Button from '@/components/ui/Button';
import { LEARNING_PATHS, QUICK_RESOURCES, WHY_LEARN_BENEFITS } from './config';
import { LearningPathCard } from './LearningPathCard';
import { ResourceCard } from './ResourceCard';

const LEVEL_FILTERS = ['all', 'beginner', 'intermediate', 'advanced'] as const;

export default function StudyBitcoinPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const filteredPaths =
    selectedLevel === 'all'
      ? LEARNING_PATHS
      : LEARNING_PATHS.filter(path => path.level.toLowerCase() === selectedLevel);

  const featuredResources = QUICK_RESOURCES.filter(r => r.featured);
  const otherResources = QUICK_RESOURCES.filter(r => !r.featured);

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader
        title="Study Bitcoin"
        subtitle="Your comprehensive guide to understanding Bitcoin"
        description="From basics to advanced concepts, learn everything you need to know about Bitcoin and the future of money."
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button href="/bitcoin-wallet-guide" size="lg" className="min-h-[48px]">
            <Wallet className="w-5 h-5 mr-2" />
            Start with Wallets
          </Button>
          <Button href="#learning-paths" variant="outline" size="lg" className="min-h-[48px]">
            <BookOpen className="w-5 h-5 mr-2" />
            Browse All Topics
          </Button>
        </div>
      </PageHeader>

      <PageSection background="white">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Featured Resources</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Start here with our most popular and essential Bitcoin education resources
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredResources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} featured />
          ))}
        </div>
      </PageSection>

      <PageSection>
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Learning Paths</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Structured courses designed to take you from beginner to Bitcoin expert
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {LEVEL_FILTERS.map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLevel === level
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPaths.map(path => (
            <LearningPathCard key={path.id} path={path} />
          ))}
        </div>
      </PageSection>

      <PageSection background="gray">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Resources</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Essential tools, guides, and external resources for your Bitcoin journey
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherResources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </PageSection>

      <PageSection background="white">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Learn About Bitcoin?</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Understanding Bitcoin is essential in today&apos;s digital economy
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_LEARN_BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </PageSection>

      <PageSection background="tiffany">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to Start Your Bitcoin Journey?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Begin with our comprehensive wallet guide and take your first step into the world of
            Bitcoin
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/bitcoin-wallet-guide" size="lg" className="min-h-[48px]">
              <Wallet className="w-5 h-5 mr-2" />
              Get Your First Wallet
            </Button>
            <Button href="/projects/create" variant="outline" size="lg" className="min-h-[48px]">
              <Target className="w-5 h-5 mr-2" />
              Start a Project
            </Button>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
}
