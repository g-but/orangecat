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

// REMOVED: console.log statement

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
  for (let port = startPort; port <= startPort + 20; port++) {
    const inUse = await checkPort(port);
    if (!inUse) {
      return port;
    }
  }
  return startPort + 21; // fallback
}

async function showDevLinks() {
  // REMOVED: console.log statement
  
  const availablePort = await findAvailablePort(3000);
  
  // Display all development server links
  // REMOVED: console.log statement
  
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement for security
  
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  // Auto-start the server (like before)
  // REMOVED: console.log statement
  
  // Start the Next.js development server
  const nextProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: availablePort }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    // REMOVED: console.log statement
    nextProcess.kill('SIGINT');
    process.exit(0);
  });
  
  nextProcess.on('close', (code) => {
    if (code !== 0) {
      // REMOVED: console.log statement
    } else {
      // REMOVED: console.log statement
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