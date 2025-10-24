module.exports = {
  NextRequest: class NextRequest {},
  NextResponse: {
    json: jest.fn(),
    redirect: jest.fn(),
    next: jest.fn(),
  },
};
