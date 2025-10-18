/**
 * Mock for Bitcoin.js library in tests
 */

module.exports = {
  networks: {
    bitcoin: {
      bech32: 'bc',
      pubKeyHash: 0x00,
      scriptHash: 0x05,
      bip32: { public: 0x0488b21e, private: 0x0488ade4 },
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      wif: 0x80
    },
    testnet: {
      bech32: 'tb',
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      bip32: { public: 0x043587cf, private: 0x04358394 },
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      wif: 0xef
    }
  },
  payments: {
    p2pkh: () => ({ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' }),
    p2wpkh: () => ({ address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' }),
    p2sh: () => ({ address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' })
  },
  script: {
    compile: () => Buffer.from([]),
    decompile: () => []
  },
  Transaction: class {
    constructor() {
      this.inputs = []
      this.outputs = []
      this.version = 1
    }
    addInput() {}
    addOutput() {}
    sign() {}
    toHex() { return '01000000000000000000' }
  },
  address: {
    toOutputScript: () => Buffer.from([]),
    fromOutputScript: () => '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  },
  ECPair: {
    makeRandom: () => ({
      publicKey: Buffer.from([]),
      privateKey: Buffer.from([]),
      sign: () => Buffer.from([])
    })
  }
}

