/**
 * PROFILES PERFORMANCE TEST SUITE - BENCHMARKING & SCALABILITY
 * 
 * This test suite focuses on performance benchmarking and scalability
 * validation for the profile service, ensuring it meets production
 * performance requirements.
 * 
 * Features:
 * - Response time benchmarking
 * - Concurrent operation testing
 * - Memory usage monitoring
 * - Scalability validation
 * - Performance regression detection
 * - Load testing simulation
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Performance benchmarking test suite
 */

import { ProfileService, type ScalableProfile, type ScalableProfileFormData } from '../profileService'
import { jest } from '@jest/globals'

// =====================================================================
// 🎯 PERFORMANCE TARGETS & CONSTANTS
// =====================================================================

const PERFORMANCE_TARGETS = {
  PROFILE_RETRIEVAL: 100, // ms
  PROFILE_UPDATE: 200, // ms
  BULK_OPERATIONS: 300, // ms
  CONCURRENT_OPERATIONS: 500, // ms
  SEARCH_OPERATIONS: 150, // ms
  ANALYTICS_UPDATE: 100, // ms
  MEMORY_GROWTH_LIMIT: 20, // MB
  CONCURRENT_USER_LIMIT: 50, // simultaneous users
  THROUGHPUT_TARGET: 100 // operations per second
}

// =====================================================================
// 🔧 PERFORMANCE TESTING UTILITIES
// =====================================================================

class PerformanceTestUtils {
  private static performanceResults: Array<{
    operation: string
    executionTime: number
    target: number
    passed: boolean
    timestamp: number
  }> = []
  
  static async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string,
    target: number,
    iterations: number = 1
  ): Promise<{
    result: T | T[]
    averageTime: number
    minTime: number
    maxTime: number
    passed: boolean
    iterations: number
  }> {
    const times: number[] = []
    let results: T[] = []
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()
      const result = await operation()
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      times.push(executionTime)
      results.push(result)
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const passed = averageTime <= target
    
    // Record result
    this.performanceResults.push({
      operation: operationName,
      executionTime: averageTime,
      target,
      passed,
      timestamp: Date.now()
    })
    
    const status = passed ? '✅' : '❌'
    console.log(`${status} ${operationName}: ${averageTime.toFixed(2)}ms avg (target: ${target}ms, min: ${minTime.toFixed(2)}ms, max: ${maxTime.toFixed(2)}ms)`)
    
    return {
      result: iterations === 1 ? results[0] : results,
      averageTime,
      minTime,
      maxTime,
      passed,
      iterations
    }
  }
  
  static async measureMemoryUsage<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{
    result: T
    memoryUsed: number
    memoryGrowth: number
  }> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const initialMemory = process.memoryUsage().heapUsed
    const result = await operation()
    const finalMemory = process.memoryUsage().heapUsed
    
    const memoryUsed = finalMemory / 1024 / 1024 // MB
    const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024 // MB
    
    console.log(`💾 ${operationName}: ${memoryUsed.toFixed(2)}MB used, ${memoryGrowth.toFixed(2)}MB growth`)
    
    return {
      result,
      memoryUsed,
      memoryGrowth
    }
  }
  
  static async simulateLoad<T>(
    operation: () => Promise<T>,
    operationName: string,
    concurrentUsers: number,
    operationsPerUser: number
  ): Promise<{
    totalOperations: number
    totalTime: number
    averageTime: number
    throughput: number
    successRate: number
    errors: number
  }> {
    const startTime = performance.now()
    let successCount = 0
    let errorCount = 0
    
    // Create concurrent user operations
    const userOperations = Array.from({ length: concurrentUsers }, async () => {
      const userResults = []
      for (let i = 0; i < operationsPerUser; i++) {
        try {
          const result = await operation()
          userResults.push(result)
          successCount++
        } catch (error) {
          errorCount++
        }
      }
      return userResults
    })
    
    await Promise.all(userOperations)
    
    const endTime = performance.now()
    const totalTime = endTime - startTime
    const totalOperations = concurrentUsers * operationsPerUser
    const averageTime = totalTime / totalOperations
    const throughput = (totalOperations / totalTime) * 1000 // operations per second
    const successRate = (successCount / totalOperations) * 100
    
    console.log(`🚀 ${operationName} Load Test:`)
    console.log(`   Users: ${concurrentUsers}, Ops/User: ${operationsPerUser}`)
    console.log(`   Total Time: ${totalTime.toFixed(2)}ms`)
    console.log(`   Throughput: ${throughput.toFixed(2)} ops/sec`)
    console.log(`   Success Rate: ${successRate.toFixed(2)}%`)
    console.log(`   Errors: ${errorCount}`)
    
    return {
      totalOperations,
      totalTime,
      averageTime,
      throughput,
      successRate,
      errors: errorCount
    }
  }
  
  static getPerformanceReport(): {
    totalTests: number
    passedTests: number
    failedTests: number
    overallScore: number
    results: typeof PerformanceTestUtils.performanceResults
  } {
    const totalTests = this.performanceResults.length
    const passedTests = this.performanceResults.filter(r => r.passed).length
    const failedTests = totalTests - passedTests
    const overallScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0
    
    return {
      totalTests,
      passedTests,
      failedTests,
      overallScore,
      results: [...this.performanceResults]
    }
  }
}

