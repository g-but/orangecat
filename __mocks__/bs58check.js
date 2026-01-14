// Mock for bs58check library
module.exports = {
  encode: jest.fn(() => 'mockedEncodedValue'),
  decode: jest.fn(() => Buffer.from([0])),
  decodeUnsafe: jest.fn(() => Buffer.from([0])),
  default: {
    encode: jest.fn(() => 'mockedEncodedValue'),
    decode: jest.fn(() => Buffer.from([0])),
    decodeUnsafe: jest.fn(() => Buffer.from([0])),
  },
};
