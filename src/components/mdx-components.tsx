import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import Image from 'next/image';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Customize markdown elements
    h1: ({ children }) => (
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 mt-12 flex items-center">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold text-gray-900 mb-3 mt-6">{children}</h4>
    ),
    p: ({ children }) => <p className="text-lg text-gray-700 leading-relaxed mb-6">{children}</p>,
    ul: ({ children }) => <ul className="space-y-3 text-gray-700 mb-6 ml-6">{children}</ul>,
    ol: ({ children }) => (
      <ol className="space-y-3 text-gray-700 mb-6 ml-6 list-decimal">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="flex items-start">
        <span className="w-2 h-2 bg-tiffany-500 rounded-full mt-2 mr-4 flex-shrink-0"></span>
        <span>{children}</span>
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-tiffany-500 pl-6 my-8 bg-tiffany-50 py-4 rounded-r-lg">
        <div className="text-lg text-gray-700 italic">{children}</div>
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto mb-6">
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <Link
        href={href || '#'}
        className="text-tiffany-600 hover:text-tiffany-700 font-medium underline"
      >
        {children}
      </Link>
    ),
    img: ({ src, alt }) => (
      <div className="my-8">
        <Image
          src={src || ''}
          alt={alt || ''}
          width={800}
          height={400}
          className="rounded-xl shadow-lg w-full"
        />
      </div>
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
    ...components,
  };
}
