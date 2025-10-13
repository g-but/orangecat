#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');

// Create a safe color function that works with different chalk versions
function createColors() {
  try {
    // Create color functions with bold method
    const createColorFunction = (colorFn) => {
      const fn = colorFn;
      fn.bold = (str) => chalk.bold(colorFn(str));
      return fn;
    };

    return {
      primary: createColorFunction(chalk.yellow), // Fallback to yellow for Bitcoin Orange
      success: createColorFunction(chalk.green),
      info: createColorFunction(chalk.cyan),
      warning: createColorFunction(chalk.yellow),
      error: createColorFunction(chalk.red),
      dim: createColorFunction(chalk.gray)
    };
  } catch (e) {
    // If chalk fails completely, return no-op functions
    const noColor = (str) => str;
    noColor.bold = (str) => str;
    return {
      primary: noColor,
      success: noColor,
      info: noColor,
      warning: noColor,
      error: noColor,
      dim: noColor
    };
  }
}

const colors = createColors();

console.log('\n🚀 Starting OrangeCat Development Environment...\n');

// Function to check if port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });

    server.on('error', () => resolve(true));
  });
}

// Function to find available port starting from 3000
async function findAvailablePort(startPort = 3000) {
  console.log(`🔍 Checking available ports starting from ${startPort}...`);
  for (let port = startPort; port <= startPort + 20; port++) {
    const inUse = await checkPort(port);
    if (!inUse) {
      console.log(`✅ Found available port: ${port}`);
      return port;
    }
  }
  console.log(`⚠️ No ports available in range ${startPort}-${startPort + 20}, using ${startPort + 21}`);
  return startPort + 21; // fallback
}

async function showDevLinks() {
  console.log('🔧 Setting up development environment...\n');

  const availablePort = await findAvailablePort(3000);
  
  // Display all development server links
  console.log(`🌐 Development servers will be available at:`);
  console.log(`   • Local:        http://localhost:${availablePort}`);
  console.log(`   • Network:      http://127.0.0.1:${availablePort}`);
  console.log(`   • Environment:  .env.local`);
  console.log(`\n📱 Mobile testing:`);
  console.log(`   • iOS Safari:   http://127.0.0.1:${availablePort}`);
  console.log(`   • Android:      http://127.0.0.1:${availablePort}`);
  console.log(`\n🔧 Press Ctrl+C to stop the development server\n`);

  console.log(`🎯 Starting Next.js development server on port ${availablePort}...`);

  // Auto-start the server (like before)
  console.log(`⚡ Launching development environment...`);

  // Start the Next.js development server
  const nextProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: availablePort }
  });

  console.log(`\n✅ OrangeCat development server starting...`);
  console.log(`📊 You can monitor progress above\n`);

  // Handle process termination
  process.on('SIGINT', () => {
    console.log(`\n🛑 Shutting down OrangeCat development server...`);
    nextProcess.kill('SIGINT');
    process.exit(0);
  });

  nextProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`❌ Development server exited with code ${code}`);
    } else {
      console.log(`✅ Development server shut down cleanly`);
    }
    process.exit(code);
  });

}

// Check if chalk is available, if not provide fallback
try {
  require.resolve('chalk');
} catch (e) {
  // Fallback without colors if chalk is not available
  const noColor = (str) => str;
  Object.keys(colors).forEach(key => {
    colors[key] = noColor;
    colors[key].bold = noColor;
  });
}

showDevLinks().catch(console.error); 