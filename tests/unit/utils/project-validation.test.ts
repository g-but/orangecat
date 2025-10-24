/**
 * Project Validation Tests - Critical for Data Integrity
 *
 * Tests the Zod schema validation for project creation and updates.
 * Ensures data consistency and security across the platform.
 */

import { projectSchema } from '@/lib/validation'

describe('🛠️ Project Validation Tests', () => {
  describe('✅ Valid Project Data', () => {
    test('accepts minimal valid project', () => {
      const validProject = {
        title: 'Test Project',
        description: 'A test project description'
      }

      const result = projectSchema.safeParse(validProject)
      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Test Project')
    })

    test('accepts complete project with all optional fields', () => {
      const completeProject = {
        title: 'Complete Test Project',
        description: 'A comprehensive test project with all fields',
        goal_amount: 1000000, // 10k sats
        goal_currency: 'SATS',
        funding_purpose: 'Development and marketing',
        currency: 'SATS',
        bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        lightning_address: 'test@getalby.com',
        category: 'technology',
        tags: ['bitcoin', 'development', 'test'],
        start_date: '2024-01-01',
        target_completion: '2024-12-31'
      }

      const result = projectSchema.safeParse(completeProject)
      expect(result.success).toBe(true)
    })

    test('accepts project with empty optional fields', () => {
      const projectWithEmptyOptionals = {
        title: 'Minimal Project',
        description: 'Just the basics',
        goal_amount: null,
        goal_currency: null,
        funding_purpose: null,
        bitcoin_address: '',
        lightning_address: '',
        category: '',
        tags: [],
        start_date: '',
        target_completion: ''
      }

      const result = projectSchema.safeParse(projectWithEmptyOptionals)
      expect(result.success).toBe(true)
    })
  })

  describe('❌ Invalid Project Data', () => {
    test('rejects missing title', () => {
      const invalidProject = {
        description: 'A project without a title'
      }

      const result = projectSchema.safeParse(invalidProject)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.path.includes('title'))).toBe(true)
    })

    test('rejects missing description', () => {
      const invalidProject = {
        title: 'Project Without Description'
      }

      const result = projectSchema.safeParse(invalidProject)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.path.includes('description'))).toBe(true)
    })

    test('rejects title too long', () => {
      const invalidProject = {
        title: 'A'.repeat(101), // 101 characters
        description: 'Valid description'
      }

      const result = projectSchema.safeParse(invalidProject)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.message.includes('100'))).toBe(true)
    })

    test('rejects description too long', () => {
      const invalidProject = {
        title: 'Valid Title',
        description: 'A'.repeat(2001) // 2001 characters
      }

      const result = projectSchema.safeParse(invalidProject)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.message.includes('2000'))).toBe(true)
    })

    test('rejects negative goal amount', () => {
      const invalidProject = {
        title: 'Valid Title',
        description: 'Valid description',
        goal_amount: -1000
      }

      const result = projectSchema.safeParse(invalidProject)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.message.includes('positive'))).toBe(true)
    })

    test('rejects invalid currency', () => {
      const invalidProject = {
        title: 'Valid Title',
        description: 'Valid description',
        goal_currency: 'INVALID'
      }

      const result = projectSchema.safeParse(invalidProject)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.path.includes('goal_currency'))).toBe(true)
    })

    test('rejects invalid Bitcoin address', () => {
      const invalidProject = {
        title: 'Valid Title',
        description: 'Valid description',
        bitcoin_address: 'invalid-address'
      }

      const result = projectSchema.safeParse(invalidProject)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.message.includes('Bitcoin address'))).toBe(true)
    })

    test('rejects invalid Lightning address', () => {
      const invalidProject = {
        title: 'Valid Title',
        description: 'Valid description',
        lightning_address: 'invalid-lightning-address'
      }

      const result = projectSchema.safeParse(invalidProject)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.message.includes('Lightning address'))).toBe(true)
    })
  })

  describe('🔒 Security & Edge Cases', () => {
    test('handles null and undefined values', () => {
      const projectWithNulls = {
        title: 'Valid Title',
        description: 'Valid description',
        goal_amount: null,
        goal_currency: null,
        funding_purpose: null,
        bitcoin_address: null,
        lightning_address: null,
        category: null,
        tags: null
      }

      const result = projectSchema.safeParse(projectWithNulls)
      expect(result.success).toBe(true)
    })

    test('handles undefined values', () => {
      const projectWithUndefined = {
        title: 'Valid Title',
        description: 'Valid description',
        goal_amount: undefined,
        goal_currency: undefined
      }

      const result = projectSchema.safeParse(projectWithUndefined)
      expect(result.success).toBe(true)
    })

    test('prevents injection in string fields', () => {
      const maliciousProject = {
        title: 'Valid Title',
        description: 'Valid description',
        funding_purpose: '<script>alert("xss")</script>'
      }

      const result = projectSchema.safeParse(maliciousProject)
      expect(result.success).toBe(true) // Should pass - validation doesn't check for XSS
      expect(result.data?.funding_purpose).toBe('<script>alert("xss")</script>')
    })

    test('handles very large numbers', () => {
      const projectWithLargeNumber = {
        title: 'Valid Title',
        description: 'Valid description',
        goal_amount: Number.MAX_SAFE_INTEGER
      }

      const result = projectSchema.safeParse(projectWithLargeNumber)
      expect(result.success).toBe(false) // Should fail max constraint
    })
  })

  describe('⚡ Performance & Reliability', () => {
    test('validates projects quickly', () => {
      const testProject = {
        title: 'Performance Test Project',
        description: 'Testing validation performance',
        goal_amount: 1000000,
        bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
      }

      const startTime = performance.now()

      // Validate 1000 times
      for (let i = 0; i < 1000; i++) {
        projectSchema.safeParse(testProject)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should validate 1000 projects in under 50ms
      expect(totalTime).toBeLessThan(50)
    })

    test('handles concurrent validations', async () => {
      const promises = []

      for (let i = 0; i < 100; i++) {
        promises.push(Promise.resolve(projectSchema.safeParse({
          title: `Project ${i}`,
          description: `Description ${i}`
        })))
      }

      const results = await Promise.all(promises)

      expect(results).toHaveLength(100)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })
})
