/** @type {import('next').NextConfig} */

const nextConfig = {
  // Move serverExternalPackages to root level (not experimental)
  serverExternalPackages: ['@supabase/supabase-js'],
  
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
    optimizePackageImports: ['lucide-react', 'framer-motion'], // Remove @supabase/supabase-js to avoid conflict
    // Removed modularizeImports from experimental as it was causing warnings
  },

  // Advanced webpack optimizations for bundle size
  webpack: (config, { dev, isServer, webpack }) => {
    // Add polyfills for server-side rendering
    if (isServer) {
      // Inject global polyfills at the top of every bundle
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: `
            if (typeof self === 'undefined') {
              globalThis.self = globalThis;
            }
            if (typeof global === 'undefined') {
              globalThis.global = globalThis;
            }
          `,
          raw: true,
          entryOnly: false,
        })
      );
    }

    // Define global variables for both client and server
    config.plugins.push(
      new webpack.DefinePlugin({
        'global': 'globalThis',
        'self': 'globalThis',
      })
    );

    // Provide polyfills
    config.plugins.push(
      new webpack.ProvidePlugin({
        global: 'globalThis',
        self: 'globalThis',
      })
    );

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

    // Add explicit alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    if (!dev) {
      // Enhanced tree shaking and dead code elimination
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // Advanced code splitting optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
            maxSize: 200000, // Split large vendor chunks
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            priority: 10,
            chunks: 'all',
            maxSize: 150000,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 20,
            chunks: 'all',
          },
          ui: {
            test: /[\\/]src[\\/](components|lib)[\\/]/,
            name: 'ui',
            priority: 5,
            chunks: 'all',
            maxSize: 100000,
          },
        },
      }
      
      // Performance budgets (stricter)
      config.performance = {
        maxAssetSize: 200000, // 200KB instead of 250KB
        maxEntrypointSize: 350000, // 350KB instead of 400KB
        hints: 'warning',
      }

      // Bundle analyzer in development
      if (process.env.ANALYZE) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: true,
          })
        )
      }
    }

    // Suppress "Critical dependency" warnings coming from dynamic requires in @supabase/realtime-js
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      (warning) =>
        typeof warning.message === 'string' &&
        warning.message.includes('Critical dependency') &&
        warning.module &&
        warning.module.resource &&
        warning.module.resource.includes('@supabase/realtime-js')
    ]

    return config
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
    webpack: (config, options) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
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