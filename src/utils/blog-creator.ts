import { generateSlug, estimateReadingTime } from './blog-helper'
import { saveBlogPost } from '@/lib/blog'
import fs from 'fs'
import path from 'path'

interface BlogPostData {
  title: string
  excerpt?: string
  content: string
  tags?: string[]
  featured?: boolean
  author?: string
  published?: boolean
}

export async function createBlogPostFromChat({
  title,
  content,
  excerpt,
  tags = ['General'],
  featured = false,
  author = 'OrangeCat Team',
  published = true
}: BlogPostData): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    // Generate slug from title
    const slug = generateSlug(title)

    // Check if file already exists
    const blogDir = path.join(process.cwd(), 'content/blog')
    const filePath = path.join(blogDir, `${slug}.mdx`)

    if (fs.existsSync(filePath)) {
      return { success: false, error: `Blog post "${slug}" already exists` }
    }

    // Generate excerpt if not provided
    const finalExcerpt = excerpt || content.substring(0, 150) + '...'

    // Calculate reading time
    const readTime = estimateReadingTime(content)

    // Create frontmatter
    const frontmatter = `---
title: "${title}"
excerpt: "${finalExcerpt}"
date: "${new Date().toISOString().split('T')[0]}"
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
featured: ${featured}
author: "${author}"
published: ${published}
readTime: "${readTime}"
---

`

    // Combine frontmatter and content
    const fullContent = frontmatter + content

    // Save the file
    const saved = saveBlogPost(slug, fullContent)

    if (saved) {
      return {
        success: true,
        slug,
        error: undefined
      }
    } else {
      return { success: false, error: 'Failed to save blog post' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Utility function to check if blog directory exists
export function ensureBlogDirectory() {
  const blogDir = path.join(process.cwd(), 'content/blog')
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true })
  }
}

