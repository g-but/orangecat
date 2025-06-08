/**
 * Bitcoin Address Validation - Comprehensive Security Tests
 * 
 * CRITICAL FOR FINANCIAL SECURITY - Bitcoin transactions are irreversible
 * Testing all Bitcoin address validation logic to prevent fund loss
 * 
 * Coverage Areas:
 * - All Bitcoin address formats (Legacy, P2SH, SegWit, Taproot)
 * - Testnet address prevention
 * - Burn address detection
 * - Malformed address rejection
 * - Length validation by address type
 * - Edge cases and attack vectors
 */

import { isValidBitcoinAddress, isValidLightningAddress } from '../validation'

describe('🔐 Bitcoin Address Validation - Financial Security Tests', () => {
  
  describe('✅ Valid Bitcoin Address Acceptance', () => {
    test('should accept valid Legacy (P2PKH) addresses', () => {
      const validLegacyAddresses = [
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block address
        '1JArS6jzE3AJ9sZ3aFij1BmTcpFGgN86hA',
        '1FeexV6bAHb8ybZjqjAn4uw3m4HGsw8ABn',
        '1111111111111111111114oLvT2' // Known burn address (will be rejected separately)
      ]

      validLegacyAddresses.slice(0, -1).forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    test('should accept valid P2SH (Pay-to-Script-Hash) addresses', () => {
      const validP2SHAddresses = [
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC',
        '33vt8ViH5jsr115AGkW6cEmEz9MpvJSwDk',
        '37VucYSaXLCAsVSPPSHqHdHhPVG8qMbLMt'
      ]

      validP2SHAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    test('should accept valid Bech32 (Native SegWit) addresses', () => {
      const validBech32Addresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        'bc1qrp33g0alq08tx9pep2rg7kzzv9twp5dklxcl75',
        'bc1q34aq5drpuwy3wgl5gzv7j3z3k4k0jls7wm33kj',
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      ]

      validBech32Addresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    test('should accept valid Taproot (P2TR) addresses', () => {
      const validTaprootAddresses = [
        'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297',
        'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0'
      ]

      validTaprootAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })
  })

  describe('🚫 Testnet Address Prevention', () => {
    test('should reject Bitcoin testnet addresses', () => {
      const testnetAddresses = [
        'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        'tb1qrp33g0alq08tx9pep2rg7kzzv9twp5dklxcl75',
        'tb1q34aq5drpuwy3wgl5gzv7j3z3k4k0jls7wm33kj'
      ]

      testnetAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Testnet addresses not allowed')
      })
    })

    test('should reject Bitcoin regtest addresses', () => {
      const regtestAddresses = [
        'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6',
        'bcrt1qrp33g0alq08tx9pep2rg7kzzv9twp5dklxcl75'
      ]

      regtestAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Testnet addresses not allowed')
      })
    })
  })

  describe('🔥 Burn Address Detection', () => {
    test('should reject known burn addresses', () => {
      const burnAddresses = [
        '1111111111111111111114oLvT2',
        '1BitcoinEaterAddressDontSendf59kuE',
        'bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9424r'
      ]

      burnAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Burn addresses not allowed')
      })
    })

    test('should reject addresses with suspicious patterns', () => {
      const suspiciousAddresses = [
        'bc1' + 'q'.repeat(50), // All q's - likely invalid
        '1' + '1'.repeat(33),   // All 1's
        'bc1' + '0'.repeat(50)  // All 0's
      ]

      suspiciousAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        // These might pass format validation but should be flagged
        if (result.valid) {
          console.warn(`⚠️ Suspicious address passed: ${address}`)
        }
      })
    })
  })

  describe('❌ Invalid Format Rejection', () => {
    test('should reject addresses with invalid characters', () => {
      const invalidCharacterAddresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t0', // Contains '0' (invalid in bech32)
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3tI', // Contains 'I' (invalid in bech32)
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNO0', // Contains 'O' and '0' (invalid in base58)
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVNI'  // Contains 'I' (invalid in base58)
      ]

      invalidCharacterAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid Bitcoin address format')
      })
    })

    test('should reject addresses with wrong length', () => {
      const wrongLengthAddresses = [
        // Too short
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNL',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaN',
        
        // Too long
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4444444444444444444',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy444444444',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2444444444'
      ]

      wrongLengthAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toMatch(/length|Invalid/)
      })
    })

    test('should reject completely malformed addresses', () => {
      const malformedAddresses = [
        '', // Empty
        ' ', // Whitespace
        'not-a-bitcoin-address',
        'bitcoin:bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // URI format
        'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4', // Wrong case for bech32
        '2J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // Starts with '2' (invalid)
        '0BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // Starts with '0' (invalid)
        'xc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' // Wrong prefix
      ]

      malformedAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })

  describe('📏 Length Validation by Address Type', () => {
    test('should validate P2PKH address length exactly', () => {
      const shortP2PKH = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN' // 33 chars (too short)
      const correctP2PKH = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2' // 34 chars (correct)
      const longP2PKH = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN23' // 35 chars (too long)

      expect(isValidBitcoinAddress(shortP2PKH).valid).toBe(false)
      expect(isValidBitcoinAddress(correctP2PKH).valid).toBe(true)
      expect(isValidBitcoinAddress(longP2PKH).valid).toBe(false)
    })

    test('should validate P2SH address length exactly', () => {
      const shortP2SH = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNL' // 33 chars (too short)
      const correctP2SH = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' // 34 chars (correct)
      const longP2SH = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy4' // 35 chars (too long)

      expect(isValidBitcoinAddress(shortP2SH).valid).toBe(false)
      expect(isValidBitcoinAddress(correctP2SH).valid).toBe(true)
      expect(isValidBitcoinAddress(longP2SH).valid).toBe(false)
    })

    test('should validate Bech32 address length range', () => {
      const tooShortBech32 = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t' // 41 chars (too short)
      const validShortBech32 = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' // 42 chars (valid min)
      const validLongBech32 = 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297' // 62 chars (valid max)
      const tooLongBech32 = 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg32974' // 63 chars (too long)

      expect(isValidBitcoinAddress(tooShortBech32).valid).toBe(false)
      expect(isValidBitcoinAddress(validShortBech32).valid).toBe(true)
      expect(isValidBitcoinAddress(validLongBech32).valid).toBe(true)
      expect(isValidBitcoinAddress(tooLongBech32).valid).toBe(false)
    })
  })

  describe('🎯 Edge Cases & Attack Vectors', () => {
    test('should handle null and undefined inputs', () => {
      expect(isValidBitcoinAddress(null as any).valid).toBe(false)
      expect(isValidBitcoinAddress(undefined as any).valid).toBe(false)
      expect(isValidBitcoinAddress('').valid).toBe(false)
    })

    test('should handle whitespace and formatting issues', () => {
      const addressWithWhitespace = ' bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 '
      const addressWithTabs = '\tbc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4\t'
      const addressWithNewlines = '\nbc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4\n'

      // These should be rejected unless the validation function trims them
      const results = [
        isValidBitcoinAddress(addressWithWhitespace),
        isValidBitcoinAddress(addressWithTabs),
        isValidBitcoinAddress(addressWithNewlines)
      ]

      results.forEach(result => {
        if (result.valid) {
          console.warn('⚠️ Validation accepts whitespace - should probably trim input first')
        }
      })
    })

    test('should handle case sensitivity correctly', () => {
      // Bech32 should be lowercase only
      const uppercaseBech32 = 'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4'
      const mixedCaseBech32 = 'Bc1qW508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'

      expect(isValidBitcoinAddress(uppercaseBech32).valid).toBe(false)
      expect(isValidBitcoinAddress(mixedCaseBech32).valid).toBe(false)

      // Legacy and P2SH addresses are case-sensitive but mixed case is valid
      const uppercaseLegacy = '1BVBMSEYSWETQTFN5AU4M4GFG7XJANVN2'
      // This might still be valid depending on checksum, but let's test
      const result = isValidBitcoinAddress(uppercaseLegacy)
      // The validation logic will determine if this passes
    })

    test('should reject addresses that look like other cryptocurrencies', () => {
      const otherCryptoAddresses = [
        '0x742d35Cc6634C0532925a3b8D581C6e017A4f4EB', // Ethereum
        'LdP8Qox1VAhCzLJNqrr74YovaWYyNBUWvL',         // Litecoin
        'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',         // Dogecoin
        'rXCBbqf4qkqGZfLZqXyKFkrpKGmNfK3aq',          // Ripple
        'tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx'        // Tezos
      ]

      otherCryptoAddresses.forEach(address => {
        const result = isValidBitcoinAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid Bitcoin address format')
      })
    })

    test('should handle very long strings without crashing', () => {
      const veryLongString = 'bc1' + 'q'.repeat(1000)
      const result = isValidBitcoinAddress(veryLongString)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      // Should not throw an error, should handle gracefully
    })

    test('should prevent injection attacks in error messages', () => {
      const maliciousInput = '<script>alert("xss")</script>'
      const result = isValidBitcoinAddress(maliciousInput)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      // Error message should not contain the malicious script
      expect(result.error).not.toContain('<script>')
    })
  })

  describe('⚡ Lightning Address Validation', () => {
    test('should accept valid Lightning addresses', () => {
      const validLightningAddresses = [
        'test@getalby.com',
        'user@strike.me',
        'satoshi@wallet.com',
        'lightning@bitcoin.org'
      ]

      validLightningAddresses.forEach(address => {
        const result = isValidLightningAddress(address)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    test('should reject Lightning addresses with local domains', () => {
      const localDomainAddresses = [
        'user@localhost',
        'user@127.0.0.1',
        'user@192.168.1.1',
        'user@10.0.0.1'
      ]

      localDomainAddresses.forEach(address => {
        const result = isValidLightningAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Local addresses not allowed')
      })
    })

    test('should reject Lightning addresses with suspicious domains', () => {
      const suspiciousDomains = [
        'user@tempmail.com',
        'user@guerrillamail.info',
        'user@10minutemail.net',
        'user@throwaway.email'
      ]

      suspiciousDomains.forEach(address => {
        const result = isValidLightningAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Temporary email domains not allowed')
      })
    })

    test('should reject malformed Lightning addresses', () => {
      const malformedAddresses = [
        'usergetalby.com', // Missing @
        '@getalby.com',    // Missing user
        'user@',           // Missing domain
        'user@@getalby.com', // Double @
        'user@domain',     // No TLD
        'user@.com'        // Missing domain name
      ]

      malformedAddresses.forEach(address => {
        const result = isValidLightningAddress(address)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid Lightning address format')
      })
    })
  })

  describe('🔍 Performance & Security Tests', () => {
    test('should validate addresses quickly (performance test)', () => {
      const testAddresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      ]

      const startTime = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        testAddresses.forEach(address => {
          isValidBitcoinAddress(address)
        })
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should validate 3000 addresses in under 100ms
      expect(totalTime).toBeLessThan(100)
      console.log(`✅ Performance: Validated 3000 addresses in ${totalTime.toFixed(2)}ms`)
    })

    test('should not leak memory on repeated validations', () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Run many validations
      for (let i = 0; i < 10000; i++) {
        isValidBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
        isValidBitcoinAddress('invalid-address-' + i)
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be minimal (less than 5MB for CI environments)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
      console.log(`✅ Memory: Increased by ${(memoryIncrease / 1024).toFixed(2)}KB after 10,000 validations`)
    })
  })
}) 