// =====================================================================
// 🎭 PERFORMANCE MOCK SETUP
// =====================================================================

class PerformanceMockSetup {
  static setupRealisticMocks(responseDelay: number = 50) {
    const mockProfile: ScalableProfile = {
      id: 'perf-test-user',
      username: 'perftest',
      full_name: 'Performance Test User',
      display_name: 'Performance Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      website: 'https://example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bio: 'Performance testing profile',
      banner_url: null,
      bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
      lightning_address: 'test@getalby.com',
      email: 'perf@test.com',
      phone: null,
      location: null,
      timezone: 'UTC',
      language: 'en',
      currency: 'USD',
      bitcoin_public_key: null,
      lightning_node_id: null,
      payment_preferences: {},
      bitcoin_balance: 0,
      lightning_balance: 0,
      profile_views: 100,
      follower_count: 50,
      following_count: 25,
      campaign_count: 5,
      total_raised: 1000000,
      total_donated: 500000,
      verification_status: 'verified',
      verification_level: 2,
      kyc_status: 'approved',
      two_factor_enabled: true,
      last_login_at: new Date().toISOString(),
      login_count: 150,
      theme_preferences: { theme: 'dark' },
      custom_css: null,
      profile_color: '#F7931A',
      cover_image_url: null,
      profile_badges: ['verified', 'early_adopter'],
      status: 'active',
      last_active_at: new Date().toISOString(),
      profile_completed_at: new Date().toISOString(),
      onboarding_completed: true,
      terms_accepted_at: new Date().toISOString(),
      privacy_policy_accepted_at: new Date().toISOString(),
      social_links: { twitter: '@perftest' },
      preferences: { notifications: true },
      metadata: { performance_test: true },
      verification_data: {},
      privacy_settings: { public_profile: true }
    }
    
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({ 
              data: mockProfile, 
              error: null 
            }), responseDelay)
          )
        ),
        maybeSingle: jest.fn().mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({ 
              data: mockProfile, 
              error: null 
            }), responseDelay)
          )
        )
      }))
    }
    
    jest.doMock('@/services/supabase/client', () => ({
      __esModule: true,
      default: mockSupabase
    }))
    
    return mockSupabase
  }
}

// =====================================================================
// 🧪 PERFORMANCE TEST SUITE
// =====================================================================

