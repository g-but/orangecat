import { Suspense } from 'react'
import Card from '@/components/ui/Card'
import { Calendar, Clock, Tag } from 'lucide-react'
import Link from 'next/link'
import { getPublishedPosts, getFeaturedPost, getAllTags } from '@/lib/blog'
import BlogClientWrapper from '@/components/blog/BlogClientWrapper'

export default function BlogPage() {
  const allPosts = getPublishedPosts()
  const featuredPost = getFeaturedPost()
  const allTags = getAllTags()

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">OrangeCat Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, guides, and stories about Bitcoin funding and community building
          </p>
        </div>

        <Suspense fallback={<div>Loading blog posts...</div>}>
          <BlogClientWrapper 
            posts={allPosts}
            featuredPost={featuredPost}
            tags={allTags}
          />
        </Suspense>
      </div>
    </div>
  )
} 