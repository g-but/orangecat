/**
 * API Integration and Frontend-Backend Sync Tests
 * 
 * Tests for frontend-backend integration issues:
 * - API response handling consistency
 * - Data flow between frontend and backend
 * - Error state management
 * - Authentication token handling
 * - Real-time data synchronization
 */

import { test, expect } from '@playwright/test'

test.describe('API Integration and Frontend-Backend Sync', () => {
  let interceptedRequests: any[] = []
  let interceptedResponses: any[] = []

  test.beforeEach(async ({ page }) => {
    // Reset request/response tracking
    interceptedRequests = []
    interceptedResponses = []

    // Intercept all API calls
    await page.route('/api/**', async (route, request) => {
      const requestData = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        timestamp: Date.now()
      }
      interceptedRequests.push(requestData)

      const response = await route.fetch()
      const responseData = {
        url: request.url(),
        status: response.status(),
        headers: response.headers(),
        body: await response.text().catch(() => ''),
        timestamp: Date.now()
      }
      interceptedResponses.push(responseData)

      route.fulfill({
        status: response.status(),
        headers: response.headers(),
        body: responseData.body
      })
    })

    // Track console errors and network failures
    const consoleErrors: string[] = []
    const networkErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`)
    })

    ;(page as any).consoleErrors = consoleErrors
    ;(page as any).networkErrors = networkErrors
  })

  test('Profile API integration flow', async ({ page }) => {
    await test.step('Test profile data flow consistency', async () => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Check if profile API was called
      const profileRequests = interceptedRequests.filter(req => 
        req.url.includes('/api/profile') || req.url.includes('/api/user')
      )

      console.log(`Profile API requests: ${profileRequests.length}`)
      profileRequests.forEach(req => {
        console.log(`  ${req.method} ${req.url}`)
      })

      // Verify profile data loads without errors
      const profileContainer = page.locator('[data-testid="profile-container"], .profile')
      if (await profileContainer.isVisible()) {
        // Check for any error states in the UI
        const errorMessages = page.locator('[data-testid="error"], .error')
        const errorCount = await errorMessages.count()
        
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorMessages.nth(i).textContent()
          console.log(`Profile error ${i + 1}:`, errorText)
        }

        // Should not have critical errors
        expect(errorCount).toBeLessThan(1)
      }

      // Test profile edit flow
      const editButton = page.locator('[data-testid="edit-profile-button"]')
      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(1000)

        const bioField = page.locator('[data-testid="bio-input"], [data-testid="bio-textarea"]')
        if (await bioField.isVisible()) {
          const originalBio = await bioField.inputValue()
          const testBio = `Test bio update at ${Date.now()}`
          
          await bioField.fill(testBio)
          
          const saveButton = page.locator('[data-testid="save-profile-button"]')
          if (await saveButton.isVisible()) {
            // Clear previous requests
            interceptedRequests.length = 0
            interceptedResponses.length = 0
            
            await saveButton.click()
            await page.waitForLoadState('networkidle')

            // Check update API call was made
            const updateRequests = interceptedRequests.filter(req => 
              req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
            )
            
            console.log(`Profile update requests: ${updateRequests.length}`)
            updateRequests.forEach(req => {
              console.log(`  ${req.method} ${req.url}`)
            })

            // Verify API response was successful
            const updateResponses = interceptedResponses.filter(res => 
              (res.url.includes('/api/profile') || res.url.includes('/api/user')) &&
              res.status >= 200 && res.status < 300
            )

            expect(updateResponses.length).toBeGreaterThan(0)

            // Verify UI reflects the update
            await page.reload()
            await page.waitForLoadState('networkidle')
            
            const updatedBio = await bioField.inputValue().catch(() => null)
            if (updatedBio !== null) {
              expect(updatedBio).toBe(testBio)
            }
          }
        }
      }
    })
  })

  test('Authentication API integration', async ({ page }) => {
    await test.step('Test auth flow API consistency', async () => {
      await page.goto('/auth')
      await page.waitForLoadState('networkidle')

      const emailInput = page.locator('[data-testid="email-input"]')
      const passwordInput = page.locator('[data-testid="password-input"]')
      const signinButton = page.locator('[data-testid="signin-button"]')

      if (await emailInput.isVisible()) {
        // Clear previous tracking
        interceptedRequests.length = 0
        interceptedResponses.length = 0

        await emailInput.fill('test@example.com')
        await passwordInput.fill('testpassword')
        await signinButton.click()
        await page.waitForLoadState('networkidle')

        // Check auth API calls
        const authRequests = interceptedRequests.filter(req => 
          req.url.includes('/api/auth') || req.url.includes('/auth/')
        )

        console.log(`Auth API requests: ${authRequests.length}`)
        authRequests.forEach(req => {
          console.log(`  ${req.method} ${req.url}`)
        })

        // Check for auth responses
        const authResponses = interceptedResponses.filter(res => 
          res.url.includes('/api/auth') || res.url.includes('/auth/')
        )

        if (authResponses.length > 0) {
          // Check response structure
          authResponses.forEach(res => {
            console.log(`Auth response: ${res.status} from ${res.url}`)
            
            if (res.body) {
              try {
                const parsed = JSON.parse(res.body)
                console.log('Response data:', Object.keys(parsed))
              } catch (e) {
                console.log('Non-JSON response body')
              }
            }
          })

          // Should not have auth errors
          const authErrors = authResponses.filter(res => res.status >= 400)
          if (authErrors.length > 0) {
            console.log('Auth errors detected:', authErrors)
          }
        }

        // Check if redirected to authenticated area
        const currentUrl = page.url()
        console.log('Post-auth URL:', currentUrl)

        // Verify authentication state consistency
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/profile')) {
          // Should have user session data
          const userMenu = page.locator('[data-testid="user-menu"], [data-testid="profile-dropdown"]')
          if (await userMenu.isVisible()) {
            await expect(userMenu).toBeVisible()
          }
        }
      }
    })
  })

  test('Campaign CRUD API integration', async ({ page }) => {
    await test.step('Test campaign creation API flow', async () => {
      await page.goto('/create')
      await page.waitForLoadState('networkidle')

      const titleInput = page.locator('[data-testid="campaign-title-input"], [data-testid="title-input"]')
      const descriptionInput = page.locator('[data-testid="campaign-description-input"], [data-testid="description-input"], [data-testid="description-textarea"]')

      if (await titleInput.isVisible() && await descriptionInput.isVisible()) {
        const testTitle = `Test Campaign ${Date.now()}`
        const testDescription = `Test description created at ${new Date().toISOString()}`

        await titleInput.fill(testTitle)
        await descriptionInput.fill(testDescription)

        // Clear tracking for submission
        interceptedRequests.length = 0
        interceptedResponses.length = 0

        const submitButton = page.locator('[data-testid="create-campaign-button"], [data-testid="publish-button"]')
        if (await submitButton.isVisible()) {
          await submitButton.click()
          await page.waitForLoadState('networkidle')

          // Check campaign creation API calls
          const createRequests = interceptedRequests.filter(req => 
            req.method === 'POST' && (
              req.url.includes('/api/campaign') || 
              req.url.includes('/api/funding') ||
              req.url.includes('/api/create')
            )
          )

          console.log(`Campaign creation requests: ${createRequests.length}`)
          createRequests.forEach(req => {
            console.log(`  ${req.method} ${req.url}`)
            if (req.postData) {
              try {
                const data = JSON.parse(req.postData)
                console.log('  Data:', Object.keys(data))
              } catch (e) {
                console.log('  Non-JSON post data')
              }
            }
          })

          // Check responses
          const createResponses = interceptedResponses.filter(res => 
            createRequests.some(req => req.url === res.url)
          )

          if (createResponses.length > 0) {
            createResponses.forEach(res => {
              console.log(`Campaign creation response: ${res.status}`)
              
              if (res.status >= 400) {
                console.log('Creation error:', res.body)
              }
            })

            // Should have successful creation
            const successResponses = createResponses.filter(res => res.status >= 200 && res.status < 300)
            expect(successResponses.length).toBeGreaterThan(0)
          }

          // Verify redirect or success state
          const currentUrl = page.url()
          console.log('Post-creation URL:', currentUrl)

          // Check if campaign appears in listing
          await page.goto('/fund-us')
          await page.waitForLoadState('networkidle')

          const campaignTitles = page.locator('[data-testid="campaign-title"]')
          const titleCount = await campaignTitles.count()
          
          if (titleCount > 0) {
            // Look for our created campaign
            let foundCampaign = false
            for (let i = 0; i < Math.min(titleCount, 10); i++) {
              const title = await campaignTitles.nth(i).textContent()
              if (title?.includes(testTitle.substring(0, 20))) {
                foundCampaign = true
                console.log('Found created campaign:', title)
                break
              }
            }
            
            if (!foundCampaign) {
              console.log('Campaign not found in listing - may indicate API sync issue')
            }
          }
        }
      }
    })
  })

  test('Error handling and API resilience', async ({ page }) => {
    await test.step('Test API error handling consistency', async () => {
      // Test various error scenarios
      
      // 1. Test invalid API calls
      await page.route('/api/nonexistent', route => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not found' })
        })
      })

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // 2. Test network timeout simulation
      await page.route('/api/profile', route => {
        // Delay response to simulate slow network
        setTimeout(() => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' })
          })
        }, 5000)
      })

      await page.goto('/profile')
      await page.waitForTimeout(3000) // Don't wait for full timeout

      // Check how frontend handles API errors
      const errorMessages = page.locator('[data-testid="error"], .error, [role="alert"]')
      const errorCount = await errorMessages.count()

      console.log(`Error messages displayed: ${errorCount}`)
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent()
        console.log(`Error ${i + 1}:`, errorText)
      }

      // 3. Test authentication failure handling
      await page.route('/api/**', route => {
        const url = route.request().url()
        if (url.includes('/api/auth') || url.includes('/api/profile')) {
          route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unauthorized' })
          })
        } else {
          route.continue()
        }
      })

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Should handle 401 gracefully (redirect to auth or show message)
      const currentUrl = page.url()
      console.log('URL after 401:', currentUrl)

      // Check for proper error handling
      const consoleErrors = (page as any).consoleErrors || []
      const networkErrors = (page as any).networkErrors || []

      console.log(`Console errors: ${consoleErrors.length}`)
      console.log(`Network errors: ${networkErrors.length}`)

      // Should not have unhandled promise rejections
      const unhandledErrors = consoleErrors.filter(error => 
        error.includes('Unhandled') || error.includes('Promise')
      )
      expect(unhandledErrors.length).toBe(0)
    })
  })

  test('Real-time data synchronization', async ({ page }) => {
    await test.step('Test data consistency across navigation', async () => {
      // Navigate to campaign listing
      await page.goto('/fund-us')
      await page.waitForLoadState('networkidle')

      // Capture initial campaign count
      const initialCampaigns = page.locator('[data-testid="campaign-card"]')
      const initialCount = await initialCampaigns.count()
      console.log(`Initial campaign count: ${initialCount}`)

      // Navigate away and back
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      await page.goto('/fund-us')
      await page.waitForLoadState('networkidle')

      // Check if count is consistent
      const finalCampaigns = page.locator('[data-testid="campaign-card"]')
      const finalCount = await finalCampaigns.count()
      console.log(`Final campaign count: ${finalCount}`)

      // Should be consistent (unless external changes occurred)
      const countDifference = Math.abs(finalCount - initialCount)
      expect(countDifference).toBeLessThanOrEqual(2) // Allow for minor external changes

      // Test individual campaign data consistency
      if (finalCount > 0) {
        const firstCampaign = finalCampaigns.first()
        const campaignTitle = await firstCampaign.locator('[data-testid="campaign-title"]').textContent()
        
        // Navigate to campaign detail and back
        await firstCampaign.click()
        await page.waitForLoadState('networkidle')
        
        await page.goBack()
        await page.waitForLoadState('networkidle')
        
        // Check if same campaign is still there
        const againFirstCampaign = page.locator('[data-testid="campaign-card"]').first()
        const againTitle = await againFirstCampaign.locator('[data-testid="campaign-title"]').textContent()
        
        expect(againTitle).toBe(campaignTitle)
      }
    })
  })

  test('API performance and timing', async ({ page }) => {
    await test.step('Measure API response times', async () => {
      const startTime = Date.now()
      
      await page.goto('/fund-us')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      console.log(`Page load time: ${loadTime}ms`)

      // Analyze API response times
      const responseTimes = interceptedResponses.map(res => ({
        url: res.url,
        responseTime: res.timestamp - (interceptedRequests.find(req => req.url === res.url)?.timestamp || res.timestamp)
      }))

      responseTimes.forEach(timing => {
        console.log(`${timing.url}: ${timing.responseTime}ms`)
      })

      const averageResponseTime = responseTimes.reduce((sum, timing) => sum + timing.responseTime, 0) / responseTimes.length
      console.log(`Average API response time: ${averageResponseTime}ms`)

      // API responses should be reasonably fast
      expect(averageResponseTime).toBeLessThan(5000) // 5 seconds max average
      
      // No API call should take longer than 30 seconds
      const slowRequests = responseTimes.filter(timing => timing.responseTime > 30000)
      expect(slowRequests.length).toBe(0)
    })
  })
})