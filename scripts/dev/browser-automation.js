#!/usr/bin/env node

const { chromium } = require('playwright');
const readline = require('readline');

class BrowserAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.context = null;
  }

  async start() {
    // REMOVED: console.log statement
    
    // Launch browser with visible window
    this.browser = await chromium.launch({ 
      headless: false,
      devtools: true,
      args: ['--start-maximized']
    });
    
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    
    // Set up console logging from browser
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        // REMOVED: console.log statement
      } else if (type === 'warn') {
        // REMOVED: console.log statement
      } else {
        // REMOVED: console.log statement
      }
    });

    // Set up page error logging
    this.page.on('pageerror', error => {
      // REMOVED: console.log statement
    });

    // Navigate to the app
    // REMOVED: console.log statement
    await this.page.goto('http://localhost:3003');
    
    if (process.env.NODE_ENV === 'development') console.log('✅ Browser automation ready!');
    if (process.env.NODE_ENV === 'development') console.log('🎯 Available commands:');
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    this.startCommandInterface();
  }

  startCommandInterface() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 Browser> '
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const command = line.trim();
      await this.executeCommand(command);
      rl.prompt();
    });

    rl.on('close', async () => {
      // REMOVED: console.log statement
      await this.cleanup();
      process.exit(0);
    });
  }

  async executeCommand(command) {
    const [cmd, ...args] = command.split(' ');

    try {
      switch (cmd) {
        case 'navigate':
          await this.page.goto(args[0]);
          if (process.env.NODE_ENV === 'development') console.log(`✅ Navigated to ${args[0]}`);
          break;

        case 'click':
          await this.page.click(args[0]);
          // REMOVED: console.log statement
          break;

        case 'type':
          const selector = args[0];
          const text = args.slice(1).join(' ');
          await this.page.fill(selector, text);
          if (process.env.NODE_ENV === 'development') console.log(`✅ Typed "${text}" in ${selector}`);
          break;

        case 'screenshot':
          const screenshotPath = `screenshot-${Date.now()}.png`;
          await this.page.screenshot({ path: screenshotPath });
          // REMOVED: console.log statement
          break;

        case 'auth':
          await this.page.goto('http://localhost:3003/auth');
          // REMOVED: console.log statement for security
          break;

        case 'dashboard':
          await this.page.goto('http://localhost:3003/dashboard');
          if (process.env.NODE_ENV === 'development') console.log('✅ Navigated to dashboard');
          break;

        case 'login':
          if (args.length < 2) {
            // REMOVED: console.log statement for security
            break;
          }
          await this.performLogin(args[0], args[1]);
          break;

        case 'status':
          await this.getPageStatus();
          break;

        case 'quit':
        case 'exit':
          await this.cleanup();
          process.exit(0);
          break;

        default:
          // REMOVED: console.log statement
      }
    } catch (error) {
      // REMOVED: console.log statement
    }
  }

  async performLogin(email, password) {
    // REMOVED: console.log statement for security
    
    // Wait for auth page to load
    await this.page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill in credentials
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect or error
    try {
      await this.page.waitForURL('**/dashboard', { timeout: 10000 });
      if (process.env.NODE_ENV === 'development') console.log('✅ Login successful! Redirected to dashboard');
    } catch (error) {
      // REMOVED: console.log statement for security
      await this.getPageStatus();
    }
  }

  async getPageStatus() {
    const url = this.page.url();
    const title = await this.page.title();
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // Check for loading states
    const isLoading = await this.page.locator('[data-testid="loading"], .animate-spin, .loading').count() > 0;
    if (isLoading) {
      // REMOVED: console.log statement
    }
    
    // Check for error messages
    const hasError = await this.page.locator('[role="alert"], .error, .text-red').count() > 0;
    if (hasError) {
      const errorText = await this.page.locator('[role="alert"], .error, .text-red').first().textContent();
      // REMOVED: console.log statement
    }
    
    // Check authentication state
    const hasAuthButton = await this.page.locator('text="Sign In", text="Login"').count() > 0;
    const hasUserMenu = await this.page.locator('[data-testid="user-menu"], .user-profile').count() > 0;
    
    if (hasAuthButton) {
      // REMOVED: console.log statement for security
    } else if (hasUserMenu) {
      // REMOVED: console.log statement
    } else {
      // REMOVED: console.log statement for security
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Start the automation
const automation = new BrowserAutomation();
automation.start().catch(console.error); 