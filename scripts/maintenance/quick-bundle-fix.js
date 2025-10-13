#!/usr/bin/env node

/**
 * Quick Bundle Size Fix
 * 
 * Identifies and addresses the most critical bundle size issues
 * that are causing the 16MB+ bundle size problem.
 * 
 * Created: 2025-06-30
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Quick Bundle Size Fix Analysis');
console.log('==================================\n');

// Check for development vs production build
const nextDir = '.next';
if (!fs.existsSync(nextDir)) {
  console.log('❌ No .next directory found. Building...\n');
  const { execSync } = require('child_process');
  
  try {
    console.log('🏗️  Running production build...');
    execSync('NODE_ENV=production npm run build', { 
      stdio: 'pipe',
      timeout: 300000 // 5 minutes
    });
  } catch (error) {
    console.log('❌ Build failed. Checking for common issues...\n');
    
    // Check for missing components that cause imports to fail
    const missingComponents = [];
    
    // Check for QR code imports
    if (!fs.existsSync('./src/components/ui/QRGenerator.tsx')) {
      missingComponents.push('QRGenerator');
    }
    
    if (!fs.existsSync('./src/components/ui/RichTextEditor.tsx')) {
      missingComponents.push('RichTextEditor');
    }
    
    if (!fs.existsSync('./src/components/charts/AdvancedCharts.tsx')) {
      missingComponents.push('AdvancedCharts');
    }
    
    if (!fs.existsSync('./src/components/ui/ImageUpload.tsx')) {
      missingComponents.push('ImageUpload');
    }
    
    if (!fs.existsSync('./src/components/ui/DatePicker.tsx')) {
      missingComponents.push('DatePicker');
    }
    
    if (!fs.existsSync('./src/components/search/AdvancedSearch.tsx')) {
      missingComponents.push('AdvancedSearch');
    }
    
    if (!fs.existsSync('./src/components/dashboard/AnalyticsDashboard.tsx')) {
      missingComponents.push('AnalyticsDashboard');
    }
    
    if (missingComponents.length > 0) {
      console.log('🚫 Missing components that prevent build:');
      missingComponents.forEach(comp => {
        console.log(`   - ${comp}`);
      });
      console.log('\n💡 Creating placeholder components...\n');
      
      // Create missing components
      createMissingComponents(missingComponents);
      
      console.log('✅ Placeholder components created. Try building again.');
    }
    
    return;
  }
}

// Analyze actual bundle size issues
console.log('📊 Analyzing bundle composition...\n');

// Check bundle sizes
const staticDir = path.join(nextDir, 'static');
if (!fs.existsSync(staticDir)) {
  console.log('❌ No static directory found in build output');
  return;
}

const chunksDir = path.join(staticDir, 'chunks');
if (!fs.existsSync(chunksDir)) {
  console.log('❌ No chunks directory found');
  return;
}

// Get all JS files and their sizes
const jsFiles = [];
function scanDirectory(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath, `${prefix}${item}/`);
    } else if (item.endsWith('.js')) {
      jsFiles.push({
        name: `${prefix}${item}`,
        path: fullPath,
        size: stat.size,
        sizeKB: Math.round(stat.size / 1024 * 100) / 100,
        sizeMB: Math.round(stat.size / (1024 * 1024) * 100) / 100
      });
    }
  });
}

scanDirectory(chunksDir);

// Sort by size
jsFiles.sort((a, b) => b.size - a.size);

const totalSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;

console.log(`📦 Total Bundle Size: ${totalSizeMB}MB`);
console.log(`📄 Total JS Files: ${jsFiles.length}\n`);

console.log('🏆 Largest Files:');
jsFiles.slice(0, 10).forEach((file, index) => {
  const status = file.sizeMB > 1 ? '🔴' : file.sizeKB > 500 ? '🟡' : '🟢';
  console.log(`   ${index + 1}. ${status} ${file.name}: ${file.sizeMB}MB`);
});

// Identify problematic patterns
console.log('\n🔍 Bundle Analysis:');

const largeFiles = jsFiles.filter(file => file.sizeMB > 1);
const mediumFiles = jsFiles.filter(file => file.sizeKB > 500 && file.sizeMB <= 1);

if (largeFiles.length > 0) {
  console.log(`\n🔴 CRITICAL: ${largeFiles.length} files over 1MB:`);
  largeFiles.forEach(file => {
    console.log(`   • ${file.name}: ${file.sizeMB}MB`);
    
    // Analyze what might be in this file
    if (file.name.includes('main')) {
      console.log('     → Likely contains entire app bundle (needs code splitting)');
    }
    if (file.name.includes('vendor')) {
      console.log('     → Third-party libraries (needs optimization)');
    }
    if (file.name.includes('chunk')) {
      console.log('     → Large component or page (needs lazy loading)');
    }
  });
}

if (mediumFiles.length > 0) {
  console.log(`\n🟡 WARNING: ${mediumFiles.length} files over 500KB:`);
  mediumFiles.forEach(file => {
    console.log(`   • ${file.name}: ${file.sizeKB}KB`);
  });
}

// Provide specific recommendations
console.log('\n💡 IMMEDIATE FIXES NEEDED:\n');

if (totalSizeMB > 10) {
  console.log('🚨 CRITICAL: Bundle size is extremely large (>10MB)');
  console.log('   → This will cause severe performance issues');
  console.log('   → Users on slow connections may not be able to load the app');
  console.log('');
}

console.log('📋 Priority Actions:');
console.log('1. 🎯 Implement dynamic imports for all non-critical components');
console.log('2. 🗂️  Split vendor libraries into separate chunks');
console.log('3. 🔄 Use lazy loading for dashboard and admin components');
console.log('4. 📦 Remove unused dependencies from package.json');
console.log('5. 🌳 Enable tree shaking for all libraries');

console.log('\n🔧 Quick Fixes Available:');
console.log('   • Run: npm run bundle:optimize-quick');
console.log('   • This will apply immediate optimizations');

function createMissingComponents(components) {
  const placeholders = {
    'QRGenerator': `
import React from 'react';

const QRGenerator: React.FC<{ value: string; size?: number }> = ({ value, size = 200 }) => {
  return (
    <div 
      className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg"
      style={{ width: size, height: size }}
    >
      <div className="text-center">
        <div className="text-gray-500 text-sm">QR Code</div>
        <div className="text-gray-400 text-xs mt-1">Placeholder</div>
      </div>
    </div>
  );
};

export default QRGenerator;
`,
    'RichTextEditor': `
import React from 'react';

const RichTextEditor: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  return (
    <textarea
      className="w-full min-h-32 p-3 border border-gray-300 rounded-lg resize-y"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter text here..."
    />
  );
};

export default RichTextEditor;
`,
    'AdvancedCharts': `
import React from 'react';

const AdvancedCharts: React.FC<{ data: any; type?: string }> = ({ data, type = 'line' }) => {
  return (
    <div className="w-full h-80 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-500 text-lg">Chart Placeholder</div>
        <div className="text-gray-400 text-sm mt-1">Type: {type}</div>
      </div>
    </div>
  );
};

export default AdvancedCharts;
`,
    'ImageUpload': `
import React from 'react';

const ImageUpload: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  return (
    <div className="w-full h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-500 text-sm">Image Upload</div>
        <div className="text-gray-400 text-xs mt-1">Placeholder</div>
      </div>
    </div>
  );
};

export default ImageUpload;
`,
    'DatePicker': `
import React from 'react';

const DatePicker: React.FC<{ value?: Date; onChange: (date: Date) => void }> = ({ value, onChange }) => {
  return (
    <input
      type="date"
      className="px-3 py-2 border border-gray-300 rounded-lg"
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  );
};

export default DatePicker;
`,
    'AdvancedSearch': `
import React from 'react';

const AdvancedSearch: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  return (
    <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <input
        type="text"
        placeholder="Advanced search placeholder..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
};

export default AdvancedSearch;
`,
    'AnalyticsDashboard': `
import React from 'react';

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
            <div className="mt-2 text-sm text-gray-500">Metric {i}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
`
  };

  components.forEach(componentName => {
    const componentCode = placeholders[componentName];
    if (componentCode) {
      let filePath;
      
      if (componentName === 'AnalyticsDashboard') {
        filePath = './src/components/dashboard/AnalyticsDashboard.tsx';
      } else if (componentName === 'AdvancedSearch') {
        filePath = './src/components/search/AdvancedSearch.tsx';
      } else if (componentName === 'AdvancedCharts') {
        filePath = './src/components/charts/AdvancedCharts.tsx';
      } else {
        filePath = `./src/components/ui/${componentName}.tsx`;
      }
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write component file
      fs.writeFileSync(filePath, componentCode.trim());
      console.log(`✅ Created: ${filePath}`);
    }
  });
}