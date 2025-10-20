import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3003',
    video: true,
    screenshotOnRunFailure: true,
    retries: 1,
    setupNodeEvents() {
      // implement node event listeners here if needed
    },
  },
})

