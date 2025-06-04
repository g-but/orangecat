import { BlogPost } from '@/data/blog-posts'

// Helper function to generate a slug from a title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

// Helper function to estimate reading time
export const estimateReadingTime = (content: string): string => {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
}

// Template for creating new blog posts
export const createBlogPost = (params: {
  title: string
  excerpt: string
  content?: string
  tags: string[]
  featured?: boolean
  author?: string
  date?: string
}): Omit<BlogPost, 'id'> => {
  const slug = generateSlug(params.title)
  const readTime = params.content ? estimateReadingTime(params.content) : '5 min read'
  
  return {
    slug,
    title: params.title,
    excerpt: params.excerpt,
    content: params.content,
    date: params.date || new Date().toISOString().split('T')[0],
    readTime,
    tags: params.tags,
    featured: params.featured || false,
    author: params.author || 'OrangeCat Team',
    published: true,
  }
}

// Quick blog post ideas and templates
export const blogPostTemplates = {
  howTo: {
    tags: ['Guide', 'How-to'],
    titleFormat: 'How to [ACTION] with Bitcoin',
    excerptFormat: 'Step-by-step guide to [ACTION] using Bitcoin and OrangeCat.'
  },
  explanation: {
    tags: ['Explanation', 'Bitcoin'],
    titleFormat: 'Understanding [CONCEPT]',
    excerptFormat: 'A clear explanation of [CONCEPT] and why it matters for Bitcoin users.'
  },
  caseStudy: {
    tags: ['Case Study', 'Success Stories'],
    titleFormat: '[PROJECT NAME]: A Bitcoin Funding Success Story',
    excerptFormat: 'How [PROJECT] used Bitcoin funding to achieve their goals and what we can learn from their approach.'
  },
  technical: {
    tags: ['Technical', 'Bitcoin', 'Development'],
    titleFormat: 'The Technical Side of [FEATURE]',
    excerptFormat: 'Deep dive into how [FEATURE] works under the hood and why we built it this way.'
  },
  philosophy: {
    tags: ['Philosophy', 'Community', 'Bitcoin'],
    titleFormat: 'Why [CONCEPT] Matters for Bitcoin Communities',
    excerptFormat: 'Exploring the broader implications of [CONCEPT] and its role in building better communities.'
  }
}

// Common tag categories
export const commonTags = {
  technical: ['Technical', 'Development', 'Bitcoin', 'Blockchain'],
  guides: ['Guide', 'How-to', 'Getting Started', 'Tutorial'],
  community: ['Community', 'Philosophy', 'Social Impact'],
  business: ['Business', 'Funding', 'Entrepreneurship'],
  features: ['Features', 'Updates', 'Product'],
  stories: ['Success Stories', 'Case Studies', 'User Stories']
} 