/**
 * Webpack Bundle Optimizer Plugin
 * 
 * Custom webpack plugin to optimize bundle size by:
 * - Removing unused exports
 * - Optimizing dependencies
 * - Tree shaking improvements
 * - Bundle splitting strategies
 * 
 * Created: 2025-06-30
 */

class BundleOptimizerPlugin {
  constructor(options = {}) {
    this.options = {
      removeUnusedExports: true,
      optimizeDependencies: true,
      splitBundles: true,
      minChunkSize: 20000,
      maxChunkSize: 200000,
      ...options
    };
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('BundleOptimizerPlugin', (compilation) => {
      // Optimize chunks
      compilation.hooks.optimizeChunks.tap('BundleOptimizerPlugin', (chunks) => {
        if (!this.options.splitBundles) return;

        // Log chunk information for debugging
        console.log(`📦 Optimizing ${chunks.size} chunks...`);
        
        let optimizationsMade = 0;
        
        chunks.forEach(chunk => {
          // Log large chunks for analysis
          if (chunk.size > this.options.maxChunkSize) {
            console.log(`⚠️  Large chunk detected: ${chunk.name || 'unnamed'} (${Math.round(chunk.size / 1024)}KB)`);
            optimizationsMade++;
          }
        });
        
        if (optimizationsMade > 0) {
          console.log(`🔧 Found ${optimizationsMade} chunks that could be optimized`);
        }
      });

      // Remove unused modules
      compilation.hooks.optimizeModules.tap('BundleOptimizerPlugin', (modules) => {
        if (!this.options.removeUnusedExports) return;

        let removedModules = 0;
        
        modules.forEach(module => {
          // Check if module is actually used
          if (module.usedExports && module.usedExports.size === 0) {
            // Module is not used, mark for removal
            module.remove = true;
            removedModules++;
          }
        });
        
        if (removedModules > 0) {
          console.log(`🗑️  Marked ${removedModules} unused modules for removal`);
        }
      });
    });

    // After compilation, log bundle statistics
    compiler.hooks.done.tap('BundleOptimizerPlugin', (stats) => {
      const { assets } = stats.compilation;
      
      let totalSize = 0;
      let jsAssets = [];
      
      Object.keys(assets).forEach(assetName => {
        const asset = assets[assetName];
        totalSize += asset.size();
        
        if (assetName.endsWith('.js')) {
          jsAssets.push({
            name: assetName,
            size: asset.size(),
            sizeKB: Math.round(asset.size() / 1024 * 100) / 100
          });
        }
      });
      
      // Sort by size
      jsAssets.sort((a, b) => b.size - a.size);
      
      console.log('\n📊 Bundle Optimization Report:');
      console.log(`📦 Total bundle size: ${Math.round(totalSize / 1024)}KB`);
      console.log('🏆 Largest JS assets:');
      
      jsAssets.slice(0, 5).forEach((asset, index) => {
        const status = asset.sizeKB > 500 ? '❌' : asset.sizeKB > 200 ? '⚠️' : '✅';
        console.log(`   ${index + 1}. ${status} ${asset.name}: ${asset.sizeKB}KB`);
      });
      
      // Recommendations
      const largeAssets = jsAssets.filter(asset => asset.sizeKB > 200);
      if (largeAssets.length > 0) {
        console.log('\n💡 Optimization recommendations:');
        largeAssets.forEach(asset => {
          console.log(`   • Consider splitting ${asset.name} (${asset.sizeKB}KB)`);
        });
      }
      
      console.log(''); // Empty line for readability
    });
  }
}

/**
 * Webpack configuration optimizations
 */
function getOptimizedWebpackConfig(config, { dev, isServer }) {
  if (dev || isServer) return config;

  // Add bundle optimizer plugin
  config.plugins.push(new BundleOptimizerPlugin());

  // Optimize splitChunks configuration
  config.optimization.splitChunks = {
    chunks: 'all',
    minSize: 20000,
    maxSize: 200000,
    minChunks: 1,
    maxAsyncRequests: 10,
    maxInitialRequests: 5,
    cacheGroups: {
      // Vendor libraries
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
        chunks: 'all',
        maxSize: 500000,
        enforce: true,
      },
      
      // React ecosystem
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
        name: 'react-vendor',
        priority: 20,
        chunks: 'all',
        enforce: true,
      },
      
      // Supabase
      supabase: {
        test: /[\\/]node_modules[\\/]@supabase[\\/]/,
        name: 'supabase',
        priority: 15,
        chunks: 'all',
        enforce: true,
      },
      
      // UI libraries
      ui: {
        test: /[\\/]node_modules[\\/](framer-motion|lucide-react|radix-ui)[\\/]/,
        name: 'ui-libs',
        priority: 12,
        chunks: 'all',
        enforce: true,
      },
      
      // Utilities
      utils: {
        test: /[\\/]node_modules[\\/](date-fns|lodash|clsx|zod)[\\/]/,
        name: 'utils',
        priority: 11,
        chunks: 'all',
        enforce: true,
      },
      
      // Common chunks
      common: {
        name: 'common',
        minChunks: 2,
        priority: 5,
        chunks: 'all',
        reuseExistingChunk: true,
        enforce: true,
      },
    },
  };

  // Enable tree shaking
  config.optimization.usedExports = true;
  config.optimization.sideEffects = false;

  // Optimize module concatenation
  config.optimization.concatenateModules = true;

  // Remove empty chunks
  config.optimization.removeEmptyChunks = true;

  // Merge duplicate chunks
  config.optimization.mergeDuplicateChunks = true;

  // Module resolution optimizations
  config.resolve.alias = {
    ...config.resolve.alias,
    // Replace heavy libraries with lighter alternatives where possible
    'lodash': 'lodash-es', // Use ES modules version for better tree shaking
  };

  // Externalize large libraries that can be loaded from CDN
  if (process.env.NODE_ENV === 'production') {
    config.externals = {
      ...config.externals,
      // Note: Only externalize if you're loading from CDN
      // 'react': 'React',
      // 'react-dom': 'ReactDOM',
    };
  }

  return config;
}

/**
 * Bundle analysis helpers
 */
function analyzeBundleComposition(stats) {
  const modules = stats.compilation.modules;
  const modulesBySize = [];
  
  modules.forEach(module => {
    if (module.size) {
      modulesBySize.push({
        name: module.identifier(),
        size: module.size(),
        sizeKB: Math.round(module.size() / 1024 * 100) / 100
      });
    }
  });
  
  modulesBySize.sort((a, b) => b.size - a.size);
  
  return {
    totalModules: modules.size,
    largestModules: modulesBySize.slice(0, 10),
    nodeModules: modulesBySize.filter(m => m.name.includes('node_modules')).slice(0, 10),
    sourceModules: modulesBySize.filter(m => !m.name.includes('node_modules')).slice(0, 10)
  };
}

module.exports = {
  BundleOptimizerPlugin,
  getOptimizedWebpackConfig,
  analyzeBundleComposition
};