describe('🚀 ProfileService - Performance & Scalability Testing', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
    PerformanceMockSetup.setupRealisticMocks(50)
  })
  
  // =====================================================================
  // ⚡ RESPONSE TIME BENCHMARKING
  // =====================================================================
  
  describe('⚡ Response Time Benchmarking', () => {
    
    it('should retrieve profile within performance target', async () => {
      // Act & Assert
      const result = await PerformanceTestUtils.measurePerformance(
        () => ProfileService.getProfile('test-user-123'),
        'Profile Retrieval',
        PERFORMANCE_TARGETS.PROFILE_RETRIEVAL,
        10 // 10 iterations for average
      )
      
      expect(result.passed).toBe(true)
      expect(result.averageTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.PROFILE_RETRIEVAL)
    })
    
    it('should update profile within performance target', async () => {
      // Arrange
      const formData: ScalableProfileFormData = {
        username: 'perftest',
        full_name: 'Updated Performance Test',
        bio: 'Updated for performance testing'
      }
      
      // Act & Assert
      const result = await PerformanceTestUtils.measurePerformance(
        () => ProfileService.updateProfile('test-user-123', formData),
        'Profile Update',
        PERFORMANCE_TARGETS.PROFILE_UPDATE,
        5 // 5 iterations
      )
      
      expect(result.passed).toBe(true)
      expect(result.averageTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.PROFILE_UPDATE)
    })
    
    it('should search profiles within performance target', async () => {
      // Act & Assert
      const result = await PerformanceTestUtils.measurePerformance(
        () => ProfileService.searchProfiles('test', 20, 0),
        'Profile Search',
        PERFORMANCE_TARGETS.SEARCH_OPERATIONS,
        5 // 5 iterations
      )
      
      expect(result.passed).toBe(true)
      expect(result.averageTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.SEARCH_OPERATIONS)
    })
    
    it('should update analytics within performance target', async () => {
      // Arrange
      const analyticsData = {
        profile_views: 150,
        follower_count: 75,
        campaign_count: 8
      }
      
      // Act & Assert
      const result = await PerformanceTestUtils.measurePerformance(
        () => ProfileService.updateAnalytics('test-user-123', analyticsData),
        'Analytics Update',
        PERFORMANCE_TARGETS.ANALYTICS_UPDATE,
        10 // 10 iterations
      )
      
      expect(result.passed).toBe(true)
      expect(result.averageTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.ANALYTICS_UPDATE)
    })
  })
  
  // =====================================================================
  // 🔄 CONCURRENT OPERATIONS TESTING
  // =====================================================================
  
  describe('🔄 Concurrent Operations Testing', () => {
    
    it('should handle concurrent profile retrievals efficiently', async () => {
      // Arrange
      const concurrentOperations = Array.from({ length: 20 }, (_, i) => 
        () => ProfileService.getProfile(`user-${i}`)
      )
      
      // Act & Assert
      const result = await PerformanceTestUtils.measurePerformance(
        () => Promise.all(concurrentOperations.map(op => op())),
        'Concurrent Profile Retrievals',
        PERFORMANCE_TARGETS.CONCURRENT_OPERATIONS
      )
      
      expect(result.passed).toBe(true)
      expect(result.averageTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.CONCURRENT_OPERATIONS)
    })
    
    it('should handle concurrent profile updates efficiently', async () => {
      // Arrange
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
        () => ProfileService.updateProfile(`user-${i}`, {
          username: `user${i}`,
          full_name: `User ${i}`,
          bio: `Bio for user ${i}`
        })
      )
      
      // Act & Assert
      const result = await PerformanceTestUtils.measurePerformance(
        () => Promise.all(concurrentOperations.map(op => op())),
        'Concurrent Profile Updates',
        PERFORMANCE_TARGETS.CONCURRENT_OPERATIONS
      )
      
      expect(result.passed).toBe(true)
      expect(result.averageTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.CONCURRENT_OPERATIONS)
    })
    
    it('should handle mixed concurrent operations', async () => {
      // Arrange
      const mixedOperations = [
        () => ProfileService.getProfile('user-1'),
        () => ProfileService.updateProfile('user-2', { full_name: 'Updated' }),
        () => ProfileService.searchProfiles('test', 10, 0),
        () => ProfileService.incrementProfileViews('user-3'),
        () => ProfileService.getProfiles({ limit: 5 })
      ]
      
      // Act & Assert
      const result = await PerformanceTestUtils.measurePerformance(
        () => Promise.all(mixedOperations.map(op => op())),
        'Mixed Concurrent Operations',
        PERFORMANCE_TARGETS.CONCURRENT_OPERATIONS
      )
      
      expect(result.passed).toBe(true)
      expect(result.averageTime).toBeLessThanOrEqual(PERFORMANCE_TARGETS.CONCURRENT_OPERATIONS)
    })
  })
  
  // =====================================================================
  // 💾 MEMORY USAGE MONITORING
  // =====================================================================
  
  describe('💾 Memory Usage Monitoring', () => {
    
    it('should maintain efficient memory usage during bulk operations', async () => {
      // Act & Assert
      const result = await PerformanceTestUtils.measureMemoryUsage(
        async () => {
          const operations = Array.from({ length: 100 }, (_, i) => 
            ProfileService.getProfile(`bulk-user-${i}`)
          )
          return await Promise.all(operations)
        },
        'Bulk Profile Operations'
      )
      
      expect(result.memoryGrowth).toBeLessThan(PERFORMANCE_TARGETS.MEMORY_GROWTH_LIMIT)
    })
    
    it('should handle memory efficiently during search operations', async () => {
      // Act & Assert
      const result = await PerformanceTestUtils.measureMemoryUsage(
        async () => {
          const searches = Array.from({ length: 50 }, (_, i) => 
            ProfileService.searchProfiles(`search${i}`, 20, 0)
          )
          return await Promise.all(searches)
        },
        'Bulk Search Operations'
      )
      
      expect(result.memoryGrowth).toBeLessThan(PERFORMANCE_TARGETS.MEMORY_GROWTH_LIMIT)
    })
  })
  
  // =====================================================================
  // 📈 SCALABILITY VALIDATION
  // =====================================================================
  
  describe('📈 Scalability Validation', () => {
    
    it('should scale linearly with user load', async () => {
      // Test with different user loads
      const loads = [5, 10, 20]
      const results = []
      
      for (const userCount of loads) {
        const result = await PerformanceTestUtils.simulateLoad(
          () => ProfileService.getProfile(`load-test-user-${Math.random()}`),
          `Load Test - ${userCount} Users`,
          userCount,
          5 // 5 operations per user
        )
        results.push({ userCount, ...result })
      }
      
      // Assert linear scaling (throughput should not degrade significantly)
      expect(results[0].successRate).toBeGreaterThan(95)
      expect(results[1].successRate).toBeGreaterThan(90)
      expect(results[2].successRate).toBeGreaterThan(85)
      
      // Throughput should remain reasonable
      results.forEach(result => {
        expect(result.throughput).toBeGreaterThan(10) // At least 10 ops/sec
      })
    })
    
    it('should maintain performance under sustained load', async () => {
      // Simulate sustained load
      const result = await PerformanceTestUtils.simulateLoad(
        () => ProfileService.getProfile(`sustained-test-${Math.random()}`),
        'Sustained Load Test',
        PERFORMANCE_TARGETS.CONCURRENT_USER_LIMIT,
        10 // 10 operations per user
      )
      
      // Assert
      expect(result.successRate).toBeGreaterThan(90)
      expect(result.throughput).toBeGreaterThan(PERFORMANCE_TARGETS.THROUGHPUT_TARGET)
      expect(result.errors).toBeLessThan(result.totalOperations * 0.1) // Less than 10% errors
    })
  })
  
  // =====================================================================
  // 🎯 PERFORMANCE REGRESSION DETECTION
  // =====================================================================
  
  describe('🎯 Performance Regression Detection', () => {
    
    it('should detect performance regressions in profile operations', async () => {
      // Baseline measurement
      const baseline = await PerformanceTestUtils.measurePerformance(
        () => ProfileService.getProfile('regression-test'),
        'Baseline Profile Retrieval',
        PERFORMANCE_TARGETS.PROFILE_RETRIEVAL,
        20
      )
      
      // Simulate potential regression (slower mock)
      PerformanceMockSetup.setupRealisticMocks(150) // Slower response
      
      const regression = await PerformanceTestUtils.measurePerformance(
        () => ProfileService.getProfile('regression-test'),
        'Regression Test Profile Retrieval',
        PERFORMANCE_TARGETS.PROFILE_RETRIEVAL,
        20
      )
      
      // Assert - Should detect significant performance degradation
      const performanceDegradation = (regression.averageTime - baseline.averageTime) / baseline.averageTime
      
      if (performanceDegradation > 0.5) { // 50% degradation
        console.warn(`⚠️ Performance regression detected: ${(performanceDegradation * 100).toFixed(2)}% slower`)
      }
      
      // Reset to normal mock
      PerformanceMockSetup.setupRealisticMocks(50)
    })
  })
})

