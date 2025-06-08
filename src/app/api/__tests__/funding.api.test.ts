/**
 * Funding API Endpoint Tests
 * 
 * Testing critical funding API that handles funding page transactions
 * Essential for Bitcoin platform transaction processing
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../funding/route';

// Mock Supabase server client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => mockSupabaseClient.from()),
      single: jest.fn()
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
};

jest.mock('@/services/supabase/server', () => ({
  createServerClient: () => mockSupabaseClient
}));

describe('💰 Funding API Endpoint - Transaction Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🔍 GET /api/funding - Funding Pages Retrieval', () => {
    test('should fetch all funding pages successfully', async () => {
      const mockFundingPages = [
        {
          id: 'fp-1',
          title: 'Bitcoin Education Initiative',
          user_id: 'user-123',
          status: 'active',
          goal: 250000,
          raised: 150000
        },
        {
          id: 'fp-2',
          title: 'Lightning Workshop',
          user_id: 'user-456',
          status: 'active',
          goal: 100000,
          raised: 75000
        }
      ];

      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockFundingPages,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/funding');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fundingPages).toEqual(mockFundingPages);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('funding_pages');
    });

    test('should filter funding pages by user ID', async () => {
      const mockUserFundingPages = [
        {
          id: 'fp-1',
          title: 'My Bitcoin Project',
          user_id: 'user-123',
          status: 'active'
        }
      ];

      mockSupabaseClient.from().select().eq.mockReturnValue(mockSupabaseClient.from());
      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockUserFundingPages,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/funding?userId=user-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fundingPages).toEqual(mockUserFundingPages);
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    test('should filter funding pages by status', async () => {
      const mockActiveFundingPages = [
        {
          id: 'fp-1',
          title: 'Active Campaign',
          status: 'active'
        }
      ];

      mockSupabaseClient.from().select().eq.mockReturnValue(mockSupabaseClient.from());
      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockActiveFundingPages,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/funding?status=active');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fundingPages).toEqual(mockActiveFundingPages);
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('status', 'active');
    });

    test('should filter by both user ID and status', async () => {
      const mockFilteredPages = [
        {
          id: 'fp-1',
          title: 'User Active Campaign',
          user_id: 'user-123',
          status: 'active'
        }
      ];

      mockSupabaseClient.from().select().eq.mockReturnValue(mockSupabaseClient.from());
      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockFilteredPages,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/funding?userId=user-123&status=active');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fundingPages).toEqual(mockFilteredPages);
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('status', 'active');
    });

    test('should handle database errors gracefully', async () => {
      mockSupabaseClient.from().select.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/funding');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Database connection failed');
    });

    test('should handle server errors', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Server error');
      });

      const request = new NextRequest('http://localhost:3000/api/funding');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An error occurred while fetching funding pages');
    });
  });

  describe('💸 POST /api/funding - Transaction Creation', () => {
    test('should create transaction successfully', async () => {
      const transactionData = {
        fundingPageId: 'fp-123',
        amount: 50000,
        currency: 'BTC',
        paymentMethod: 'bitcoin'
      };

      const mockTransaction = {
        id: 'tx-123',
        funding_page_id: 'fp-123',
        amount: 50000,
        currency: 'BTC',
        payment_method: 'bitcoin',
        status: 'pending'
      };

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: mockTransaction,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(transactionData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Transaction created successfully');
      expect(data.transaction).toEqual(mockTransaction);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('transactions');
    });

    test('should reject transaction with missing fields', async () => {
      const incompleteData = {
        amount: 50000,
        currency: 'BTC'
        // Missing fundingPageId and paymentMethod
      };

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('All fields are required');
    });

    test('should handle database insertion errors', async () => {
      const transactionData = {
        fundingPageId: 'fp-123',
        amount: 50000,
        currency: 'BTC',
        paymentMethod: 'bitcoin'
      };

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Funding page not found' }
      });

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(transactionData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Funding page not found');
    });

    test('should handle server errors during transaction creation', async () => {
      const transactionData = {
        fundingPageId: 'fp-123',
        amount: 50000,
        currency: 'BTC',
        paymentMethod: 'bitcoin'
      };

      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Server error');
      });

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(transactionData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An error occurred while creating the transaction');
    });

    test('should handle malformed JSON requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An error occurred while creating the transaction');
    });
  });

  describe('💼 Real-world Transaction Scenarios', () => {
    test('should handle Bitcoin transaction', async () => {
      const bitcoinTransaction = {
        fundingPageId: 'fp-bitcoin-123',
        amount: 100000000, // 1 BTC in sats
        currency: 'BTC',
        paymentMethod: 'bitcoin'
      };

      const mockTransaction = {
        id: 'tx-bitcoin-123',
        funding_page_id: 'fp-bitcoin-123',
        amount: 100000000,
        currency: 'BTC',
        payment_method: 'bitcoin',
        status: 'pending'
      };

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: mockTransaction,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(bitcoinTransaction),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transaction.amount).toBe(100000000);
      expect(data.transaction.currency).toBe('BTC');
      expect(data.transaction.payment_method).toBe('bitcoin');
    });

    test('should handle Lightning Network transaction', async () => {
      const lightningTransaction = {
        fundingPageId: 'fp-lightning-123',
        amount: 50000,
        currency: 'BTC',
        paymentMethod: 'lightning'
      };

      const mockTransaction = {
        id: 'tx-lightning-123',
        funding_page_id: 'fp-lightning-123',
        amount: 50000,
        currency: 'BTC',
        payment_method: 'lightning',
        status: 'pending'
      };

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: mockTransaction,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(lightningTransaction),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transaction.payment_method).toBe('lightning');
      expect(data.transaction.amount).toBe(50000);
    });

    test('should handle small satoshi amounts', async () => {
      const smallTransaction = {
        fundingPageId: 'fp-small-123',
        amount: 1000, // 1k sats
        currency: 'BTC',
        paymentMethod: 'lightning'
      };

      const mockTransaction = {
        id: 'tx-small-123',
        ...smallTransaction,
        status: 'pending'
      };

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: mockTransaction,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(smallTransaction),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transaction.amount).toBe(1000);
    });

    test('should handle multiple funding pages for same user', async () => {
      const userFundingPages = [
        {
          id: 'fp-1',
          title: 'Bitcoin Education',
          user_id: 'user-123',
          status: 'active'
        },
        {
          id: 'fp-2',
          title: 'Lightning Workshop',
          user_id: 'user-123',
          status: 'completed'
        }
      ];

      mockSupabaseClient.from().select().eq.mockReturnValue(mockSupabaseClient.from());
      mockSupabaseClient.from().select.mockResolvedValue({
        data: userFundingPages,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/funding?userId=user-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fundingPages).toHaveLength(2);
      expect(data.fundingPages[0].user_id).toBe('user-123');
      expect(data.fundingPages[1].user_id).toBe('user-123');
    });
  });

  describe('🔒 Security & Data Integrity Tests', () => {
    test('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: '',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An error occurred while creating the transaction');
    });

    test('should handle null values in transaction data', async () => {
      const transactionWithNulls = {
        fundingPageId: null,
        amount: null,
        currency: null,
        paymentMethod: null
      };

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(transactionWithNulls),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('All fields are required');
    });

    test('should handle undefined values in transaction data', async () => {
      const transactionWithUndefined = {
        fundingPageId: undefined,
        amount: undefined,
        currency: undefined,
        paymentMethod: undefined
      };

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(transactionWithUndefined),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('All fields are required');
    });

    test('should handle empty string values', async () => {
      const transactionWithEmptyStrings = {
        fundingPageId: '',
        amount: '',
        currency: '',
        paymentMethod: ''
      };

      const request = new NextRequest('http://localhost:3000/api/funding', {
        method: 'POST',
        body: JSON.stringify(transactionWithEmptyStrings),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('All fields are required');
    });
  });
}); 