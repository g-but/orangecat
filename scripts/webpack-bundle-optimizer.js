/**
 * Webpack Bundle Optimizer
 * Provides configuration optimizations for Next.js webpack builds
 */

function getOptimizedWebpackConfig(config, options) {
  const { dev, isServer } = options;

  // Only apply optimizations in production
  if (dev) {
    return config;
  }

  // Enhanced optimization for production builds
  config.optimization = {
    ...config.optimization,
    minimize: true,
    // Split chunks for better caching
    splitChunks: {
      ...config.optimization.splitChunks,
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Vendor chunk for common libraries
        lib: {
          name: 'lib',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          minChunks: 1,
          reuseExistingChunk: true,
        },
        // Common chunks used across pages
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  };

  return config;
}

module.exports = {
  getOptimizedWebpackConfig,
};