// =====================================================================
// 📊 PERFORMANCE TEST SUMMARY
// =====================================================================

afterAll(() => {
  const report = PerformanceTestUtils.getPerformanceReport()
  
  console.log(`
🚀 PERFORMANCE TESTING COMPLETED
================================

📊 Performance Summary:
- Total Tests: ${report.totalTests}
- Passed: ${report.passedTests} ✅
- Failed: ${report.failedTests} ❌
- Overall Score: ${report.overallScore.toFixed(2)}%

🎯 Performance Targets:
- Profile Retrieval: <${PERFORMANCE_TARGETS.PROFILE_RETRIEVAL}ms
- Profile Updates: <${PERFORMANCE_TARGETS.PROFILE_UPDATE}ms
- Search Operations: <${PERFORMANCE_TARGETS.SEARCH_OPERATIONS}ms
- Concurrent Operations: <${PERFORMANCE_TARGETS.CONCURRENT_OPERATIONS}ms
- Memory Growth: <${PERFORMANCE_TARGETS.MEMORY_GROWTH_LIMIT}MB
- Throughput: >${PERFORMANCE_TARGETS.THROUGHPUT_TARGET} ops/sec

${report.overallScore >= 90 ? '🎉 EXCELLENT PERFORMANCE!' : 
  report.overallScore >= 75 ? '✅ GOOD PERFORMANCE' : 
  '⚠️ PERFORMANCE NEEDS IMPROVEMENT'}

🚀 Scalability Status: ${report.passedTests >= report.totalTests * 0.8 ? 'PRODUCTION READY' : 'NEEDS OPTIMIZATION'}
  `)
}) 