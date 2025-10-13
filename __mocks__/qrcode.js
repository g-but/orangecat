/**
 * Mock for QR Code library in tests
 */

module.exports = {
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  toString: jest.fn().mockResolvedValue('QR_CODE_STRING'),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('QR_CODE_BUFFER'))
}

