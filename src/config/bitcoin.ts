export const BITCOIN_CONFIG = {
  // Main Bitcoin address for receiving donations
  DONATION_ADDRESS: 'bc1qgsup75ajy4rln08j0te9wpdgrf46ctx6w94xzq',
  
  // Network type (mainnet/testnet)
  NETWORK: 'mainnet',
  
  // Minimum donation amount in satoshis (0.0001 BTC)
  MIN_DONATION: 10000,
  
  // Maximum donation amount in satoshis (1 BTC)
  MAX_DONATION: 100000000,
  
  // Default donation amount in satoshis (0.001 BTC)
  DEFAULT_DONATION: 100000,
  
  // QR code settings
  QR_CODE: {
    // Size in pixels
    SIZE: 256,
    // Error correction level (L, M, Q, H)
    ERROR_CORRECTION: 'M',
    // Include logo in QR code
    INCLUDE_LOGO: true,
  },
  
  // Transaction settings
  TRANSACTION: {
    // Number of confirmations required
    REQUIRED_CONFIRMATIONS: 1,
    // Transaction timeout in minutes
    TIMEOUT_MINUTES: 30,
  }
} as const 