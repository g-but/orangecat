'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Filter } from 'lucide-react';
import type { Story } from '@/lib/stories';
import { ROUTES } from '@/config/routes';

interface StoriesPageClientProps {
  stories: Story[];
  categories: string[];
}

export default function StoriesPageClient({ stories, categories }: StoriesPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter stories based on category and search term
  const filteredStories = stories.filter(story => {
    const matchesCategory = selectedCategory === 'All' || story.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      story.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.role.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Hero Section */}
      <section className="bg-fg-primary text-fg-inverted py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Real People.{' '}
              <span className="bg-surface-base bg-clip-text text-transparent">Real Projects.</span>
            </h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto opacity-90 mb-8">
              From artists to entrepreneurs, medical researchers to educators—real stories of how
              direct Bitcoin funding makes real change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" href={ROUTES.HOME}>
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
              <Button
                variant="outline"
                size="lg"
                href={ROUTES.AUTH}
                className="bg-surface-base/10 border-fg-inverted/30 hover:bg-surface-raised/20"
              >
                Start Your Project
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-surface-base border-b border-default sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="w-full lg:w-96">
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-strong rounded-lg focus:ring-2 focus:ring-ring focus:border-interactive bg-surface-base text-fg-primary"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Filter className="w-5 h-5 text-fg-secondary hidden sm:block" />
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-fg-primary text-fg-inverted'
                      : 'bg-surface-raised text-fg-primary hover:bg-surface-overlay dark:hover:bg-surface-raised/80'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-fg-secondary">
            Showing {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
          </div>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredStories.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-fg-secondary text-lg">No stories found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full transition-colors">
                    <div className="p-8">
                      {/* Story Header */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 text-4xl flex items-center justify-center bg-surface-base rounded-lg shadow-sm">
                          {story.emoji}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-fg-primary mb-1">
                            {story.name}
                          </h3>
                          <p className="text-fg-primary font-medium">{story.role}</p>
                          <p className="text-fg-secondary text-sm">{story.location}</p>
                        </div>
                      </div>

                      {/* Funding Details */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-surface-base/70 dark:bg-surface-base/70 rounded-lg p-3">
                          <p className="text-xs text-fg-secondary mb-1">Goal</p>
                          <p className="text-lg font-bold text-fg-primary">{story.goal}</p>
                        </div>
                        <div className="bg-surface-base/70 dark:bg-surface-base/70 rounded-lg p-3">
                          <p className="text-xs text-fg-secondary mb-1">Raised</p>
                          <p className="text-lg font-bold text-status-positive">{story.raised}</p>
                        </div>
                        <div className="bg-surface-base/70 dark:bg-surface-base/70 rounded-lg p-3">
                          <p className="text-xs text-fg-secondary mb-1">Supporters</p>
                          <p className="text-lg font-bold text-fg-primary">{story.supporters}</p>
                        </div>
                        <div className="bg-surface-base/70 dark:bg-surface-base/70 rounded-lg p-3">
                          <p className="text-xs text-fg-secondary mb-1">Timeline</p>
                          <p className="text-lg font-bold text-fg-primary">{story.timeline}</p>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-fg-primary font-medium mb-6 leading-relaxed">
                        {story.summary}
                      </p>

                      {/* Story Content (MDX) */}
                      <div className="prose prose-sm max-w-none mb-6 text-fg-primary">
                        <MDXRemote source={story.story} />
                      </div>

                      {/* Category Badge */}
                      <div className="mt-6">
                        <span className="inline-block px-3 py-1 bg-surface-base/70 dark:bg-surface-base/70 text-fg-primary text-sm font-medium rounded-full">
                          {story.category}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
