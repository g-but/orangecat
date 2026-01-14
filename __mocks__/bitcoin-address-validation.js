// Mock for bitcoin-address-validation library
module.exports = {
  validate: jest.fn(() => true),
  default: {
    validate: jest.fn(() => true),
  },
};
