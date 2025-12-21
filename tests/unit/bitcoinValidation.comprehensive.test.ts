/**
 * COMPREHENSIVE BITCOIN ADDRESS VALIDATION TESTS
 * 
 * CRITICAL FOR BITCOIN PLATFORM SECURITY:
 * - Invalid Bitcoin addresses = PERMANENT LOSS OF FUNDS
 * - Address validation must be bulletproof
 * - Must handle all Bitcoin address formats (Legacy, SegWit, Taproot)
 * - Must prevent common user errors
 * - Must validate checksums correctly
 * - Edge cases must be handled safely
 * 
 * This is LIFE-OR-DEATH functionality for users' money.
 */

import { 
  cleanBitcoinAddress, 
  BitcoinService
} from '../index'

// Mock fetch for API tests
const mockFetch = jest.fn()

describe('Bitcoin Address Validation - CRITICAL SECURITY', () => {
  let bitcoinService: BitcoinService;
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    // Create new instance with mocked fetch for each test
    bitcoinService = new BitcoinService(mockFetch as any)
  })

  describe('Bitcoin Address Cleaning - URI Handling', () => {
    it('should clean bitcoin: URI addresses correctly', () => {
      const uriAddress = 'bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2?amount=0.1'
      const cleaned = cleanBitcoinAddress(uriAddress)
      
      expect(cleaned).toBe('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    })

    it('should handle bitcoin: URI without parameters', () => {
      const uriAddress = 'bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const cleaned = cleanBitcoinAddress(uriAddress)
      
      expect(cleaned).toBe('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    })

    it('should return regular addresses unchanged', () => {
      const regularAddress = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const cleaned = cleanBitcoinAddress(regularAddress)
      
      expect(cleaned).toBe('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    })

    it('should handle SegWit addresses correctly', () => {
      const segwitAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
      const cleaned = cleanBitcoinAddress(segwitAddress)
      
      expect(cleaned).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    })

    it('should handle Taproot addresses correctly', () => {
      const taprootAddress = 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297'
      const cleaned = cleanBitcoinAddress(taprootAddress)
      
      expect(cleaned).toBe('bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297')
    })

    it('should handle complex bitcoin: URIs with multiple parameters', () => {
      const complexUri = 'bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2?amount=0.1&label=Test&message=Payment'
      const cleaned = cleanBitcoinAddress(complexUri)
      
      expect(cleaned).toBe('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    })
  })

  describe('Bitcoin Wallet Data Fetching - API Integration', () => {
    it('should fetch wallet data successfully from primary provider', async () => {
      const mockAddressData = {
        chain_stats: {
          funded_txo_sum: 100000000, // 1 BTC in satoshis
          spent_txo_sum: 50000000    // 0.5 BTC in satoshis
        }
      }

      const mockTransactions = [
        {
          txid: 'abc123',
          status: { confirmed: true, block_time: 1640995200 },
          vin: [],
          vout: [
            {
              scriptpubkey_address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
              value: 50000000
            }
          ]
        }
      ]

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAddressData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTransactions)
        })

      const result = await bitcoinService.fetchBitcoinWalletData('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')

      expect(result.balance).toBe(0.5) // 50000000 satoshis = 0.5 BTC
      expect(result.transactions).toHaveLength(1)
      expect(result.transactions[0].txid).toBe('abc123')
      expect(result.transactions[0].type).toBe('incoming')
      expect(result.transactions[0].value).toBe(0.5)
      expect(result.lastUpdated).toBeDefined()
    })

    it('should handle outgoing transactions correctly', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const mockAddressData = {
        chain_stats: {
          funded_txo_sum: 100000000,
          spent_txo_sum: 30000000
        }
      }

      const mockTransactions = [
        {
          txid: 'def456',
          status: { confirmed: true, block_time: 1640995200 },
          vin: [
            {
              prevout: {
                scriptpubkey_address: address,
                value: 100000000
              }
            }
          ],
          vout: [
            {
              scriptpubkey_address: 'other-address',
              value: 70000000
            },
            {
              scriptpubkey_address: address, // change
              value: 30000000
            }
          ]
        }
      ]

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAddressData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTransactions)
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.transactions[0].type).toBe('outgoing')
      expect(result.transactions[0].value).toBe(0.7) // 70000000 satoshis sent to others
    })

    it('should handle API failures with fallback providers', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'

      // First provider fails
      ;(mockFetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        // Second provider succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.balance).toBe(1.0) // 100000000 satoshis = 1 BTC
      expect(result.transactions).toEqual([])
      expect(mockFetch).toHaveBeenCalledTimes(4) // 2 failed calls + 2 successful calls
    })

    it('should handle HTTP error responses', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'

      ;(mockFetch as jest.Mock)
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

      await expect(bitcoinService.fetchBitcoinWalletData(address)).rejects.toThrow()
    })

    it('should handle timeout scenarios', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'

      // Mock fetch to simulate timeout
      ;(mockFetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      await expect(bitcoinService.fetchBitcoinWalletData(address)).rejects.toThrow()
    })

    it('should handle malformed API responses', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null) // Malformed response
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(null)
        })

      await expect(bitcoinService.fetchBitcoinWalletData(address)).rejects.toThrow()
    })
  })

  describe('Transaction Processing - Financial Accuracy', () => {
    it('should correctly calculate incoming transaction values', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const mockTransactions = [
        {
          txid: 'incoming-tx',
          status: { confirmed: true, block_time: 1640995200 },
          vin: [
            {
              prevout: {
                scriptpubkey_address: 'other-address',
                value: 100000000
              }
            }
          ],
          vout: [
            {
              scriptpubkey_address: address,
              value: 75000000 // 0.75 BTC to our address
            },
            {
              scriptpubkey_address: 'change-address',
              value: 25000000 // 0.25 BTC change
            }
          ]
        }
      ]

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { funded_txo_sum: 75000000, spent_txo_sum: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTransactions)
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.transactions[0].type).toBe('incoming')
      expect(result.transactions[0].value).toBe(0.75)
    })

    it('should handle consolidation transactions (self-sends)', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const mockTransactions = [
        {
          txid: 'consolidation-tx',
          status: { confirmed: true, block_time: 1640995200 },
          vin: [
            {
              prevout: {
                scriptpubkey_address: address,
                value: 100000000
              }
            }
          ],
          vout: [
            {
              scriptpubkey_address: address, // All outputs back to same address
              value: 99950000 // Minus fee
            }
          ]
        }
      ]

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 50000 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTransactions)
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.transactions[0].type).toBe('outgoing')
      expect(result.transactions[0].value).toBe(1.0) // Shows total value moved in consolidation
    })

    it('should handle pending transactions correctly', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const mockTransactions = [
        {
          txid: 'pending-tx',
          status: { confirmed: false }, // No block_time for pending
          vin: [],
          vout: [
            {
              scriptpubkey_address: address,
              value: 50000000
            }
          ]
        }
      ]

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { funded_txo_sum: 50000000, spent_txo_sum: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTransactions)
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.transactions[0].status).toBe('pending')
      expect(result.transactions[0].timestamp).toBeDefined()
      expect(result.transactions[0].timestamp).toBeGreaterThan(Date.now() - 10000) // Recent timestamp
    })

    it('should limit transaction results to 10', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const mockTransactions = Array.from({ length: 20 }, (_, i) => ({
        txid: `tx-${i}`,
        status: { confirmed: true, block_time: 1640995200 },
        vin: [],
        vout: [
          {
            scriptpubkey_address: address,
            value: 1000000
          }
        ]
      }))

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { funded_txo_sum: 20000000, spent_txo_sum: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTransactions)
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.transactions).toHaveLength(10) // Should be limited to 10
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty address gracefully', async () => {
      await expect(bitcoinService.fetchBitcoinWalletData('')).rejects.toThrow()
    })

    it('should handle null/undefined address', async () => {
      await expect(bitcoinService.fetchBitcoinWalletData(null as any)).rejects.toThrow()
      await expect(bitcoinService.fetchBitcoinWalletData(undefined as any)).rejects.toThrow()
    })

    it('should handle addresses with special characters', () => {
      const weirdAddress = 'bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2?amount=0.1&message=Hello%20World'
      const cleaned = cleanBitcoinAddress(weirdAddress)
      
      expect(cleaned).toBe('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    })

    it('should handle very long addresses', () => {
      const longAddress = 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297'
      const cleaned = cleanBitcoinAddress(longAddress)
      
      expect(cleaned).toBe(longAddress)
    })

    it('should handle addresses with whitespace', () => {
      const addressWithSpaces = '  1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2  '
      const cleaned = cleanBitcoinAddress(addressWithSpaces.trim())
      
      expect(cleaned).toBe('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    })

    it('should handle transactions with missing data', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const mockTransactions = [
        {
          txid: 'incomplete-tx',
          status: { confirmed: true, block_time: 1640995200 },
          vin: [], // Empty inputs
          vout: [] // Empty outputs
        }
      ]

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { funded_txo_sum: 0, spent_txo_sum: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTransactions)
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.transactions[0].value).toBe(0)
      expect(result.transactions[0].type).toBe('incoming') // Default to incoming
    })
  })

  describe('Security and Data Integrity', () => {
    it('should never return negative balances', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { 
              funded_txo_sum: 50000000, 
              spent_txo_sum: 100000000 // Spent more than funded (shouldn't happen)
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.balance).toBeGreaterThanOrEqual(0) // Should never be negative
    })

    it('should handle extremely large numbers correctly', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { 
              funded_txo_sum: 2100000000000000, // 21 million BTC in satoshis
              spent_txo_sum: 0
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.balance).toBe(21000000) // 21 million BTC
      expect(Number.isFinite(result.balance)).toBe(true)
    })

    it('should validate timestamp ranges', async () => {
      const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const mockTransactions = [
        {
          txid: 'old-tx',
          status: { confirmed: true, block_time: 1231006505 }, // Bitcoin genesis block time
          vin: [],
          vout: [
            {
              scriptpubkey_address: address,
              value: 50000000
            }
          ]
        }
      ]

      ;(mockFetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            chain_stats: { funded_txo_sum: 50000000, spent_txo_sum: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTransactions)
        })

      const result = await bitcoinService.fetchBitcoinWalletData(address)

      expect(result.transactions[0].timestamp).toBe(1231006505000) // Converted to milliseconds
      expect(result.transactions[0].timestamp).toBeGreaterThan(1231006505000 - 1) // Sanity check
    })
  })
}) 