'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import { Calendar, Clock, Tag } from 'lucide-react'

// Mock blog posts data
const blogPosts = [
  {
    id: 1,
    title: 'Getting Started with Bitcoin Funding',
    excerpt: 'Learn how to create your first funding page and start receiving Bitcoin donations for your projects.',
    date: '2024-03-15',
    readTime: '5 min read',
    tags: ['Guide', 'Bitcoin', 'Getting Started'],
  },
  {
    id: 2,
    title: 'Why Bitcoin is the Future of Funding',
    excerpt: 'Discover how Bitcoin is revolutionizing the way creators and innovators receive funding for their projects.',
    date: '2024-03-10',
    readTime: '7 min read',
    tags: ['Bitcoin', 'Future', 'Innovation'],
  },
  {
    id: 3,
    title: 'Success Stories: Funded Projects',
    excerpt: 'Read about successful projects that were funded through OrangeCat and how Bitcoin helped them achieve their goals.',
    date: '2024-03-05',
    readTime: '6 min read',
    tags: ['Success Stories', 'Projects', 'Case Studies'],
  },
]

export default function BlogPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)))
  const filteredPosts = selectedTag
    ? blogPosts.filter(post => post.tags.includes(selectedTag))
    : blogPosts

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">OrangeCat Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, guides, and stories about Bitcoin funding
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Tags Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  !selectedTag
                    ? 'bg-tiffany-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
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

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <Card key={post.id} className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  {post.date}
                  <Clock className="w-4 h-4 ml-4 mr-2" />
                  {post.readTime}
                </div>
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
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
              </Card>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="mt-16">
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
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
                  <button className="px-6 py-2 bg-tiffany-500 text-white rounded-lg hover:bg-tiffany-600">
                    Subscribe
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 