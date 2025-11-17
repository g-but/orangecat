'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import CompactStoryCard from '@/components/home/CompactStoryCard';
import { ArrowRight } from 'lucide-react';

const featuredStories = [
  {
    emoji: '🎨',
    name: 'Sarah M.',
    role: 'Artist',
    location: 'New York',
    goal: '$2,000 for art supplies',
    result: '✓ Funded in 2 weeks',
    quote: 'Supporters saw exactly where every dollar went. I showed receipts for each purchase.',
    fullStory:
      'I needed $2,000 for art supplies and studio rent. Instead of begging on social media, I posted my project. Supporters sent Bitcoin directly. I showed receipts for every purchase. They saw exactly how their help made new paintings possible.',
    gradient: 'from-purple-50 to-pink-50',
  },
  {
    emoji: '🚀',
    name: 'Marcus K.',
    role: 'Entrepreneur',
    location: 'Nairobi',
    goal: '$8,000 for solar inventory',
    result: '✓ Powered 5 homes in 3 months',
    quote: 'Posted photos and energy savings data. Everyone saw their support was working.',
    fullStory:
      'My solar panel business needed $8,000 for our first inventory. I shared our business plan and how we\'d expand access to clean energy. Supporters sent Bitcoin, we bought panels, installed systems in 5 homes. I posted photos and energy savings data.',
    gradient: 'from-amber-50 to-orange-50',
  },
  {
    emoji: '🏥',
    name: 'Dr. Elena R.',
    role: 'Medical Researcher',
    location: 'Barcelona',
    goal: '$15,000 for lab equipment',
    result: '✓ Advanced research by 6 months',
    quote: 'Shared lab photos, test results, and progress updates. Supporters saw the research happening.',
    fullStory:
      'My Parkinson\'s treatment research needed $15,000 for lab equipment. I explained the science, showed my credentials, and detailed how this could help millions. People sent Bitcoin directly. I shared lab photos, test results, and progress updates.',
    gradient: 'from-red-50 to-pink-50',
  },
];

export default function ProofSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Real People. Real Projects. Real Transparency.
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Creators share their work, show how they use support, and build trust through transparency.
          </p>
        </div>

        {/* Story Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 lg:mb-12">
          {featuredStories.map((story, index) => (
            <CompactStoryCard key={story.name} {...story} index={index} />
          ))}
        </div>

        {/* CTA Row */}
        <div className="text-center space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-600">
            These are real stories from people using OrangeCat. No charities. No fees. No guessing where your help goes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" className="w-full sm:w-auto" href="/discover">
              Browse All Projects
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" href="/stories">
              Read All Stories
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
