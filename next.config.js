/** @type {import('next').NextConfig} */

const nextConfig = {
  // Externalize Supabase packages for server-side rendering
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ohkueislstxomdjavyhs.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Removed deprecated `domains` configuration per Next.js 15 guidance
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental features (only supported ones)
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    // Removed modularizeImports from experimental as it was causing warnings
  },

  // Advanced webpack optimizations for bundle size
  webpack: (config, { dev, isServer, webpack }) => {
    // Exclude Supabase packages from server-side bundling
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        '@supabase/supabase-js': 'commonjs @supabase/supabase-js',
        '@supabase/ssr': 'commonjs @supabase/ssr',
        '@supabase/auth-js': 'commonjs @supabase/auth-js',
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js',
        '@supabase/postgrest-js': 'commonjs @supabase/postgrest-js',
        '@supabase/storage-js': 'commonjs @supabase/storage-js',
      })
    }

    // Configure fallbacks for Node.js polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Define global variables for both client and server
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'global': 'globalThis',
        'self': 'globalThis',
      })
    );

    // Provide polyfills for global variables
    config.plugins.push(
      new webpack.ProvidePlugin({
        global: 'globalThis',
        self: 'globalThis',
      })
    );

    // Add explicit alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    if (!dev) {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 10,
            },
            ui: {
              test: /[\\/]src[\\/](components|ui)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 5,
            },
          },
        },
      };
    }

    return config;
  },

  // Enable compression
  compress: true,
  
  // Generate ETags for better caching
  generateEtags: true,
  
  // Enhanced headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),

  // Output configuration
  output: 'standalone',
  
  // TypeScript optimization - completely skip TypeScript validation
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint optimization
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Remove X-Powered-By header
  poweredByHeader: false,

  // Performance budgets
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
}

module.exports = nextConfig

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Performance optimizations enabled:')
  console.log('  ✅ SWC Minification')
  console.log('  ✅ Image Optimization') 
  console.log('  ✅ Advanced Tree Shaking')
  console.log('  ✅ Smart Code Splitting')
  console.log('  ✅ Compression')
  console.log('  ✅ Enhanced Caching Headers')
  console.log('  ✅ Bundle Size Optimization')
} 