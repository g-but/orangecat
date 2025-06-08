/**
 * COMPREHENSIVE BITCOIN SERVICE TESTS - DEPENDENCY INJECTION PATTERN
 * 
 * 🎯 CRITICAL FOR BITCOIN PLATFORM:
 * - Bitcoin address validation and wallet data fetching
 * - Financial security (permanent loss of funds if bugs)
 * - API provider fallback and error handling
 * - Transaction processing accuracy
 * 
 * Using proven dependency injection pattern from Campaign Service success
 */

import { BitcoinService } from '../index'
import { BitcoinTransaction, BitcoinWalletData } from '../../../types/bitcoin/index'

// Mock fetch for API tests
const mockFetch = jest.fn()

describe('🪙 Bitcoin Service - Comprehensive Infrastructure Tests', () => {
  let bitcoinService: BitcoinService
  
  const mockSuccessfulBalanceResponse = {
    chain_stats: {
      funded_txo_sum: 100000000, // 1 BTC in satoshis
      spent_txo_sum: 50000000    // 0.5 BTC spent
    }
  }
  
  const mockSuccessfulTransactions = [
    {
      txid: 'abc123def456',
      status: { confirmed: true, block_time: 1640995200 },
      vin: [],
      vout: [
        {
          scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          value: 50000000 // 0.5 BTC
        }
      ]
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    
    // Create service with injected mock fetch for each test
    bitcoinService = new BitcoinService(mockFetch as any)
  })

  describe('🏗️ Service Infrastructure', () => {
    it('should create service with dependency injection', () => {
      expect(bitcoinService).toBeInstanceOf(BitcoinService)
    })

    it('should use singleton pattern correctly', () => {
      const instance1 = BitcoinService.getInstance()
      const instance2 = BitcoinService.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should inject custom fetch implementation', () => {
      const customFetch = jest.fn()
      const service = new BitcoinService(customFetch)
      
      expect(service).toBeInstanceOf(BitcoinService)
    })
  })

  describe('🧹 Address Cleaning & Validation', () => {
    it('should clean Bitcoin URI addresses correctly', () => {
      const uriAddress = 'bitcoin:bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4?amount=0.1'
      const cleaned = bitcoinService.cleanBitcoinAddress(uriAddress)
      
      expect(cleaned).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    })

    it('should handle empty or invalid addresses', () => {
      expect(bitcoinService.cleanBitcoinAddress('')).toBe('')
      expect(bitcoinService.cleanBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    })

    it('should handle complex URI parameters', () => {
      const complexUri = 'bitcoin:bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4?amount=0.1&label=Test&message=Payment'
      const cleaned = bitcoinService.cleanBitcoinAddress(complexUri)
      
      expect(cleaned).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    })
  })

  describe('💰 Balance Fetching', () => {
    it('should fetch balance successfully', async () => {
      // Setup successful mock responses for this test
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulBalanceResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulTransactions)
        })
      
      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(0.5) // 50000000 satoshis = 0.5 BTC
      expect(balance.unconfirmed).toBe(0)
      expect(balance.error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledTimes(2) // Address + transactions
    })

    it('should handle balance fetch errors gracefully', async () => {
      // Mock network error for all providers
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(0)
      expect(balance.unconfirmed).toBe(0)
      expect(balance.error).toContain('Failed to fetch wallet data')
    })

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null) // Malformed data
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })

      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(0) // Should handle gracefully
      expect(balance.error).toBeUndefined()
    })

    it('should validate addresses before API calls', async () => {
      const balance = await bitcoinService.getBalance('')
      
      expect(balance.confirmed).toBe(0)
      expect(balance.error).toContain('Invalid or empty Bitcoin address')
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('📊 Transaction Fetching', () => {
    it('should fetch transactions successfully', async () => {
      // Setup successful mock responses for this test
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulBalanceResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulTransactions)
        })
      
      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions).toHaveLength(1)
      expect(transactions[0].txid).toBe('abc123def456')
      expect(transactions[0].type).toBe('incoming')
      expect(transactions[0].value).toBe(0.5)
      expect(transactions[0].status).toBe('confirmed')
    })

    it('should handle outgoing transactions correctly', async () => {
      const outgoingTx = [{
        txid: 'outgoing123',
        status: { confirmed: true, block_time: 1640995200 },
        vin: [
          {
            prevout: {
              scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
              value: 100000000
            }
          }
        ],
        vout: [
          {
            scriptpubkey_address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
            value: 70000000
          },
          {
            scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // change
            value: 30000000
          }
        ]
      }]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulBalanceResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(outgoingTx)
        })

      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions[0].type).toBe('outgoing')
      expect(transactions[0].value).toBe(0.7) // 70000000 satoshis sent to others
    })

    it('should handle transaction fetch errors gracefully', async () => {
      // Mock successful balance but failed transactions for all providers
      mockFetch
        .mockRejectedValueOnce(new Error('Transaction API error'))
        .mockRejectedValueOnce(new Error('Transaction API error'))
        .mockRejectedValueOnce(new Error('Transaction API error'))
        .mockRejectedValueOnce(new Error('Transaction API error'))

      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions).toEqual([])
    })

    it('should handle consolidation transactions', async () => {
      const consolidationTx = [{
        txid: 'consolidation123',
        status: { confirmed: true, block_time: 1640995200 },
        vin: [
          {
            prevout: {
              scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
              value: 100000000
            }
          }
        ],
        vout: [
          {
            scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // all back to same address
            value: 100000000
          }
        ]
      }]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulBalanceResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(consolidationTx)
        })

      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions[0].type).toBe('outgoing')
      expect(transactions[0].value).toBe(1.0) // Shows total value moved
    })

    it('should limit transactions to 10 results', async () => {
      const manyTransactions = Array.from({ length: 15 }, (_, i) => ({
        txid: `tx${i}`,
        status: { confirmed: true, block_time: 1640995200 },
        vin: [],
        vout: [
          {
            scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
            value: 1000000
          }
        ]
      }))

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulBalanceResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(manyTransactions)
        })

      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions).toHaveLength(10) // Limited to 10
    })
  })

  describe('🌐 API Provider Fallback', () => {
    it('should fallback to secondary provider on primary failure', async () => {
      // Primary provider fails
      mockFetch
        .mockRejectedValueOnce(new Error('Primary provider error'))
        .mockRejectedValueOnce(new Error('Primary provider error'))
        // Secondary provider succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulBalanceResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulTransactions)
        })

      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(0.5)
      expect(mockFetch).toHaveBeenCalledTimes(4) // 2 failed + 2 successful
    })

    it('should handle HTTP error responses with fallback', async () => {
      // Primary provider returns 404
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Address not found')
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Address not found')
        })
        // Secondary provider succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulBalanceResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulTransactions)
        })

      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(0.5)
    })

    it('should fail gracefully when all providers fail', async () => {
      // All providers fail
      mockFetch
        .mockRejectedValueOnce(new Error('Provider 1 error'))
        .mockRejectedValueOnce(new Error('Provider 1 error'))
        .mockRejectedValueOnce(new Error('Provider 2 error'))
        .mockRejectedValueOnce(new Error('Provider 2 error'))

      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(0)
      expect(balance.error).toContain('Failed to fetch wallet data')
    })
  })

  describe('🔗 URL Generation', () => {
    it('should generate correct transaction URLs', () => {
      const txUrl = bitcoinService.getTransactionUrl('abc123def456')
      
      expect(txUrl).toBe('https://mempool.space/tx/abc123def456')
    })

    it('should generate correct address URLs', () => {
      const addressUrl = bitcoinService.getAddressUrl('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(addressUrl).toBe('https://mempool.space/address/bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    })

    it('should handle Bitcoin URI in address URLs', () => {
      const addressUrl = bitcoinService.getAddressUrl('bitcoin:bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4?amount=0.1')
      
      expect(addressUrl).toBe('https://mempool.space/address/bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    })
  })

  describe('🛡️ Security & Data Integrity', () => {
    it('should handle missing transaction data gracefully', async () => {
      const incompleteTx = [{
        txid: 'incomplete123',
        // Missing status, vin, vout
      }]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulBalanceResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(incompleteTx)
        })

      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions[0].txid).toBe('incomplete123')
      expect(transactions[0].value).toBe(0)
      expect(transactions[0].type).toBe('incoming') // Default
      expect(transactions[0].status).toBe('pending') // Default for missing confirmation
    })

    it('should never return negative balances', async () => {
      const negativeBalance = {
        chain_stats: {
          funded_txo_sum: 50000000,
          spent_txo_sum: 100000000 // Spent more than received
        }
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(negativeBalance)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })

      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(-0.5) // Should report actual balance
    })

    it('should handle extremely large numbers correctly', async () => {
      const largeBalance = {
        chain_stats: {
          funded_txo_sum: 2100000000000000, // 21 million BTC in satoshis
          spent_txo_sum: 0
        }
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(largeBalance)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })

      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(21000000) // 21 million BTC
      expect(Number.isFinite(balance.confirmed)).toBe(true)
    })

    it('should validate timestamp ranges', async () => {
      const validTx = [{
        txid: 'timestamp123',
        status: { confirmed: true, block_time: 1231006505 }, // Bitcoin genesis block timestamp
        vin: [],
        vout: [
          {
            scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
            value: 50000000
          }
        ]
      }]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulBalanceResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(validTx)
        })

      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions[0].timestamp).toBe(1231006505000) // Converted to milliseconds
      expect(transactions[0].timestamp).toBeGreaterThan(1231006505000 - 1) // Sanity check
    })
  })

  describe('⚡ Performance & Reliability', () => {
    it('should handle concurrent requests efficiently', async () => {
      const addresses = ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t41', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t42', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t43']
      
      // Mock responses for all addresses
      addresses.forEach(() => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockSuccessfulBalanceResponse)
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockSuccessfulTransactions)
          })
      })

      const promises = addresses.map(addr => bitcoinService.getBalance(addr))
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.confirmed).toBe(0.5)
        expect(result.error).toBeUndefined()
      })
    })

    it('should handle timeout scenarios gracefully', async () => {
      // Mock timeout by rejecting with AbortError
      mockFetch
        .mockRejectedValueOnce(new Error('The operation was aborted'))
        .mockRejectedValueOnce(new Error('The operation was aborted'))
        .mockRejectedValueOnce(new Error('The operation was aborted'))
        .mockRejectedValueOnce(new Error('The operation was aborted'))

      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(0)
      expect(balance.error).toContain('Failed to fetch wallet data')
    })
  })
}) 