'use client';

import { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import { Calendar, Clock, Tag, Filter } from 'lucide-react';
import Link from 'next/link';
import { BlogPost } from '@/lib/blog';

interface BlogClientWrapperProps {
  posts: BlogPost[];
  featuredPost: BlogPost | null;
  tags: string[];
}

type TimeFilter = 'all' | 'thisyear' | 'last6months' | 'thismonth' | string; // string for specific year/month

export default function BlogClientWrapper({ posts, featuredPost, tags }: BlogClientWrapperProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('all');

  // Generate time filter options based on available posts
  const timeFilterOptions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get unique years and months from posts
    const postDates = posts.map(post => new Date(post.date));
    const years = Array.from(new Set(postDates.map(date => date.getFullYear()))).sort(
      (a, b) => b - a
    );
    const yearMonths = Array.from(
      new Set(
        postDates.map(
          date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        )
      )
    )
      .sort()
      .reverse();

    const options = [{ key: 'all', label: 'All Time', count: posts.length }];

    // Add current year if we have posts from it
    if (years.includes(currentYear)) {
      const thisYearPosts = posts.filter(post => new Date(post.date).getFullYear() === currentYear);
      options.push({ key: 'thisyear', label: 'This Year', count: thisYearPosts.length });
    }

    // Add last 6 months if relevant
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const last6MonthsPosts = posts.filter(post => new Date(post.date) >= sixMonthsAgo);
    if (last6MonthsPosts.length > 0 && last6MonthsPosts.length < posts.length) {
      options.push({ key: 'last6months', label: 'Last 6 Months', count: last6MonthsPosts.length });
    }

    // Add this month if we have posts from it
    const thisMonthPosts = posts.filter(post => {
      const postDate = new Date(post.date);
      return postDate.getFullYear() === currentYear && postDate.getMonth() === currentMonth;
    });
    if (thisMonthPosts.length > 0) {
      options.push({ key: 'thismonth', label: 'This Month', count: thisMonthPosts.length });
    }

    // Add specific year/month combinations for easy access
    yearMonths.forEach(yearMonth => {
      const [year, month] = yearMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      const monthPosts = posts.filter(post => {
        const postDate = new Date(post.date);
        return (
          postDate.getFullYear() === parseInt(year) && postDate.getMonth() === parseInt(month) - 1
        );
      });
      options.push({ key: yearMonth, label: monthName, count: monthPosts.length });
    });

    return options;
  }, [posts]);

  // Filter posts by both tag and time
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(post =>
        post.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    // Apply time filter
    if (selectedTimeFilter !== 'all') {
      const now = new Date();

      switch (selectedTimeFilter) {
        case 'thisyear':
          filtered = filtered.filter(
            post => new Date(post.date).getFullYear() === now.getFullYear()
          );
          break;
        case 'last6months':
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          filtered = filtered.filter(post => new Date(post.date) >= sixMonthsAgo);
          break;
        case 'thismonth':
          filtered = filtered.filter(post => {
            const postDate = new Date(post.date);
            return (
              postDate.getFullYear() === now.getFullYear() && postDate.getMonth() === now.getMonth()
            );
          });
          break;
        default:
          // Handle specific year-month (YYYY-MM format)
          if (selectedTimeFilter.includes('-')) {
            const [year, month] = selectedTimeFilter.split('-');
            filtered = filtered.filter(post => {
              const postDate = new Date(post.date);
              return (
                postDate.getFullYear() === parseInt(year) &&
                postDate.getMonth() === parseInt(month) - 1
              );
            });
          }
      }
    }

    return filtered;
  }, [posts, selectedTag, selectedTimeFilter]);

  // When no tag filter and All Time selected, show featured post separately + all other posts
  // When any filter is selected, show all matching posts in grid (no separate featured section)
  const postsToShow =
    selectedTag || selectedTimeFilter !== 'all'
      ? filteredPosts // Show all filtered posts including featured
      : posts; // Show ALL posts in grid when "All Topics" is selected

  // Only show featured section when no filters AND user hasn't selected any specific filtering
  const showFeaturedSection = false; // Disable featured section for now to test unified grid

  return (
    <div className="max-w-6xl mx-auto">
      {/* Featured Post */}
      {showFeaturedSection && featuredPost && (
        <div className="mb-12">
          <div className="bg-gradient-to-r from-orange-50 to-tiffany-50 rounded-2xl p-8 border border-orange-100">
            <div className="flex items-center text-sm text-orange-600 mb-4 font-medium">
              <Tag className="w-4 h-4 mr-2" />
              Featured Article
            </div>
            <Link href={`/blog/${featuredPost.slug}`}>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 hover:text-orange-600 transition-colors cursor-pointer">
                {featuredPost.title}
              </h2>
            </Link>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">{featuredPost.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                {featuredPost.date}
                <Clock className="w-4 h-4 ml-4 mr-2" />
                {featuredPost.readTime}
                {featuredPost.author && (
                  <>
                    <span className="ml-4 mr-2">•</span>
                    {featuredPost.author}
                  </>
                )}
              </div>
              <Link href={`/blog/${featuredPost.slug}`}>
                <span className="text-orange-600 hover:text-orange-700 font-medium cursor-pointer">
                  Read Article →
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-8 space-y-6">
        {/* Topic Filter */}
        {tags.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <Tag className="w-4 h-4 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold">Filter by Topic</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedTag
                    ? 'bg-tiffany-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Topics
              </button>
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-tiffany-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time Filter */}
        <div>
          <div className="flex items-center mb-4">
            <Calendar className="w-4 h-4 mr-2 text-gray-600" />
            <h3 className="text-lg font-semibold">Filter by Time</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {timeFilterOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setSelectedTimeFilter(option.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTimeFilter === option.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
                <span className="ml-1.5 text-xs opacity-75">({option.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {(selectedTag || selectedTimeFilter !== 'all') && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Showing:</span>
              {selectedTag && (
                <span className="px-2 py-1 bg-tiffany-100 text-tiffany-700 rounded text-xs font-medium">
                  {selectedTag}
                </span>
              )}
              {selectedTimeFilter !== 'all' && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                  {timeFilterOptions.find(opt => opt.key === selectedTimeFilter)?.label}
                </span>
              )}
              <span className="text-gray-500">•</span>
              <span className="text-gray-600 font-medium">
                {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedTag(null);
                setSelectedTimeFilter('all');
              }}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Blog Posts Grid */}
      {postsToShow.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {postsToShow.map(post => (
            <Card key={post.slug} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                {post.date}
                <Clock className="w-4 h-4 ml-4 mr-2" />
                {post.readTime}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-semibold mb-2 hover:text-orange-600 transition-colors cursor-pointer">
                  {post.title}
                </h2>
              </Link>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
              {post.author && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">By {post.author}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">No posts found</h3>
          <p className="text-gray-600 mb-8">
            {selectedTag || selectedTimeFilter !== 'all'
              ? 'Try adjusting your filters or clear them to see all posts.'
              : 'We have more great content in development. Check back soon for our latest insights and updates.'}
          </p>
          {(selectedTag || selectedTimeFilter !== 'all') && (
            <button
              onClick={() => {
                setSelectedTag(null);
                setSelectedTimeFilter('all');
              }}
              className="px-6 py-3 bg-tiffany-500 text-white rounded-lg hover:bg-tiffany-600 transition-colors"
            >
              View All Posts
            </button>
          )}
        </div>
      )}

      {/* Newsletter Signup */}
      <div className="mt-16">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-6">
            Subscribe to our newsletter for the latest updates and insights about Bitcoin funding
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              />
              <button className="px-6 py-2 bg-tiffany-500 text-white rounded-lg hover:bg-tiffany-600 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
