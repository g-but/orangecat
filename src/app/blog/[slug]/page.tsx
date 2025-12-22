import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { Calendar, Clock, ArrowLeft, Users, Tag } from 'lucide-react';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getBlogPost, getBlogPostSlugs } from '@/lib/blog';
import Button from '@/components/ui/Button';
import { ComponentProps } from 'react';

// MDX Components
const mdxComponents = {
  // Customize markdown elements
  h1: ({ children, ...props }: ComponentProps<'h1'>) => (
    <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: ComponentProps<'h2'>) => (
    <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12 flex items-center" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentProps<'h3'>) => (
    <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: ComponentProps<'h4'>) => (
    <h4 className="text-xl font-semibold text-gray-900 mb-3 mt-6" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: ComponentProps<'p'>) => (
    <p className="text-lg text-gray-700 leading-relaxed mb-6" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: ComponentProps<'ul'>) => (
    <ul className="space-y-3 text-gray-700 mb-6 ml-6" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentProps<'ol'>) => (
    <ol className="space-y-3 text-gray-700 mb-6 ml-6 list-decimal" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentProps<'li'>) => (
    <li className="flex items-start" {...props}>
      <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-4 flex-shrink-0"></span>
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children, ...props }: ComponentProps<'blockquote'>) => (
    <blockquote
      className="border-l-4 border-teal-500 pl-6 my-8 bg-teal-50 py-4 rounded-r-lg"
      {...props}
    >
      <div className="text-lg text-gray-700 italic">{children}</div>
    </blockquote>
  ),
  code: ({ children, ...props }: ComponentProps<'code'>) => (
    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }: ComponentProps<'pre'>) => (
    <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto mb-6" {...props}>
      {children}
    </pre>
  ),
  a: ({ href, children, ...props }: ComponentProps<'a'>) => (
    <Link
      href={href || '#'}
      className="text-teal-600 hover:text-teal-700 font-medium underline"
      {...props}
    >
      {children}
    </Link>
  ),
  // Custom components for blog posts
  Alert: ({
    type = 'info',
    children,
  }: {
    type?: 'info' | 'warning' | 'success' | 'error';
    children: React.ReactNode;
  }) => {
    const styles = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
    };
    return <div className={`border rounded-xl p-6 mb-6 ${styles[type]}`}>{children}</div>;
  },
  SecurityFeature: ({ title, description }: { title: string; description: string }) => (
    <div className="bg-white border border-green-200 rounded-xl p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
        {title}
      </h4>
      <p className="text-gray-700">{description}</p>
    </div>
  ),
};

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const slugs = getBlogPostSlugs();
  return slugs.map(slug => ({ slug }));
}

// Generate metadata for each blog post
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found - OrangeCat Blog',
    };
  }

  return {
    title: `${post.title} - OrangeCat Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author || 'OrangeCat Team'],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back to Blog */}
          <div className="mb-8">
            <Link href="/blog">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-12">
            {post.featured && (
              <div className="flex items-center text-sm text-orange-600 mb-4 font-medium">
                <span className="bg-orange-100 px-3 py-1 rounded-full">Featured Article</span>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-6">{post.excerpt}</p>

            {/* Post Meta */}
            <div className="flex items-center text-sm text-gray-500 border-t border-b border-gray-200 py-4">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              <Clock className="w-4 h-4 ml-6 mr-2" />
              {post.readTime}
              {post.author && (
                <>
                  <Users className="w-4 h-4 ml-6 mr-2" />
                  {post.author}
                </>
              )}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Article Content */}
          <article className="prose prose-lg max-w-none">
            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [],
                  rehypePlugins: [],
                },
              }}
            />
          </article>

          {/* Share and Navigation */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <Link href="/blog">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Button>
              </Link>
              <div className="mt-4 sm:mt-0 text-center">
                <p className="text-gray-600 text-sm mb-2">
                  Part of our commitment to building in public
                </p>
                <p className="text-gray-500 text-xs">
                  Share this article to help spread knowledge about Bitcoin platform security
                </p>
              </div>
            </div>
          </div>

          {/* Related Posts CTA */}
          <div className="mt-12 bg-gradient-to-r from-orange-50 to-tiffany-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">More from OrangeCat</h3>
            <p className="text-lg text-gray-700 mb-6">
              Discover more insights about Bitcoin, security, and building in public.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/blog">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  Read More Articles
                </Button>
              </Link>
              <Link href="/auth?mode=register">
                <Button variant="outline" size="lg">
                  Join OrangeCat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
