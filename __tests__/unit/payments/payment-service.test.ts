/** @jest-environment jsdom */
import { bitcoinPaymentService } from '@/services/bitcoin/paymentService'

describe('bitcoinPaymentService', () => {
  test('creates lightning payment and QR data is invoice', async () => {
    const res = await bitcoinPaymentService.createLightningPayment('project-1', 12345, 'Test donation')
    expect(res.success).toBe(true)
    expect(res.paymentRequest).toBeDefined()
    expect(res.paymentRequest?.invoice).toBeDefined()

    const qr = bitcoinPaymentService.getPaymentQRData(res.paymentRequest!)
    expect(typeof qr).toBe('string')
    expect(qr).toEqual(qr.toUpperCase()) // invoices normalized to upper-case
  })

  test('creates on-chain payment and QR data is bitcoin URI', async () => {
    const addr = 'tb1qfm8k0n7l2p0ssr7a3t5z2c7ml8c5p9h6s4p3qy' // sample bech32 testnet format length
    expect(bitcoinPaymentService.isValidBitcoinAddress(addr)).toBe(true)

    const res = await bitcoinPaymentService.createOnChainPayment('project-2', 5000, 'Test donation', addr)
    expect(res.success).toBe(true)
    expect(res.paymentRequest?.address).toBe(addr)

    const qr = bitcoinPaymentService.getPaymentQRData(res.paymentRequest!)
    expect(qr.startsWith('bitcoin:')).toBe(true)
    expect(qr).toContain('amount=0.00005') // 5000 sats to BTC
  })

  test('validates bitcoin addresses', () => {
    const validMainnet = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080'
    const validTestnet = 'tb1qfm8k0n7l2p0ssr7a3t5z2c7ml8c5p9h6s4p3qy'
    const legacyMainnet = '1BoatSLRHtKNngkdXEeobR76b53LETtpyT'
    const invalid = 'not-a-bitcoin-address'

    expect(bitcoinPaymentService.isValidBitcoinAddress(validMainnet)).toBe(true)
    expect(bitcoinPaymentService.isValidBitcoinAddress(validTestnet)).toBe(true)
    expect(bitcoinPaymentService.isValidBitcoinAddress(legacyMainnet)).toBe(true)
    expect(bitcoinPaymentService.isValidBitcoinAddress(invalid)).toBe(false)
  })
})

