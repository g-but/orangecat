/**
 * Funding API Endpoint Tests
 * 
 * Testing critical funding API that handles funding page transactions
 * Essential for Bitcoin platform transaction processing
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../funding/route';

// More robust mock for Supabase server client
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  }
};

jest.mock('@/services/supabase/server', () => ({
  createServerClient: () => mockSupabaseClient
}));

// Mock the logger
jest.mock('@/utils/logger', () => ({
    logger: {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }
}));


describe('💰 Funding API Endpoint - Transaction Processing', () => {
    
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mocks to a default successful state
    const fromChain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    };
    mockSupabaseClient.from.mockReturnValue(fromChain);
    
    // Default mock user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-authed' } },
        error: null,
    });
  });

  describe('🔍 GET /api/funding - Funding Pages Retrieval', () => {
    
    test('should fetch user\'s own funding pages successfully', async () => {
      const mockFundingPages = [
        { id: 'fp-1', title: 'My Project', user_id: 'test-user-authed' },
      ];
      
      const selectMock = jest.fn().mockResolvedValue({ data: mockFundingPages, error: null });
      mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: selectMock, // GET for user's pages uses .eq('user_id', user.id)
      });

      const request = new NextRequest('http://localhost:3000/api/funding');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fundingPages).toEqual(mockFundingPages);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('funding_pages');
      // The implementation forces filtering by authenticated user
      expect(selectMock).toHaveBeenCalledWith('user_id', 'test-user-authed');
    });

    test('should return 403 when trying to access another user\'s pages', async () => {
        const request = new NextRequest('http://localhost:3000/api/funding?userId=other-user');
        const response = await GET(request);
        const data = await response.json();
  
        expect(response.status).toBe(403);
        expect(data.error).toBe('Cannot access other users\' funding data');
    });

    test('should filter funding pages by status', async () => {
        const mockActiveFundingPages = [{ id: 'fp-active', status: 'active' }];
        
        const eqMockStatus = jest.fn().mockResolvedValue({ data: mockActiveFundingPages, error: null });
        const eqMockUser = jest.fn().mockReturnValue({ eq: eqMockStatus });
        mockSupabaseClient.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: eqMockUser,
        });

        const request = new NextRequest('http://localhost:3000/api/funding?status=active');
        const response = await GET(request);
        const data = await response.json();
  
        expect(response.status).toBe(200);
        expect(data.fundingPages).toEqual(mockActiveFundingPages);
        expect(eqMockUser).toHaveBeenCalledWith('user_id', 'test-user-authed');
        expect(eqMockStatus).toHaveBeenCalledWith('status', 'active');
    });

    test('should handle database errors gracefully during GET', async () => {
        mockSupabaseClient.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
        });
        
        const request = new NextRequest('http://localhost:3000/api/funding');
        const response = await GET(request);
        const data = await response.json();
  
        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch funding pages');
    });

  });

  describe('📮 POST /api/funding - Transaction Creation', () => {

    test('should require authentication to create a transaction', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No auth' } });

        const request = new NextRequest('http://localhost:3000/api/funding', { method: 'POST', body: JSON.stringify({}) });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Authentication required to create transactions');
    });

    test('should reject transaction with missing fields', async () => {
        const request = new NextRequest('http://localhost:3000/api/funding', {
            method: 'POST',
            body: JSON.stringify({ amount: 100, currency: 'BTC' }) // missing fundingPageId and paymentMethod
        });
        const response = await POST(request);
        const data = await response.json();
  
        expect(response.status).toBe(400);
        expect(data.error).toBe('All fields are required');
    });
    
    test('should create a transaction successfully', async () => {
        const fundingPageId = 'fp-owned-by-user';
        const transactionData = {
            fundingPageId,
            amount: 1000,
            currency: 'SATS',
            paymentMethod: 'lightning',
        };

        // Mock funding page ownership check
        mockSupabaseClient.from.mockImplementation((tableName: string) => {
            if (tableName === 'funding_pages') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockResolvedValue({ 
                        data: { user_id: 'test-user-authed', status: 'active' }, 
                        error: null 
                    }),
                    single: jest.fn(), // Not used in this path
                };
            }
            if (tableName === 'transactions') {
                return {
                    insert: jest.fn().mockReturnThis(),
                    select: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'new-tx-id', ...transactionData }, error: null }),
                };
            }
            return { from: jest.fn() } as any;
        });

        const request = new NextRequest('http://localhost:3000/api/funding', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.message).toBe('Transaction created successfully');
        expect(data.transaction.id).toBe('new-tx-id');
    });
    
    test('should handle database insertion errors during POST', async () => {
        mockSupabaseClient.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: { user_id: 'test-user-authed', status: 'active' }, error: null }),
            insert: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        });
        
        const request = new NextRequest('http://localhost:3000/api/funding', {
            method: 'POST',
            body: JSON.stringify({ fundingPageId: 'fp-1', amount: 100, currency: 'BTC', paymentMethod: 'bitcoin' })
        });

        const response = await POST(request);
        const data = await response.json();
  
        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to create transaction');
    });

  });
}); 