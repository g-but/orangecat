/**
 * Test Utilities for OrangeCat
 * Shared utilities and helpers for all test types
 *
 * Created: 2025-09-24
 * Last Modified: 2025-09-24
 * Last Modified Summary: Test utilities for comprehensive testing
 */

import { jest } from '@jest/globals';

// =============================================================================
// TYPES
// =============================================================================

export interface TestUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface TestCampaign {
  id: string;
  title: string;
  description: string;
  bitcoin_address: string;
  goal_amount: number;
  raised_amount: number;
  categories: string[];
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
  creator_id: string;
}

// =============================================================================
// FACTORIES
// =============================================================================

export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  email: `test${Date.now()}@example.com`,
  username: `testuser${Date.now()}`,
  full_name: 'Test User',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createTestCampaign = (overrides: Partial<TestCampaign> = {}): TestCampaign => ({
  id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Campaign',
  description: 'Test campaign description',
  bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
  goal_amount: 1000000,
  raised_amount: 0,
  categories: ['technology', 'bitcoin'],
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  creator_id: 'test-user-id',
  ...overrides
});

// =============================================================================
// API MOCK UTILITIES
// =============================================================================

export const mockApiResponse = (
  status: number = 200,
  data: any = {},
  headers: Record<string, string> = {}
) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: { get: (name: string) => headers[name] || null }
});

export const mockFetch = (responses: Array<{ status?: number; data?: any }>) => {
  const mockResponses = [...responses];
  return jest.fn().mockImplementation(() =>
    Promise.resolve(
      mockResponses.length > 0
        ? mockApiResponse(mockResponses.shift()?.status || 200, mockResponses.shift()?.data)
        : mockApiResponse(500, { error: 'No more responses' })
    )
  );
};

// =============================================================================
// TIME UTILITIES
// =============================================================================

export const timeUtils = {
  mockDate: (date: Date | string) => {
    const mockDate = new Date(date);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    return mockDate;
  },
  restoreDate: () => jest.restoreAllMocks(),
  mockTimeout: () => jest.useFakeTimers(),
  restoreTimeout: () => jest.useRealTimers(),
  advanceTime: (ms: number) => jest.advanceTimersByTime(ms)
};

// =============================================================================
// SECURITY TEST UTILITIES
// =============================================================================

export const securityUtils = {
  xssVectors: [
    '<script>alert("XSS")</script>',
    'javascript:alert(1)',
    '<img src=x onerror=alert(1)>'
  ],
  testSanitization: (input: string, sanitized: string) => {
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('alert(');
  }
};

export const testUtils = {
  createTestUser,
  createTestCampaign,
  mockApiResponse,
  mockFetch,
  timeUtils,
  securityUtils
};

export default testUtils;






