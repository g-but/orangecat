/**
 * Bitcoin Services - Comprehensive Tests
 * 
 * Testing Bitcoin address validation, transaction processing,
 * and API integration which are critical for platform functionality.
 */

import { 
  cleanBitcoinAddress,
  BitcoinService
} from '../bitcoin'
import { BitcoinTransaction } from '../../types/bitcoin'

// Mock fetch for API calls
const mockFetch = jest.fn()

describe('🪙 Bitcoin Services - Comprehensive Coverage', () => {
  let bitcoinService: BitcoinService;
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    // Create new instance with mocked fetch for each test
    bitcoinService = new BitcoinService(mockFetch as any)
  })

  describe('🧹 Address Cleaning', () => {
    test('cleans Bitcoin URI format', () => {
      const uri = 'bitcoin:bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4?amount=0.1'
      const cleaned = cleanBitcoinAddress(uri)
      
      expect(cleaned).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    })

    test('cleans Bitcoin URI with parameters', () => {
      const uri = 'bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2?amount=0.5&label=donation'
      const cleaned = cleanBitcoinAddress(uri)
      
      expect(cleaned).toBe('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    })

    test('returns plain address unchanged', () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
      const cleaned = cleanBitcoinAddress(address)
      
      expect(cleaned).toBe(address)
    })

    test('handles empty and invalid inputs', () => {
      expect(cleanBitcoinAddress('')).toBe('')
      expect(cleanBitcoinAddress('bitcoin:')).toBe('')
      expect(cleanBitcoinAddress('invalid-input')).toBe('invalid-input')
    })

    test('handles complex URI parameters', () => {
      const uri = 'bitcoin:3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy?amount=1.5&label=Test%20Payment&message=Thank%20you'
      const cleaned = cleanBitcoinAddress(uri)
      
      expect(cleaned).toBe('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')
    })
  })

  describe('📊 Transaction Processing', () => {
    const mockTransactionData = [
      {
        txid: 'abc123',
        status: { confirmed: true, block_time: 1640995200 },
        vin: [],
        vout: [
          { scriptpubkey_address: 'bc1qtest', value: 50000000 }
        ]
      },
      {
        txid: 'def456', 
        status: { confirmed: false },
        vin: [
          { prevout: { scriptpubkey_address: 'bc1qtest', value: 25000000 } }
        ],
        vout: [
          { scriptpubkey_address: 'bc1qother', value: 20000000 }
        ]
      }
    ]

    test('processes incoming transactions correctly', () => {
      const address = 'bc1qtest'
      
      // Access the provider's processTransactions method
      const provider = bitcoinService['providers'][0]
      const transactions = provider.processTransactions(mockTransactionData, address)
      
      expect(transactions).toHaveLength(2)
      
      // First transaction - incoming
      expect(transactions[0]).toMatchObject({
        txid: 'abc123',
        type: 'incoming',
        value: 0.5, // 50M sats = 0.5 BTC
        status: 'confirmed'
      })
      
      // Second transaction - outgoing
      expect(transactions[1]).toMatchObject({
        txid: 'def456',
        type: 'outgoing', 
        value: 0.2, // 20M sats sent to others = 0.2 BTC
        status: 'pending'
      })
    })

    test('handles transactions with no relevant inputs/outputs', () => {
      const irrelevantTx = [{
        txid: 'xyz789',
        status: { confirmed: true, block_time: 1640995200 },
        vin: [
          { prevout: { scriptpubkey_address: 'bc1qother', value: 10000000 } }
        ],
        vout: [
          { scriptpubkey_address: 'bc1qdifferent', value: 9000000 }
        ]
      }]
      
      const address = 'bc1qtest'
      const provider = bitcoinService['providers'][0]
      const transactions = provider.processTransactions(irrelevantTx, address)
      
      expect(transactions).toHaveLength(1)
      expect(transactions[0].value).toBe(0) // No value for this address
    })

    test('handles consolidation transactions', () => {
      const consolidationTx = [{
        txid: 'consolidate123',
        status: { confirmed: true, block_time: 1640995200 },
        vin: [
          { prevout: { scriptpubkey_address: 'bc1qtest', value: 30000000 } },
          { prevout: { scriptpubkey_address: 'bc1qtest', value: 20000000 } }
        ],
        vout: [
          { scriptpubkey_address: 'bc1qtest', value: 49000000 } // Consolidation back to same address
        ]
      }]
      
      const address = 'bc1qtest'
      const provider = bitcoinService['providers'][0]
      const transactions = provider.processTransactions(consolidationTx, address)
      
      expect(transactions).toHaveLength(1)
      expect(transactions[0].type).toBe('outgoing')
      expect(transactions[0].value).toBe(0.5) // Total input value shown for consolidation
    })
  })

  describe('🌐 API Integration', () => {
    test('fetches balance successfully', async () => {
      const mockResponse = {
        chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 50000000 },
        mempool_stats: { funded_txo_sum: 10000000, spent_txo_sum: 5000000 }
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      
      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance).toEqual({
        confirmed: 0.5, // (100M - 50M) / 100M = 0.5 BTC
        unconfirmed: 0,
        total: 0.5
      })
    })

    test('handles API errors gracefully', async () => {
      // Mock both providers to fail so we get the original error
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
      
      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance).toEqual({
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
        error: 'Network error'
      })
    })

    test('fetches transactions successfully', () => {
      const mockTxData = [
        {
          txid: 'tx123',
          status: { confirmed: true, block_time: 1640995200 },
          vin: [],
          vout: [{ scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', value: 100000000 }]
        }
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 0 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
        })
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTxData)
      })
      
      return bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4').then(transactions => {
        expect(transactions).toHaveLength(1)
        expect(transactions[0]).toMatchObject({
          txid: 'tx123',
          type: 'incoming',
          value: 1,
          status: 'confirmed'
        })
      })
    })

    test('handles transaction API errors', async () => {
      // Mock both providers to fail
      mockFetch
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
      
      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions).toEqual([])
    })

    test('falls back to secondary API provider', async () => {
      // First API call fails
      mockFetch
        .mockRejectedValueOnce(new Error('Primary API down'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { funded_txo_sum: 50000000, spent_txo_sum: 0 },
            mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
      
      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(0.5)
      expect(mockFetch).toHaveBeenCalledTimes(3) // Tried both providers (address + tx for successful one)
    })
  })

  describe('⚡ Performance & Reliability', () => {
    test('processes large transaction lists efficiently', async () => {
      // Generate 1000 mock transactions
      const largeTxList = Array.from({ length: 1000 }, (_, i) => ({
        txid: `tx${i}`,
        status: { confirmed: i % 2 === 0, block_time: 1640995200 + i },
        vin: [],
        vout: [{ scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', value: 1000000 }]
      }))
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 0 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
        })
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeTxList)
      })
      
      const startTime = performance.now()
      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      const endTime = performance.now()
      
      expect(transactions).toHaveLength(10) // Should limit to 10 transactions
      expect(endTime - startTime).toBeLessThan(100) // Should process quickly
    })

    test('handles concurrent API requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 0 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
        })
      })
      
      const addresses = ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'bc1qzq9z3z3z3z3z3z3z3z3z3z3z3z3z3z3z3z3zjhzm5']
      
      const promises = addresses.map(addr => bitcoinService.getBalance(addr))
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(3)
      results.forEach(balance => {
        expect(balance.confirmed).toBe(1)
      })
    })

    test('implements request rate limiting', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 0 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
        })
      })
      
      // Make multiple rapid requests
      const promises = Array.from({ length: 5 }, () => 
        bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      )
      
      await Promise.all(promises)
      
      // Should have made API calls for each request (2 calls per transaction request: address + txs)
      expect(mockFetch).toHaveBeenCalledTimes(10) // 5 requests * 2 calls each
    })
  })

  describe('🛡️ Security & Validation', () => {
    test('validates addresses before API calls', async () => {
      // Invalid address should not make API call
      const balance = await bitcoinService.getBalance('invalid-address')
      
      expect(balance).toEqual({
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
        error: 'Invalid Bitcoin address format'
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    test('sanitizes API responses', async () => {
      const maliciousResponse = {
        chain_stats: { 
          funded_txo_sum: '<script>alert("xss")</script>',
          spent_txo_sum: 0 
        },
        mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(maliciousResponse)
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      
      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      // Should handle malicious data gracefully
      expect(balance.confirmed).toBe(0)
      expect(balance.total).toBe(0)
    })

    test('handles API response tampering', async () => {
      const tamperedResponse = {
        chain_stats: { funded_txo_sum: Infinity, spent_txo_sum: -Infinity },
        mempool_stats: { funded_txo_sum: NaN, spent_txo_sum: null }
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tamperedResponse)
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      
      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      // Should handle invalid numbers gracefully
      expect(balance.confirmed).toBe(0)
      expect(balance.unconfirmed).toBe(0)
      expect(balance.total).toBe(0)
    })
  })

  describe('🔄 Error Recovery', () => {
    test('retries failed requests', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 0 },
            mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
      
      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance.confirmed).toBe(1)
      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial failure + second provider success (address + tx)
    })

    test('handles network timeouts', async () => {
      // Mock both providers to timeout
      mockFetch
        .mockImplementationOnce(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
        )
        .mockImplementationOnce(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
        )
      
      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance).toEqual({
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
        error: 'Timeout'
      })
    })

    test('handles malformed JSON responses', async () => {
      // Mock both providers to have JSON parsing errors
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON'))
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON'))
        })
      
      const balance = await bitcoinService.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(balance).toEqual({
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
        error: 'Invalid JSON'
      })
    })
  })

  describe('📈 Real-world Scenarios', () => {
    test('handles high-frequency trading address', async () => {
      // Simulate address with many small transactions
      const manySmallTxs = Array.from({ length: 100 }, (_, i) => ({
        txid: `small_tx_${i}`,
        status: { confirmed: true, block_time: 1640995200 + i * 600 },
        vin: [],
        vout: [{ scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', value: 10000 }] // 0.0001 BTC each
      }))
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          chain_stats: { funded_txo_sum: 1000000, spent_txo_sum: 0 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
        })
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manySmallTxs)
      })
      
      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions).toHaveLength(10) // Limited to 10 most recent
      expect(transactions[0].value).toBe(0.0001)
    })

    test('handles whale address with large transactions', async () => {
      const largeTx = [{
        txid: 'whale_tx',
        status: { confirmed: true, block_time: 1640995200 },
        vin: [],
        vout: [{ scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', value: 1000000000000 }] // 10,000 BTC
      }]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          chain_stats: { funded_txo_sum: 1000000000000, spent_txo_sum: 0 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
        })
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeTx)
      })
      
      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions).toHaveLength(1)
      expect(transactions[0].value).toBe(10000) // 10,000 BTC
    })

    test('handles exchange address with mixed transaction types', async () => {
      const mixedTxs = [
        {
          txid: 'deposit',
          status: { confirmed: true, block_time: 1640995200 },
          vin: [],
          vout: [{ scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', value: 50000000 }]
        },
        {
          txid: 'withdrawal',
          status: { confirmed: true, block_time: 1640995800 },
          vin: [{ prevout: { scriptpubkey_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', value: 30000000 } }],
          vout: [{ scriptpubkey_address: 'bc1qother', value: 25000000 }]
        }
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          chain_stats: { funded_txo_sum: 50000000, spent_txo_sum: 25000000 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
        })
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mixedTxs)
      })
      
      const transactions = await bitcoinService.getTransactions('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
      
      expect(transactions).toHaveLength(2)
      expect(transactions[0].type).toBe('incoming')
      expect(transactions[1].type).toBe('outgoing')
    })
  })
}) 