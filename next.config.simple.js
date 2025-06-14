/** @type {import('next').NextConfig} */

const nextConfig = {
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: [
      'images.unsplash.com',
      'supabase.io',
      'github.com'
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental features (only supported ones)
  experimental: {
    esmExternals: true,
  },

  // Webpack optimizations
  webpack: (config, { dev }) => {
    if (!dev) {
      // Enable tree shaking
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // Performance budgets
      config.performance = {
        maxAssetSize: 250000,
        maxEntrypointSize: 400000,
        hints: 'warning',
      }
    }
    return config
  },

  // Enable compression
  compress: true,
  
  // Generate ETags for better caching
  generateEtags: true,
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
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
        exclude: ['error'],
      },
    },
  }),

  // Output configuration
  output: 'standalone',
  
  // TypeScript optimization
  typescript: {
    ignoreBuildErrors: false,
  },

  // Remove X-Powered-By header
  poweredByHeader: false,
}

module.exports = nextConfig

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Performance optimizations enabled:')
  console.log('  ✅ SWC Minification')
  console.log('  ✅ Image Optimization') 
  console.log('  ✅ Tree Shaking')
  console.log('  ✅ Compression')
  console.log('  ✅ Caching Headers')
} 