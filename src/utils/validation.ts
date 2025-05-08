// Bitcoin address validation
export const isValidBitcoinAddress = (address: string): boolean => {
  // Basic format check for Bitcoin addresses
  const btcRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/
  return btcRegex.test(address)
}

// Lightning address validation
export const isValidLightningAddress = (address: string): boolean => {
  // Basic format check for Lightning addresses
  const lnRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return lnRegex.test(address)
}

// Website URL validation
export const isValidWebsite = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
} 